from sqlalchemy import Column, String, Boolean, Integer, Text, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"


class SettingType(str, enum.Enum):
    string = "string"
    number = "number"
    boolean = "boolean"
    json = "json"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.student)
    avatar = Column(String, nullable=True)  # URL o path de la imagen de perfil
    reset_token = Column(String, nullable=True)  # Token para reset de contraseña
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    paralelos = relationship("Paralelo", back_populates="teacher", foreign_keys="Paralelo.teacher_id")


class Paralelo(Base):
    __tablename__ = "paralelos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    level = Column(String, nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    student_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    teacher = relationship("User", back_populates="paralelos", foreign_keys=[teacher_id])
    enrollments = relationship("Enrollment", back_populates="paralelo", cascade="all, delete-orphan")
    exercises = relationship("Exercise", back_populates="paralelo", cascade="all, delete-orphan")


class Setting(Base):
    __tablename__ = "settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String, unique=True, nullable=False)
    value = Column(Text, nullable=True)
    type = Column(SQLEnum(SettingType), default=SettingType.string)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# Inscripciones de estudiantes en paralelos
class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    paralelo_id = Column(UUID(as_uuid=True), ForeignKey("paralelos.id"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    student = relationship("User")
    paralelo = relationship("Paralelo", back_populates="enrollments")


# Tipos de ejercicio
class ExerciseType(str, enum.Enum):
    multiple_choice = "multiple_choice"
    true_false = "true_false"
    fill_blank = "fill_blank"
    numeric = "numeric"


# Dificultad del ejercicio
class ExerciseDifficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


# Temas matemáticos
class MathTopic(str, enum.Enum):
    operations = "operations"  # Operaciones básicas
    combined_operations = "combined_operations"  # Operaciones combinadas
    linear_equations = "linear_equations"  # Ecuaciones lineales
    quadratic_equations = "quadratic_equations"  # Ecuaciones cuadráticas
    fractions = "fractions"  # Fracciones
    percentages = "percentages"  # Porcentajes
    geometry = "geometry"  # Geometría
    algebra = "algebra"  # Álgebra general


# Ejercicios
class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paralelo_id = Column(UUID(as_uuid=True), ForeignKey("paralelos.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    question = Column(Text, nullable=False)
    exercise_type = Column(SQLEnum(ExerciseType), nullable=False)
    difficulty = Column(SQLEnum(ExerciseDifficulty), default=ExerciseDifficulty.medium)
    topic = Column(SQLEnum(MathTopic), nullable=False, default=MathTopic.operations)
    correct_answer = Column(Text, nullable=False)  # JSON para múltiples opciones
    options = Column(Text, nullable=True)  # JSON para opciones de respuesta
    points = Column(Integer, default=10)
    time_limit = Column(Integer, nullable=True)  # En segundos
    is_active = Column(Boolean, default=True)
    is_practice = Column(Boolean, default=False)  # True si es para modo práctica/juego
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    paralelo = relationship("Paralelo", back_populates="exercises")
    attempts = relationship("ExerciseAttempt", back_populates="exercise", cascade="all, delete-orphan")


# Intentos de ejercicios
class ExerciseAttempt(Base):
    __tablename__ = "exercise_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    game_session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id"), nullable=True)
    student_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken = Column(Integer, nullable=True)  # En segundos
    points_earned = Column(Integer, default=0)
    points_lost = Column(Integer, default=0)  # Puntos perdidos por error
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    exercise = relationship("Exercise", back_populates="attempts")
    student = relationship("User")
    game_session = relationship("GameSession", back_populates="attempts")


# Sesiones de juego
class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    paralelo_id = Column(UUID(as_uuid=True), ForeignKey("paralelos.id"), nullable=True)
    total_score = Column(Integer, default=0)
    exercises_completed = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    student = relationship("User")
    paralelo = relationship("Paralelo")
    attempts = relationship("ExerciseAttempt", back_populates="game_session")


# Progreso del estudiante por tema
class StudentTopicProgress(Base):
    __tablename__ = "student_topic_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    topic = Column(SQLEnum(MathTopic), nullable=False)
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    wrong_attempts = Column(Integer, default=0)
    mastery_level = Column(Integer, default=0)  # 0-100: nivel de dominio del tema
    needs_improvement = Column(Boolean, default=False)
    last_practiced = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("User")


# Estados de metas
class GoalStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    expired = "expired"
    cancelled = "cancelled"


# Estados de competencias
class ChallengeStatus(str, enum.Enum):
    pending = "pending"  # Esperando participantes
    active = "active"  # En progreso
    completed = "completed"  # Finalizada
    cancelled = "cancelled"  # Cancelada


# Tipos de metas
class GoalType(str, enum.Enum):
    exercises = "exercises"  # Completar X ejercicios
    accuracy = "accuracy"  # Alcanzar X% de precisión
    points = "points"  # Alcanzar X puntos
    streak = "streak"  # Mantener racha de X días
    topic_mastery = "topic_mastery"  # Dominar un tema específico


# Metas
class Goal(Base):
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    paralelo_id = Column(UUID(as_uuid=True), ForeignKey("paralelos.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    goal_type = Column(SQLEnum(GoalType), nullable=False)
    target_value = Column(Integer, nullable=False)  # Valor objetivo (ej: 10 ejercicios, 80% precision)
    topic = Column(SQLEnum(MathTopic), nullable=True)  # Solo para topic_mastery
    reward_points = Column(Integer, default=100)  # Puntos de recompensa
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    paralelo = relationship("Paralelo")
    student_goals = relationship("StudentGoal", back_populates="goal", cascade="all, delete-orphan")


# Asignacion de metas a estudiantes
class StudentGoal(Base):
    __tablename__ = "student_goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("goals.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    current_value = Column(Integer, default=0)  # Progreso actual
    status = Column(SQLEnum(GoalStatus), default=GoalStatus.active)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    points_earned = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    goal = relationship("Goal", back_populates="student_goals")
    student = relationship("User")


# Competencias (Versus)
class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    paralelo_id = Column(UUID(as_uuid=True), ForeignKey("paralelos.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    topic = Column(SQLEnum(MathTopic), nullable=True)  # Tema especifico o null para todos
    difficulty = Column(SQLEnum(ExerciseDifficulty), nullable=True)  # Dificultad o null para mixta
    num_exercises = Column(Integer, default=10)  # Numero de ejercicios
    time_limit = Column(Integer, nullable=True)  # Tiempo limite en minutos (null = sin limite)
    max_participants = Column(Integer, default=2)  # Numero maximo de participantes
    status = Column(SQLEnum(ChallengeStatus), default=ChallengeStatus.pending)
    winner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    winner = relationship("User", foreign_keys=[winner_id])
    paralelo = relationship("Paralelo")
    participants = relationship("ChallengeParticipant", back_populates="challenge", cascade="all, delete-orphan")


# Participantes de competencias
class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id = Column(UUID(as_uuid=True), ForeignKey("challenges.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    score = Column(Integer, default=0)
    exercises_completed = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    time_taken = Column(Integer, default=0)  # Tiempo total en segundos
    has_finished = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    challenge = relationship("Challenge", back_populates="participants")
    student = relationship("User")


# Categorias de insignias
class BadgeCategory(str, enum.Enum):
    achievement = "achievement"  # Logros generales
    streak = "streak"  # Rachas
    mastery = "mastery"  # Dominio de temas
    social = "social"  # Interaccion social
    special = "special"  # Eventos especiales


# Insignias
class Badge(Base):
    __tablename__ = "badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)  # Nombre del icono o URL
    category = Column(SQLEnum(BadgeCategory), default=BadgeCategory.achievement)
    requirement = Column(String, nullable=True)  # Descripcion del requisito
    requirement_value = Column(Integer, default=0)  # Valor numerico del requisito
    points = Column(Integer, default=10)  # Puntos que otorga
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student_badges = relationship("StudentBadge", back_populates="badge", cascade="all, delete-orphan")


# Insignias de estudiantes
class StudentBadge(Base):
    __tablename__ = "student_badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    badge_id = Column(UUID(as_uuid=True), ForeignKey("badges.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_equipped = Column(Boolean, default=False)  # Si esta equipada como principal
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    badge = relationship("Badge", back_populates="student_badges")
    student = relationship("User")


# Tipos de recursos
class ResourceType(str, enum.Enum):
    pdf = "pdf"
    video = "video"
    link = "link"


# Recursos educativos
class Resource(Base):
    __tablename__ = "resources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    paralelo_id = Column(UUID(as_uuid=True), ForeignKey("paralelos.id"), nullable=True)  # Null = todos
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String, nullable=False)
    resource_type = Column(SQLEnum(ResourceType), default=ResourceType.link)
    topic = Column(SQLEnum(MathTopic), nullable=True)  # Null = general
    view_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    teacher = relationship("User")
    paralelo = relationship("Paralelo")
