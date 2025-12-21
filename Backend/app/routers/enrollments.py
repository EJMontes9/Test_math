from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from app.database import get_db
from app.models import User, UserRole, Paralelo, Enrollment
from app.schemas import APIResponse
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/enrollments", tags=["Enrollments"])


# Schemas
class EnrollmentCreate(BaseModel):
    student_id: UUID = Field(alias="studentId")
    paralelo_id: UUID = Field(alias="paraleloId")

    class Config:
        populate_by_name = True


class BulkEnrollmentCreate(BaseModel):
    student_ids: List[UUID] = Field(alias="studentIds")
    paralelo_id: UUID = Field(alias="paraleloId")

    class Config:
        populate_by_name = True


def require_admin_or_teacher(current_user: User = Depends(get_current_user)):
    """Verificar que el usuario sea admin o profesor"""
    if current_user.role not in [UserRole.admin, UserRole.teacher]:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return current_user


@router.get("/", response_model=APIResponse)
async def get_enrollments(
    paralelo_id: Optional[UUID] = None,
    student_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_teacher)
):
    """Obtener inscripciones con filtros opcionales"""
    query = db.query(Enrollment).filter(Enrollment.is_active == True)

    if paralelo_id:
        query = query.filter(Enrollment.paralelo_id == paralelo_id)

    if student_id:
        query = query.filter(Enrollment.student_id == student_id)

    # Si es profesor, solo mostrar sus paralelos
    if current_user.role == UserRole.teacher:
        teacher_paralelos = db.query(Paralelo.id).filter(
            Paralelo.teacher_id == current_user.id
        ).all()
        paralelo_ids = [p[0] for p in teacher_paralelos]
        query = query.filter(Enrollment.paralelo_id.in_(paralelo_ids))

    enrollments = query.all()

    enrollments_data = []
    for enrollment in enrollments:
        student = db.query(User).filter(User.id == enrollment.student_id).first()
        paralelo = db.query(Paralelo).filter(Paralelo.id == enrollment.paralelo_id).first()

        enrollments_data.append({
            "id": str(enrollment.id),
            "studentId": str(enrollment.student_id),
            "studentName": f"{student.first_name} {student.last_name}" if student else "Desconocido",
            "studentEmail": student.email if student else "",
            "paraleloId": str(enrollment.paralelo_id),
            "paraleloName": paralelo.name if paralelo else "Desconocido",
            "enrolledAt": enrollment.enrolled_at.isoformat(),
            "isActive": enrollment.is_active
        })

    return APIResponse(success=True, data=enrollments_data)


@router.post("/", response_model=APIResponse)
async def create_enrollment(
    enrollment_data: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_teacher)
):
    """Inscribir un estudiante en un paralelo"""
    # Verificar que el estudiante existe y es estudiante
    student = db.query(User).filter(
        User.id == enrollment_data.student_id,
        User.role == UserRole.student
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    # Verificar que el paralelo existe
    paralelo = db.query(Paralelo).filter(
        Paralelo.id == enrollment_data.paralelo_id,
        Paralelo.is_active == True
    ).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    # Si es profesor, verificar que sea su paralelo
    if current_user.role == UserRole.teacher and paralelo.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para inscribir en este paralelo")

    # Verificar si ya está inscrito
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == enrollment_data.student_id,
        Enrollment.paralelo_id == enrollment_data.paralelo_id,
        Enrollment.is_active == True
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="El estudiante ya está inscrito en este paralelo")

    # Crear inscripción
    enrollment = Enrollment(
        student_id=enrollment_data.student_id,
        paralelo_id=enrollment_data.paralelo_id,
        is_active=True
    )
    db.add(enrollment)

    # Actualizar contador del paralelo
    paralelo.student_count = db.query(func.count(Enrollment.id)).filter(
        Enrollment.paralelo_id == paralelo.id,
        Enrollment.is_active == True
    ).scalar() + 1

    db.commit()

    return APIResponse(
        success=True,
        message=f"Estudiante inscrito exitosamente en {paralelo.name}",
        data={"id": str(enrollment.id)}
    )


@router.post("/bulk", response_model=APIResponse)
async def create_bulk_enrollments(
    enrollment_data: BulkEnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_teacher)
):
    """Inscribir múltiples estudiantes en un paralelo"""
    # Verificar que el paralelo existe
    paralelo = db.query(Paralelo).filter(
        Paralelo.id == enrollment_data.paralelo_id,
        Paralelo.is_active == True
    ).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    # Si es profesor, verificar que sea su paralelo
    if current_user.role == UserRole.teacher and paralelo.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para inscribir en este paralelo")

    enrolled_count = 0
    skipped_count = 0

    for student_id in enrollment_data.student_ids:
        # Verificar que el estudiante existe y es estudiante
        student = db.query(User).filter(
            User.id == student_id,
            User.role == UserRole.student
        ).first()

        if not student:
            skipped_count += 1
            continue

        # Verificar si ya está inscrito
        existing = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.paralelo_id == enrollment_data.paralelo_id,
            Enrollment.is_active == True
        ).first()

        if existing:
            skipped_count += 1
            continue

        # Crear inscripción
        enrollment = Enrollment(
            student_id=student_id,
            paralelo_id=enrollment_data.paralelo_id,
            is_active=True
        )
        db.add(enrollment)
        enrolled_count += 1

    # Actualizar contador del paralelo
    paralelo.student_count = db.query(func.count(Enrollment.id)).filter(
        Enrollment.paralelo_id == paralelo.id,
        Enrollment.is_active == True
    ).scalar() + enrolled_count

    db.commit()

    return APIResponse(
        success=True,
        message=f"{enrolled_count} estudiantes inscritos, {skipped_count} omitidos",
        data={
            "enrolled": enrolled_count,
            "skipped": skipped_count
        }
    )


@router.delete("/{enrollment_id}", response_model=APIResponse)
async def delete_enrollment(
    enrollment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_teacher)
):
    """Eliminar una inscripción"""
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()

    if not enrollment:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    # Si es profesor, verificar que sea su paralelo
    if current_user.role == UserRole.teacher:
        paralelo = db.query(Paralelo).filter(Paralelo.id == enrollment.paralelo_id).first()
        if paralelo.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta inscripción")

    # Soft delete
    enrollment.is_active = False

    # Actualizar contador del paralelo
    paralelo = db.query(Paralelo).filter(Paralelo.id == enrollment.paralelo_id).first()
    if paralelo:
        paralelo.student_count = max(0, paralelo.student_count - 1)

    db.commit()

    return APIResponse(success=True, message="Inscripción eliminada exitosamente")


@router.get("/students-not-enrolled/{paralelo_id}", response_model=APIResponse)
async def get_students_not_enrolled(
    paralelo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_teacher)
):
    """Obtener estudiantes que no están inscritos en un paralelo"""
    # Verificar que el paralelo existe
    paralelo = db.query(Paralelo).filter(Paralelo.id == paralelo_id).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    # Si es profesor, verificar que sea su paralelo
    if current_user.role == UserRole.teacher and paralelo.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este paralelo")

    # Obtener IDs de estudiantes ya inscritos
    enrolled_ids = db.query(Enrollment.student_id).filter(
        Enrollment.paralelo_id == paralelo_id,
        Enrollment.is_active == True
    ).all()
    enrolled_ids = [e[0] for e in enrolled_ids]

    # Obtener estudiantes no inscritos
    students = db.query(User).filter(
        User.role == UserRole.student,
        User.is_active == True,
        ~User.id.in_(enrolled_ids) if enrolled_ids else True
    ).all()

    students_data = [
        {
            "id": str(student.id),
            "email": student.email,
            "firstName": student.first_name,
            "lastName": student.last_name,
            "fullName": f"{student.first_name} {student.last_name}"
        }
        for student in students
    ]

    return APIResponse(success=True, data=students_data)
