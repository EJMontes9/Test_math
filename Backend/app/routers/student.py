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


def update_student_goals_progress(student_id: UUID, topic: MathTopic, is_correct: bool, db: Session):
    """Actualizar el progreso de las metas del estudiante despues de cada ejercicio"""
    now = datetime.now()

    # Obtener metas activas del estudiante
    active_goals = db.query(StudentGoal).join(Goal).filter(
        StudentGoal.student_id == student_id,
        StudentGoal.status == GoalStatus.active,
        Goal.is_active == True,
        Goal.start_date <= now,
        Goal.end_date >= now
    ).all()

    for student_goal in active_goals:
        goal = student_goal.goal
        updated = False

        if goal.goal_type == GoalType.exercises:
            # Meta de ejercicios completados: +1 por cada ejercicio
            student_goal.current_value += 1
            updated = True

        elif goal.goal_type == GoalType.accuracy:
            # Meta de precision: calcular % de aciertos
            total_attempts = db.query(func.count(ExerciseAttempt.id)).filter(
                ExerciseAttempt.student_id == student_id
            ).scalar() or 0
            correct_attempts = db.query(func.count(ExerciseAttempt.id)).filter(
                ExerciseAttempt.student_id == student_id,
                ExerciseAttempt.is_correct == True
            ).scalar() or 0
            if total_attempts > 0:
                student_goal.current_value = int((correct_attempts / total_attempts) * 100)
                updated = True

        elif goal.goal_type == GoalType.points:
            # Meta de puntos: sumar puntos totales de sesiones
            total_points = db.query(func.sum(GameSession.total_score)).filter(
                GameSession.student_id == student_id
            ).scalar() or 0
            student_goal.current_value = total_points
            updated = True

        elif goal.goal_type == GoalType.streak:
            # Meta de racha: calcular respuestas correctas consecutivas
            if is_correct:
                # Obtener ultimos intentos para calcular racha actual
                recent_attempts = db.query(ExerciseAttempt).filter(
                    ExerciseAttempt.student_id == student_id
                ).order_by(ExerciseAttempt.attempted_at.desc()).limit(100).all()

                streak = 0
                for attempt in recent_attempts:
                    if attempt.is_correct:
                        streak += 1
                    else:
                        break

                # Solo actualizar si la racha actual es mayor
                if streak > student_goal.current_value:
                    student_goal.current_value = streak
                    updated = True

        elif goal.goal_type == GoalType.topic_mastery:
            # Meta de dominio de tema: verificar si el tema coincide
            if goal.topic == topic:
                topic_progress = db.query(StudentTopicProgress).filter(
                    StudentTopicProgress.student_id == student_id,
                    StudentTopicProgress.topic == topic
                ).first()
                if topic_progress:
                    # Usar nivel de maestria (0-100)
                    student_goal.current_value = int(topic_progress.mastery_level * 100)
                    updated = True

        # Verificar si la meta fue completada
        if updated and student_goal.current_value >= goal.target_value:
            student_goal.status = GoalStatus.completed
            student_goal.completed_at = now
            student_goal.points_earned = goal.reward_points

    db.flush()


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

    # Actualizar progreso de metas del estudiante
    update_student_goals_progress(
        current_user.id,
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


# ==================== ENDPOINTS DE DESAFIOS ====================

@router.get("/challenges", response_model=APIResponse)
async def get_challenges(
    filter: Optional[str] = "available",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener desafios disponibles para el estudiante"""
    now = datetime.now()

    # Obtener paralelo del estudiante
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.is_active == True
    ).first()

    paralelo_id = enrollment.paralelo_id if enrollment else None

    # Base query: desafios activos del paralelo del estudiante o abiertos a todos
    query = db.query(Challenge).filter(
        Challenge.is_active == True
    )

    if paralelo_id:
        query = query.filter(
            (Challenge.paralelo_id == paralelo_id) | (Challenge.paralelo_id == None)
        )
    else:
        query = query.filter(Challenge.paralelo_id == None)

    if filter == "available":
        # Desafios pendientes o activos donde el estudiante puede unirse
        query = query.filter(Challenge.status.in_([ChallengeStatus.pending, ChallengeStatus.active]))
    elif filter == "my":
        # Solo desafios donde el estudiante ya esta participando
        my_challenge_ids = db.query(ChallengeParticipant.challenge_id).filter(
            ChallengeParticipant.student_id == current_user.id
        ).subquery()
        query = query.filter(Challenge.id.in_(my_challenge_ids))
    elif filter == "completed":
        # Desafios finalizados donde el estudiante participo
        my_challenge_ids = db.query(ChallengeParticipant.challenge_id).filter(
            ChallengeParticipant.student_id == current_user.id
        ).subquery()
        query = query.filter(
            Challenge.id.in_(my_challenge_ids),
            Challenge.status == ChallengeStatus.completed
        )

    challenges = query.order_by(desc(Challenge.created_at)).all()

    challenges_data = []
    for challenge in challenges:
        # Obtener participantes
        participants = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == challenge.id
        ).order_by(desc(ChallengeParticipant.score)).all()

        # Verificar si el estudiante ya se unio
        has_joined = any(p.student_id == current_user.id for p in participants)
        is_winner = challenge.winner_id == current_user.id if challenge.winner_id else False

        participants_data = []
        for p in participants:
            student = p.student
            participants_data.append({
                "name": f"{student.first_name} {student.last_name}",
                "score": p.score,
                "isMe": p.student_id == current_user.id,
                "isWinner": challenge.winner_id == p.student_id if challenge.winner_id else False
            })

        # Nombre del tema
        topic_names = {
            "operations": "Operaciones Basicas",
            "combined_operations": "Operaciones Combinadas",
            "linear_equations": "Ecuaciones Lineales",
            "quadratic_equations": "Ecuaciones Cuadraticas",
            "fractions": "Fracciones",
            "percentages": "Porcentajes",
            "geometry": "Geometria",
            "algebra": "Algebra"
        }

        challenges_data.append({
            "id": str(challenge.id),
            "title": challenge.title,
            "description": challenge.description,
            "topic": challenge.topic.value if challenge.topic else None,
            "topicName": topic_names.get(challenge.topic.value, challenge.topic.value) if challenge.topic else "Tema Mixto",
            "numExercises": challenge.num_exercises,
            "timeLimit": challenge.time_limit,
            "maxParticipants": challenge.max_participants,
            "status": challenge.status.value,
            "participantCount": len(participants),
            "participants": participants_data,
            "hasJoined": has_joined,
            "isWinner": is_winner
        })

    return APIResponse(success=True, data=challenges_data)


@router.post("/challenges/{challenge_id}/join", response_model=APIResponse)
async def join_challenge(
    challenge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Unirse a un desafio"""
    # Verificar que el desafio existe y esta disponible
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.is_active == True,
        Challenge.status.in_([ChallengeStatus.pending, ChallengeStatus.active])
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio no encontrado o no disponible")

    # Verificar que el estudiante pertenece al paralelo del desafio (si aplica)
    if challenge.paralelo_id:
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.paralelo_id == challenge.paralelo_id,
            Enrollment.is_active == True
        ).first()

        if not enrollment:
            raise HTTPException(status_code=403, detail="No perteneces al paralelo de este desafio")

    # Verificar que no esta ya participando
    existing = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.student_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Ya estas participando en este desafio")

    # Verificar limite de participantes
    participant_count = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id
    ).count()

    if participant_count >= challenge.max_participants:
        raise HTTPException(status_code=400, detail="El desafio ya tiene el maximo de participantes")

    # Crear participacion
    participant = ChallengeParticipant(
        challenge_id=challenge_id,
        student_id=current_user.id
    )
    db.add(participant)
    db.commit()

    return APIResponse(success=True, message="Te has unido al desafio exitosamente")


@router.get("/challenges/{challenge_id}/exercise", response_model=APIResponse)
async def get_challenge_exercise(
    challenge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener el siguiente ejercicio de un desafio"""
    # Verificar participacion
    participant = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.student_id == current_user.id
    ).first()

    if not participant:
        raise HTTPException(status_code=403, detail="No estas participando en este desafio")

    # Verificar desafio activo
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.status == ChallengeStatus.active
    ).first()

    if not challenge:
        raise HTTPException(status_code=400, detail="El desafio no esta activo")

    # Verificar si ya termino sus ejercicios
    if participant.exercises_completed >= challenge.num_exercises:
        if not participant.has_finished:
            participant.has_finished = True
            participant.finished_at = datetime.now()
            db.commit()
        return APIResponse(
            success=True,
            data={
                "finished": True,
                "score": participant.score,
                "correct_answers": participant.correct_answers,
                "wrong_answers": participant.wrong_answers
            }
        )

    # Generar ejercicio
    topic = challenge.topic if challenge.topic else random.choice(list(MathTopic))
    difficulty = challenge.difficulty if challenge.difficulty else ExerciseDifficulty.medium

    exercise_data = ExerciseGenerator.generate_exercise(topic, difficulty, participant.score)

    # Guardar ejercicio
    exercise = Exercise(
        title=exercise_data["title"],
        question=exercise_data["question"],
        exercise_type="multiple_choice",
        difficulty=difficulty,
        topic=topic,
        correct_answer=exercise_data["correct_answer"],
        options=exercise_data["options"],
        points=_calculate_exercise_points(difficulty, 0),
        is_practice=False,
        is_active=True
    )

    db.add(exercise)
    db.commit()
    db.refresh(exercise)

    return APIResponse(
        success=True,
        data={
            "finished": False,
            "exercise_id": str(exercise.id),
            "title": exercise.title,
            "question": exercise.question,
            "options": json.loads(exercise.options) if exercise.options else [],
            "topic": exercise.topic.value,
            "difficulty": exercise.difficulty.value,
            "possible_points": exercise.points,
            "current_exercise": participant.exercises_completed + 1,
            "total_exercises": challenge.num_exercises,
            "current_score": participant.score
        }
    )


@router.post("/challenges/{challenge_id}/submit-answer", response_model=APIResponse)
async def submit_challenge_answer(
    challenge_id: UUID,
    request: schemas.SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Enviar respuesta de un ejercicio de desafio"""
    # Verificar participacion
    participant = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id,
        ChallengeParticipant.student_id == current_user.id
    ).first()

    if not participant:
        raise HTTPException(status_code=403, detail="No estas participando en este desafio")

    # Verificar desafio activo
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.status == ChallengeStatus.active
    ).first()

    if not challenge:
        raise HTTPException(status_code=400, detail="El desafio no esta activo")

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
        participant.score
    )

    # Actualizar participacion
    participant.exercises_completed += 1
    participant.time_taken += request.time_taken

    if is_correct:
        participant.correct_answers += 1
        participant.score += points_earned
    else:
        participant.wrong_answers += 1

    # Verificar si termino
    if participant.exercises_completed >= challenge.num_exercises:
        participant.has_finished = True
        participant.finished_at = datetime.now()

        # Verificar si todos terminaron para determinar ganador
        all_participants = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == challenge_id
        ).all()

        all_finished = all(p.has_finished for p in all_participants)

        if all_finished:
            # Determinar ganador
            winner = max(all_participants, key=lambda p: p.score)
            challenge.status = ChallengeStatus.completed
            challenge.winner_id = winner.student_id
            challenge.end_time = datetime.now()

    # Guardar intento
    attempt = ExerciseAttempt(
        exercise_id=exercise.id,
        student_id=current_user.id,
        student_answer=request.answer,
        is_correct=is_correct,
        time_taken=request.time_taken,
        points_earned=points_earned if is_correct else 0,
        points_lost=points_lost if not is_correct else 0
    )

    db.add(attempt)
    db.commit()

    return APIResponse(
        success=True,
        data={
            "is_correct": is_correct,
            "correct_answer": exercise.correct_answer,
            "points_earned": points_earned if is_correct else 0,
            "new_score": participant.score,
            "exercises_completed": participant.exercises_completed,
            "total_exercises": challenge.num_exercises,
            "has_finished": participant.has_finished
        }
    )


# ==================== ENDPOINTS DE METAS ====================

@router.get("/goals", response_model=APIResponse)
async def get_student_goals(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener metas del estudiante"""
    now = datetime.now()

    # Obtener paralelo del estudiante
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.is_active == True
    ).first()

    paralelo_id = enrollment.paralelo_id if enrollment else None

    # Obtener metas activas disponibles para el estudiante
    query = db.query(Goal).filter(
        Goal.is_active == True
    )

    if paralelo_id:
        query = query.filter(
            (Goal.paralelo_id == paralelo_id) | (Goal.paralelo_id == None)
        )
    else:
        query = query.filter(Goal.paralelo_id == None)

    goals = query.order_by(desc(Goal.created_at)).all()

    goals_data = []
    for goal in goals:
        # Buscar o crear StudentGoal
        student_goal = db.query(StudentGoal).filter(
            StudentGoal.goal_id == goal.id,
            StudentGoal.student_id == current_user.id
        ).first()

        if not student_goal:
            # Crear registro para este estudiante si la meta esta dentro del periodo
            if goal.start_date <= now <= goal.end_date:
                student_goal = StudentGoal(
                    goal_id=goal.id,
                    student_id=current_user.id,
                    current_value=0,
                    status=GoalStatus.active
                )
                db.add(student_goal)
                db.flush()

        if student_goal:
            # Verificar si expiro
            if goal.end_date < now and student_goal.status == GoalStatus.active:
                student_goal.status = GoalStatus.expired
                db.flush()

            # Filtrar por status si se especifica
            if status:
                if status == "active" and student_goal.status != GoalStatus.active:
                    continue
                elif status == "completed" and student_goal.status != GoalStatus.completed:
                    continue
                elif status == "expired" and student_goal.status != GoalStatus.expired:
                    continue

            # Nombre del tipo de meta
            goal_type_names = {
                "exercises": "Ejercicios Completados",
                "accuracy": "Precision",
                "points": "Puntos",
                "streak": "Racha de Aciertos",
                "topic_mastery": "Dominio de Tema"
            }

            # Nombre del tema
            topic_names = {
                "operations": "Operaciones Basicas",
                "combined_operations": "Operaciones Combinadas",
                "linear_equations": "Ecuaciones Lineales",
                "quadratic_equations": "Ecuaciones Cuadraticas",
                "fractions": "Fracciones",
                "percentages": "Porcentajes",
                "geometry": "Geometria",
                "algebra": "Algebra"
            }

            progress = min(100, (student_goal.current_value / goal.target_value * 100)) if goal.target_value > 0 else 0

            goals_data.append({
                "id": str(goal.id),
                "studentGoalId": str(student_goal.id),
                "title": goal.title,
                "description": goal.description,
                "goalType": goal.goal_type.value,
                "goalTypeName": goal_type_names.get(goal.goal_type.value, goal.goal_type.value),
                "topic": goal.topic.value if goal.topic else None,
                "topicName": topic_names.get(goal.topic.value, goal.topic.value) if goal.topic else None,
                "targetValue": goal.target_value,
                "currentValue": student_goal.current_value,
                "progress": round(progress, 1),
                "rewardPoints": goal.reward_points,
                "startDate": goal.start_date.isoformat(),
                "endDate": goal.end_date.isoformat(),
                "status": student_goal.status.value,
                "completedAt": student_goal.completed_at.isoformat() if student_goal.completed_at else None,
                "pointsEarned": student_goal.points_earned or 0
            })

    db.commit()

    return APIResponse(success=True, data=goals_data)


# ==================== ENDPOINTS DE INSIGNIAS ====================

@router.get("/badges", response_model=APIResponse)
async def get_student_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener insignias del estudiante"""
    from app.models import Badge, StudentBadge

    # Obtener todas las insignias activas
    badges = db.query(Badge).filter(Badge.is_active == True).all()

    badges_data = []
    for badge in badges:
        # Verificar si el estudiante tiene esta insignia
        student_badge = db.query(StudentBadge).filter(
            StudentBadge.badge_id == badge.id,
            StudentBadge.student_id == current_user.id
        ).first()

        badges_data.append({
            "id": str(badge.id),
            "name": badge.name,
            "description": badge.description,
            "icon": badge.icon,
            "category": badge.category.value if badge.category else "general",
            "requirement": badge.requirement,
            "requirementValue": badge.requirement_value,
            "points": badge.points,
            "owned": student_badge is not None,
            "equipped": student_badge.is_equipped if student_badge else False,
            "earnedAt": student_badge.earned_at.isoformat() if student_badge else None
        })

    # Ordenar: primero las que tiene, luego por categoria
    badges_data.sort(key=lambda x: (not x["owned"], x["category"]))

    return APIResponse(success=True, data=badges_data)


@router.post("/badges/{badge_id}/equip", response_model=APIResponse)
async def equip_badge(
    badge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Equipar una insignia"""
    from app.models import StudentBadge

    # Verificar que el estudiante tiene la insignia
    student_badge = db.query(StudentBadge).filter(
        StudentBadge.badge_id == badge_id,
        StudentBadge.student_id == current_user.id
    ).first()

    if not student_badge:
        raise HTTPException(status_code=404, detail="No tienes esta insignia")

    # Desequipar todas las demas
    db.query(StudentBadge).filter(
        StudentBadge.student_id == current_user.id,
        StudentBadge.is_equipped == True
    ).update({"is_equipped": False})

    # Equipar esta
    student_badge.is_equipped = True
    db.commit()

    return APIResponse(success=True, message="Insignia equipada")


@router.post("/badges/{badge_id}/unequip", response_model=APIResponse)
async def unequip_badge(
    badge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Desequipar una insignia"""
    from app.models import StudentBadge

    student_badge = db.query(StudentBadge).filter(
        StudentBadge.badge_id == badge_id,
        StudentBadge.student_id == current_user.id
    ).first()

    if not student_badge:
        raise HTTPException(status_code=404, detail="No tienes esta insignia")

    student_badge.is_equipped = False
    db.commit()

    return APIResponse(success=True, message="Insignia desequipada")


# ==================== ENDPOINTS DE RECURSOS ====================

@router.get("/resources", response_model=APIResponse)
async def get_student_resources(
    topic: Optional[str] = None,
    resource_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Obtener recursos disponibles para el estudiante"""
    from app.models import Resource, ResourceType

    # Obtener paralelo del estudiante
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.is_active == True
    ).first()

    paralelo_id = enrollment.paralelo_id if enrollment else None

    # Recursos del paralelo del estudiante o publicos
    query = db.query(Resource).filter(Resource.is_active == True)

    if paralelo_id:
        query = query.filter(
            (Resource.paralelo_id == paralelo_id) | (Resource.paralelo_id == None)
        )
    else:
        query = query.filter(Resource.paralelo_id == None)

    if topic:
        query = query.filter(Resource.topic == MathTopic(topic))
    if resource_type:
        query = query.filter(Resource.resource_type == ResourceType(resource_type))

    resources = query.order_by(desc(Resource.created_at)).all()

    # Nombre del tema
    topic_names = {
        "operations": "Operaciones Basicas",
        "combined_operations": "Operaciones Combinadas",
        "linear_equations": "Ecuaciones Lineales",
        "quadratic_equations": "Ecuaciones Cuadraticas",
        "fractions": "Fracciones",
        "percentages": "Porcentajes",
        "geometry": "Geometria",
        "algebra": "Algebra"
    }

    resources_data = []
    for resource in resources:
        resources_data.append({
            "id": str(resource.id),
            "title": resource.title,
            "description": resource.description,
            "url": resource.url,
            "resourceType": resource.resource_type.value,
            "topic": resource.topic.value if resource.topic else None,
            "topicName": topic_names.get(resource.topic.value, resource.topic.value) if resource.topic else None,
            "viewCount": resource.view_count,
            "teacherName": f"{resource.teacher.first_name} {resource.teacher.last_name}"
        })

    return APIResponse(success=True, data=resources_data)


@router.post("/resources/{resource_id}/view", response_model=APIResponse)
async def register_resource_view(
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Registrar vista de un recurso"""
    from app.models import Resource

    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.is_active == True
    ).first()

    if resource:
        resource.view_count += 1
        db.commit()

    return APIResponse(success=True, message="Vista registrada")
