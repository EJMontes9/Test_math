from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from uuid import UUID
from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserCreate, UserUpdate, UserResponse, UserStats, APIResponse
from app.auth import get_password_hash, require_admin

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=APIResponse)
async def get_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener todos los usuarios con filtros opcionales"""
    query = db.query(User)

    # Filtros
    if role and role != "all":
        query = query.filter(User.role == role)

    if status:
        is_active = status == "active"
        query = query.filter(User.is_active == is_active)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                User.email.ilike(search_filter),
                User.first_name.ilike(search_filter),
                User.last_name.ilike(search_filter)
            )
        )

    users = query.order_by(User.created_at.desc()).all()

    # Convertir a formato del frontend
    users_data = [
        {
            "id": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role.value,
            "isActive": user.is_active,
            "createdAt": user.created_at.isoformat(),
            "updatedAt": user.updated_at.isoformat()
        }
        for user in users
    ]

    return APIResponse(success=True, data=users_data)


@router.get("/stats", response_model=APIResponse)
async def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener estadísticas de usuarios"""
    total = db.query(func.count(User.id)).scalar()
    active = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    inactive = total - active

    # Por rol
    by_role = {}
    for role in UserRole:
        count = db.query(func.count(User.id)).filter(User.role == role).scalar()
        by_role[role.value] = count

    stats = {
        "total": total,
        "active": active,
        "inactive": inactive,
        "byRole": by_role
    }

    return APIResponse(success=True, data=stats)


@router.get("/{user_id}", response_model=APIResponse)
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener un usuario por ID"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user_data = {
        "id": str(user.id),
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role.value,
        "isActive": user.is_active,
        "createdAt": user.created_at.isoformat(),
        "updatedAt": user.updated_at.isoformat()
    }

    return APIResponse(success=True, data=user_data)


@router.post("/", response_model=APIResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Crear un nuevo usuario"""
    # Verificar si el email ya existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    # Crear usuario
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        is_active=user_data.is_active
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return APIResponse(
        success=True,
        message="Usuario creado exitosamente",
        data={
            "id": str(new_user.id),
            "email": new_user.email,
            "firstName": new_user.first_name,
            "lastName": new_user.last_name,
            "role": new_user.role.value,
            "isActive": new_user.is_active
        }
    )


@router.put("/{user_id}", response_model=APIResponse)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Actualizar un usuario"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar campos
    update_data = user_data.model_dump(exclude_unset=True, by_alias=False)

    if "password" in update_data and update_data["password"]:
        update_data["password"] = get_password_hash(update_data["password"])

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return APIResponse(
        success=True,
        message="Usuario actualizado exitosamente",
        data={
            "id": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role.value,
            "isActive": user.is_active
        }
    )


@router.delete("/{user_id}", response_model=APIResponse)
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Eliminar (desactivar) un usuario"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Soft delete
    user.is_active = False
    db.commit()

    return APIResponse(
        success=True,
        message="Usuario eliminado exitosamente"
    )
