"""Script para crear insignias por defecto, incluyendo las basadas en metas"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Badge, BadgeCategory


def create_badges():
    db = SessionLocal()
    try:
        print("🏅 Creando insignias por defecto...")

        badges = [
            # --- Insignias por ejercicios ---
            {
                "name": "Primer Paso",
                "description": "Completa tu primer ejercicio",
                "icon": "🌱",
                "category": BadgeCategory.achievement,
                "requirement": "first_exercise",
                "requirement_value": 1,
                "points": 10,
            },
            {
                "name": "En Práctica",
                "description": "Completa 10 ejercicios",
                "icon": "📝",
                "category": BadgeCategory.achievement,
                "requirement": "exercises_count",
                "requirement_value": 10,
                "points": 20,
            },
            {
                "name": "Dedicado",
                "description": "Completa 50 ejercicios",
                "icon": "💪",
                "category": BadgeCategory.achievement,
                "requirement": "exercises_count",
                "requirement_value": 50,
                "points": 50,
            },
            {
                "name": "Matemático",
                "description": "Completa 100 ejercicios",
                "icon": "🧮",
                "category": BadgeCategory.achievement,
                "requirement": "exercises_count",
                "requirement_value": 100,
                "points": 100,
            },

            # --- Insignias por sesiones ---
            {
                "name": "Jugador Activo",
                "description": "Juega 5 sesiones",
                "icon": "🎮",
                "category": BadgeCategory.achievement,
                "requirement": "sessions_count",
                "requirement_value": 5,
                "points": 30,
            },
            {
                "name": "Constante",
                "description": "Juega 20 sesiones",
                "icon": "🔥",
                "category": BadgeCategory.streak,
                "requirement": "sessions_count",
                "requirement_value": 20,
                "points": 60,
            },

            # --- Insignias por respuestas correctas ---
            {
                "name": "Buen Ojo",
                "description": "Acumula 20 respuestas correctas",
                "icon": "🎯",
                "category": BadgeCategory.achievement,
                "requirement": "correct_streak",
                "requirement_value": 20,
                "points": 40,
            },
            {
                "name": "Experto",
                "description": "Acumula 100 respuestas correctas",
                "icon": "⭐",
                "category": BadgeCategory.mastery,
                "requirement": "correct_streak",
                "requirement_value": 100,
                "points": 80,
            },

            # --- Insignias por metas completadas ---
            {
                "name": "Primera Meta",
                "description": "Completa tu primera meta asignada",
                "icon": "🎖️",
                "category": BadgeCategory.achievement,
                "requirement": "first_goal",
                "requirement_value": 1,
                "points": 50,
            },
            {
                "name": "Cumplidor",
                "description": "Completa 3 metas",
                "icon": "🏆",
                "category": BadgeCategory.achievement,
                "requirement": "goals_completed",
                "requirement_value": 3,
                "points": 75,
            },
            {
                "name": "Campeón de Metas",
                "description": "Completa 5 metas",
                "icon": "👑",
                "category": BadgeCategory.achievement,
                "requirement": "goals_completed",
                "requirement_value": 5,
                "points": 100,
            },
            {
                "name": "Leyenda",
                "description": "Completa 10 metas",
                "icon": "🌟",
                "category": BadgeCategory.mastery,
                "requirement": "goals_completed",
                "requirement_value": 10,
                "points": 200,
            },
        ]

        created = 0
        for badge_data in badges:
            existing = db.query(Badge).filter(Badge.name == badge_data["name"]).first()
            if not existing:
                badge = Badge(
                    name=badge_data["name"],
                    description=badge_data["description"],
                    icon=badge_data["icon"],
                    category=badge_data["category"],
                    requirement=badge_data["requirement"],
                    requirement_value=badge_data["requirement_value"],
                    points=badge_data["points"],
                    is_active=True,
                )
                db.add(badge)
                created += 1
                print(f"  ✅ {badge_data['icon']} {badge_data['name']}")
            else:
                print(f"  ℹ️  Ya existe: {badge_data['name']}")

        db.commit()
        print(f"\n✅ {created} insignias creadas exitosamente!")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    create_badges()
