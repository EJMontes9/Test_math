from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, or_
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
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


# ============= Schemas para Challenges =============
class ChallengeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    paralelo_id: Optional[UUID] = Field(None, alias="paraleloId")
    topic: Optional[MathTopic] = None
    difficulty: Optional[ExerciseDifficulty] = None
    num_exercises: int = Field(default=10, alias="numExercises")
    time_limit: Optional[int] = Field(None, alias="timeLimit")
    max_participants: int = Field(default=2, alias="maxParticipants")
    student_ids: List[UUID] = Field(default=[], alias="studentIds")

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

        # Contar ejercicios activos
        active_exercises = db.query(func.count(Exercise.id)).filter(
            Exercise.paralelo_id == paralelo.id,
            Exercise.is_active == True
        ).scalar()

        # Calcular promedio de progreso (% de ejercicios completados)
        if active_exercises > 0 and active_students > 0:
            total_attempts = db.query(func.count(ExerciseAttempt.id.distinct())).join(
                Exercise
            ).filter(
                Exercise.paralelo_id == paralelo.id
            ).scalar()

            expected_attempts = active_students * active_exercises
            progress = (total_attempts / expected_attempts * 100) if expected_attempts > 0 else 0
        else:
            progress = 0

        paralelos_data.append({
            "id": str(paralelo.id),
            "name": paralelo.name,
            "level": paralelo.level,
            "description": paralelo.description,
            "activeStudents": active_students,
            "totalExercises": active_exercises,
            "progress": round(progress, 1),
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

        # Obtener estadísticas del estudiante en este paralelo
        total_exercises = db.query(func.count(Exercise.id)).filter(
            Exercise.paralelo_id == paralelo_id,
            Exercise.is_active == True
        ).scalar()

        completed_exercises = db.query(func.count(ExerciseAttempt.id.distinct())).join(
            Exercise
        ).filter(
            Exercise.paralelo_id == paralelo_id,
            ExerciseAttempt.student_id == student.id
        ).scalar()

        # Calcular tasa de acierto
        attempts = db.query(ExerciseAttempt).join(Exercise).filter(
            Exercise.paralelo_id == paralelo_id,
            ExerciseAttempt.student_id == student.id
        ).all()

        total_attempts = len(attempts)
        correct_attempts = sum(1 for a in attempts if a.is_correct)
        accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0

        # Última actividad
        last_attempt = db.query(ExerciseAttempt).join(Exercise).filter(
            Exercise.paralelo_id == paralelo_id,
            ExerciseAttempt.student_id == student.id
        ).order_by(desc(ExerciseAttempt.attempted_at)).first()

        last_activity = last_attempt.attempted_at.isoformat() if last_attempt else None

        students_data.append({
            "id": str(student.id),
            "firstName": student.first_name,
            "lastName": student.last_name,
            "email": student.email,
            "enrolledAt": enrollment.enrolled_at.isoformat(),
            "totalExercises": total_exercises,
            "completedExercises": completed_exercises,
            "progress": round((completed_exercises / total_exercises * 100) if total_exercises > 0 else 0, 1),
            "accuracy": round(accuracy, 1),
            "totalAttempts": total_attempts,
            "correctAttempts": correct_attempts,
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

        # Filtrar por paralelo específico
        attempts_query = db.query(ExerciseAttempt).join(Exercise).filter(
            Exercise.paralelo_id == paralelo_id,
            ExerciseAttempt.student_id == student_id
        )
    else:
        # Obtener todos los intentos del estudiante en paralelos del profesor
        teacher_paralelos = db.query(Paralelo.id).filter(
            Paralelo.teacher_id == current_user.id
        ).all()
        paralelo_ids = [p[0] for p in teacher_paralelos]

        attempts_query = db.query(ExerciseAttempt).join(Exercise).filter(
            Exercise.paralelo_id.in_(paralelo_ids),
            ExerciseAttempt.student_id == student_id
        )

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
    seven_days_ago = datetime.now() - timedelta(days=7)
    recent_attempts_by_day = {}

    for attempt in all_attempts:
        if attempt.attempted_at >= seven_days_ago:
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


# ============= CHALLENGES (VERSUS) ENDPOINTS =============

@router.get("/challenges", response_model=APIResponse)
async def get_challenges(
    paralelo_id: Optional[UUID] = None,
    status: Optional[ChallengeStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener todas las competencias del profesor"""
    query = db.query(Challenge).filter(Challenge.teacher_id == current_user.id)

    if paralelo_id:
        query = query.filter(Challenge.paralelo_id == paralelo_id)

    if status:
        query = query.filter(Challenge.status == status)

    challenges = query.order_by(desc(Challenge.created_at)).all()

    challenges_data = []
    for challenge in challenges:
        participants = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == challenge.id
        ).order_by(desc(ChallengeParticipant.score)).all()

        participants_data = []
        for p in participants:
            student = p.student
            participants_data.append({
                "id": str(p.id),
                "studentId": str(student.id),
                "firstName": student.first_name,
                "lastName": student.last_name,
                "score": p.score,
                "exercisesCompleted": p.exercises_completed,
                "correctAnswers": p.correct_answers,
                "wrongAnswers": p.wrong_answers,
                "timeTaken": p.time_taken,
                "hasFinished": p.has_finished
            })

        challenges_data.append({
            "id": str(challenge.id),
            "title": challenge.title,
            "description": challenge.description,
            "paraleloId": str(challenge.paralelo_id) if challenge.paralelo_id else None,
            "paraleloName": challenge.paralelo.name if challenge.paralelo else "Todos",
            "topic": challenge.topic.value if challenge.topic else None,
            "difficulty": challenge.difficulty.value if challenge.difficulty else None,
            "numExercises": challenge.num_exercises,
            "timeLimit": challenge.time_limit,
            "maxParticipants": challenge.max_participants,
            "status": challenge.status.value,
            "winnerId": str(challenge.winner_id) if challenge.winner_id else None,
            "winnerName": f"{challenge.winner.first_name} {challenge.winner.last_name}" if challenge.winner else None,
            "startTime": challenge.start_time.isoformat() if challenge.start_time else None,
            "endTime": challenge.end_time.isoformat() if challenge.end_time else None,
            "participants": participants_data,
            "participantCount": len(participants),
            "createdAt": challenge.created_at.isoformat()
        })

    return APIResponse(success=True, data=challenges_data)


@router.post("/challenges", response_model=APIResponse)
async def create_challenge(
    challenge_data: ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Crear una nueva competencia"""
    # Verificar paralelo si se especifica
    if challenge_data.paralelo_id:
        paralelo = db.query(Paralelo).filter(
            Paralelo.id == challenge_data.paralelo_id,
            Paralelo.teacher_id == current_user.id
        ).first()
        if not paralelo:
            raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    # Crear la competencia
    new_challenge = Challenge(
        teacher_id=current_user.id,
        paralelo_id=challenge_data.paralelo_id,
        title=challenge_data.title,
        description=challenge_data.description,
        topic=challenge_data.topic,
        difficulty=challenge_data.difficulty,
        num_exercises=challenge_data.num_exercises,
        time_limit=challenge_data.time_limit,
        max_participants=challenge_data.max_participants,
        status=ChallengeStatus.pending
    )
    db.add(new_challenge)
    db.flush()

    # Agregar participantes si se especifican
    for student_id in challenge_data.student_ids[:challenge_data.max_participants]:
        participant = ChallengeParticipant(
            challenge_id=new_challenge.id,
            student_id=student_id
        )
        db.add(participant)

    db.commit()

    return APIResponse(
        success=True,
        message="Competencia creada exitosamente",
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
    if challenge_data.status is not None:
        challenge.status = challenge_data.status
        if challenge_data.status == ChallengeStatus.active:
            challenge.start_time = datetime.now()
        elif challenge_data.status == ChallengeStatus.completed:
            challenge.end_time = datetime.now()
            # Determinar ganador
            winner = db.query(ChallengeParticipant).filter(
                ChallengeParticipant.challenge_id == challenge_id
            ).order_by(desc(ChallengeParticipant.score)).first()
            if winner:
                challenge.winner_id = winner.student_id
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
    """Iniciar una competencia"""
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.teacher_id == current_user.id
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Competencia no encontrada")

    if challenge.status != ChallengeStatus.pending:
        raise HTTPException(status_code=400, detail="La competencia ya fue iniciada o finalizada")

    participants_count = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id
    ).count()

    if participants_count < 2:
        raise HTTPException(status_code=400, detail="Se necesitan al menos 2 participantes")

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
    """Finalizar una competencia"""
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.teacher_id == current_user.id
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Competencia no encontrada")

    challenge.status = ChallengeStatus.completed
    challenge.end_time = datetime.now()

    # Determinar ganador
    winner = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id
    ).order_by(desc(ChallengeParticipant.score)).first()

    if winner:
        challenge.winner_id = winner.student_id

    db.commit()

    return APIResponse(success=True, message="Competencia finalizada")


@router.post("/challenges/{challenge_id}/add-participant", response_model=APIResponse)
async def add_challenge_participant(
    challenge_id: UUID,
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Agregar un participante a una competencia"""
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.teacher_id == current_user.id
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Competencia no encontrada")

    if challenge.status != ChallengeStatus.pending:
        raise HTTPException(status_code=400, detail="No se pueden agregar participantes a una competencia activa")

    # Verificar que el estudiante existe
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.student).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    # Verificar que no esté ya inscrito
    existing = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.student_id == student_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="El estudiante ya está inscrito")

    # Verificar límite de participantes
    current_count = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id
    ).count()

    if current_count >= challenge.max_participants:
        raise HTTPException(status_code=400, detail="Se alcanzó el límite de participantes")

    participant = ChallengeParticipant(
        challenge_id=challenge_id,
        student_id=student_id
    )
    db.add(participant)
    db.commit()

    return APIResponse(success=True, message="Participante agregado")


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
