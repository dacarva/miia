"""Esquemas Pydantic básicos"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    message: str = Field(..., description="Mensaje del cliente")
    phone_number: str = Field(..., description="Número de teléfono")
    context: Optional[Dict[str, Any]] = Field(None, description="Contexto adicional")

class ChatResponse(BaseModel):
    message: str = Field(..., description="Respuesta del agente")
    context: Dict[str, Any] = Field(..., description="Contexto actualizado")
    suggested_actions: List[str] = Field(..., description="Acciones sugeridas")

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, str]
