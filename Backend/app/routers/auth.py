from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, APIResponse
from app.auth import verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


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
