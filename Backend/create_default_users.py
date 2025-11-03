"""Script para crear usuarios por defecto"""
import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User, UserRole
from app.auth import get_password_hash


def create_default_users():
    """Crear usuarios por defecto"""
    db = SessionLocal()

    try:
        print("👥 Creando usuarios por defecto...")

        # Usuarios por defecto
        default_users = [
            {
                "email": "admin@mathmaster.com",
                "password": "admin123",
                "first_name": "Admin",
                "last_name": "Sistema",
                "role": UserRole.admin
            },
            {
                "email": "docente@mathmaster.com",
                "password": "docente123",
                "first_name": "Juan",
                "last_name": "Profesor",
                "role": UserRole.teacher
            },
            {
                "email": "estudiante@mathmaster.com",
                "password": "estudiante123",
                "first_name": "María",
                "last_name": "García",
                "role": UserRole.student
            }
        ]

        for user_data in default_users:
            # Verificar si el usuario ya existe
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()

            if not existing_user:
                new_user = User(
                    email=user_data["email"],
                    password=get_password_hash(user_data["password"]),
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    role=user_data["role"],
                    is_active=True
                )
                db.add(new_user)
                db.commit()
                print(f"✅ Usuario creado: {user_data['email']}")
            else:
                print(f"ℹ️  Usuario ya existe: {user_data['email']}")

        print("\n✅ Usuarios por defecto creados exitosamente!")
        print("\n🔐 Credenciales:")
        print("   Admin: admin@mathmaster.com / admin123")
        print("   Docente: docente@mathmaster.com / docente123")
        print("   Estudiante: estudiante@mathmaster.com / estudiante123")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    create_default_users()
