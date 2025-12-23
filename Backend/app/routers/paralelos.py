from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel
from app.database import get_db
from app.models import Paralelo, User, Enrollment, UserRole
from app.schemas import ParaleloCreate, ParaleloUpdate, APIResponse
from app.auth import require_admin

router = APIRouter(prefix="/api/paralelos", tags=["Paralelos"])


# Schema para asignar estudiantes
class AssignStudentsRequest(BaseModel):
    student_ids: List[UUID]


@router.get("/", response_model=APIResponse)
async def get_paralelos(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener todos los paralelos"""
    query = db.query(Paralelo)

    if status:
        is_active = status == "active"
        query = query.filter(Paralelo.is_active == is_active)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Paralelo.name.ilike(search_filter),
                Paralelo.level.ilike(search_filter)
            )
        )

    paralelos = query.order_by(Paralelo.created_at.desc()).all()

    # Convertir a formato del frontend
    paralelos_data = []
    for paralelo in paralelos:
        teacher_data = None
        if paralelo.teacher:
            teacher_data = {
                "id": str(paralelo.teacher.id),
                "firstName": paralelo.teacher.first_name,
                "lastName": paralelo.teacher.last_name,
                "email": paralelo.teacher.email
            }

        # Contar estudiantes activos desde la tabla Enrollment
        student_count = db.query(func.count(Enrollment.id)).filter(
            Enrollment.paralelo_id == paralelo.id,
            Enrollment.is_active == True
        ).scalar() or 0

        # Actualizar el campo student_count si está desactualizado
        if paralelo.student_count != student_count:
            paralelo.student_count = student_count

        paralelos_data.append({
            "id": str(paralelo.id),
            "name": paralelo.name,
            "level": paralelo.level,
            "teacherId": str(paralelo.teacher_id) if paralelo.teacher_id else None,
            "studentCount": student_count,
            "isActive": paralelo.is_active,
            "description": paralelo.description,
            "teacher": teacher_data,
            "createdAt": paralelo.created_at.isoformat(),
            "updatedAt": paralelo.updated_at.isoformat()
        })

    # Guardar actualizaciones de student_count si hubo cambios
    db.commit()

    return APIResponse(success=True, data=paralelos_data)


@router.get("/stats", response_model=APIResponse)
async def get_paralelo_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener estadísticas de paralelos"""
    total = db.query(func.count(Paralelo.id)).scalar()
    active = db.query(func.count(Paralelo.id)).filter(Paralelo.is_active == True).scalar()

    # Total estudiantes - contar desde Enrollment para datos precisos
    total_students = db.query(func.count(Enrollment.id)).filter(
        Enrollment.is_active == True
    ).scalar() or 0

    stats = {
        "total": total,
        "active": active,
        "totalStudents": total_students
    }

    return APIResponse(success=True, data=stats)


@router.get("/{paralelo_id}", response_model=APIResponse)
async def get_paralelo(
    paralelo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener un paralelo por ID"""
    paralelo = db.query(Paralelo).filter(Paralelo.id == paralelo_id).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    teacher_data = None
    if paralelo.teacher:
        teacher_data = {
            "id": str(paralelo.teacher.id),
            "firstName": paralelo.teacher.first_name,
            "lastName": paralelo.teacher.last_name
        }

    paralelo_data = {
        "id": str(paralelo.id),
        "name": paralelo.name,
        "level": paralelo.level,
        "teacherId": str(paralelo.teacher_id) if paralelo.teacher_id else None,
        "studentCount": paralelo.student_count,
        "isActive": paralelo.is_active,
        "description": paralelo.description,
        "teacher": teacher_data
    }

    return APIResponse(success=True, data=paralelo_data)


@router.post("/", response_model=APIResponse)
async def create_paralelo(
    paralelo_data: ParaleloCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Crear un nuevo paralelo"""
    new_paralelo = Paralelo(
        name=paralelo_data.name,
        level=paralelo_data.level,
        teacher_id=paralelo_data.teacher_id,
        student_count=paralelo_data.student_count,
        is_active=paralelo_data.is_active,
        description=paralelo_data.description
    )

    db.add(new_paralelo)
    db.commit()
    db.refresh(new_paralelo)

    return APIResponse(
        success=True,
        message="Paralelo creado exitosamente",
        data={"id": str(new_paralelo.id), "name": new_paralelo.name}
    )


@router.put("/{paralelo_id}", response_model=APIResponse)
async def update_paralelo(
    paralelo_id: UUID,
    paralelo_data: ParaleloUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Actualizar un paralelo"""
    paralelo = db.query(Paralelo).filter(Paralelo.id == paralelo_id).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    update_data = paralelo_data.model_dump(exclude_unset=True, by_alias=False)

    for field, value in update_data.items():
        setattr(paralelo, field, value)

    db.commit()
    db.refresh(paralelo)

    return APIResponse(
        success=True,
        message="Paralelo actualizado exitosamente"
    )


@router.delete("/{paralelo_id}", response_model=APIResponse)
async def delete_paralelo(
    paralelo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Eliminar (desactivar) un paralelo"""
    paralelo = db.query(Paralelo).filter(Paralelo.id == paralelo_id).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    paralelo.is_active = False
    db.commit()

    return APIResponse(
        success=True,
        message="Paralelo eliminado exitosamente"
    )


# ============= Gestión de Estudiantes del Paralelo =============

@router.get("/{paralelo_id}/students", response_model=APIResponse)
async def get_paralelo_students(
    paralelo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener todos los estudiantes de un paralelo"""
    paralelo = db.query(Paralelo).filter(Paralelo.id == paralelo_id).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    # Obtener enrollments activos
    enrollments = db.query(Enrollment).filter(
        Enrollment.paralelo_id == paralelo_id,
        Enrollment.is_active == True
    ).all()

    students_data = []
    for enrollment in enrollments:
        student = enrollment.student
        students_data.append({
            "id": str(student.id),
            "email": student.email,
            "firstName": student.first_name,
            "lastName": student.last_name,
            "isActive": student.is_active,
            "enrolledAt": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None
        })

    return APIResponse(success=True, data=students_data)


@router.get("/{paralelo_id}/available-students", response_model=APIResponse)
async def get_available_students(
    paralelo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener estudiantes disponibles (no asignados a este paralelo)"""
    paralelo = db.query(Paralelo).filter(Paralelo.id == paralelo_id).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    # Obtener IDs de estudiantes ya inscritos en este paralelo
    enrolled_student_ids = db.query(Enrollment.student_id).filter(
        Enrollment.paralelo_id == paralelo_id,
        Enrollment.is_active == True
    ).all()
    enrolled_ids = [str(e[0]) for e in enrolled_student_ids]

    # Obtener todos los estudiantes activos que no están en este paralelo
    students = db.query(User).filter(
        User.role == UserRole.student,
        User.is_active == True,
        ~User.id.in_([UUID(id) for id in enrolled_ids]) if enrolled_ids else True
    ).all()

    students_data = []
    for student in students:
        students_data.append({
            "id": str(student.id),
            "email": student.email,
            "firstName": student.first_name,
            "lastName": student.last_name
        })

    return APIResponse(success=True, data=students_data)


@router.post("/{paralelo_id}/students", response_model=APIResponse)
async def assign_students_to_paralelo(
    paralelo_id: UUID,
    request: AssignStudentsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Asignar estudiantes a un paralelo"""
    paralelo = db.query(Paralelo).filter(Paralelo.id == paralelo_id).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    added_count = 0
    for student_id in request.student_ids:
        # Verificar que el estudiante existe y es un estudiante
        student = db.query(User).filter(
            User.id == student_id,
            User.role == UserRole.student,
            User.is_active == True
        ).first()

        if not student:
            continue

        # Verificar si ya existe un enrollment (activo o inactivo)
        existing_enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.paralelo_id == paralelo_id
        ).first()

        if existing_enrollment:
            # Reactivar si estaba inactivo
            if not existing_enrollment.is_active:
                existing_enrollment.is_active = True
                added_count += 1
        else:
            # Crear nuevo enrollment
            new_enrollment = Enrollment(
                student_id=student_id,
                paralelo_id=paralelo_id,
                is_active=True
            )
            db.add(new_enrollment)
            added_count += 1

    # Actualizar contador de estudiantes del paralelo
    student_count = db.query(func.count(Enrollment.id)).filter(
        Enrollment.paralelo_id == paralelo_id,
        Enrollment.is_active == True
    ).scalar()
    paralelo.student_count = student_count

    db.commit()

    return APIResponse(
        success=True,
        message=f"{added_count} estudiante(s) agregado(s) al paralelo",
        data={"addedCount": added_count, "totalStudents": student_count}
    )


@router.delete("/{paralelo_id}/students/{student_id}", response_model=APIResponse)
async def remove_student_from_paralelo(
    paralelo_id: UUID,
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Remover un estudiante de un paralelo"""
    paralelo = db.query(Paralelo).filter(Paralelo.id == paralelo_id).first()

    if not paralelo:
        raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.paralelo_id == paralelo_id,
        Enrollment.is_active == True
    ).first()

    if not enrollment:
        raise HTTPException(status_code=404, detail="El estudiante no está inscrito en este paralelo")

    # Desactivar enrollment
    enrollment.is_active = False

    # Actualizar contador de estudiantes del paralelo
    student_count = db.query(func.count(Enrollment.id)).filter(
        Enrollment.paralelo_id == paralelo_id,
        Enrollment.is_active == True
    ).scalar() - 1  # -1 porque aún no se ha commitado
    paralelo.student_count = max(0, student_count)

    db.commit()

    return APIResponse(
        success=True,
        message="Estudiante removido del paralelo",
        data={"totalStudents": paralelo.student_count}
    )
