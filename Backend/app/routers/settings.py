from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List
import json
from app.database import get_db
from app.models import Setting, User, SettingType
from app.schemas import SettingCreate, SettingUpdate, SettingBulkUpdate, APIResponse
from app.auth import require_admin

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/public", response_model=APIResponse)
async def get_public_settings(db: Session = Depends(get_db)):
    """Obtener configuraciones públicas (sin autenticación requerida)"""
    # Categorías públicas que pueden verse sin autenticación
    public_categories = ["application", "general"]

    settings = db.query(Setting).filter(
        Setting.category.in_(public_categories)
    ).order_by(Setting.category, Setting.key).all()

    # Agrupar por categoría
    grouped = {}
    for setting in settings:
        if setting.category not in grouped:
            grouped[setting.category] = []

        grouped[setting.category].append({
            "key": setting.key,
            "value": parse_value(setting.value, setting.type),
            "type": setting.type.value,
            "description": setting.description
        })

    return APIResponse(success=True, data=grouped)


def parse_value(value: str, value_type: SettingType):
    """Convierte el valor de string al tipo correcto"""
    if value is None:
        return None

    if value_type == SettingType.number:
        return float(value)
    elif value_type == SettingType.boolean:
        return value.lower() in ('true', '1', 'yes')
    elif value_type == SettingType.json:
        try:
            return json.loads(value)
        except:
            return value
    else:
        return value


def stringify_value(value, value_type: SettingType) -> str:
    """Convierte el valor al formato string para almacenar"""
    if value is None:
        return None

    if value_type == SettingType.json:
        return json.dumps(value)
    elif value_type == SettingType.boolean:
        return str(value).lower()
    else:
        return str(value)


@router.get("/", response_model=APIResponse)
async def get_all_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener todas las configuraciones agrupadas por categoría"""
    settings = db.query(Setting).order_by(Setting.category, Setting.key).all()

    # Agrupar por categoría
    grouped = {}
    for setting in settings:
        if setting.category not in grouped:
            grouped[setting.category] = []

        grouped[setting.category].append({
            "key": setting.key,
            "value": parse_value(setting.value, setting.type),
            "type": setting.type.value,
            "description": setting.description
        })

    return APIResponse(success=True, data=grouped)


@router.get("/{key}", response_model=APIResponse)
async def get_setting(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener una configuración específica"""
    setting = db.query(Setting).filter(Setting.key == key).first()

    if not setting:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")

    setting_data = {
        "key": setting.key,
        "value": parse_value(setting.value, setting.type),
        "type": setting.type.value,
        "category": setting.category,
        "description": setting.description
    }

    return APIResponse(success=True, data=setting_data)


@router.put("/{key}", response_model=APIResponse)
async def update_setting(
    key: str,
    setting_data: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Actualizar una configuración"""
    setting = db.query(Setting).filter(Setting.key == key).first()

    if not setting:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")

    if setting_data.value is not None:
        value_type = setting_data.type if setting_data.type else setting.type
        setting.value = stringify_value(setting_data.value, value_type)

    if setting_data.type:
        setting.type = setting_data.type
    if setting_data.category:
        setting.category = setting_data.category
    if setting_data.description:
        setting.description = setting_data.description

    db.commit()
    db.refresh(setting)

    return APIResponse(
        success=True,
        message="Configuración actualizada exitosamente"
    )


@router.post("/bulk", response_model=APIResponse)
async def update_multiple_settings(
    bulk_data: SettingBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Actualizar múltiples configuraciones a la vez"""
    updated_count = 0

    for setting_data in bulk_data.settings:
        setting = db.query(Setting).filter(Setting.key == setting_data.key).first()

        if setting:
            setting.value = stringify_value(setting_data.value, setting_data.type)
            setting.type = setting_data.type
            setting.category = setting_data.category
            if setting_data.description:
                setting.description = setting_data.description
            updated_count += 1
        else:
            # Crear nueva configuración si no existe
            new_setting = Setting(
                key=setting_data.key,
                value=stringify_value(setting_data.value, setting_data.type),
                type=setting_data.type,
                category=setting_data.category,
                description=setting_data.description
            )
            db.add(new_setting)
            updated_count += 1

    db.commit()

    return APIResponse(
        success=True,
        message=f"{updated_count} configuraciones actualizadas exitosamente"
    )


@router.post("/initialize", response_model=APIResponse)
async def initialize_defaults(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Inicializar configuraciones por defecto"""
    defaults = [
        # Configuración de la Aplicación
        {"key": "app_name", "value": "MathMaster", "type": SettingType.string, "category": "application", "description": "Nombre de la institución educativa"},
        {"key": "app_primary_color", "value": "#3B82F6", "type": SettingType.string, "category": "application", "description": "Color primario del tema"},
        {"key": "app_secondary_color", "value": "#8B5CF6", "type": SettingType.string, "category": "application", "description": "Color secundario del tema"},
        {"key": "academic_year", "value": "2025", "type": SettingType.string, "category": "application", "description": "Año lectivo actual"},
        {"key": "academic_period", "value": "Primer Trimestre", "type": SettingType.string, "category": "application", "description": "Período académico actual"},

        # Configuración de Ejercicios
        {"key": "exercise_default_difficulty", "value": "medium", "type": SettingType.string, "category": "exercises", "description": "Dificultad por defecto de ejercicios"},
        {"key": "exercise_time_limit", "value": "30", "type": SettingType.number, "category": "exercises", "description": "Tiempo límite en minutos"},
        {"key": "exercise_pass_score", "value": "70", "type": SettingType.number, "category": "exercises", "description": "Puntuación mínima de aprobación (%)"},
        {"key": "exercise_max_attempts", "value": "3", "type": SettingType.number, "category": "exercises", "description": "Número máximo de intentos"},

        # Seguridad
        {"key": "session_timeout", "value": "60", "type": SettingType.number, "category": "security", "description": "Tiempo de sesión en minutos"},
        {"key": "password_min_length", "value": "6", "type": SettingType.number, "category": "security", "description": "Longitud mínima de contraseña"},
        {"key": "require_password_change", "value": "false", "type": SettingType.boolean, "category": "security", "description": "Requerir cambio de contraseña inicial"}
    ]

    results = []
    for default in defaults:
        existing = db.query(Setting).filter(Setting.key == default["key"]).first()
        if not existing:
            new_setting = Setting(**default)
            db.add(new_setting)
            results.append({"key": default["key"], "created": True})
        else:
            results.append({"key": default["key"], "created": False})

    db.commit()

    return APIResponse(
        success=True,
        message="Configuraciones inicializadas",
        data=results
    )
