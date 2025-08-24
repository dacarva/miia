from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class WhatsAppInterface(ABC):
    """Interfaz abstracta para servicios de WhatsApp"""
    
    @abstractmethod
    async def send_message(self, phone: str, message: str) -> bool:
        pass
    
    @abstractmethod
    async def get_status(self) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def initialize(self) -> bool:
        pass

class WhatsAppWebService(WhatsAppInterface):
    """Implementación con WhatsApp Web JS"""
    # Tu implementación actual
    
class WhatsAppBusinessAPIService(WhatsAppInterface):
    """Implementación con WhatsApp Business API"""
    # Implementación futura para migración
