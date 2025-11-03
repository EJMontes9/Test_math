"""Sistema de recomendaciones con IA"""
from typing import Dict, List
from sqlalchemy.orm import Session
from app.models import StudentTopicProgress, MathTopic, ExerciseAttempt, User
import json


class AIRecommendations:
    """Sistema de recomendaciones inteligentes para estudiantes"""

    @staticmethod
    def generate_student_recommendations(student_id: str, db: Session) -> List[Dict]:
        """
        Genera recomendaciones personalizadas para un estudiante
        basándose en su rendimiento
        """
        recommendations = []

        # Obtener progreso por tema
        topic_progress = db.query(StudentTopicProgress).filter(
            StudentTopicProgress.student_id == student_id
        ).all()

        if not topic_progress:
            recommendations.append({
                "type": "info",
                "priority": "high",
                "title": "¡Comienza tu práctica!",
                "message": "No tienes ejercicios completados aún. Te recomendamos comenzar con Operaciones Básicas para familiarizarte con el sistema.",
                "suggested_topic": MathTopic.operations.value,
                "action": "practice"
            })
            return recommendations

        # Analizar cada tema
        weak_topics = []
        strong_topics = []
        needs_practice = []

        for progress in topic_progress:
            accuracy = (progress.correct_attempts / progress.total_attempts * 100) if progress.total_attempts > 0 else 0
            mastery = progress.mastery_level

            if mastery < 30:
                weak_topics.append((progress.topic, accuracy, mastery))
            elif mastery > 70:
                strong_topics.append((progress.topic, accuracy, mastery))

            if progress.total_attempts < 5:
                needs_practice.append(progress.topic)

        # Generar recomendaciones basadas en análisis

        # 1. Temas débiles prioritarios
        if weak_topics:
            weak_topics.sort(key=lambda x: x[2])  # Ordenar por mastery (menor primero)
            weakest_topic = weak_topics[0]

            topic_name = AIRecommendations._get_topic_name(weakest_topic[0])

            recommendations.append({
                "type": "warning",
                "priority": "high",
                "title": f"Refuerza {topic_name}",
                "message": f"Tu nivel de dominio en {topic_name} es bajo ({int(weakest_topic[2])}%). Te recomendamos dedicar más tiempo a practicar este tema.",
                "suggested_topic": weakest_topic[0].value,
                "action": "practice",
                "details": {
                    "current_accuracy": round(weakest_topic[1], 1),
                    "mastery_level": weakest_topic[2],
                    "recommended_exercises": 10
                }
            })

        # 2. Temas que necesitan más práctica
        if needs_practice:
            topic = needs_practice[0]
            topic_name = AIRecommendations._get_topic_name(topic)

            recommendations.append({
                "type": "info",
                "priority": "medium",
                "title": f"Practica más {topic_name}",
                "message": f"Has hecho pocos ejercicios de {topic_name}. Realiza al menos 5 ejercicios más para mejorar tu dominio.",
                "suggested_topic": topic.value,
                "action": "practice"
            })

        # 3. Celebrar fortalezas
        if strong_topics:
            strong_topics.sort(key=lambda x: x[2], reverse=True)
            strongest_topic = strong_topics[0]
            topic_name = AIRecommendations._get_topic_name(strongest_topic[0])

            recommendations.append({
                "type": "success",
                "priority": "low",
                "title": f"¡Excelente en {topic_name}!",
                "message": f"Has dominado {topic_name} con un {int(strongest_topic[2])}% de nivel. Sigue así y ayuda a tus compañeros.",
                "suggested_topic": strongest_topic[0].value,
                "action": "challenge"
            })

        # 4. Recomendaciones de próximos pasos
        if len(strong_topics) >= 2 and len(weak_topics) < 2:
            recommendations.append({
                "type": "success",
                "priority": "medium",
                "title": "¡Estás listo para más desafíos!",
                "message": "Has dominado varios temas. Te recomendamos intentar ejercicios de Ecuaciones Cuadráticas o Álgebra avanzada.",
                "suggested_topic": MathTopic.quadratic_equations.value,
                "action": "challenge"
            })

        # 5. Motivación general
        total_attempts = sum(p.total_attempts for p in topic_progress)
        total_correct = sum(p.correct_attempts for p in topic_progress)
        overall_accuracy = (total_correct / total_attempts * 100) if total_attempts > 0 else 0

        if overall_accuracy < 50:
            recommendations.append({
                "type": "warning",
                "priority": "high",
                "title": "Mejora tu precisión",
                "message": f"Tu tasa de acierto general es {overall_accuracy:.1f}%. Tómate tu tiempo para leer bien cada ejercicio antes de responder.",
                "action": "tips",
                "details": {
                    "tip": "Lee el ejercicio dos veces antes de responder",
                    "tip2": "Verifica tu respuesta antes de enviar",
                    "tip3": "Practica con ejercicios fáciles primero"
                }
            })
        elif overall_accuracy > 80:
            recommendations.append({
                "type": "success",
                "priority": "low",
                "title": "¡Rendimiento excepcional!",
                "message": f"Tu tasa de acierto es {overall_accuracy:.1f}%. ¡Sigue así! Estás entre los mejores estudiantes.",
                "action": "celebrate"
            })

        return recommendations

    @staticmethod
    def generate_class_recommendations(paralelo_id: str, db: Session) -> Dict:
        """
        Genera recomendaciones para el profesor sobre el curso en general
        """
        from app.models import Enrollment
        from sqlalchemy import func

        # Obtener estudiantes del paralelo
        enrollments = db.query(Enrollment).filter(
            Enrollment.paralelo_id == paralelo_id,
            Enrollment.is_active == True
        ).all()

        student_ids = [e.student_id for e in enrollments]

        if not student_ids:
            return {
                "overall_health": "unknown",
                "recommendations": [],
                "weak_topics": [],
                "strong_topics": []
            }

        # Analizar temas por estudiante
        topic_stats = {}

        for topic in MathTopic:
            progress_list = db.query(StudentTopicProgress).filter(
                StudentTopicProgress.student_id.in_(student_ids),
                StudentTopicProgress.topic == topic
            ).all()

            if progress_list:
                avg_mastery = sum(p.mastery_level for p in progress_list) / len(progress_list)
                total_attempts = sum(p.total_attempts for p in progress_list)
                total_correct = sum(p.correct_attempts for p in progress_list)
                accuracy = (total_correct / total_attempts * 100) if total_attempts > 0 else 0

                topic_stats[topic] = {
                    "mastery": avg_mastery,
                    "accuracy": accuracy,
                    "students_practicing": len(progress_list),
                    "total_attempts": total_attempts
                }

        # Identificar temas débiles y fuertes
        weak_topics = []
        strong_topics = []

        for topic, stats in topic_stats.items():
            if stats["mastery"] < 40:
                weak_topics.append({
                    "topic": topic.value,
                    "name": AIRecommendations._get_topic_name(topic),
                    "mastery": round(stats["mastery"], 1),
                    "accuracy": round(stats["accuracy"], 1)
                })
            elif stats["mastery"] > 70:
                strong_topics.append({
                    "topic": topic.value,
                    "name": AIRecommendations._get_topic_name(topic),
                    "mastery": round(stats["mastery"], 1),
                    "accuracy": round(stats["accuracy"], 1)
                })

        # Generar recomendaciones
        recommendations = []

        if weak_topics:
            recommendations.append({
                "type": "warning",
                "priority": "high",
                "message": f"La clase necesita refuerzo en: {', '.join([t['name'] for t in weak_topics[:3]])}.",
                "action": "Considera dedicar más tiempo de clase a estos temas"
            })

        if strong_topics:
            recommendations.append({
                "type": "success",
                "priority": "medium",
                "message": f"La clase domina: {', '.join([t['name'] for t in strong_topics[:3]])}.",
                "action": "Estos estudiantes podrían ayudar a sus compañeros"
            })

        # Salud general del curso
        if topic_stats:
            avg_class_mastery = sum(s["mastery"] for s in topic_stats.values()) / len(topic_stats)

            if avg_class_mastery < 40:
                overall_health = "needs_attention"
            elif avg_class_mastery < 60:
                overall_health = "good"
            else:
                overall_health = "excellent"
        else:
            overall_health = "unknown"

        return {
            "overall_health": overall_health,
            "recommendations": recommendations,
            "weak_topics": weak_topics,
            "strong_topics": strong_topics,
            "average_mastery": round(avg_class_mastery, 1) if topic_stats else 0
        }

    @staticmethod
    def _get_topic_name(topic: MathTopic) -> str:
        """Obtiene el nombre en español del tema"""
        names = {
            MathTopic.operations: "Operaciones Básicas",
            MathTopic.combined_operations: "Operaciones Combinadas",
            MathTopic.linear_equations: "Ecuaciones Lineales",
            MathTopic.quadratic_equations: "Ecuaciones Cuadráticas",
            MathTopic.fractions: "Fracciones",
            MathTopic.percentages: "Porcentajes",
            MathTopic.geometry: "Geometría",
            MathTopic.algebra: "Álgebra"
        }
        return names.get(topic, topic.value)

    @staticmethod
    def update_topic_progress(student_id: str, topic: MathTopic, is_correct: bool, db: Session):
        """Actualiza el progreso del estudiante en un tema específico"""
        from datetime import datetime

        progress = db.query(StudentTopicProgress).filter(
            StudentTopicProgress.student_id == student_id,
            StudentTopicProgress.topic == topic
        ).first()

        if not progress:
            progress = StudentTopicProgress(
                student_id=student_id,
                topic=topic,
                total_attempts=0,
                correct_attempts=0,
                wrong_attempts=0,
                mastery_level=0
            )
            db.add(progress)

        progress.total_attempts += 1
        if is_correct:
            progress.correct_attempts += 1
        else:
            progress.wrong_attempts += 1

        progress.last_practiced = datetime.now()

        # Calcular nivel de dominio (mastery_level)
        accuracy = (progress.correct_attempts / progress.total_attempts * 100) if progress.total_attempts > 0 else 0

        # Fórmula de mastery: considera tanto la precisión como la cantidad de práctica
        # Máximo 100%, pero requiere tanto buena precisión como suficiente práctica
        practice_factor = min(progress.total_attempts / 20, 1.0)  # Máximo en 20 intentos
        accuracy_factor = accuracy / 100

        progress.mastery_level = int(practice_factor * accuracy_factor * 100)

        # Marcar si necesita mejora
        progress.needs_improvement = progress.mastery_level < 50 or accuracy < 60

        db.commit()
