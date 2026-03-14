"""
Script de migración para actualizar la DB de Railway.
Agrega columnas faltantes y crea tablas nuevas sin borrar datos existentes.
Ejecutar: python migrate_db.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import (
    Goal, StudentGoal, Badge, StudentBadge,
    GoalType, GoalStatus, BadgeCategory
)
from sqlalchemy import text


def run_migration():
    print("=" * 60)
    print("🔧 Iniciando migración de base de datos...")
    print("=" * 60)

    with engine.connect() as conn:

        # 1. Crear enums si no existen
        print("\n📦 Verificando tipos ENUM...")

        enums = {
            "goaltype": ["exercises", "accuracy", "points", "streak", "topic_mastery"],
            "goalstatus": ["active", "completed", "expired", "cancelled"],
            "badgecategory": ["achievement", "streak", "mastery", "social", "special"],
        }

        for enum_name, values in enums.items():
            try:
                values_sql = ", ".join(f"'{v}'" for v in values)
                conn.execute(text(f"CREATE TYPE {enum_name} AS ENUM ({values_sql})"))
                conn.commit()
                print(f"  ✅ Enum '{enum_name}' creado")
            except Exception as e:
                conn.rollback()
                if "already exists" in str(e):
                    print(f"  ℹ️  Enum '{enum_name}' ya existe")
                    # Verificar si falta algún valor
                    for value in values:
                        try:
                            conn.execute(text(f"ALTER TYPE {enum_name} ADD VALUE IF NOT EXISTS '{value}'"))
                            conn.commit()
                        except Exception:
                            conn.rollback()
                else:
                    print(f"  ⚠️  Error en enum '{enum_name}': {e}")
                    conn.rollback()

        # 2. Agregar columnas faltantes a la tabla 'badges'
        print("\n📦 Actualizando tabla 'badges'...")

        badge_migrations = [
            ("teacher_id", "UUID REFERENCES users(id) ON DELETE SET NULL"),
            ("requirement", "VARCHAR"),
            ("requirement_value", "INTEGER DEFAULT 0"),
        ]

        for col_name, col_def in badge_migrations:
            try:
                conn.execute(text(
                    f"ALTER TABLE badges ADD COLUMN IF NOT EXISTS {col_name} {col_def}"
                ))
                conn.commit()
                print(f"  ✅ Columna 'badges.{col_name}' agregada/verificada")
            except Exception as e:
                conn.rollback()
                print(f"  ⚠️  Error en 'badges.{col_name}': {e}")

        # 3. Agregar columnas faltantes a la tabla 'goals' (si ya existe)
        print("\n📦 Actualizando tabla 'goals' (columnas faltantes)...")

        goals_migrations = [
            ("badge_id", "UUID REFERENCES badges(id) ON DELETE SET NULL"),
            ("topic", "VARCHAR"),
            ("reward_points", "INTEGER DEFAULT 100"),
            ("updated_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
        ]

        for col_name, col_def in goals_migrations:
            try:
                conn.execute(text(
                    f"ALTER TABLE goals ADD COLUMN IF NOT EXISTS {col_name} {col_def}"
                ))
                conn.commit()
                print(f"  ✅ Columna 'goals.{col_name}' agregada/verificada")
            except Exception as e:
                conn.rollback()
                print(f"  ⚠️  Error en 'goals.{col_name}': {e}")

        # 4. Crear tabla 'goals' si no existe
        print("\n📦 Verificando tabla 'goals'...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS goals (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    paralelo_id UUID REFERENCES paralelos(id) ON DELETE SET NULL,
                    title VARCHAR NOT NULL,
                    description TEXT,
                    goal_type goaltype NOT NULL,
                    target_value INTEGER NOT NULL,
                    topic VARCHAR,
                    reward_points INTEGER DEFAULT 100,
                    badge_id UUID REFERENCES badges(id) ON DELETE SET NULL,
                    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            conn.commit()
            print("  ✅ Tabla 'goals' creada/verificada")
        except Exception as e:
            conn.rollback()
            print(f"  ⚠️  Error en tabla 'goals': {e}")

        # 4. Crear tabla 'student_goals' si no existe
        print("\n📦 Verificando tabla 'student_goals'...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS student_goals (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
                    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    current_value INTEGER DEFAULT 0,
                    status goalstatus DEFAULT 'active',
                    completed_at TIMESTAMP WITH TIME ZONE,
                    points_earned INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            conn.commit()
            print("  ✅ Tabla 'student_goals' creada/verificada")
        except Exception as e:
            conn.rollback()
            print(f"  ⚠️  Error en tabla 'student_goals': {e}")

        # 5. Crear tabla 'student_badges' si no existe
        print("\n📦 Verificando tabla 'student_badges'...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS student_badges (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
                    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    is_equipped BOOLEAN DEFAULT FALSE,
                    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            conn.commit()
            print("  ✅ Tabla 'student_badges' creada/verificada")
        except Exception as e:
            conn.rollback()
            print(f"  ⚠️  Error en tabla 'student_badges': {e}")

        # 6. Verificar estado final
        print("\n📊 Estado final de tablas:")
        tables = ["badges", "goals", "student_goals", "student_badges"]
        for table in tables:
            try:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"  ✅ {table}: {count} registros")
            except Exception as e:
                print(f"  ❌ {table}: ERROR - {e}")
                conn.rollback()

    print("\n" + "=" * 60)
    print("✅ Migración completada")
    print("=" * 60)


if __name__ == "__main__":
    run_migration()
