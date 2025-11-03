"""Generador de ejercicios matemáticos"""
import random
import json
from typing import Dict, List, Tuple
from app.models import MathTopic, ExerciseDifficulty


class ExerciseGenerator:
    """Generador de ejercicios matemáticos dinámicos"""

    @staticmethod
    def generate_exercise(topic: MathTopic, difficulty: ExerciseDifficulty, current_score: int = 0) -> Dict:
        """Genera un ejercicio basado en el tema y dificultad"""

        # Ajustar dificultad basada en puntaje
        effective_difficulty = ExerciseGenerator._adjust_difficulty_by_score(difficulty, current_score)

        if topic == MathTopic.combined_operations:
            return ExerciseGenerator._generate_combined_operations(effective_difficulty)
        elif topic == MathTopic.linear_equations:
            return ExerciseGenerator._generate_linear_equation(effective_difficulty)
        elif topic == MathTopic.quadratic_equations:
            return ExerciseGenerator._generate_quadratic_equation(effective_difficulty)
        elif topic == MathTopic.fractions:
            return ExerciseGenerator._generate_fractions(effective_difficulty)
        elif topic == MathTopic.operations:
            return ExerciseGenerator._generate_basic_operations(effective_difficulty)
        elif topic == MathTopic.percentages:
            return ExerciseGenerator._generate_percentages(effective_difficulty)
        else:
            # Por defecto, operaciones combinadas
            return ExerciseGenerator._generate_combined_operations(effective_difficulty)

    @staticmethod
    def _adjust_difficulty_by_score(difficulty: ExerciseDifficulty, score: int) -> ExerciseDifficulty:
        """Ajusta la dificultad basándose en el puntaje actual"""
        if score < 100:
            return ExerciseDifficulty.easy
        elif score < 300:
            return difficulty
        elif score < 600:
            # Aumentar un nivel si no está en hard
            if difficulty == ExerciseDifficulty.easy:
                return ExerciseDifficulty.medium
            return difficulty
        else:
            return ExerciseDifficulty.hard

    @staticmethod
    def calculate_points(difficulty: ExerciseDifficulty, is_correct: bool, time_taken: int, current_score: int) -> Tuple[int, int]:
        """
        Calcula puntos ganados/perdidos
        Returns: (points_earned, points_lost)
        """
        base_points = {
            ExerciseDifficulty.easy: 10,
            ExerciseDifficulty.medium: 20,
            ExerciseDifficulty.hard: 35
        }

        points = base_points.get(difficulty, 10)

        if is_correct:
            # Bonus por velocidad (si responde en menos de 30 segundos)
            if time_taken < 30:
                points += 5

            # Bonus por puntaje alto (mientras más puntos, más se gana)
            if current_score > 500:
                points = int(points * 1.3)
            elif current_score > 200:
                points = int(points * 1.15)

            return (points, 0)
        else:
            # Penalización por error (mientras más puntos, más se pierde)
            penalty = int(points * 0.4)  # 40% del valor del ejercicio

            if current_score > 500:
                penalty = int(penalty * 1.5)  # 50% más de penalización
            elif current_score > 200:
                penalty = int(penalty * 1.2)  # 20% más de penalización

            return (0, penalty)

    @staticmethod
    def _generate_combined_operations(difficulty: ExerciseDifficulty) -> Dict:
        """Genera operaciones combinadas"""
        if difficulty == ExerciseDifficulty.easy:
            # 2-3 operaciones simples
            a = random.randint(1, 20)
            b = random.randint(1, 20)
            c = random.randint(1, 10)

            operations = [
                (f"{a} + {b} - {c}", a + b - c),
                (f"{a} × {c} + {b}", a * c + b),
                (f"{a + b} - {c} × 2", (a + b) - (c * 2)),
            ]

            question, answer = random.choice(operations)

        elif difficulty == ExerciseDifficulty.medium:
            # 3-4 operaciones con paréntesis
            a = random.randint(2, 15)
            b = random.randint(2, 15)
            c = random.randint(2, 10)
            d = random.randint(1, 5)

            operations = [
                (f"({a} + {b}) × {c} - {d}", (a + b) * c - d),
                (f"{a} × ({b} - {c}) + {d}", a * (b - c) + d),
                (f"({a} × {b}) ÷ {c} + {d}", (a * b) // c + d),
                (f"{a} + ({b} × {c}) - {d}", a + (b * c) - d),
            ]

            question, answer = random.choice(operations)

        else:  # hard
            # 4-5 operaciones complejas con múltiples paréntesis
            a = random.randint(5, 20)
            b = random.randint(3, 15)
            c = random.randint(2, 10)
            d = random.randint(2, 8)

            operations = [
                (f"(({a} + {b}) × {c}) - ({d} × 2)", ((a + b) * c) - (d * 2)),
                (f"{a} × ({b} + {c}) - ({d} × {c})", a * (b + c) - (d * c)),
                (f"({a} × {b}) ÷ {c} + ({d} × {c})", (a * b) // c + (d * c)),
            ]

            question, answer = random.choice(operations)

        # Generar opciones incorrectas
        correct_answer = int(answer)
        wrong_answers = [
            correct_answer + random.randint(1, 5),
            correct_answer - random.randint(1, 5),
            int(correct_answer * 1.1),
        ]

        options = [str(correct_answer)] + [str(w) for w in wrong_answers]
        random.shuffle(options)

        return {
            "title": "Operación Combinada",
            "question": f"¿Cuál es el resultado de: {question}?",
            "correct_answer": str(correct_answer),
            "options": json.dumps(options),
            "explanation": f"Resolviendo paso a paso: {question} = {correct_answer}",
            "topic": MathTopic.combined_operations
        }

    @staticmethod
    def _generate_linear_equation(difficulty: ExerciseDifficulty) -> Dict:
        """Genera ecuaciones lineales"""
        if difficulty == ExerciseDifficulty.easy:
            # ax + b = c
            a = random.randint(1, 5)
            x_val = random.randint(1, 10)
            c = a * x_val + random.randint(-10, 10)
            b = c - (a * x_val)

            if b >= 0:
                equation = f"{a}x + {b} = {c}"
            else:
                equation = f"{a}x - {abs(b)} = {c}"

        elif difficulty == ExerciseDifficulty.medium:
            # ax + b = cx + d
            a = random.randint(2, 8)
            c = random.randint(1, a-1) if a > 1 else 1
            x_val = random.randint(1, 10)
            d = random.randint(-15, 15)
            b = (c - a) * x_val + d

            equation = f"{a}x + {b} = {c}x + {d}"

        else:  # hard
            # a(x + b) = c(x - d) + e
            a = random.randint(2, 6)
            b = random.randint(1, 8)
            c = random.randint(1, 5)
            d = random.randint(1, 8)

            # Resolver para un valor específico
            x_val = random.randint(5, 15)
            e = a * (x_val + b) - c * (x_val - d)

            equation = f"{a}(x + {b}) = {c}(x - {d}) + {e}"

        # Generar opciones
        correct_answer = x_val
        wrong_answers = [
            x_val + random.randint(1, 3),
            x_val - random.randint(1, 3),
            x_val * 2,
        ]

        options = [str(correct_answer)] + [str(w) for w in wrong_answers]
        random.shuffle(options)

        return {
            "title": "Ecuación Lineal",
            "question": f"Resuelve para x: {equation}",
            "correct_answer": str(correct_answer),
            "options": json.dumps(options),
            "explanation": f"El valor de x es {correct_answer}",
            "topic": MathTopic.linear_equations
        }

    @staticmethod
    def _generate_fractions(difficulty: ExerciseDifficulty) -> Dict:
        """Genera ejercicios de fracciones"""
        if difficulty == ExerciseDifficulty.easy:
            # Suma simple de fracciones con mismo denominador
            den = random.choice([2, 3, 4, 5, 6])
            num1 = random.randint(1, den-1)
            num2 = random.randint(1, den-1)

            result_num = num1 + num2
            result_den = den

            # Simplificar si es posible
            from math import gcd
            g = gcd(result_num, result_den)
            result_num //= g
            result_den //= g

            question = f"{num1}/{den} + {num2}/{den}"

        elif difficulty == ExerciseDifficulty.medium:
            # Suma de fracciones con diferente denominador
            den1 = random.choice([2, 3, 4, 5])
            den2 = random.choice([2, 3, 4, 5, 6])

            while den1 == den2:
                den2 = random.choice([2, 3, 4, 5, 6])

            num1 = random.randint(1, den1-1)
            num2 = random.randint(1, den2-1)

            # Calcular resultado
            from math import lcm
            common_den = lcm(den1, den2)
            result_num = (num1 * (common_den // den1)) + (num2 * (common_den // den2))
            result_den = common_den

            # Simplificar
            from math import gcd
            g = gcd(result_num, result_den)
            result_num //= g
            result_den //= g

            question = f"{num1}/{den1} + {num2}/{den2}"

        else:  # hard
            # Multiplicación y división de fracciones
            num1, den1 = random.randint(1, 8), random.randint(2, 9)
            num2, den2 = random.randint(1, 8), random.randint(2, 9)

            if random.choice([True, False]):
                # Multiplicación
                result_num = num1 * num2
                result_den = den1 * den2
                question = f"({num1}/{den1}) × ({num2}/{den2})"
            else:
                # División
                result_num = num1 * den2
                result_den = den1 * num2
                question = f"({num1}/{den1}) ÷ ({num2}/{den2})"

            # Simplificar
            from math import gcd
            g = gcd(result_num, result_den)
            result_num //= g
            result_den //= g

        if result_den == 1:
            correct_answer = str(result_num)
        else:
            correct_answer = f"{result_num}/{result_den}"

        # Generar opciones incorrectas
        wrong_answers = []
        wrong_answers.append(f"{result_num + 1}/{result_den}")
        wrong_answers.append(f"{result_num}/{result_den + 1}")
        wrong_answers.append(f"{result_num - 1}/{result_den}" if result_num > 1 else f"{result_num}/{result_den - 1}")

        options = [correct_answer] + wrong_answers
        random.shuffle(options)

        return {
            "title": "Fracciones",
            "question": f"Calcula: {question}",
            "correct_answer": correct_answer,
            "options": json.dumps(options),
            "explanation": f"El resultado simplificado es {correct_answer}",
            "topic": MathTopic.fractions
        }

    @staticmethod
    def _generate_basic_operations(difficulty: ExerciseDifficulty) -> Dict:
        """Genera operaciones básicas"""
        if difficulty == ExerciseDifficulty.easy:
            a = random.randint(1, 20)
            b = random.randint(1, 20)
            op = random.choice(['+', '-', '×'])

            if op == '+':
                answer = a + b
            elif op == '-':
                answer = a - b
            else:
                answer = a * b

            question = f"{a} {op} {b}"

        else:
            a = random.randint(10, 50)
            b = random.randint(2, 20)
            op = random.choice(['+', '-', '×', '÷'])

            if op == '÷':
                # Asegurar división exacta
                answer = random.randint(2, 20)
                a = answer * b
            elif op == '+':
                answer = a + b
            elif op == '-':
                answer = a - b
            else:
                answer = a * b

            question = f"{a} {op} {b}"

        correct_answer = int(answer)
        wrong_answers = [
            correct_answer + random.randint(1, 10),
            correct_answer - random.randint(1, 10),
            correct_answer + random.randint(11, 20),
        ]

        options = [str(correct_answer)] + [str(w) for w in wrong_answers if w != correct_answer][:3]
        random.shuffle(options)

        return {
            "title": "Operación Básica",
            "question": f"¿Cuánto es {question}?",
            "correct_answer": str(correct_answer),
            "options": json.dumps(options),
            "explanation": f"{question} = {correct_answer}",
            "topic": MathTopic.operations
        }

    @staticmethod
    def _generate_percentages(difficulty: ExerciseDifficulty) -> Dict:
        """Genera ejercicios de porcentajes"""
        if difficulty == ExerciseDifficulty.easy:
            percentage = random.choice([10, 20, 25, 50, 75])
            number = random.randint(20, 200)

            # Ajustar para que sea resultado entero
            while (number * percentage) % 100 != 0:
                number += 1

            answer = (number * percentage) // 100
            question = f"¿Cuánto es el {percentage}% de {number}?"

        else:
            percentage = random.randint(5, 95)
            number = random.randint(50, 500)

            answer = round((number * percentage) / 100, 2)
            question = f"¿Cuánto es el {percentage}% de {number}?"

        correct_answer = str(int(answer) if answer == int(answer) else answer)

        wrong_answers = [
            str(int(answer * 1.1)),
            str(int(answer * 0.9)),
            str(int(answer + percentage)),
        ]

        options = [correct_answer] + wrong_answers
        random.shuffle(options)

        return {
            "title": "Porcentajes",
            "question": question,
            "correct_answer": correct_answer,
            "options": json.dumps(options),
            "explanation": f"El {percentage}% de {number} es {correct_answer}",
            "topic": MathTopic.percentages
        }

    @staticmethod
    def _generate_quadratic_equation(difficulty: ExerciseDifficulty) -> Dict:
        """Genera ecuaciones cuadráticas"""
        # x² + bx + c = 0
        # Generamos desde las raíces
        root1 = random.randint(-5, 10)
        root2 = random.randint(-5, 10)

        # Expandir (x - root1)(x - root2)
        b = -(root1 + root2)
        c = root1 * root2

        equation = f"x² "
        if b >= 0:
            equation += f"+ {b}x "
        else:
            equation += f"- {abs(b)}x "

        if c >= 0:
            equation += f"+ {c} = 0"
        else:
            equation += f"- {abs(c)} = 0"

        # Solución más pequeña
        correct_answer = min(root1, root2)

        wrong_answers = [
            max(root1, root2),
            correct_answer + random.randint(1, 5),
            correct_answer - random.randint(1, 5),
        ]

        options = [str(correct_answer)] + [str(w) for w in wrong_answers][:3]
        random.shuffle(options)

        return {
            "title": "Ecuación Cuadrática",
            "question": f"Encuentra la solución menor de: {equation}",
            "correct_answer": str(correct_answer),
            "options": json.dumps(options),
            "explanation": f"Las raíces son {root1} y {root2}, la menor es {correct_answer}",
            "topic": MathTopic.quadratic_equations
        }
