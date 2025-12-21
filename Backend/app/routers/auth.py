from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timedelta
import secrets
import os
import uuid
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, APIResponse
from app.auth import verify_password, create_access_token, get_password_hash, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Directorio para avatares
AVATAR_DIR = "static/avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)


# ============= Schemas =============
class ChangePasswordRequest(BaseModel):
    current_password: str = Field(alias="currentPassword")
    new_password: str = Field(alias="newPassword")

    class Config:
        populate_by_name = True


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(alias="newPassword")

    class Config:
        populate_by_name = True


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")

    class Config:
        populate_by_name = True


# ============= Endpoints =============

@router.post("/login", response_model=APIResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Iniciar sesión y obtener token JWT"""
    # Buscar usuario
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )

    # Crear token
    access_token = create_access_token(data={"sub": user.email})

    return APIResponse(
        success=True,
        message="Login exitoso",
        data={
            "token": access_token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "role": user.role.value,
                "avatar": user.avatar,
                "isActive": user.is_active
            }
        }
    )


@router.post("/logout", response_model=APIResponse)
async def logout():
    """Cerrar sesión (en el cliente se elimina el token)"""
    return APIResponse(
        success=True,
        message="Logout exitoso"
    )


@router.get("/me", response_model=APIResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Obtener información del usuario autenticado"""
    return APIResponse(
        success=True,
        data={
            "user": {
                "id": str(current_user.id),
                "email": current_user.email,
                "firstName": current_user.first_name,
                "lastName": current_user.last_name,
                "role": current_user.role.value,
                "avatar": current_user.avatar,
                "isActive": current_user.is_active,
                "createdAt": current_user.created_at.isoformat() if current_user.created_at else None
            }
        }
    )


@router.post("/forgot-password", response_model=APIResponse)
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Solicitar restablecimiento de contraseña"""
    user = db.query(User).filter(User.email == request.email).first()

    # Por seguridad, siempre devolvemos éxito aunque el email no exista
    if not user:
        return APIResponse(
            success=True,
            message="Si el email existe, recibirás un enlace para restablecer tu contraseña"
        )

    # Generar token de reset
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now() + timedelta(hours=1)
    db.commit()

    # En producción, aquí se enviaría el email con el enlace
    # Por ahora, solo retornamos el token para testing
    # TODO: Integrar servicio de email (SendGrid, AWS SES, etc.)

    return APIResponse(
        success=True,
        message="Si el email existe, recibirás un enlace para restablecer tu contraseña",
        data={
            # En producción, NO incluir el token en la respuesta
            # Esto es solo para desarrollo/testing
            "resetToken": reset_token,
            "expiresIn": "1 hora"
        }
    )


@router.post("/reset-password", response_model=APIResponse)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Restablecer contraseña usando token"""
    user = db.query(User).filter(
        User.reset_token == request.token,
        User.reset_token_expires > datetime.now()
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )

    # Validar nueva contraseña
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres"
        )

    # Actualizar contraseña
    user.password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return APIResponse(
        success=True,
        message="Contraseña restablecida exitosamente"
    )


@router.post("/change-password", response_model=APIResponse)
async def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cambiar contraseña del usuario autenticado"""
    # Verificar contraseña actual
    if not verify_password(request.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )

    # Validar nueva contraseña
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 6 caracteres"
        )

    if request.current_password == request.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente a la actual"
        )

    # Actualizar contraseña
    current_user.password = get_password_hash(request.new_password)
    db.commit()

    return APIResponse(
        success=True,
        message="Contraseña actualizada exitosamente"
    )


@router.put("/profile", response_model=APIResponse)
async def update_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar perfil del usuario"""
    if request.first_name:
        current_user.first_name = request.first_name
    if request.last_name:
        current_user.last_name = request.last_name

    db.commit()

    return APIResponse(
        success=True,
        message="Perfil actualizado",
        data={
            "user": {
                "id": str(current_user.id),
                "email": current_user.email,
                "firstName": current_user.first_name,
                "lastName": current_user.last_name,
                "role": current_user.role.value,
                "avatar": current_user.avatar,
                "isActive": current_user.is_active
            }
        }
    )


@router.post("/upload-avatar", response_model=APIResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Subir imagen de avatar"""
    # Validar tipo de archivo
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP"
        )

    # Validar tamaño (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo es demasiado grande. Máximo 5MB"
        )

    # Generar nombre único
    extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{extension}"
    filepath = os.path.join(AVATAR_DIR, filename)

    # Eliminar avatar anterior si existe
    if current_user.avatar:
        old_path = current_user.avatar.replace("/static/", "static/")
        if os.path.exists(old_path):
            os.remove(old_path)

    # Guardar archivo
    with open(filepath, "wb") as f:
        f.write(contents)

    # Actualizar usuario
    avatar_url = f"/static/avatars/{filename}"
    current_user.avatar = avatar_url
    db.commit()

    return APIResponse(
        success=True,
        message="Avatar actualizado",
        data={
            "avatar": avatar_url
        }
    )


@router.delete("/avatar", response_model=APIResponse)
async def delete_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar avatar del usuario"""
    if current_user.avatar:
        old_path = current_user.avatar.replace("/static/", "static/")
        if os.path.exists(old_path):
            os.remove(old_path)

        current_user.avatar = None
        db.commit()

    return APIResponse(
        success=True,
        message="Avatar eliminado"
    )
