from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, Paralelo, Enrollment, Exercise, ExerciseAttempt, UserRole
from app.schemas import APIResponse
from app.auth import get_current_user

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
