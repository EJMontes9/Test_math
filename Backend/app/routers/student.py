from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models import (
    User, UserRole, GameSession, Exercise, ExerciseAttempt,
    StudentTopicProgress, MathTopic, ExerciseDifficulty, Enrollment, Paralelo,
    Goal, StudentGoal, GoalStatus, GoalType,
    Challenge, ChallengeParticipant, ChallengeStatus
)
from app import schemas
from app.schemas import APIResponse
from app.auth import get_current_user
from app.exercise_generator import ExerciseGenerator
from app.ai_recommendations import AIRecommendations
import json
import random

router = APIRouter(prefix="/api/student", tags=["Student"])


def require_student(current_user: User = Depends(get_current_user)):
    """Verificar que el usuario sea estudiante"""
    if current_user.role not in [UserRole.student, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol de estudiante")
    return current_user


@router.post("/game/start", response_model=APIResponse)
async def start_game_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Iniciar una nueva sesión de juego"""
    # Obtener paralelo del estudiante (si existe)
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.is_active == True
    ).first()

    paralelo_id = enrollment.paralelo_id if enrollment else None

    # Crear nueva sesión
    session = GameSession(
        student_id=current_user.id,
        paralelo_id=paralelo_id,
        total_score=0,
        exercises_completed=0,
        correct_answers=0,
        wrong_answers=0,
        is_active=True
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return APIResponse(
        success=True,
        message="Sesión de juego iniciada",
        data={
            "session_id": str(session.id),
            "score": 0,
            "started_at": session.started_at.isoformat()
        }
    )


@router.get("/game/next-exercise", response_model=APIResponse)
async def get_next_exercise(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener el siguiente ejercicio adaptativo"""
    # Verificar sesión
    session = db.query(GameSession).filter(
        GameSession.id == session_id,
        GameSession.student_id == current_user.id,
        GameSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada o finalizada")

    # Obtener progreso del estudiante
    topic_progress = db.query(StudentTopicProgress).filter(
        StudentTopicProgress.student_id == current_user.id
    ).all()

    # Determinar qué tema practicar
    selected_topic, difficulty = _select_adaptive_topic(topic_progress, session.total_score)

    # Generar ejercicio
    exercise_data = ExerciseGenerator.generate_exercise(selected_topic, difficulty, session.total_score)

    # Guardar ejercicio en BD (temporal para esta sesión)
    exercise = Exercise(
        title=exercise_data["title"],
        question=exercise_data["question"],
        exercise_type="multiple_choice",
        difficulty=difficulty,
        topic=selected_topic,
        correct_answer=exercise_data["correct_answer"],
        options=exercise_data["options"],
        points=_calculate_exercise_points(difficulty, session.total_score),
        is_practice=True,
        is_active=True
    )

    db.add(exercise)
    db.commit()
    db.refresh(exercise)

    return APIResponse(
        success=True,
        data={
            "exercise_id": str(exercise.id),
            "title": exercise.title,
            "question": exercise.question,
            "options": json.loads(exercise.options) if exercise.options else [],
            "topic": exercise.topic.value,
            "difficulty": exercise.difficulty.value,
            "possible_points": exercise.points,
            "current_score": session.total_score,
            "exercises_completed": session.exercises_completed
        }
    )


@router.post("/game/submit-answer", response_model=APIResponse)
async def submit_answer(
    request: schemas.SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Verificar respuesta y actualizar puntuación"""
    # Verificar sesión
    session = db.query(GameSession).filter(
        GameSession.id == request.session_id,
        GameSession.student_id == current_user.id,
        GameSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    # Obtener ejercicio
    exercise = db.query(Exercise).filter(Exercise.id == request.exercise_id).first()

    if not exercise:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")

    # Verificar respuesta
    is_correct = request.answer.strip() == exercise.correct_answer.strip()

    # Calcular puntos
    points_earned, points_lost = ExerciseGenerator.calculate_points(
        exercise.difficulty,
        is_correct,
        request.time_taken,
        session.total_score
    )

    # Actualizar sesión
    session.exercises_completed += 1

    if is_correct:
        session.correct_answers += 1
        session.total_score += points_earned
    else:
        session.wrong_answers += 1
        session.total_score = max(0, session.total_score - points_lost)  # No permitir puntaje negativo

    # Guardar intento
    attempt = ExerciseAttempt(
        exercise_id=exercise.id,
        student_id=current_user.id,
        game_session_id=session.id,
        student_answer=request.answer,
        is_correct=is_correct,
        time_taken=request.time_taken,
        points_earned=points_earned if is_correct else 0,
        points_lost=points_lost if not is_correct else 0
    )

    db.add(attempt)

    # Actualizar progreso del tema
    AIRecommendations.update_topic_progress(
        str(current_user.id),
        exercise.topic,
        is_correct,
        db
    )

    db.commit()

    return APIResponse(
        success=True,
        data={
            "is_correct": is_correct,
            "correct_answer": exercise.correct_answer,
            "points_earned": points_earned,
            "points_lost": points_lost,
            "new_score": session.total_score,
            "explanation": f"{'¡Correcto!' if is_correct else 'Incorrecto.'} La respuesta es {exercise.correct_answer}",
            "total_correct": session.correct_answers,
            "total_wrong": session.wrong_answers
        }
    )


@router.post("/game/end", response_model=APIResponse)
async def end_game_session(
    request: schemas.EndGameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Finalizar sesión de juego"""
    session = db.query(GameSession).filter(
        GameSession.id == request.session_id,
        GameSession.student_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    session.is_active = False
    session.ended_at = datetime.now()

    db.commit()

    # Calcular estadísticas finales
    accuracy = (session.correct_answers / session.exercises_completed * 100) if session.exercises_completed > 0 else 0

    return APIResponse(
        success=True,
        message="Sesión finalizada",
        data={
            "final_score": session.total_score,
            "exercises_completed": session.exercises_completed,
            "correct_answers": session.correct_answers,
            "wrong_answers": session.wrong_answers,
            "accuracy": round(accuracy, 1),
            "duration_minutes": int((session.ended_at - session.started_at).total_seconds() / 60)
        }
    )


@router.get("/stats", response_model=APIResponse)
async def get_student_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener estadísticas del estudiante"""
    # Estadísticas generales
    all_attempts = db.query(ExerciseAttempt).filter(
        ExerciseAttempt.student_id == current_user.id
    ).all()

    total_attempts = len(all_attempts)
    correct_attempts = sum(1 for a in all_attempts if a.is_correct)
    total_points = sum(a.points_earned for a in all_attempts)

    # Sesiones de juego
    sessions = db.query(GameSession).filter(
        GameSession.student_id == current_user.id
    ).all()

    total_sessions = len(sessions)
    total_score = sum(s.total_score for s in sessions)
    best_score = max([s.total_score for s in sessions]) if sessions else 0

    # Progreso por tema
    topic_progress = db.query(StudentTopicProgress).filter(
        StudentTopicProgress.student_id == current_user.id
    ).all()

    topics_data = []
    for progress in topic_progress:
        accuracy = (progress.correct_attempts / progress.total_attempts * 100) if progress.total_attempts > 0 else 0

        topics_data.append({
            "topic": progress.topic.value,
            "name": AIRecommendations._get_topic_name(progress.topic),
            "mastery_level": progress.mastery_level,
            "accuracy": round(accuracy, 1),
            "total_attempts": progress.total_attempts,
            "needs_improvement": progress.needs_improvement
        })

    return APIResponse(
        success=True,
        data={
            "general": {
                "total_attempts": total_attempts,
                "correct_attempts": correct_attempts,
                "accuracy": round((correct_attempts / total_attempts * 100) if total_attempts > 0 else 0, 1),
                "total_points": total_points,
                "total_sessions": total_sessions,
                "total_score": total_score,
                "best_score": best_score
            },
            "topics": topics_data
        }
    )


@router.get("/ranking", response_model=APIResponse)
async def get_ranking(
    paralelo_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener ranking de estudiantes"""
    # Si no se especifica paralelo, buscar el paralelo del estudiante
    if not paralelo_id:
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.is_active == True
        ).first()

        if not enrollment:
            raise HTTPException(status_code=404, detail="No estás inscrito en ningún paralelo")

        paralelo_id = enrollment.paralelo_id

    # Obtener estudiantes del paralelo
    enrollments = db.query(Enrollment).filter(
        Enrollment.paralelo_id == paralelo_id,
        Enrollment.is_active == True
    ).all()

    student_ids = [e.student_id for e in enrollments]

    # Obtener puntuación total de cada estudiante
    ranking_data = []

    for student_id in student_ids:
        student = db.query(User).filter(User.id == student_id).first()

        # Calcular puntuación total
        sessions = db.query(GameSession).filter(
            GameSession.student_id == student_id
        ).all()

        total_score = sum(s.total_score for s in sessions)
        total_exercises = sum(s.exercises_completed for s in sessions)
        correct_answers = sum(s.correct_answers for s in sessions)

        ranking_data.append({
            "student_id": str(student.id),
            "name": f"{student.first_name} {student.last_name}",
            "total_score": total_score,
            "exercises_completed": total_exercises,
            "correct_answers": correct_answers,
            "is_current_user": student.id == current_user.id
        })

    # Ordenar por puntuación
    ranking_data.sort(key=lambda x: x["total_score"], reverse=True)

    # Agregar posición
    for idx, student in enumerate(ranking_data):
        student["rank"] = idx + 1

    # Obtener información del paralelo
    paralelo = db.query(Paralelo).filter(Paralelo.id == paralelo_id).first()

    return APIResponse(
        success=True,
        data={
            "paralelo": {
                "id": str(paralelo.id),
                "name": paralelo.name,
                "level": paralelo.level
            },
            "ranking": ranking_data
        }
    )


@router.get("/recommendations", response_model=APIResponse)
async def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener recomendaciones personalizadas con IA"""
    recommendations = AIRecommendations.generate_student_recommendations(
        str(current_user.id),
        db
    )

    return APIResponse(
        success=True,
        data={"recommendations": recommendations}
    )


def _select_adaptive_topic(topic_progress: list, current_score: int) -> tuple:
    """Selecciona adaptativamente el siguiente tema basándose en el progreso"""
    if not topic_progress:
        # Estudiante nuevo: comenzar con operaciones básicas
        return (MathTopic.operations, ExerciseDifficulty.easy)

    # Identificar temas débiles (mastery < 50)
    weak_topics = [p for p in topic_progress if p.mastery_level < 50 and p.needs_improvement]

    # 70% de probabilidad de practicar tema débil, 30% tema aleatorio
    if weak_topics and random.random() < 0.7:
        # Seleccionar tema más débil
        weakest = min(weak_topics, key=lambda p: p.mastery_level)
        topic = weakest.topic

        # Dificultad basada en mastery
        if weakest.mastery_level < 30:
            difficulty = ExerciseDifficulty.easy
        else:
            difficulty = ExerciseDifficulty.medium
    else:
        # Seleccionar tema aleatorio ponderado por práctica reciente
        # Favorece temas con menos intentos recientes
        topic = random.choice(list(MathTopic))

        # Dificultad basada en puntaje
        if current_score < 100:
            difficulty = ExerciseDifficulty.easy
        elif current_score < 300:
            difficulty = ExerciseDifficulty.medium
        else:
            difficulty = ExerciseDifficulty.hard

    return (topic, difficulty)


def _calculate_exercise_points(difficulty: ExerciseDifficulty, current_score: int) -> int:
    """Calcula cuántos puntos vale un ejercicio"""
    base_points = {
        ExerciseDifficulty.easy: 10,
        ExerciseDifficulty.medium: 20,
        ExerciseDifficulty.hard: 35
    }

    points = base_points.get(difficulty, 10)

    # Aumentar valor de puntos con score alto
    if current_score > 500:
        points = int(points * 1.3)
    elif current_score > 200:
        points = int(points * 1.15)

    return points


# ============= ENDPOINTS DE METAS (GOALS) =============

@router.get("/goals", response_model=APIResponse)
async def get_student_goals(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener las metas asignadas al estudiante"""
    query = db.query(StudentGoal).filter(
        StudentGoal.student_id == current_user.id
    )

    now = datetime.now()

    if status:
        if status == "active":
            query = query.join(Goal).filter(
                StudentGoal.status == GoalStatus.active,
                Goal.start_date <= now,
                Goal.end_date >= now
            )
        elif status == "completed":
            query = query.filter(StudentGoal.status == GoalStatus.completed)
        elif status == "expired":
            query = query.join(Goal).filter(Goal.end_date < now)

    student_goals = query.all()

    goals_data = []
    for sg in student_goals:
        goal = sg.goal

        # Calcular progreso porcentual
        progress_percent = min((sg.current_value / goal.target_value) * 100, 100) if goal.target_value > 0 else 0

        # Determinar estado visual
        if sg.status == GoalStatus.completed:
            visual_status = "completed"
        elif goal.end_date.replace(tzinfo=None) < now:
            visual_status = "expired"
        elif goal.start_date.replace(tzinfo=None) > now:
            visual_status = "upcoming"
        else:
            visual_status = "active"

        # Calcular días restantes
        if goal.end_date.replace(tzinfo=None) > now:
            days_remaining = (goal.end_date.replace(tzinfo=None) - now).days
        else:
            days_remaining = 0

        goals_data.append({
            "id": str(sg.id),
            "goalId": str(goal.id),
            "title": goal.title,
            "description": goal.description,
            "goalType": goal.goal_type.value,
            "targetValue": goal.target_value,
            "currentValue": sg.current_value,
            "progressPercent": round(progress_percent, 1),
            "topic": goal.topic.value if goal.topic else None,
            "rewardPoints": goal.reward_points,
            "pointsEarned": sg.points_earned,
            "startDate": goal.start_date.isoformat(),
            "endDate": goal.end_date.isoformat(),
            "daysRemaining": days_remaining,
            "status": visual_status,
            "completedAt": sg.completed_at.isoformat() if sg.completed_at else None
        })

    # Ordenar: activas primero, luego por días restantes
    goals_data.sort(key=lambda x: (
        0 if x["status"] == "active" else (1 if x["status"] == "upcoming" else 2),
        x["daysRemaining"]
    ))

    return APIResponse(success=True, data=goals_data)


@router.get("/goals/{goal_id}", response_model=APIResponse)
async def get_student_goal_detail(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener detalle de una meta específica del estudiante"""
    student_goal = db.query(StudentGoal).filter(
        StudentGoal.goal_id == goal_id,
        StudentGoal.student_id == current_user.id
    ).first()

    if not student_goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")

    goal = student_goal.goal
    now = datetime.now()

    progress_percent = min((student_goal.current_value / goal.target_value) * 100, 100) if goal.target_value > 0 else 0

    if student_goal.status == GoalStatus.completed:
        visual_status = "completed"
    elif goal.end_date.replace(tzinfo=None) < now:
        visual_status = "expired"
    elif goal.start_date.replace(tzinfo=None) > now:
        visual_status = "upcoming"
    else:
        visual_status = "active"

    return APIResponse(
        success=True,
        data={
            "id": str(student_goal.id),
            "goalId": str(goal.id),
            "title": goal.title,
            "description": goal.description,
            "goalType": goal.goal_type.value,
            "targetValue": goal.target_value,
            "currentValue": student_goal.current_value,
            "progressPercent": round(progress_percent, 1),
            "topic": goal.topic.value if goal.topic else None,
            "rewardPoints": goal.reward_points,
            "pointsEarned": student_goal.points_earned,
            "startDate": goal.start_date.isoformat(),
            "endDate": goal.end_date.isoformat(),
            "status": visual_status,
            "completedAt": student_goal.completed_at.isoformat() if student_goal.completed_at else None,
            "teacherName": f"{goal.teacher.first_name} {goal.teacher.last_name}"
        }
    )


# ============= ENDPOINTS DE DESAFÍOS (CHALLENGES) =============

@router.get("/challenges", response_model=APIResponse)
async def get_student_challenges(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener los desafíos disponibles y en los que participa el estudiante"""
    # Obtener paralelo del estudiante
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.is_active == True
    ).first()

    paralelo_id = enrollment.paralelo_id if enrollment else None

    # Obtener desafíos donde el estudiante participa
    participating = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.student_id == current_user.id
    ).all()
    participating_ids = [p.challenge_id for p in participating]

    # Query base: desafíos del paralelo del estudiante o donde ya participa
    query = db.query(Challenge).filter(
        Challenge.is_active == True,
        (Challenge.paralelo_id == paralelo_id) | (Challenge.id.in_(participating_ids))
    )

    if status:
        if status == "pending":
            query = query.filter(Challenge.status == ChallengeStatus.pending)
        elif status == "active":
            query = query.filter(Challenge.status == ChallengeStatus.active)
        elif status == "completed":
            query = query.filter(Challenge.status == ChallengeStatus.completed)
        elif status == "my":
            query = query.filter(Challenge.id.in_(participating_ids))

    challenges = query.order_by(desc(Challenge.created_at)).all()

    challenges_data = []
    for challenge in challenges:
        # Verificar si el estudiante participa
        participation = next(
            (p for p in participating if p.challenge_id == challenge.id),
            None
        )

        # Obtener participantes
        participants_data = []
        for p in challenge.participants:
            student = db.query(User).filter(User.id == p.student_id).first()
            participants_data.append({
                "id": str(p.student_id),
                "name": f"{student.first_name} {student.last_name}",
                "score": p.score,
                "exercisesCompleted": p.exercises_completed,
                "correctAnswers": p.correct_answers,
                "hasFinished": p.has_finished,
                "isCurrentUser": p.student_id == current_user.id
            })

        # Ordenar participantes por puntaje
        participants_data.sort(key=lambda x: x["score"], reverse=True)

        challenges_data.append({
            "id": str(challenge.id),
            "title": challenge.title,
            "description": challenge.description,
            "topic": challenge.topic.value if challenge.topic else None,
            "difficulty": challenge.difficulty.value if challenge.difficulty else None,
            "numExercises": challenge.num_exercises,
            "timeLimit": challenge.time_limit,
            "maxParticipants": challenge.max_participants,
            "currentParticipants": len(challenge.participants),
            "status": challenge.status.value,
            "isParticipating": participation is not None,
            "myScore": participation.score if participation else 0,
            "myProgress": participation.exercises_completed if participation else 0,
            "hasFinished": participation.has_finished if participation else False,
            "winnerId": str(challenge.winner_id) if challenge.winner_id else None,
            "winnerName": f"{challenge.winner.first_name} {challenge.winner.last_name}" if challenge.winner else None,
            "participants": participants_data,
            "startTime": challenge.start_time.isoformat() if challenge.start_time else None,
            "endTime": challenge.end_time.isoformat() if challenge.end_time else None,
            "createdAt": challenge.created_at.isoformat()
        })

    return APIResponse(success=True, data=challenges_data)


@router.post("/challenges/{challenge_id}/join", response_model=APIResponse)
async def join_challenge(
    challenge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Unirse a un desafío"""
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.is_active == True
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Desafío no encontrado")

    if challenge.status != ChallengeStatus.pending:
        raise HTTPException(status_code=400, detail="El desafío ya no acepta participantes")

    # Verificar si ya participa
    existing = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.student_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Ya estás participando en este desafío")

    # Verificar límite de participantes
    current_count = db.query(func.count(ChallengeParticipant.id)).filter(
        ChallengeParticipant.challenge_id == challenge_id
    ).scalar()

    if current_count >= challenge.max_participants:
        raise HTTPException(status_code=400, detail="El desafío está lleno")

    # Crear participación
    participant = ChallengeParticipant(
        challenge_id=challenge_id,
        student_id=current_user.id
    )
    db.add(participant)

    # Si se alcanza el máximo, iniciar el desafío
    if current_count + 1 >= challenge.max_participants:
        challenge.status = ChallengeStatus.active
        challenge.start_time = datetime.now()

    db.commit()

    return APIResponse(
        success=True,
        message="Te has unido al desafío exitosamente"
    )


@router.get("/challenges/{challenge_id}", response_model=APIResponse)
async def get_challenge_detail(
    challenge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener detalle de un desafío específico"""
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Desafío no encontrado")

    # Verificar participación
    participation = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.student_id == current_user.id
    ).first()

    # Obtener participantes con ranking
    participants_data = []
    for p in challenge.participants:
        student = db.query(User).filter(User.id == p.student_id).first()
        participants_data.append({
            "id": str(p.student_id),
            "name": f"{student.first_name} {student.last_name}",
            "avatar": student.avatar,
            "score": p.score,
            "exercisesCompleted": p.exercises_completed,
            "correctAnswers": p.correct_answers,
            "wrongAnswers": p.wrong_answers,
            "timeTaken": p.time_taken,
            "hasFinished": p.has_finished,
            "isCurrentUser": p.student_id == current_user.id
        })

    # Ordenar por puntaje
    participants_data.sort(key=lambda x: (-x["score"], x["timeTaken"]))

    # Agregar posición
    for idx, p in enumerate(participants_data):
        p["rank"] = idx + 1

    return APIResponse(
        success=True,
        data={
            "id": str(challenge.id),
            "title": challenge.title,
            "description": challenge.description,
            "topic": challenge.topic.value if challenge.topic else None,
            "difficulty": challenge.difficulty.value if challenge.difficulty else None,
            "numExercises": challenge.num_exercises,
            "timeLimit": challenge.time_limit,
            "maxParticipants": challenge.max_participants,
            "status": challenge.status.value,
            "isParticipating": participation is not None,
            "myScore": participation.score if participation else 0,
            "myProgress": participation.exercises_completed if participation else 0,
            "hasFinished": participation.has_finished if participation else False,
            "winnerId": str(challenge.winner_id) if challenge.winner_id else None,
            "participants": participants_data,
            "startTime": challenge.start_time.isoformat() if challenge.start_time else None,
            "endTime": challenge.end_time.isoformat() if challenge.end_time else None
        }
    )


@router.post("/challenges/{challenge_id}/submit", response_model=APIResponse)
async def submit_challenge_answer(
    challenge_id: UUID,
    request: schemas.SubmitChallengeAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Enviar respuesta en un desafío"""
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.status == ChallengeStatus.active
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Desafío no encontrado o no activo")

    # Verificar participación
    participation = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.student_id == current_user.id
    ).first()

    if not participation:
        raise HTTPException(status_code=400, detail="No estás participando en este desafío")

    if participation.has_finished:
        raise HTTPException(status_code=400, detail="Ya has terminado este desafío")

    # Obtener ejercicio
    exercise = db.query(Exercise).filter(Exercise.id == request.exercise_id).first()

    if not exercise:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")

    # Verificar respuesta
    is_correct = request.answer.strip() == exercise.correct_answer.strip()

    # Calcular puntos
    points = exercise.points if is_correct else 0

    # Actualizar participación
    participation.exercises_completed += 1
    participation.time_taken += request.time_taken

    if is_correct:
        participation.correct_answers += 1
        participation.score += points
    else:
        participation.wrong_answers += 1

    # Verificar si terminó
    if participation.exercises_completed >= challenge.num_exercises:
        participation.has_finished = True
        participation.finished_at = datetime.now()

        # Verificar si todos terminaron para determinar ganador
        all_finished = all(p.has_finished for p in challenge.participants)
        if all_finished:
            # Determinar ganador (mayor puntaje, menor tiempo en empate)
            winner = max(
                challenge.participants,
                key=lambda p: (p.score, -p.time_taken)
            )
            challenge.winner_id = winner.student_id
            challenge.status = ChallengeStatus.completed
            challenge.end_time = datetime.now()

    db.commit()

    return APIResponse(
        success=True,
        data={
            "isCorrect": is_correct,
            "correctAnswer": exercise.correct_answer,
            "pointsEarned": points,
            "newScore": participation.score,
            "exercisesCompleted": participation.exercises_completed,
            "hasFinished": participation.has_finished,
            "totalExercises": challenge.num_exercises
        }
    )
