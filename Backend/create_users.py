"""Script simplificado para crear usuarios de prueba"""
import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User, UserRole, Paralelo, Enrollment
from app.auth import get_password_hash


def create_users():
    """Crea usuarios y paralelos de prueba"""
    db = SessionLocal()

    try:
        print("🚀 Creando usuarios de prueba...")

        # 1. Crear Admin
        admin = db.query(User).filter(User.email == "admin@mathmaster.com").first()
        if not admin:
            admin = User(
                email="admin@mathmaster.com",
                password=get_password_hash("admin123"),
                first_name="Admin",
                last_name="Sistema",
                role=UserRole.admin,
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("✅ Admin: admin@mathmaster.com / admin123")

        # 2. Crear Docente
        teacher = db.query(User).filter(User.email == "docente@mathmaster.com").first()
        if not teacher:
            teacher = User(
                email="docente@mathmaster.com",
                password=get_password_hash("docente123"),
                first_name="Profesor",
                last_name="García",
                role=UserRole.teacher,
                is_active=True
            )
            db.add(teacher)
            db.commit()
            db.refresh(teacher)
            print("✅ Docente: docente@mathmaster.com / docente123")

        # 3. Crear Paralelo
        paralelo = db.query(Paralelo).filter(Paralelo.name == "6to Básico A").first()
        if not paralelo:
            paralelo = Paralelo(
                name="6to Básico A",
                level="6to Básico",
                teacher_id=teacher.id,
                description="Paralelo de prueba",
                is_active=True
            )
            db.add(paralelo)
            db.commit()
            db.refresh(paralelo)
            print("✅ Paralelo: 6to Básico A")

        # 4. Crear Estudiantes
        students = [
            ("estudiante1@mathmaster.com", "Juan", "Pérez"),
            ("estudiante2@mathmaster.com", "María", "González"),
            ("estudiante3@mathmaster.com", "Carlos", "Rodríguez"),
            ("estudiante4@mathmaster.com", "Ana", "Martínez"),
            ("estudiante5@mathmaster.com", "Luis", "López"),
        ]

        for email, first_name, last_name in students:
            student = db.query(User).filter(User.email == email).first()
            if not student:
                student = User(
                    email=email,
                    password=get_password_hash("estudiante123"),
                    first_name=first_name,
                    last_name=last_name,
                    role=UserRole.student,
                    is_active=True
                )
                db.add(student)
                db.commit()
                db.refresh(student)

                # Inscribir en paralelo
                enrollment = Enrollment(
                    student_id=student.id,
                    paralelo_id=paralelo.id,
                    is_active=True
                )
                db.add(enrollment)
                db.commit()

                print(f"✅ Estudiante: {email} / estudiante123")

        print("\n" + "="*60)
        print("✅ ¡Usuarios creados exitosamente!")
        print("="*60)
        print("\n📋 CREDENCIALES DE ACCESO:")
        print("\n👤 Administrador:")
        print("   Email: admin@mathmaster.com")
        print("   Password: admin123")
        print("\n👨‍🏫 Docente:")
        print("   Email: docente@mathmaster.com")
        print("   Password: docente123")
        print("\n🎓 Estudiantes (password: estudiante123):")
        print("   - estudiante1@mathmaster.com - Juan Pérez")
        print("   - estudiante2@mathmaster.com - María González")
        print("   - estudiante3@mathmaster.com - Carlos Rodríguez")
        print("   - estudiante4@mathmaster.com - Ana Martínez")
        print("   - estudiante5@mathmaster.com - Luis López")
        print("="*60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_users()
