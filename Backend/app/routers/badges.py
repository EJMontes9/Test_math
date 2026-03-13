from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.database import get_db
from app.models import Badge, BadgeCategory, User, UserRole
from app.schemas import APIResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/teacher/badges", tags=["Teacher - Badges"])

VALID_REQUIREMENTS = [
    "first_exercise",
    "exercises_count",
    "correct_streak",
    "sessions_count",
    "first_goal",
    "goals_completed",
    "goal_completed",  # Al completar una meta específica (asignado manualmente por el profesor)
]


def require_teacher(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.teacher, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol de profesor")
    return current_user


class BadgeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: str = "🏅"
    category: BadgeCategory = BadgeCategory.achievement
    requirement: str = "first_exercise"
    requirement_value: int = 1
    points: int = 10


class BadgeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[BadgeCategory] = None
    requirement: Optional[str] = None
    requirement_value: Optional[int] = None
    points: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("", response_model=APIResponse)
async def list_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Listar las insignias del profesor (propias) más las globales del sistema"""
    badges = db.query(Badge).filter(
        (Badge.teacher_id == current_user.id) | (Badge.teacher_id == None)
    ).order_by(Badge.category, Badge.name).all()

    data = [
        {
            "id": str(b.id),
            "name": b.name,
            "description": b.description,
            "icon": b.icon,
            "category": b.category.value if b.category else "achievement",
            "requirement": b.requirement,
            "requirementValue": b.requirement_value,
            "points": b.points,
            "isActive": b.is_active,
            "isOwn": b.teacher_id == current_user.id,
        }
        for b in badges
    ]
    return APIResponse(success=True, data=data)


@router.post("", response_model=APIResponse)
async def create_badge(
    badge_data: BadgeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Crear una nueva insignia (pertenece al profesor)"""
    if badge_data.requirement not in VALID_REQUIREMENTS:
        raise HTTPException(status_code=400, detail=f"Requisito inválido. Opciones: {', '.join(VALID_REQUIREMENTS)}")

    existing = db.query(Badge).filter(
        Badge.name == badge_data.name,
        Badge.teacher_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya tienes una insignia con ese nombre")

    badge = Badge(
        teacher_id=current_user.id,
        name=badge_data.name,
        description=badge_data.description,
        icon=badge_data.icon,
        category=badge_data.category,
        requirement=badge_data.requirement,
        requirement_value=badge_data.requirement_value,
        points=badge_data.points,
        is_active=True,
    )
    db.add(badge)
    db.commit()
    db.refresh(badge)
    return APIResponse(success=True, message="Insignia creada", data={"id": str(badge.id)})


@router.put("/{badge_id}", response_model=APIResponse)
async def update_badge(
    badge_id: UUID,
    badge_data: BadgeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Editar una insignia propia"""
    badge = db.query(Badge).filter(
        Badge.id == badge_id,
        Badge.teacher_id == current_user.id
    ).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Insignia no encontrada o no tienes permiso para editarla")

    if badge_data.requirement and badge_data.requirement not in VALID_REQUIREMENTS:
        raise HTTPException(status_code=400, detail=f"Requisito inválido. Opciones: {', '.join(VALID_REQUIREMENTS)}")

    update_data = badge_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(badge, field, value)

    db.commit()
    return APIResponse(success=True, message="Insignia actualizada")


@router.patch("/{badge_id}/toggle", response_model=APIResponse)
async def toggle_badge(
    badge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Activar o desactivar una insignia propia"""
    badge = db.query(Badge).filter(
        Badge.id == badge_id,
        Badge.teacher_id == current_user.id
    ).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Insignia no encontrada o no tienes permiso")

    badge.is_active = not badge.is_active
    db.commit()
    estado = "activada" if badge.is_active else "desactivada"
    return APIResponse(success=True, message=f"Insignia {estado}")


@router.delete("/{badge_id}", response_model=APIResponse)
async def delete_badge(
    badge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Eliminar una insignia propia"""
    badge = db.query(Badge).filter(
        Badge.id == badge_id,
        Badge.teacher_id == current_user.id
    ).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Insignia no encontrada o no tienes permiso para eliminarla")

    db.delete(badge)
    db.commit()
    return APIResponse(success=True, message="Insignia eliminada")
