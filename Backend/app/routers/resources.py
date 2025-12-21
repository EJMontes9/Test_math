from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from app.database import get_db
from app.models import User, UserRole, Resource, ResourceType, MathTopic, Paralelo, Enrollment
from app.schemas import APIResponse
from app.auth import get_current_user
import os
import uuid as uuid_lib
import shutil

router = APIRouter(prefix="/api/resources", tags=["Resources"])


# ============= Schemas =============

class ResourceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    resource_type: ResourceType = Field(alias="resourceType")
    topic: Optional[MathTopic] = None
    url: str
    paralelo_id: Optional[UUID] = Field(None, alias="paraleloId")
    thumbnail: Optional[str] = None

    class Config:
        populate_by_name = True


class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    topic: Optional[MathTopic] = None
    url: Optional[str] = None
    paralelo_id: Optional[UUID] = Field(None, alias="paraleloId")
    thumbnail: Optional[str] = None
    is_active: Optional[bool] = Field(None, alias="isActive")

    class Config:
        populate_by_name = True


def require_teacher(current_user: User = Depends(get_current_user)):
    """Verificar que el usuario sea profesor o admin"""
    if current_user.role not in [UserRole.teacher, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return current_user


# ============= Endpoints Profesor =============

@router.get("/teacher", response_model=APIResponse)
async def get_teacher_resources(
    topic: Optional[str] = None,
    resource_type: Optional[str] = None,
    paralelo_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Obtener recursos del profesor"""
    query = db.query(Resource).filter(
        Resource.teacher_id == current_user.id,
        Resource.is_active == True
    )

    if topic:
        query = query.filter(Resource.topic == topic)

    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)

    if paralelo_id:
        query = query.filter(Resource.paralelo_id == paralelo_id)

    resources = query.order_by(desc(Resource.created_at)).all()

    resources_data = []
    for resource in resources:
        resources_data.append({
            "id": str(resource.id),
            "title": resource.title,
            "description": resource.description,
            "resourceType": resource.resource_type.value,
            "topic": resource.topic.value if resource.topic else None,
            "url": resource.url,
            "thumbnail": resource.thumbnail,
            "paraleloId": str(resource.paralelo_id) if resource.paralelo_id else None,
            "paraleloName": resource.paralelo.name if resource.paralelo else "Todos",
            "viewCount": resource.view_count,
            "createdAt": resource.created_at.isoformat()
        })

    return APIResponse(success=True, data=resources_data)


@router.post("/", response_model=APIResponse)
async def create_resource(
    resource_data: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Crear un nuevo recurso"""
    # Verificar paralelo si se especifica
    if resource_data.paralelo_id:
        paralelo = db.query(Paralelo).filter(
            Paralelo.id == resource_data.paralelo_id,
            Paralelo.teacher_id == current_user.id
        ).first()
        if not paralelo:
            raise HTTPException(status_code=404, detail="Paralelo no encontrado")

    resource = Resource(
        teacher_id=current_user.id,
        paralelo_id=resource_data.paralelo_id,
        title=resource_data.title,
        description=resource_data.description,
        resource_type=resource_data.resource_type,
        topic=resource_data.topic,
        url=resource_data.url,
        thumbnail=resource_data.thumbnail
    )

    db.add(resource)
    db.commit()

    return APIResponse(
        success=True,
        message="Recurso creado exitosamente",
        data={"id": str(resource.id)}
    )


@router.post("/upload", response_model=APIResponse)
async def upload_resource_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Subir un archivo de recurso (PDF)"""
    # Validar tipo de archivo
    allowed_types = ["application/pdf", "video/mp4", "video/webm"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido. Use PDF o video.")

    # Crear directorio si no existe
    upload_dir = "static/resources"
    os.makedirs(upload_dir, exist_ok=True)

    # Generar nombre único
    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid_lib.uuid4()}.{file_ext}"
    file_path = os.path.join(upload_dir, file_name)

    # Guardar archivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Retornar URL
    url = f"/static/resources/{file_name}"

    return APIResponse(
        success=True,
        message="Archivo subido exitosamente",
        data={"url": url, "filename": file_name}
    )


@router.put("/{resource_id}", response_model=APIResponse)
async def update_resource(
    resource_id: UUID,
    resource_data: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Actualizar un recurso"""
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.teacher_id == current_user.id
    ).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    update_data = resource_data.model_dump(exclude_unset=True, by_alias=False)
    for field, value in update_data.items():
        setattr(resource, field, value)

    db.commit()

    return APIResponse(success=True, message="Recurso actualizado")


@router.delete("/{resource_id}", response_model=APIResponse)
async def delete_resource(
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Eliminar un recurso"""
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.teacher_id == current_user.id
    ).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    resource.is_active = False
    db.commit()

    return APIResponse(success=True, message="Recurso eliminado")


# ============= Endpoints Estudiante =============

@router.get("/student", response_model=APIResponse)
async def get_student_resources(
    topic: Optional[str] = None,
    resource_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener recursos disponibles para el estudiante"""
    # Obtener paralelo del estudiante
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.is_active == True
    ).first()

    paralelo_id = enrollment.paralelo_id if enrollment else None

    # Obtener recursos del paralelo o recursos generales
    query = db.query(Resource).filter(
        Resource.is_active == True,
        (Resource.paralelo_id == paralelo_id) | (Resource.paralelo_id == None)
    )

    if topic:
        query = query.filter(Resource.topic == topic)

    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)

    resources = query.order_by(desc(Resource.created_at)).all()

    resources_data = []
    for resource in resources:
        resources_data.append({
            "id": str(resource.id),
            "title": resource.title,
            "description": resource.description,
            "resourceType": resource.resource_type.value,
            "topic": resource.topic.value if resource.topic else None,
            "topicName": _get_topic_name(resource.topic) if resource.topic else None,
            "url": resource.url,
            "thumbnail": resource.thumbnail,
            "teacherName": f"{resource.teacher.first_name} {resource.teacher.last_name}",
            "viewCount": resource.view_count,
            "createdAt": resource.created_at.isoformat()
        })

    return APIResponse(success=True, data=resources_data)


@router.post("/{resource_id}/view", response_model=APIResponse)
async def register_resource_view(
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registrar visualización de un recurso"""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    resource.view_count += 1
    db.commit()

    return APIResponse(success=True, message="Vista registrada")


def _get_topic_name(topic: MathTopic) -> str:
    """Obtener nombre legible del tema"""
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
    return names.get(topic, str(topic.value))
