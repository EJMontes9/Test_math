"""Script para crear datos de prueba"""
import sys
import os
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User, UserRole, Paralelo, Enrollment, Setting
from app.auth import get_password_hash


def create_sample_data():
    """Crea usuarios, paralelos y datos de prueba"""
    db = SessionLocal()

    try:
        print("🚀 Creando datos de prueba...")

        # 1. Crear configuraciones por defecto
        print("\n📝 Creando configuraciones...")
        settings = [
            Setting(key="app_name", value="MathMaster", type="string"),
            Setting(key="primary_color", value="#6366f1", type="string"),
            Setting(key="secondary_color", value="#8b5cf6", type="string"),
        ]

        for setting in settings:
            existing = db.query(Setting).filter(Setting.key == setting.key).first()
            if not existing:
                db.add(setting)

        db.commit()
        print("✅ Configuraciones creadas")

        # 2. Crear usuarios
        print("\n👥 Creando usuarios...")

        # Admin
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
            print("✅ Administrador creado: admin@mathmaster.com / admin123")

        # Docente
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
            print("✅ Docente creado: docente@mathmaster.com / docente123")

        db.commit()
        db.refresh(teacher)

        # 3. Crear paralelo
        print("\n📚 Creando paralelo...")
        paralelo = db.query(Paralelo).filter(Paralelo.name == "6to Básico A").first()
        if not paralelo:
            paralelo = Paralelo(
                name="6to Básico A",
                level="6to Básico",
                teacher_id=teacher.id,
                description="Paralelo de prueba para 6to Básico",
                is_active=True
            )
            db.add(paralelo)
            db.commit()
            db.refresh(paralelo)
            print("✅ Paralelo creado: 6to Básico A")

        # 4. Crear estudiantes
        print("\n🎓 Creando estudiantes...")
        students_data = [
            ("estudiante1@mathmaster.com", "estudiante123", "Juan", "Pérez"),
            ("estudiante2@mathmaster.com", "estudiante123", "María", "González"),
            ("estudiante3@mathmaster.com", "estudiante123", "Carlos", "Rodríguez"),
            ("estudiante4@mathmaster.com", "estudiante123", "Ana", "Martínez"),
            ("estudiante5@mathmaster.com", "estudiante123", "Luis", "López"),
        ]

        for email, password, first_name, last_name in students_data:
            student = db.query(User).filter(User.email == email).first()
            if not student:
                student = User(
                    email=email,
                    password=get_password_hash(password),
                    first_name=first_name,
                    last_name=last_name,
                    role=UserRole.student,
                    is_active=True
                )
                db.add(student)
                db.commit()
                db.refresh(student)

                # Inscribir en el paralelo
                enrollment = Enrollment(
                    student_id=student.id,
                    paralelo_id=paralelo.id,
                    is_active=True
                )
                db.add(enrollment)

                print(f"✅ Estudiante creado: {email} / {password}")

        db.commit()

        print("\n" + "="*60)
        print("✅ Datos de prueba creados exitosamente!")
        print("="*60)
        print("\n📋 CREDENCIALES:")
        print("\nAdministrador:")
        print("  Email: admin@mathmaster.com")
        print("  Password: admin123")
        print("\nDocente:")
        print("  Email: docente@mathmaster.com")
        print("  Password: docente123")
        print("\nEstudiantes (todos con password: estudiante123):")
        print("  - estudiante1@mathmaster.com")
        print("  - estudiante2@mathmaster.com")
        print("  - estudiante3@mathmaster.com")
        print("  - estudiante4@mathmaster.com")
        print("  - estudiante5@mathmaster.com")
        print("="*60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_sample_data()
