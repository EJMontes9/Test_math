from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
import os
import uuid as uuid_lib
import shutil
from sqlalchemy import func, and_, desc, or_
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from app.database import get_db
from app.models import (
    User, Paralelo, Enrollment, Exercise, ExerciseAttempt, UserRole,
    Goal, StudentGoal, GoalStatus, GoalType, MathTopic,
    Challenge, ChallengeParticipant, ChallengeStatus, ExerciseDifficulty,
    GameSession
)
from app.schemas import APIResponse
from app.auth import get_current_user


# ============= Schemas para Goals =============
class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    goal_type: GoalType = Field(alias="goalType")
    target_value: int = Field(alias="targetValue")
    topic: Optional[MathTopic] = None
    reward_points: int = Field(default=100, alias="rewardPoints")
    paralelo_id: Optional[UUID] = Field(None, alias="paraleloId")
    start_date: datetime = Field(alias="startDate")
    end_date: datetime = Field(alias="endDate")

    class Config:
        populate_by_name = True


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[int] = Field(None, alias="targetValue")
    reward_points: Optional[int] = Field(None, alias="rewardPoints")
    end_date: Optional[datetime] = Field(None, alias="endDate")
    is_active: Optional[bool] = Field(None, alias="isActive")

    class Config:
        populate_by_name = True


# ============= Schemas para Challenges (Versus entre Paralelos) =============
class ChallengeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    paralelo1_id: UUID = Field(alias="paralelo1Id")
    paralelo2_id: UUID = Field(alias="paralelo2Id")
    topic: Optional[MathTopic] = None
    difficulty: Optional[ExerciseDifficulty] = None
    num_exercises: int = Field(default=10, alias="numExercises")
    time_limit: Optional[int] = Field(None, alias="timeLimit")

    class Config:
        populate_by_name = True


class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ChallengeStatus] = None
    is_active: Optional[bool] = Field(None, alias="isActive")

    class Config:
        populate_by_name = True

router = APIRouter(prefix="/api/teacher", tags=["Teacher"])


def require_teacher(current_user: User = Depends(get_current_user)):
    """Verificar que el usuario sea profesor"""
    if current_user.role not in [UserRole.teacher, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol de profesor")
    return current_user


@router.get("/my-paralelos", response_model=APIResponse)
async def get_my_paralelos(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener todos los paralelos del profesor actual"""
    paralelos = db.query(Paralelo).filter(
        Paralelo.teacher_id == current_user.id,
        Paralelo.is_active == True
    ).order_by(Paralelo.created_at.desc()).all()

    paralelos_data = []
    for paralelo in paralelos:
        # Contar estudiantes activos inscritos
        active_students = db.query(func.count(Enrollment.id)).filter(
            Enrollment.paralelo_id == paralelo.id,
            Enrollment.is_active == True
        ).scalar()

        # Obtener IDs de estudiantes inscritos
        student_ids = [e.student_id for e in db.query(Enrollment.student_id).filter(
            Enrollment.paralelo_id == paralelo.id,
            Enrollment.is_active == True
        ).all()]

        # Contar ejercicios completados por los estudiantes del paralelo
        total_exercises_completed = 0
        total_correct = 0
        total_sessions = 0
        avg_accuracy = 0

        if student_ids:
            # Obtener sesiones de juego del paralelo
            sessions = db.query(GameSession).filter(
                GameSession.paralelo_id == paralelo.id,
                GameSession.student_id.in_(student_ids)
            ).all()

            total_sessions = len(sessions)
            total_exercises_completed = sum(s.exercises_completed or 0 for s in sessions)
            total_correct = sum(s.correct_answers or 0 for s in sessions)
            total_wrong = sum(s.wrong_answers or 0 for s in sessions)

            # Calcular precisión promedio
            if total_correct + total_wrong > 0:
                avg_accuracy = round((total_correct / (total_correct + total_wrong)) * 100, 1)

        # Calcular progreso basado en actividad
        # Progreso = porcentaje de estudiantes que han practicado al menos una vez
        if active_students > 0:
            students_with_activity = db.query(func.count(func.distinct(GameSession.student_id))).filter(
                GameSession.paralelo_id == paralelo.id,
                GameSession.student_id.in_(student_ids) if student_ids else False
            ).scalar() or 0
            progress = round((students_with_activity / active_students) * 100, 1)
        else:
            progress = 0

        paralelos_data.append({
            "id": str(paralelo.id),
            "name": paralelo.name,
            "level": paralelo.level,
            "description": paralelo.description,
            "activeStudents": active_students,
            "totalExercises": total_exercises_completed,
            "totalSessions": total_sessions,
            "avgAccuracy": avg_accuracy,
            "progress": progress,
            "createdAt": paralelo.created_at.isoformat()
        })

    return APIResponse(success=True, data=paralelos_data)


@router.get("/paralelo/{paralelo_id}/students", response_model=APIResponse)
async def get_paralelo_students(
    paralelo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener todos los estudiantes de un paralelo específico"""
    # Verificar que el paralelo pertenezca al profesor
    paralelo = db.query(Paralelo).filter(
        Paralelo.id == paralelo_id,
        Paralelo.teacher_id == current_user.id
    ).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado o no tienes acceso")

    # Obtener estudiantes inscritos
    enrollments = db.query(Enrollment).filter(
        Enrollment.paralelo_id == paralelo_id,
        Enrollment.is_active == True
    ).all()

    students_data = []
    for enrollment in enrollments:
        student = enrollment.student

        # Obtener estadísticas del estudiante usando GameSession (más confiable)
        sessions = db.query(GameSession).filter(
            GameSession.student_id == student.id,
            GameSession.paralelo_id == paralelo_id
        ).all()

        # Calcular totales desde las sesiones
        total_exercises_completed = sum(s.exercises_completed or 0 for s in sessions)
        total_correct = sum(s.correct_answers or 0 for s in sessions)
        total_wrong = sum(s.wrong_answers or 0 for s in sessions)
        total_attempts = total_correct + total_wrong
        total_points = sum(s.total_score or 0 for s in sessions)

        # Calcular precisión
        accuracy = (total_correct / total_attempts * 100) if total_attempts > 0 else 0

        # Última actividad (última sesión)
        last_session = db.query(GameSession).filter(
            GameSession.student_id == student.id,
            GameSession.paralelo_id == paralelo_id
        ).order_by(desc(GameSession.started_at)).first()

        last_activity = None
        if last_session:
            last_activity = (last_session.ended_at or last_session.started_at).isoformat()

        # Progreso basado en si ha practicado
        progress = 100 if total_exercises_completed > 0 else 0

        students_data.append({
            "id": str(student.id),
            "firstName": student.first_name,
            "lastName": student.last_name,
            "email": student.email,
            "enrolledAt": enrollment.enrolled_at.isoformat(),
            "totalExercises": total_exercises_completed,
            "completedExercises": total_exercises_completed,
            "progress": progress,
            "accuracy": round(accuracy, 1),
            "totalAttempts": total_attempts,
            "correctAttempts": total_correct,
            "totalPoints": total_points,
            "lastActivity": last_activity
        })

    return APIResponse(success=True, data={
        "paralelo": {
            "id": str(paralelo.id),
            "name": paralelo.name,
            "level": paralelo.level
        },
        "students": students_data
    })


@router.get("/student/{student_id}/stats", response_model=APIResponse)
async def get_student_detailed_stats(
    student_id: UUID,
    paralelo_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener estadísticas detalladas de un estudiante"""
    student = db.query(User).filter(User.id == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    # Si se especifica paralelo, verificar que el profesor tenga acceso
    if paralelo_id:
        paralelo = db.query(Paralelo).filter(
            Paralelo.id == paralelo_id,
            Paralelo.teacher_id == current_user.id
        ).first()

        if not paralelo:
            raise HTTPException(status_code=404, detail="Paralelo no encontrado o no tienes acceso")

        # Obtener sesiones del estudiante en este paralelo
        sessions = db.query(GameSession).filter(
            GameSession.student_id == student_id,
            GameSession.paralelo_id == paralelo_id
        ).all()
        session_ids = [s.id for s in sessions]

        # Filtrar intentos por las sesiones del paralelo
        if session_ids:
            attempts_query = db.query(ExerciseAttempt).filter(
                ExerciseAttempt.student_id == student_id,
                ExerciseAttempt.game_session_id.in_(session_ids)
            )
        else:
            attempts_query = db.query(ExerciseAttempt).filter(False)  # No hay sesiones
    else:
        # Obtener todos los paralelos del profesor
        teacher_paralelos = db.query(Paralelo.id).filter(
            Paralelo.teacher_id == current_user.id
        ).all()
        paralelo_ids = [p[0] for p in teacher_paralelos]

        # Obtener sesiones del estudiante en paralelos del profesor
        sessions = db.query(GameSession).filter(
            GameSession.student_id == student_id,
            GameSession.paralelo_id.in_(paralelo_ids)
        ).all()
        session_ids = [s.id for s in sessions]

        if session_ids:
            attempts_query = db.query(ExerciseAttempt).filter(
                ExerciseAttempt.student_id == student_id,
                ExerciseAttempt.game_session_id.in_(session_ids)
            )
        else:
            attempts_query = db.query(ExerciseAttempt).filter(False)

    all_attempts = attempts_query.order_by(desc(ExerciseAttempt.attempted_at)).all()

    # Estadísticas generales
    total_attempts = len(all_attempts)
    correct_attempts = sum(1 for a in all_attempts if a.is_correct)
    incorrect_attempts = total_attempts - correct_attempts
    accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0

    # Tiempo promedio
    attempts_with_time = [a for a in all_attempts if a.time_taken]
    avg_time = sum(a.time_taken for a in attempts_with_time) / len(attempts_with_time) if attempts_with_time else 0

    # Puntos totales
    total_points = sum(a.points_earned for a in all_attempts)

    # Análisis por hora del día
    hour_distribution = {}
    for attempt in all_attempts:
        hour = attempt.attempted_at.hour
        if hour not in hour_distribution:
            hour_distribution[hour] = 0
        hour_distribution[hour] += 1

    # Encontrar horas más activas
    if hour_distribution:
        most_active_hours = sorted(hour_distribution.items(), key=lambda x: x[1], reverse=True)[:3]
        peak_hours = [{"hour": h, "attempts": c} for h, c in most_active_hours]
    else:
        peak_hours = []

    # Últimos 10 intentos con detalles
    recent_attempts = []
    for attempt in all_attempts[:10]:
        exercise = attempt.exercise
        recent_attempts.append({
            "id": str(attempt.id),
            "exerciseTitle": exercise.title,
            "question": exercise.question,
            "studentAnswer": attempt.student_answer,
            "correctAnswer": exercise.correct_answer,
            "isCorrect": attempt.is_correct,
            "timeTaken": attempt.time_taken,
            "pointsEarned": attempt.points_earned,
            "attemptedAt": attempt.attempted_at.isoformat(),
            "difficulty": exercise.difficulty.value
        })

    # Progreso en los últimos 7 días
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_attempts_by_day = {}

    for attempt in all_attempts:
        # Convertir a timezone-aware si es necesario
        attempt_time = attempt.attempted_at
        if attempt_time.tzinfo is None:
            attempt_time = attempt_time.replace(tzinfo=timezone.utc)
        if attempt_time >= seven_days_ago:
            day = attempt.attempted_at.date().isoformat()
            if day not in recent_attempts_by_day:
                recent_attempts_by_day[day] = {"total": 0, "correct": 0}
            recent_attempts_by_day[day]["total"] += 1
            if attempt.is_correct:
                recent_attempts_by_day[day]["correct"] += 1

    progress_chart = [
        {
            "date": day,
            "total": data["total"],
            "correct": data["correct"],
            "accuracy": round((data["correct"] / data["total"] * 100) if data["total"] > 0 else 0, 1)
        }
        for day, data in sorted(recent_attempts_by_day.items())
    ]

    # Recomendaciones basadas en el rendimiento
    recommendations = []

    if accuracy < 50:
        recommendations.append({
            "type": "warning",
            "message": "El estudiante tiene una tasa de acierto baja. Considera revisar los conceptos básicos."
        })

    if avg_time > 300:  # Más de 5 minutos por ejercicio
        recommendations.append({
            "type": "info",
            "message": "El estudiante toma más tiempo del promedio. Podría necesitar más práctica o ejercicios más sencillos."
        })

    if total_attempts < 5:
        recommendations.append({
            "type": "info",
            "message": "Poca actividad registrada. Motiva al estudiante a participar más."
        })

    if accuracy > 80 and total_attempts > 10:
        recommendations.append({
            "type": "success",
            "message": "¡Excelente rendimiento! El estudiante muestra dominio del contenido."
        })

    if peak_hours:
        peak_hour_str = ", ".join([f"{h['hour']}:00" for h in peak_hours[:2]])
        recommendations.append({
            "type": "info",
            "message": f"El estudiante es más activo alrededor de las {peak_hour_str}. Considera este horario para asignar tareas importantes."
        })

    return APIResponse(success=True, data={
        "student": {
            "id": str(student.id),
            "firstName": student.first_name,
            "lastName": student.last_name,
            "email": student.email
        },
        "statistics": {
            "totalAttempts": total_attempts,
            "correctAttempts": correct_attempts,
            "incorrectAttempts": incorrect_attempts,
            "accuracy": round(accuracy, 1),
            "averageTime": round(avg_time, 1),
            "totalPoints": total_points
        },
        "peakHours": peak_hours,
        "recentAttempts": recent_attempts,
        "progressChart": progress_chart,
        "recommendations": recommendations
    })


# ============= GOALS ENDPOINTS =============

@router.get("/goals", response_model=APIResponse)
async def get_goals(
    paralelo_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener todas las metas del profesor"""
    query = db.query(Goal).filter(Goal.teacher_id == current_user.id)

    if paralelo_id:
        query = query.filter(Goal.paralelo_id == paralelo_id)

    if status:
        # Filtrar por estado basado en fechas
        now = datetime.now()
        if status == "active":
            query = query.filter(
                Goal.is_active == True,
                Goal.start_date <= now,
                Goal.end_date >= now
            )
        elif status == "upcoming":
            query = query.filter(Goal.start_date > now)
        elif status == "expired":
            query = query.filter(Goal.end_date < now)

    goals = query.order_by(desc(Goal.created_at)).all()

    goals_data = []
    for goal in goals:
        # Contar estudiantes asignados y completados
        student_goals = db.query(StudentGoal).filter(StudentGoal.goal_id == goal.id).all()
        total_assigned = len(student_goals)
        completed_count = sum(1 for sg in student_goals if sg.status == GoalStatus.completed)

        # Calcular progreso promedio
        if student_goals:
            avg_progress = sum(
                min((sg.current_value / goal.target_value) * 100, 100) for sg in student_goals
            ) / len(student_goals)
        else:
            avg_progress = 0

        # Determinar estado visual
        now = datetime.now()
        if goal.end_date.replace(tzinfo=None) < now:
            visual_status = "expired"
        elif goal.start_date.replace(tzinfo=None) > now:
            visual_status = "upcoming"
        else:
            visual_status = "active"

        goals_data.append({
            "id": str(goal.id),
            "title": goal.title,
            "description": goal.description,
            "goalType": goal.goal_type.value,
            "targetValue": goal.target_value,
            "topic": goal.topic.value if goal.topic else None,
            "rewardPoints": goal.reward_points,
            "paraleloId": str(goal.paralelo_id) if goal.paralelo_id else None,
            "paraleloName": goal.paralelo.name if goal.paralelo else "Todos",
            "startDate": goal.start_date.isoformat(),
            "endDate": goal.end_date.isoformat(),
            "isActive": goal.is_active,
            "status": visual_status,
            "totalAssigned": total_assigned,
            "completedCount": completed_count,
            "avgProgress": round(avg_progress, 1),
            "createdAt": goal.created_at.isoformat()
        })

    return APIResponse(success=True, data=goals_data)


@router.post("/goals", response_model=APIResponse)
async def create_goal(
    goal_data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Crear una nueva meta"""
    # Validar fechas
    if goal_data.end_date <= goal_data.start_date:
        raise HTTPException(status_code=400, detail="La fecha de fin debe ser posterior a la fecha de inicio")

    # Verificar paralelo si se especifica
    if goal_data.paralelo_id:
        paralelo = db.query(Paralelo).filter(
            Paralelo.id == goal_data.paralelo_id,
            Paralelo.teacher_id == current_user.id
        ).first()
        if not paralelo:
            raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    # Crear la meta
    new_goal = Goal(
        teacher_id=current_user.id,
        paralelo_id=goal_data.paralelo_id,
        title=goal_data.title,
        description=goal_data.description,
        goal_type=goal_data.goal_type,
        target_value=goal_data.target_value,
        topic=goal_data.topic,
        reward_points=goal_data.reward_points,
        start_date=goal_data.start_date,
        end_date=goal_data.end_date
    )
    db.add(new_goal)
    db.flush()

    # Asignar a todos los estudiantes del paralelo o de todos los paralelos del profesor
    if goal_data.paralelo_id:
        enrollments = db.query(Enrollment).filter(
            Enrollment.paralelo_id == goal_data.paralelo_id,
            Enrollment.is_active == True
        ).all()
    else:
        # Obtener todos los paralelos del profesor
        teacher_paralelos = db.query(Paralelo.id).filter(
            Paralelo.teacher_id == current_user.id
        ).all()
        paralelo_ids = [p[0] for p in teacher_paralelos]
        enrollments = db.query(Enrollment).filter(
            Enrollment.paralelo_id.in_(paralelo_ids),
            Enrollment.is_active == True
        ).all()

    # Crear asignaciones para cada estudiante
    student_ids_added = set()
    for enrollment in enrollments:
        if enrollment.student_id not in student_ids_added:
            student_goal = StudentGoal(
                goal_id=new_goal.id,
                student_id=enrollment.student_id
            )
            db.add(student_goal)
            student_ids_added.add(enrollment.student_id)

    db.commit()

    return APIResponse(
        success=True,
        message=f"Meta creada y asignada a {len(student_ids_added)} estudiantes",
        data={"id": str(new_goal.id)}
    )


@router.put("/goals/{goal_id}", response_model=APIResponse)
async def update_goal(
    goal_id: UUID,
    goal_data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Actualizar una meta existente"""
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.teacher_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")

    # Actualizar campos
    if goal_data.title is not None:
        goal.title = goal_data.title
    if goal_data.description is not None:
        goal.description = goal_data.description
    if goal_data.target_value is not None:
        goal.target_value = goal_data.target_value
    if goal_data.reward_points is not None:
        goal.reward_points = goal_data.reward_points
    if goal_data.end_date is not None:
        goal.end_date = goal_data.end_date
    if goal_data.is_active is not None:
        goal.is_active = goal_data.is_active

    db.commit()

    return APIResponse(success=True, message="Meta actualizada correctamente")


@router.delete("/goals/{goal_id}", response_model=APIResponse)
async def delete_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Eliminar una meta"""
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.teacher_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")

    db.delete(goal)
    db.commit()

    return APIResponse(success=True, message="Meta eliminada correctamente")


@router.get("/goals/{goal_id}/students", response_model=APIResponse)
async def get_goal_students(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener el progreso de estudiantes en una meta"""
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.teacher_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")

    student_goals = db.query(StudentGoal).filter(StudentGoal.goal_id == goal_id).all()

    students_data = []
    for sg in student_goals:
        student = sg.student
        progress = min((sg.current_value / goal.target_value) * 100, 100)

        students_data.append({
            "id": str(sg.id),
            "studentId": str(student.id),
            "firstName": student.first_name,
            "lastName": student.last_name,
            "email": student.email,
            "currentValue": sg.current_value,
            "targetValue": goal.target_value,
            "progress": round(progress, 1),
            "status": sg.status.value,
            "completedAt": sg.completed_at.isoformat() if sg.completed_at else None,
            "pointsEarned": sg.points_earned
        })

    return APIResponse(success=True, data={
        "goal": {
            "id": str(goal.id),
            "title": goal.title,
            "goalType": goal.goal_type.value,
            "targetValue": goal.target_value,
            "rewardPoints": goal.reward_points
        },
        "students": students_data
    })


# ============= CHALLENGES (VERSUS ENTRE PARALELOS) ENDPOINTS =============

@router.get("/challenges", response_model=APIResponse)
async def get_challenges(
    paralelo_id: Optional[UUID] = None,
    status: Optional[ChallengeStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener todas las competencias del profesor (enfrentamientos entre paralelos)"""
    query = db.query(Challenge).filter(Challenge.teacher_id == current_user.id)

    if paralelo_id:
        query = query.filter(
            or_(Challenge.paralelo1_id == paralelo_id, Challenge.paralelo2_id == paralelo_id)
        )

    if status:
        query = query.filter(Challenge.status == status)

    challenges = query.order_by(desc(Challenge.created_at)).all()

    challenges_data = []
    for challenge in challenges:
        # Obtener participantes agrupados por paralelo
        participants = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == challenge.id
        ).all()

        # Separar participantes por paralelo
        paralelo1_participants = []
        paralelo2_participants = []
        paralelo1_total_score = 0
        paralelo2_total_score = 0

        for p in participants:
            student = p.student
            participant_data = {
                "id": str(p.id),
                "studentId": str(student.id),
                "firstName": student.first_name,
                "lastName": student.last_name,
                "paraleloId": str(p.paralelo_id),
                "score": p.score,
                "exercisesCompleted": p.exercises_completed,
                "correctAnswers": p.correct_answers,
                "wrongAnswers": p.wrong_answers,
                "timeTaken": p.time_taken,
                "hasFinished": p.has_finished
            }
            if p.paralelo_id == challenge.paralelo1_id:
                paralelo1_participants.append(participant_data)
                paralelo1_total_score += p.score
            else:
                paralelo2_participants.append(participant_data)
                paralelo2_total_score += p.score

        # Ordenar por score
        paralelo1_participants.sort(key=lambda x: x["score"], reverse=True)
        paralelo2_participants.sort(key=lambda x: x["score"], reverse=True)

        challenges_data.append({
            "id": str(challenge.id),
            "title": challenge.title,
            "description": challenge.description,
            "paralelo1Id": str(challenge.paralelo1_id),
            "paralelo1Name": challenge.paralelo1.name if challenge.paralelo1 else "Paralelo 1",
            "paralelo2Id": str(challenge.paralelo2_id),
            "paralelo2Name": challenge.paralelo2.name if challenge.paralelo2 else "Paralelo 2",
            "paralelo1Score": challenge.paralelo1_score,
            "paralelo2Score": challenge.paralelo2_score,
            "topic": challenge.topic.value if challenge.topic else None,
            "difficulty": challenge.difficulty.value if challenge.difficulty else None,
            "numExercises": challenge.num_exercises,
            "timeLimit": challenge.time_limit,
            "status": challenge.status.value,
            "winnerParaleloId": str(challenge.winner_paralelo_id) if challenge.winner_paralelo_id else None,
            "winnerParaleloName": challenge.winner_paralelo.name if challenge.winner_paralelo else None,
            "startTime": challenge.start_time.isoformat() if challenge.start_time else None,
            "endTime": challenge.end_time.isoformat() if challenge.end_time else None,
            "paralelo1Participants": paralelo1_participants,
            "paralelo2Participants": paralelo2_participants,
            "paralelo1ParticipantCount": len(paralelo1_participants),
            "paralelo2ParticipantCount": len(paralelo2_participants),
            "totalParticipants": len(participants),
            "createdAt": challenge.created_at.isoformat()
        })

    return APIResponse(success=True, data=challenges_data)


@router.post("/challenges", response_model=APIResponse)
async def create_challenge(
    challenge_data: ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Crear una nueva competencia entre dos paralelos"""
    # Verificar que ambos paralelos existen y pertenecen al profesor
    paralelo1 = db.query(Paralelo).filter(
        Paralelo.id == challenge_data.paralelo1_id,
        Paralelo.teacher_id == current_user.id
    ).first()
    if not paralelo1:
        raise HTTPException(status_code=404, detail="Paralelo 1 no encontrado")

    paralelo2 = db.query(Paralelo).filter(
        Paralelo.id == challenge_data.paralelo2_id,
        Paralelo.teacher_id == current_user.id
    ).first()
    if not paralelo2:
        raise HTTPException(status_code=404, detail="Paralelo 2 no encontrado")

    # Verificar que sean paralelos diferentes
    if challenge_data.paralelo1_id == challenge_data.paralelo2_id:
        raise HTTPException(status_code=400, detail="Los paralelos deben ser diferentes")

    # Crear la competencia
    new_challenge = Challenge(
        teacher_id=current_user.id,
        paralelo1_id=challenge_data.paralelo1_id,
        paralelo2_id=challenge_data.paralelo2_id,
        title=challenge_data.title,
        description=challenge_data.description,
        topic=challenge_data.topic,
        difficulty=challenge_data.difficulty,
        num_exercises=challenge_data.num_exercises,
        time_limit=challenge_data.time_limit,
        status=ChallengeStatus.pending
    )
    db.add(new_challenge)
    db.flush()

    # Agregar todos los estudiantes de ambos paralelos como participantes
    enrollments1 = db.query(Enrollment).filter(
        Enrollment.paralelo_id == challenge_data.paralelo1_id,
        Enrollment.is_active == True
    ).all()

    enrollments2 = db.query(Enrollment).filter(
        Enrollment.paralelo_id == challenge_data.paralelo2_id,
        Enrollment.is_active == True
    ).all()

    for enrollment in enrollments1:
        participant = ChallengeParticipant(
            challenge_id=new_challenge.id,
            student_id=enrollment.student_id,
            paralelo_id=challenge_data.paralelo1_id
        )
        db.add(participant)

    for enrollment in enrollments2:
        participant = ChallengeParticipant(
            challenge_id=new_challenge.id,
            student_id=enrollment.student_id,
            paralelo_id=challenge_data.paralelo2_id
        )
        db.add(participant)

    db.commit()

    total_participants = len(enrollments1) + len(enrollments2)
    return APIResponse(
        success=True,
        message=f"Competencia creada con {total_participants} participantes",
        data={"id": str(new_challenge.id)}
    )


@router.put("/challenges/{challenge_id}", response_model=APIResponse)
async def update_challenge(
    challenge_id: UUID,
    challenge_data: ChallengeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Actualizar una competencia"""
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.teacher_id == current_user.id
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Competencia no encontrada")

    if challenge_data.title is not None:
        challenge.title = challenge_data.title
    if challenge_data.description is not None:
        challenge.description = challenge_data.description
    if challenge_data.is_active is not None:
        challenge.is_active = challenge_data.is_active

    db.commit()

    return APIResponse(success=True, message="Competencia actualizada")


@router.delete("/challenges/{challenge_id}", response_model=APIResponse)
async def delete_challenge(
    challenge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Eliminar una competencia"""
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.teacher_id == current_user.id
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Competencia no encontrada")

    db.delete(challenge)
    db.commit()

    return APIResponse(success=True, message="Competencia eliminada")


@router.post("/challenges/{challenge_id}/start", response_model=APIResponse)
async def start_challenge(
    challenge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Iniciar una competencia entre paralelos"""
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.teacher_id == current_user.id
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Competencia no encontrada")

    if challenge.status != ChallengeStatus.pending:
        raise HTTPException(status_code=400, detail="La competencia ya fue iniciada o finalizada")

    # Verificar que hay participantes de ambos paralelos
    paralelo1_count = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.paralelo_id == challenge.paralelo1_id
    ).count()

    paralelo2_count = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.paralelo_id == challenge.paralelo2_id
    ).count()

    if paralelo1_count == 0 or paralelo2_count == 0:
        raise HTTPException(status_code=400, detail="Ambos paralelos deben tener al menos un participante")

    challenge.status = ChallengeStatus.active
    challenge.start_time = datetime.now()
    db.commit()

    return APIResponse(success=True, message="Competencia iniciada")


@router.post("/challenges/{challenge_id}/end", response_model=APIResponse)
async def end_challenge(
    challenge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Finalizar una competencia entre paralelos y determinar ganador"""
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.teacher_id == current_user.id
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Competencia no encontrada")

    challenge.status = ChallengeStatus.completed
    challenge.end_time = datetime.now()

    # Calcular puntuaciones totales por paralelo
    paralelo1_score = db.query(func.sum(ChallengeParticipant.score)).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.paralelo_id == challenge.paralelo1_id
    ).scalar() or 0

    paralelo2_score = db.query(func.sum(ChallengeParticipant.score)).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.paralelo_id == challenge.paralelo2_id
    ).scalar() or 0

    challenge.paralelo1_score = paralelo1_score
    challenge.paralelo2_score = paralelo2_score

    # Determinar paralelo ganador
    if paralelo1_score > paralelo2_score:
        challenge.winner_paralelo_id = challenge.paralelo1_id
    elif paralelo2_score > paralelo1_score:
        challenge.winner_paralelo_id = challenge.paralelo2_id
    # Si es empate, no hay ganador (winner_paralelo_id queda null)

    db.commit()

    winner_name = challenge.winner_paralelo.name if challenge.winner_paralelo else "Empate"
    return APIResponse(
        success=True,
        message=f"Competencia finalizada. Ganador: {winner_name}",
        data={
            "paralelo1Score": paralelo1_score,
            "paralelo2Score": paralelo2_score,
            "winnerParaleloId": str(challenge.winner_paralelo_id) if challenge.winner_paralelo_id else None
        }
    )


# ============= RANKING ENDPOINTS =============

@router.get("/ranking", response_model=APIResponse)
async def get_teacher_ranking(
    paralelo_id: Optional[UUID] = None,
    period: str = "all",  # all, week, month
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener ranking de estudiantes para el profesor"""
    # Obtener paralelos del profesor
    if paralelo_id:
        paralelos = db.query(Paralelo).filter(
            Paralelo.id == paralelo_id,
            Paralelo.teacher_id == current_user.id
        ).all()
    else:
        paralelos = db.query(Paralelo).filter(
            Paralelo.teacher_id == current_user.id
        ).all()

    if not paralelos:
        return APIResponse(success=True, data={"ranking": [], "stats": {}})

    paralelo_ids = [p.id for p in paralelos]

    # Obtener estudiantes inscritos
    enrollments = db.query(Enrollment).filter(
        Enrollment.paralelo_id.in_(paralelo_ids),
        Enrollment.is_active == True
    ).all()

    student_ids = list(set([e.student_id for e in enrollments]))

    # Filtro de tiempo
    if period == "week":
        time_filter = datetime.now() - timedelta(days=7)
    elif period == "month":
        time_filter = datetime.now() - timedelta(days=30)
    else:
        time_filter = None

    ranking_data = []
    for student_id in student_ids:
        student = db.query(User).filter(User.id == student_id).first()
        if not student:
            continue

        # Obtener sesiones de juego
        sessions_query = db.query(GameSession).filter(
            GameSession.student_id == student_id,
            GameSession.paralelo_id.in_(paralelo_ids)
        )

        if time_filter:
            sessions_query = sessions_query.filter(GameSession.started_at >= time_filter)

        sessions = sessions_query.all()

        total_score = sum(s.total_score for s in sessions)
        total_exercises = sum(s.exercises_completed for s in sessions)
        total_correct = sum(s.correct_answers for s in sessions)
        total_wrong = sum(s.wrong_answers for s in sessions)
        accuracy = (total_correct / (total_correct + total_wrong) * 100) if (total_correct + total_wrong) > 0 else 0

        # Obtener paralelo del estudiante
        student_enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.paralelo_id.in_(paralelo_ids),
            Enrollment.is_active == True
        ).first()

        paralelo_name = ""
        if student_enrollment:
            paralelo = db.query(Paralelo).filter(Paralelo.id == student_enrollment.paralelo_id).first()
            paralelo_name = paralelo.name if paralelo else ""

        # Calcular racha (días consecutivos)
        streak = 0
        if sessions:
            sorted_sessions = sorted(sessions, key=lambda x: x.started_at, reverse=True)
            current_date = datetime.now().date()
            for session in sorted_sessions:
                session_date = session.started_at.date()
                if session_date == current_date or session_date == current_date - timedelta(days=1):
                    streak += 1
                    current_date = session_date
                else:
                    break

        ranking_data.append({
            "studentId": str(student.id),
            "firstName": student.first_name,
            "lastName": student.last_name,
            "email": student.email,
            "paraleloName": paralelo_name,
            "totalScore": total_score,
            "exercisesCompleted": total_exercises,
            "correctAnswers": total_correct,
            "wrongAnswers": total_wrong,
            "accuracy": round(accuracy, 1),
            "streak": streak,
            "sessionsCount": len(sessions)
        })

    # Ordenar por puntaje total
    ranking_data.sort(key=lambda x: x["totalScore"], reverse=True)

    # Agregar posiciones
    for i, student in enumerate(ranking_data):
        student["position"] = i + 1

    # Estadísticas generales
    stats = {
        "totalStudents": len(ranking_data),
        "totalExercises": sum(s["exercisesCompleted"] for s in ranking_data),
        "avgAccuracy": round(sum(s["accuracy"] for s in ranking_data) / len(ranking_data), 1) if ranking_data else 0,
        "topScore": ranking_data[0]["totalScore"] if ranking_data else 0
    }

    return APIResponse(success=True, data={
        "ranking": ranking_data,
        "stats": stats,
        "period": period
    })


# ============= RESOURCES ENDPOINTS =============

from app.models import Resource, ResourceType

@router.get("/resources", response_model=APIResponse)
async def get_teacher_resources(
    topic: Optional[MathTopic] = None,
    resource_type: Optional[ResourceType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener recursos del profesor"""
    query = db.query(Resource).filter(
        Resource.teacher_id == current_user.id,
        Resource.is_active == True
    )

    if topic:
        query = query.filter(Resource.topic == topic)
    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)

    resources = query.order_by(desc(Resource.created_at)).all()

    resources_data = []
    for resource in resources:
        resources_data.append({
            "id": str(resource.id),
            "title": resource.title,
            "description": resource.description,
            "url": resource.url,
            "resourceType": resource.resource_type.value,
            "topic": resource.topic.value if resource.topic else None,
            "viewCount": resource.view_count,
            "paraleloId": str(resource.paralelo_id) if resource.paralelo_id else None,
            "paraleloName": resource.paralelo.name if resource.paralelo else "Todos",
            "createdAt": resource.created_at.isoformat()
        })

    return APIResponse(success=True, data=resources_data)


@router.post("/resources", response_model=APIResponse)
async def create_resource(
    resource_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Crear un recurso"""
    # Convertir paralelo_id a UUID si se proporciona
    paralelo_uuid = None
    paralelo_id_str = resource_data.get("paraleloId")
    if paralelo_id_str and paralelo_id_str.strip():
        try:
            paralelo_uuid = UUID(paralelo_id_str)
        except ValueError:
            pass

    new_resource = Resource(
        teacher_id=current_user.id,
        title=resource_data.get("title"),
        description=resource_data.get("description"),
        url=resource_data.get("url"),
        resource_type=ResourceType(resource_data.get("resourceType", "link")),
        topic=MathTopic(resource_data.get("topic")) if resource_data.get("topic") else None,
        paralelo_id=paralelo_uuid
    )
    db.add(new_resource)
    db.commit()

    return APIResponse(success=True, message="Recurso creado", data={"id": str(new_resource.id)})


# Directorio para archivos subidos
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/resources/upload", response_model=APIResponse)
async def upload_resource_file(
    file: UploadFile = File(...),
    title: str = Form(""),
    description: str = Form(""),
    topic: str = Form(""),
    paralelo_id: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Subir un archivo PDF como recurso"""
    # Validar tipo de archivo
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")

    # Validar tamaño (máximo 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo es demasiado grande (máximo 10MB)")

    # Generar nombre único para el archivo
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid_lib.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Guardar archivo
    with open(file_path, "wb") as f:
        f.write(contents)

    # Convertir paralelo_id a UUID si se proporciona
    paralelo_uuid = None
    if paralelo_id and paralelo_id.strip():
        try:
            paralelo_uuid = UUID(paralelo_id)
        except ValueError:
            pass

    # Crear recurso en la base de datos
    new_resource = Resource(
        teacher_id=current_user.id,
        title=title or file.filename,
        description=description,
        url=f"/api/files/{unique_filename}",
        resource_type=ResourceType.pdf,
        topic=MathTopic(topic) if topic else None,
        paralelo_id=paralelo_uuid
    )
    db.add(new_resource)
    db.commit()

    return APIResponse(
        success=True,
        message="Archivo subido exitosamente",
        data={
            "id": str(new_resource.id),
            "url": new_resource.url,
            "filename": unique_filename
        }
    )


@router.put("/resources/{resource_id}", response_model=APIResponse)
async def update_resource(
    resource_id: UUID,
    resource_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Actualizar un recurso"""
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.teacher_id == current_user.id
    ).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    if "title" in resource_data:
        resource.title = resource_data["title"]
    if "description" in resource_data:
        resource.description = resource_data["description"]
    if "url" in resource_data:
        resource.url = resource_data["url"]
    if "resourceType" in resource_data:
        resource.resource_type = ResourceType(resource_data["resourceType"])
    if "topic" in resource_data:
        resource.topic = MathTopic(resource_data["topic"]) if resource_data["topic"] else None
    if "paraleloId" in resource_data:
        paralelo_id_str = resource_data["paraleloId"]
        if paralelo_id_str and paralelo_id_str.strip():
            try:
                resource.paralelo_id = UUID(paralelo_id_str)
            except ValueError:
                resource.paralelo_id = None
        else:
            resource.paralelo_id = None

    db.commit()

    return APIResponse(success=True, message="Recurso actualizado")


@router.delete("/resources/{resource_id}", response_model=APIResponse)
async def delete_resource(
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Eliminar un recurso"""
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.teacher_id == current_user.id
    ).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    resource.is_active = False
    db.commit()

    return APIResponse(success=True, message="Recurso eliminado")


# ============= PERFORMANCE ENDPOINT =============

@router.get("/paralelo/{paralelo_id}/performance", response_model=APIResponse)
async def get_paralelo_performance(
    paralelo_id: UUID,
    period: str = "week",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener estadisticas de desempeno de un paralelo"""
    # Verificar paralelo
    paralelo = db.query(Paralelo).filter(
        Paralelo.id == paralelo_id,
        Paralelo.teacher_id == current_user.id
    ).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    # Obtener estudiantes
    enrollments = db.query(Enrollment).filter(
        Enrollment.paralelo_id == paralelo_id,
        Enrollment.is_active == True
    ).all()

    student_ids = [e.student_id for e in enrollments]

    # Filtro de tiempo
    if period == "week":
        time_filter = datetime.now() - timedelta(days=7)
    elif period == "month":
        time_filter = datetime.now() - timedelta(days=30)
    else:
        time_filter = None

    # Estadisticas generales
    sessions_query = db.query(GameSession).filter(
        GameSession.student_id.in_(student_ids),
        GameSession.paralelo_id == paralelo_id
    )
    if time_filter:
        sessions_query = sessions_query.filter(GameSession.started_at >= time_filter)

    sessions = sessions_query.all()

    total_exercises = sum(s.exercises_completed for s in sessions)
    total_correct = sum(s.correct_answers for s in sessions)
    total_wrong = sum(s.wrong_answers for s in sessions)
    average_accuracy = (total_correct / (total_correct + total_wrong) * 100) if (total_correct + total_wrong) > 0 else 0
    average_score = sum(s.total_score for s in sessions) / len(student_ids) if student_ids else 0

    # Estudiantes activos (con sesiones en el periodo)
    active_student_ids = set(s.student_id for s in sessions)

    # Desempeno por tema
    topic_stats = {}
    attempts_query = db.query(ExerciseAttempt).filter(
        ExerciseAttempt.student_id.in_(student_ids)
    )
    if time_filter:
        attempts_query = attempts_query.filter(ExerciseAttempt.attempted_at >= time_filter)

    attempts = attempts_query.all()
    for attempt in attempts:
        exercise = db.query(Exercise).filter(Exercise.id == attempt.exercise_id).first()
        if exercise and exercise.topic:
            topic = exercise.topic.value
            if topic not in topic_stats:
                topic_stats[topic] = {"correct": 0, "total": 0}
            topic_stats[topic]["total"] += 1
            if attempt.is_correct:
                topic_stats[topic]["correct"] += 1

    topic_performance = []
    for topic, stats in topic_stats.items():
        accuracy = (stats["correct"] / stats["total"] * 100) if stats["total"] > 0 else 0
        topic_performance.append({
            "topic": topic,
            "accuracy": round(accuracy, 1),
            "attempts": stats["total"]
        })
    topic_performance.sort(key=lambda x: x["attempts"], reverse=True)

    # Top estudiantes
    top_students = []
    for student_id in student_ids:
        student = db.query(User).filter(User.id == student_id).first()
        student_sessions = [s for s in sessions if s.student_id == student_id]
        total_score = sum(s.total_score for s in student_sessions)
        correct = sum(s.correct_answers for s in student_sessions)
        wrong = sum(s.wrong_answers for s in student_sessions)
        accuracy = (correct / (correct + wrong) * 100) if (correct + wrong) > 0 else 0
        top_students.append({
            "name": f"{student.first_name} {student.last_name}",
            "score": total_score,
            "accuracy": round(accuracy, 1)
        })
    top_students.sort(key=lambda x: x["score"], reverse=True)

    # Estudiantes que necesitan ayuda (accuracy < 60%)
    needs_help = [s for s in top_students if s["accuracy"] < 60]

    # Actividad semanal
    weekly_progress = []
    days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
    today = datetime.now()
    for i in range(7):
        day = today - timedelta(days=6-i)
        day_sessions = [s for s in sessions if s.started_at.date() == day.date()]
        exercises = sum(s.exercises_completed for s in day_sessions)
        weekly_progress.append({
            "day": days[day.weekday()],
            "exercises": exercises
        })

    return APIResponse(success=True, data={
        "general": {
            "totalStudents": len(student_ids),
            "activeStudents": len(active_student_ids),
            "totalExercises": total_exercises,
            "averageAccuracy": round(average_accuracy, 1),
            "averageScore": round(average_score, 1),
            "trend": "up" if average_accuracy > 50 else "down"
        },
        "topicPerformance": topic_performance[:5],
        "topStudents": top_students[:3],
        "needsHelp": needs_help[:3],
        "weeklyProgress": weekly_progress
    })


# ============= REPORTES PDF =============

def generate_pdf_report(title: str, teacher_name: str, paralelo_name: str, students_data: list, summary: dict):
    """Genera un PDF con el reporte de estudiantes"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = []
    styles = getSampleStyleSheet()

    # Estilos personalizados
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        alignment=TA_CENTER,
        spaceAfter=20,
        textColor=colors.HexColor('#4F46E5')
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        alignment=TA_CENTER,
        spaceAfter=10,
        textColor=colors.HexColor('#6B7280')
    )

    section_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#1F2937')
    )

    # Titulo principal
    elements.append(Paragraph("MathMaster - Reporte de Estudiantes", title_style))
    elements.append(Paragraph(f"Paralelo: {paralelo_name}", subtitle_style))
    elements.append(Paragraph(f"Profesor: {teacher_name}", subtitle_style))
    elements.append(Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", subtitle_style))
    elements.append(Spacer(1, 20))

    # Resumen general
    elements.append(Paragraph("Resumen General", section_style))
    summary_data = [
        ["Total Estudiantes", str(summary.get('total_students', 0))],
        ["Estudiantes Activos", str(summary.get('active_students', 0))],
        ["Ejercicios Completados", str(summary.get('total_exercises', 0))],
        ["Precision Promedio", f"{summary.get('average_accuracy', 0):.1f}%"],
        ["Puntaje Promedio", str(int(summary.get('average_score', 0)))]
    ]

    summary_table = Table(summary_data, colWidths=[200, 150])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F3F4F6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1F2937')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB'))
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))

    # Tabla de estudiantes
    elements.append(Paragraph("Detalle por Estudiante", section_style))

    # Encabezados
    table_data = [["#", "Nombre", "Ejercicios", "Correctos", "Precision", "Puntaje", "Nivel"]]

    # Datos de estudiantes
    for i, student in enumerate(students_data, 1):
        precision = f"{student.get('accuracy', 0):.1f}%"
        nivel = "Avanzado" if student.get('accuracy', 0) >= 80 else "Intermedio" if student.get('accuracy', 0) >= 60 else "Basico"
        table_data.append([
            str(i),
            student.get('name', 'N/A'),
            str(student.get('exercises', 0)),
            str(student.get('correct', 0)),
            precision,
            str(student.get('score', 0)),
            nivel
        ])

    # Crear tabla
    col_widths = [30, 140, 70, 70, 70, 60, 70]
    student_table = Table(table_data, colWidths=col_widths)

    # Estilo de tabla
    table_style = TableStyle([
        # Encabezado
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        # Cuerpo
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1F2937')),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
    ])

    # Alternar colores de filas
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            table_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor('#F9FAFB'))

    student_table.setStyle(table_style)
    elements.append(student_table)

    # Pie de pagina
    elements.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#9CA3AF')
    )
    elements.append(Paragraph("Generado automaticamente por MathMaster", footer_style))

    # Construir PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


@router.get("/reports/paralelo/{paralelo_id}/pdf")
async def generate_paralelo_report_pdf(
    paralelo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Generar reporte PDF de un paralelo con todos los estudiantes"""
    # Verificar paralelo
    paralelo = db.query(Paralelo).filter(
        Paralelo.id == paralelo_id,
        Paralelo.teacher_id == current_user.id
    ).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    # Obtener estudiantes
    enrollments = db.query(Enrollment).filter(
        Enrollment.paralelo_id == paralelo_id,
        Enrollment.is_active == True
    ).all()

    students_data = []
    total_exercises = 0
    total_correct = 0
    total_wrong = 0
    total_score = 0
    active_count = 0

    for enrollment in enrollments:
        student = db.query(User).filter(User.id == enrollment.student_id).first()
        if not student:
            continue

        # Obtener sesiones del estudiante
        sessions = db.query(GameSession).filter(
            GameSession.student_id == student.id,
            GameSession.paralelo_id == paralelo_id
        ).all()

        exercises = sum(s.exercises_completed for s in sessions)
        correct = sum(s.correct_answers for s in sessions)
        wrong = sum(s.wrong_answers for s in sessions)
        score = sum(s.total_score for s in sessions)
        accuracy = (correct / (correct + wrong) * 100) if (correct + wrong) > 0 else 0

        if exercises > 0:
            active_count += 1

        total_exercises += exercises
        total_correct += correct
        total_wrong += wrong
        total_score += score

        students_data.append({
            'name': f"{student.first_name} {student.last_name}",
            'exercises': exercises,
            'correct': correct,
            'wrong': wrong,
            'accuracy': accuracy,
            'score': score
        })

    # Ordenar por puntaje
    students_data.sort(key=lambda x: x['score'], reverse=True)

    # Resumen
    avg_accuracy = (total_correct / (total_correct + total_wrong) * 100) if (total_correct + total_wrong) > 0 else 0
    avg_score = total_score / len(enrollments) if enrollments else 0

    summary = {
        'total_students': len(enrollments),
        'active_students': active_count,
        'total_exercises': total_exercises,
        'average_accuracy': avg_accuracy,
        'average_score': avg_score
    }

    # Generar PDF
    teacher_name = f"{current_user.first_name} {current_user.last_name}"
    pdf_buffer = generate_pdf_report(
        title="Reporte de Paralelo",
        teacher_name=teacher_name,
        paralelo_name=paralelo.name,
        students_data=students_data,
        summary=summary
    )

    # Nombre del archivo
    filename = f"reporte_{paralelo.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/reports/student/{student_id}/pdf")
async def generate_student_report_pdf(
    student_id: UUID,
    paralelo_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Generar reporte PDF de un estudiante individual"""
    # Verificar que el estudiante pertenece a un paralelo del profesor
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    # Verificar permisos
    enrollment = db.query(Enrollment).join(Paralelo).filter(
        Enrollment.student_id == student_id,
        Enrollment.is_active == True,
        Paralelo.teacher_id == current_user.id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este estudiante")

    paralelo = db.query(Paralelo).filter(Paralelo.id == enrollment.paralelo_id).first()

    # Obtener sesiones
    sessions = db.query(GameSession).filter(
        GameSession.student_id == student_id,
        GameSession.paralelo_id == enrollment.paralelo_id
    ).all()

    exercises = sum(s.exercises_completed for s in sessions)
    correct = sum(s.correct_answers for s in sessions)
    wrong = sum(s.wrong_answers for s in sessions)
    score = sum(s.total_score for s in sessions)
    accuracy = (correct / (correct + wrong) * 100) if (correct + wrong) > 0 else 0

    # Datos del estudiante
    students_data = [{
        'name': f"{student.first_name} {student.last_name}",
        'exercises': exercises,
        'correct': correct,
        'wrong': wrong,
        'accuracy': accuracy,
        'score': score
    }]

    summary = {
        'total_students': 1,
        'active_students': 1 if exercises > 0 else 0,
        'total_exercises': exercises,
        'average_accuracy': accuracy,
        'average_score': score
    }

    # Generar PDF
    teacher_name = f"{current_user.first_name} {current_user.last_name}"
    pdf_buffer = generate_pdf_report(
        title=f"Reporte Individual - {student.first_name} {student.last_name}",
        teacher_name=teacher_name,
        paralelo_name=paralelo.name if paralelo else "N/A",
        students_data=students_data,
        summary=summary
    )

    filename = f"reporte_{student.first_name}_{student.last_name}_{datetime.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/reports/available", response_model=APIResponse)
async def get_available_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener lista de reportes disponibles para el profesor"""
    # Obtener paralelos del profesor
    paralelos = db.query(Paralelo).filter(
        Paralelo.teacher_id == current_user.id,
        Paralelo.is_active == True
    ).all()

    reports = []
    for paralelo in paralelos:
        # Contar estudiantes
        student_count = db.query(Enrollment).filter(
            Enrollment.paralelo_id == paralelo.id,
            Enrollment.is_active == True
        ).count()

        reports.append({
            'id': str(paralelo.id),
            'name': paralelo.name,
            'type': 'paralelo',
            'studentCount': student_count,
            'description': f"Reporte completo del paralelo {paralelo.name}"
        })

    return APIResponse(success=True, data=reports)
