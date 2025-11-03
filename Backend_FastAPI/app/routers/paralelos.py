from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
from uuid import UUID
from app.database import get_db
from app.models import Paralelo, User
from app.schemas import ParaleloCreate, ParaleloUpdate, APIResponse
from app.auth import require_admin

router = APIRouter(prefix="/api/paralelos", tags=["Paralelos"])


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

        paralelos_data.append({
            "id": str(paralelo.id),
            "name": paralelo.name,
            "level": paralelo.level,
            "teacherId": str(paralelo.teacher_id) if paralelo.teacher_id else None,
            "studentCount": paralelo.student_count,
            "isActive": paralelo.is_active,
            "description": paralelo.description,
            "teacher": teacher_data,
            "createdAt": paralelo.created_at.isoformat(),
            "updatedAt": paralelo.updated_at.isoformat()
        })

    return APIResponse(success=True, data=paralelos_data)


@router.get("/stats", response_model=APIResponse)
async def get_paralelo_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener estadísticas de paralelos"""
    total = db.query(func.count(Paralelo.id)).scalar()
    active = db.query(func.count(Paralelo.id)).filter(Paralelo.is_active == True).scalar()

    # Total estudiantes
    result = db.query(func.sum(Paralelo.student_count)).filter(Paralelo.is_active == True).scalar()
    total_students = int(result) if result else 0

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
