"""Script para resetear contraseñas de usuarios existentes"""
import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash


def reset_passwords():
    """Resetea las contraseñas de los usuarios por defecto"""
    db = SessionLocal()

    try:
        # Usuarios y sus contraseñas
        users_passwords = [
            ("admin@mathmaster.com", "admin123"),
            ("docente@mathmaster.com", "docente123"),
            ("estudiante@mathmaster.com", "estudiante123"),
        ]

        for email, password in users_passwords:
            user = db.query(User).filter(User.email == email).first()
            if user:
                # Generar nuevo hash con passlib
                user.password = get_password_hash(password)
                db.commit()
                print(f"✅ Contraseña actualizada para: {email}")
            else:
                print(f"⚠️  Usuario no encontrado: {email}")

        print("\n✅ Proceso completado")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    reset_passwords()
