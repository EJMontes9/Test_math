from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models import UserRole, SettingType


# ============= Auth Schemas =============
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


# ============= User Schemas =============
class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    role: UserRole
    is_active: bool = Field(default=True, alias="isActive")

    model_config = ConfigDict(populate_by_name=True)


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    role: Optional[UserRole] = None
    is_active: Optional[bool] = Field(None, alias="isActive")
    password: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class UserResponse(UserBase):
    id: UUID
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UserStats(BaseModel):
    total: int
    active: int
    inactive: int
    by_role: dict


# ============= Paralelo Schemas =============
class ParaleloBase(BaseModel):
    name: str
    level: str
    teacher_id: Optional[UUID] = Field(None, alias="teacherId")
    student_count: int = Field(default=0, alias="studentCount")
    is_active: bool = Field(default=True, alias="isActive")
    description: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class ParaleloCreate(ParaleloBase):
    pass


class ParaleloUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None
    teacher_id: Optional[UUID] = Field(None, alias="teacherId")
    student_count: Optional[int] = Field(None, alias="studentCount")
    is_active: Optional[bool] = Field(None, alias="isActive")
    description: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class ParaleloResponse(ParaleloBase):
    id: UUID
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    teacher: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ParaleloStats(BaseModel):
    total: int
    active: int
    total_students: int = Field(alias="totalStudents")

    model_config = ConfigDict(populate_by_name=True)


# ============= Setting Schemas =============
class SettingBase(BaseModel):
    key: str
    value: Optional[str] = None
    type: SettingType
    category: str
    description: Optional[str] = None


class SettingCreate(SettingBase):
    pass


class SettingUpdate(BaseModel):
    value: Optional[str] = None
    type: Optional[SettingType] = None
    category: Optional[str] = None
    description: Optional[str] = None


class SettingResponse(SettingBase):
    id: UUID
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SettingBulkUpdate(BaseModel):
    settings: List[SettingCreate]


# ============= Student Game Schemas =============
class SubmitAnswerRequest(BaseModel):
    session_id: UUID
    exercise_id: UUID
    answer: str
    time_taken: int

    model_config = ConfigDict(populate_by_name=True)


class EndGameRequest(BaseModel):
    session_id: UUID

    model_config = ConfigDict(populate_by_name=True)


# ============= Generic API Response =============
class APIResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[dict | list | str | int | bool] = None
