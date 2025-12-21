from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from app.database import get_db
from app.models import (
    User, UserRole, Badge, StudentBadge, BadgeType, BadgeRarity,
    ExerciseAttempt, GameSession
)
from app.schemas import APIResponse
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/badges", tags=["Badges"])


# ============= Schemas =============

class BadgeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    badge_type: BadgeType = Field(alias="badgeType")
    rarity: BadgeRarity = BadgeRarity.common
    icon: Optional[str] = None
    color: Optional[str] = None
    requirement_type: str = Field(alias="requirementType")
    requirement_value: int = Field(alias="requirementValue")

    class Config:
        populate_by_name = True


class BadgeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    requirement_value: Optional[int] = Field(None, alias="requirementValue")
    is_active: Optional[bool] = Field(None, alias="isActive")

    class Config:
        populate_by_name = True


# ============= Endpoints Admin =============

@router.get("/", response_model=APIResponse)
async def get_all_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener todas las insignias disponibles"""
    badges = db.query(Badge).filter(Badge.is_active == True).all()

    badges_data = []
    for badge in badges:
        # Contar cuántos estudiantes la tienen
        count = db.query(func.count(StudentBadge.id)).filter(
            StudentBadge.badge_id == badge.id
        ).scalar()

        badges_data.append({
            "id": str(badge.id),
            "name": badge.name,
            "description": badge.description,
            "badgeType": badge.badge_type.value,
            "rarity": badge.rarity.value,
            "icon": badge.icon,
            "color": badge.color,
            "requirementType": badge.requirement_type,
            "requirementValue": badge.requirement_value,
            "earnedCount": count
        })

    return APIResponse(success=True, data=badges_data)


@router.post("/", response_model=APIResponse)
async def create_badge(
    badge_data: BadgeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Crear una nueva insignia (solo admin)"""
    badge = Badge(
        name=badge_data.name,
        description=badge_data.description,
        badge_type=badge_data.badge_type,
        rarity=badge_data.rarity,
        icon=badge_data.icon,
        color=badge_data.color,
        requirement_type=badge_data.requirement_type,
        requirement_value=badge_data.requirement_value
    )

    db.add(badge)
    db.commit()

    return APIResponse(
        success=True,
        message="Insignia creada exitosamente",
        data={"id": str(badge.id)}
    )


@router.put("/{badge_id}", response_model=APIResponse)
async def update_badge(
    badge_id: UUID,
    badge_data: BadgeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Actualizar una insignia (solo admin)"""
    badge = db.query(Badge).filter(Badge.id == badge_id).first()

    if not badge:
        raise HTTPException(status_code=404, detail="Insignia no encontrada")

    update_data = badge_data.model_dump(exclude_unset=True, by_alias=False)
    for field, value in update_data.items():
        setattr(badge, field, value)

    db.commit()

    return APIResponse(success=True, message="Insignia actualizada")


@router.delete("/{badge_id}", response_model=APIResponse)
async def delete_badge(
    badge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Eliminar una insignia (solo admin)"""
    badge = db.query(Badge).filter(Badge.id == badge_id).first()

    if not badge:
        raise HTTPException(status_code=404, detail="Insignia no encontrada")

    badge.is_active = False
    db.commit()

    return APIResponse(success=True, message="Insignia eliminada")


# ============= Endpoints Estudiante =============

@router.get("/my-badges", response_model=APIResponse)
async def get_my_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener insignias del estudiante actual"""
    student_badges = db.query(StudentBadge).filter(
        StudentBadge.student_id == current_user.id
    ).all()

    badges_data = []
    for sb in student_badges:
        badge = sb.badge
        badges_data.append({
            "id": str(sb.id),
            "badgeId": str(badge.id),
            "name": badge.name,
            "description": badge.description,
            "badgeType": badge.badge_type.value,
            "rarity": badge.rarity.value,
            "icon": badge.icon,
            "color": badge.color,
            "isEquipped": sb.is_equipped,
            "earnedAt": sb.earned_at.isoformat()
        })

    return APIResponse(success=True, data=badges_data)


@router.get("/equipped", response_model=APIResponse)
async def get_equipped_badge(
    student_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener la insignia equipada de un estudiante"""
    target_id = student_id or current_user.id

    equipped = db.query(StudentBadge).filter(
        StudentBadge.student_id == target_id,
        StudentBadge.is_equipped == True
    ).first()

    if not equipped:
        return APIResponse(success=True, data=None)

    badge = equipped.badge
    return APIResponse(
        success=True,
        data={
            "id": str(equipped.id),
            "name": badge.name,
            "badgeType": badge.badge_type.value,
            "rarity": badge.rarity.value,
            "icon": badge.icon,
            "color": badge.color
        }
    )


@router.post("/equip/{badge_id}", response_model=APIResponse)
async def equip_badge(
    badge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Equipar una insignia"""
    # Verificar que el estudiante tiene la insignia
    student_badge = db.query(StudentBadge).filter(
        StudentBadge.student_id == current_user.id,
        StudentBadge.badge_id == badge_id
    ).first()

    if not student_badge:
        raise HTTPException(status_code=404, detail="No tienes esta insignia")

    # Desequipar todas las otras insignias del mismo tipo
    badge = student_badge.badge
    db.query(StudentBadge).filter(
        StudentBadge.student_id == current_user.id,
        StudentBadge.is_equipped == True
    ).update({"is_equipped": False})

    # Equipar esta insignia
    student_badge.is_equipped = True
    db.commit()

    return APIResponse(success=True, message=f"Insignia '{badge.name}' equipada")


@router.post("/unequip", response_model=APIResponse)
async def unequip_badge(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Desequipar la insignia actual"""
    db.query(StudentBadge).filter(
        StudentBadge.student_id == current_user.id,
        StudentBadge.is_equipped == True
    ).update({"is_equipped": False})

    db.commit()

    return APIResponse(success=True, message="Insignia desequipada")


@router.post("/check-achievements", response_model=APIResponse)
async def check_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verificar y otorgar nuevas insignias basadas en logros"""
    new_badges = []
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())

    # Obtener todas las insignias activas
    all_badges = db.query(Badge).filter(Badge.is_active == True).all()

    # Obtener insignias que ya tiene el estudiante
    existing_badge_ids = set(
        sb.badge_id for sb in db.query(StudentBadge).filter(
            StudentBadge.student_id == current_user.id
        ).all()
    )

    for badge in all_badges:
        if badge.id in existing_badge_ids:
            continue

        earned = False
        req_type = badge.requirement_type
        req_value = badge.requirement_value

        # Verificar diferentes tipos de requisitos
        if req_type == "correct_streak":
            # Racha de respuestas correctas consecutivas
            attempts = db.query(ExerciseAttempt).filter(
                ExerciseAttempt.student_id == current_user.id
            ).order_by(ExerciseAttempt.attempted_at.desc()).limit(req_value).all()

            if len(attempts) >= req_value and all(a.is_correct for a in attempts):
                earned = True

        elif req_type == "daily_exercises":
            # Ejercicios completados hoy
            today_count = db.query(func.count(ExerciseAttempt.id)).filter(
                ExerciseAttempt.student_id == current_user.id,
                ExerciseAttempt.attempted_at >= today_start
            ).scalar()

            if today_count >= req_value:
                earned = True

        elif req_type == "daily_correct":
            # Respuestas correctas hoy
            today_correct = db.query(func.count(ExerciseAttempt.id)).filter(
                ExerciseAttempt.student_id == current_user.id,
                ExerciseAttempt.attempted_at >= today_start,
                ExerciseAttempt.is_correct == True
            ).scalar()

            if today_correct >= req_value:
                earned = True

        elif req_type == "total_points":
            # Puntos totales
            total_points = db.query(func.sum(GameSession.total_score)).filter(
                GameSession.student_id == current_user.id
            ).scalar() or 0

            if total_points >= req_value:
                earned = True

        elif req_type == "total_exercises":
            # Total de ejercicios completados
            total = db.query(func.count(ExerciseAttempt.id)).filter(
                ExerciseAttempt.student_id == current_user.id
            ).scalar()

            if total >= req_value:
                earned = True

        elif req_type == "accuracy":
            # Precisión general (porcentaje)
            total = db.query(func.count(ExerciseAttempt.id)).filter(
                ExerciseAttempt.student_id == current_user.id
            ).scalar()
            correct = db.query(func.count(ExerciseAttempt.id)).filter(
                ExerciseAttempt.student_id == current_user.id,
                ExerciseAttempt.is_correct == True
            ).scalar()

            if total >= 50:  # Mínimo 50 ejercicios
                accuracy = (correct / total) * 100
                if accuracy >= req_value:
                    earned = True

        elif req_type == "perfect_session":
            # Sesiones perfectas (100% correcto)
            perfect_sessions = db.query(GameSession).filter(
                GameSession.student_id == current_user.id,
                GameSession.exercises_completed >= 10,
                GameSession.wrong_answers == 0
            ).count()

            if perfect_sessions >= req_value:
                earned = True

        # Otorgar insignia si se cumple el requisito
        if earned:
            student_badge = StudentBadge(
                student_id=current_user.id,
                badge_id=badge.id,
                is_equipped=False
            )
            db.add(student_badge)
            new_badges.append({
                "id": str(badge.id),
                "name": badge.name,
                "description": badge.description,
                "rarity": badge.rarity.value,
                "icon": badge.icon,
                "color": badge.color
            })

    db.commit()

    return APIResponse(
        success=True,
        message=f"¡Has ganado {len(new_badges)} nueva(s) insignia(s)!" if new_badges else "No hay nuevas insignias",
        data={"newBadges": new_badges}
    )


@router.post("/initialize-defaults", response_model=APIResponse)
async def initialize_default_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Crear insignias predeterminadas (solo admin)"""
    default_badges = [
        # Títulos por racha
        {"name": "Imparable", "description": "10 respuestas correctas seguidas", "badge_type": BadgeType.title, "rarity": BadgeRarity.rare, "icon": "🔥", "color": "#ef4444", "requirement_type": "correct_streak", "requirement_value": 10},
        {"name": "En Llamas", "description": "20 respuestas correctas seguidas", "badge_type": BadgeType.title, "rarity": BadgeRarity.epic, "icon": "💥", "color": "#f97316", "requirement_type": "correct_streak", "requirement_value": 20},
        {"name": "Leyenda", "description": "50 respuestas correctas seguidas", "badge_type": BadgeType.title, "rarity": BadgeRarity.legendary, "icon": "👑", "color": "#eab308", "requirement_type": "correct_streak", "requirement_value": 50},

        # Títulos por ejercicios diarios
        {"name": "Dedicado", "description": "20 ejercicios en un día", "badge_type": BadgeType.title, "rarity": BadgeRarity.common, "icon": "📚", "color": "#3b82f6", "requirement_type": "daily_exercises", "requirement_value": 20},
        {"name": "Incansable", "description": "50 ejercicios en un día", "badge_type": BadgeType.title, "rarity": BadgeRarity.rare, "icon": "💪", "color": "#8b5cf6", "requirement_type": "daily_exercises", "requirement_value": 50},
        {"name": "Máquina", "description": "100 ejercicios en un día", "badge_type": BadgeType.title, "rarity": BadgeRarity.epic, "icon": "🤖", "color": "#06b6d4", "requirement_type": "daily_exercises", "requirement_value": 100},

        # Títulos por precisión
        {"name": "Preciso", "description": "80% de precisión (mín 50 ejercicios)", "badge_type": BadgeType.title, "rarity": BadgeRarity.common, "icon": "🎯", "color": "#22c55e", "requirement_type": "accuracy", "requirement_value": 80},
        {"name": "Francotirador", "description": "90% de precisión (mín 50 ejercicios)", "badge_type": BadgeType.title, "rarity": BadgeRarity.rare, "icon": "🏹", "color": "#14b8a6", "requirement_type": "accuracy", "requirement_value": 90},
        {"name": "Perfeccionista", "description": "95% de precisión (mín 50 ejercicios)", "badge_type": BadgeType.title, "rarity": BadgeRarity.epic, "icon": "💎", "color": "#a855f7", "requirement_type": "accuracy", "requirement_value": 95},

        # Títulos por puntos totales
        {"name": "Aprendiz", "description": "1,000 puntos totales", "badge_type": BadgeType.title, "rarity": BadgeRarity.common, "icon": "⭐", "color": "#64748b", "requirement_type": "total_points", "requirement_value": 1000},
        {"name": "Experto", "description": "5,000 puntos totales", "badge_type": BadgeType.title, "rarity": BadgeRarity.rare, "icon": "🌟", "color": "#f59e0b", "requirement_type": "total_points", "requirement_value": 5000},
        {"name": "Maestro", "description": "10,000 puntos totales", "badge_type": BadgeType.title, "rarity": BadgeRarity.epic, "icon": "✨", "color": "#ec4899", "requirement_type": "total_points", "requirement_value": 10000},
        {"name": "Gran Maestro", "description": "25,000 puntos totales", "badge_type": BadgeType.title, "rarity": BadgeRarity.legendary, "icon": "🏆", "color": "#fbbf24", "requirement_type": "total_points", "requirement_value": 25000},

        # Bordes especiales
        {"name": "Borde Dorado", "description": "5 sesiones perfectas", "badge_type": BadgeType.border, "rarity": BadgeRarity.epic, "icon": "🥇", "color": "#fbbf24", "requirement_type": "perfect_session", "requirement_value": 5},
        {"name": "Borde Diamante", "description": "10 sesiones perfectas", "badge_type": BadgeType.border, "rarity": BadgeRarity.legendary, "icon": "💠", "color": "#60a5fa", "requirement_type": "perfect_session", "requirement_value": 10},
    ]

    created_count = 0
    for badge_data in default_badges:
        # Verificar si ya existe
        existing = db.query(Badge).filter(Badge.name == badge_data["name"]).first()
        if not existing:
            badge = Badge(**badge_data)
            db.add(badge)
            created_count += 1

    db.commit()

    return APIResponse(
        success=True,
        message=f"{created_count} insignias creadas",
        data={"created": created_count}
    )
