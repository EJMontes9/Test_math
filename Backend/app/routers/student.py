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
    Goal, StudentGoal, GoalStatus, GoalType
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
