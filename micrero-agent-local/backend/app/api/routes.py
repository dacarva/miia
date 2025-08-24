"""Rutas básicas de la API"""

from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.schemas import HealthResponse, ChatMessage, ChatResponse
from app.services.mcp_client import mcp_client
from datetime import datetime
import re
import structlog

logger = structlog.get_logger()
router = APIRouter()

@router.get("/test")
async def test_endpoint():
    """Endpoint de prueba"""
    return {
        "message": "API funcionando correctamente",
        "timestamp": datetime.now().isoformat(),
        "service": "MicreroSport AI Backend"
    }

@router.post("/chat/test", response_model=ChatResponse)
async def test_chat(message: ChatMessage):
    """Endpoint de prueba para chat"""
    
    # Respuesta simulada
    response = ChatResponse(
        message=f"Hola! Recibí tu mensaje: '{message.message}'. Soy el asistente de MicreroSport ⚽",
        context={"phone": message.phone_number, "test_mode": True},
        suggested_actions=["Ver catálogo", "Consultar precios", "Hablar con asesor"]
    )
    
    return response

@router.get("/health/detailed", response_model=HealthResponse)
async def detailed_health():
    """Health check detallado"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        services={
            "api": "healthy",
            "backend": "healthy",
            "mcp": "connected" if mcp_client.is_connected else "disconnected",
            "test_mode": "active"
        }
    )

@router.post("/whatsapp/process-message")
async def process_whatsapp_message(request: Request):
    """Procesar mensajes entrantes de WhatsApp"""
    try:
        data = await request.json()
        from_number = data.get('from', '')
        message = data.get('message', '').strip()
        message_id = data.get('messageId', '')
        
        logger.info("📱 Procesando mensaje WhatsApp", {
            "from": from_number,
            "message": message,
            "message_id": message_id
        })
        
        # Analizar el mensaje para detectar intenciones
        intent = analyze_message_intent(message)
        
        # Generar respuesta basada en la intención
        response_text = await generate_response(message, intent, from_number)
        
        return {
            "reply": response_text,
            "intent": intent,
            "processed": True,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error("❌ Error procesando mensaje WhatsApp", error=str(e))
        
        # Respuesta de fallback
        return {
            "reply": "¡Hola! Soy el asistente de MicreroSport ⚽. Puedo ayudarte con información sobre propiedades. ¿En qué ciudad estás buscando?",
            "intent": "greeting",
            "processed": False,
            "error": str(e)
        }

def analyze_message_intent(message: str) -> str:
    """Analizar la intención del mensaje"""
    message_lower = message.lower()
    
    # Saludos
    if any(word in message_lower for word in ['hola', 'buenas', 'hey', 'hello', 'hi']):
        return "greeting"
    
    # Búsqueda de propiedades
    if any(word in message_lower for word in ['casa', 'apartamento', 'propiedad', 'finca', 'lote', 'terreno']):
        return "property_search"
    
    # Ubicaciones
    if any(word in message_lower for word in ['bogotá', 'medellín', 'cali', 'cartagena', 'barranquilla', 'bucaramanga']):
        return "location_inquiry"
    
    # Precios
    if any(word in message_lower for word in ['precio', 'costo', 'valor', 'cuanto', 'millones', '$']):
        return "price_inquiry"
    
    # Información general
    if any(word in message_lower for word in ['información', 'info', 'detalles', 'características']):
        return "information_request"
    
    return "general"

async def generate_response(message: str, intent: str, from_number: str) -> str:
    """Generar respuesta basada en el mensaje e intención"""
    
    if intent == "greeting":
        return """¡Hola! 👋 Soy tu asistente de bienes raíces de MicreroSport ⚽

Puedo ayudarte a encontrar la propiedad perfecta. ¿Qué estás buscando?
🏠 Casa
🏢 Apartamento  
🏞️ Finca o lote
💰 Consultar precios

¿En qué ciudad te interesa buscar?"""
    
    elif intent == "property_search":
        # Intentar buscar propiedades usando MCP
        try:
            # Extraer criterios del mensaje
            criteria = extract_search_criteria(message)
            
            # Buscar en la base de datos
            properties_result = await mcp_client.search_properties_by_criteria(criteria)
            
            if properties_result["success"] and properties_result.get("data"):
                return format_properties_response(properties_result["data"])
            else:
                return """🏠 Te ayudo a encontrar propiedades disponibles.

Por favor, comparte más detalles:
📍 ¿En qué ciudad buscas?
💰 ¿Cuál es tu presupuesto?
🛏️ ¿Cuántos cuartos necesitas?

¡Con esta información podré encontrar las mejores opciones para ti!"""
        except Exception as e:
            logger.error("❌ Error buscando propiedades", error=str(e))
            return "Estoy consultando las propiedades disponibles. Un momento por favor... 🔍"
    
    elif intent == "location_inquiry":
        city = extract_city_from_message(message)
        if city:
            try:
                properties_result = await mcp_client.get_finca_raiz_properties(location=city)
                if properties_result["success"]:
                    return f"🏙️ Excelente elección! {city} es una ciudad con gran potencial inmobiliario.\n\nEstoy consultando las propiedades disponibles en {city}... Un momento."
            except Exception as e:
                logger.error("❌ Error consultando ciudad", error=str(e))
        
        return """📍 ¡Perfecto! Manejamos propiedades en las principales ciudades de Colombia:

🏙️ Bogotá - Centro económico
🌆 Medellín - Ciudad de la eterna primavera  
🏖️ Cartagena - Ciudad histórica
🌊 Barranquilla - Puerta de oro
⛰️ Bucaramanga - Ciudad bonita
🌴 Cali - Sultana del Valle

¿En cuál de estas ciudades te gustaría buscar?"""
    
    elif intent == "price_inquiry":
        return """💰 Te ayudo con información de precios.

Los rangos típicos por ciudad son:
🏙️ Bogotá: $200M - $800M+
🌆 Medellín: $180M - $600M+  
🏖️ Cartagena: $250M - $1.2B+
🌊 Barranquilla: $150M - $400M+

¿Tienes un presupuesto específico en mente? 
¿En qué ciudad estás buscando?"""
    
    else:
        return """¡Hola! Soy tu asistente inmobiliario de MicreroSport ⚽

¿En qué puedo ayudarte hoy?
🏠 Buscar propiedades
📍 Consultar por ciudad  
💰 Información de precios
📞 Hablar con un asesor

Escribe lo que necesitas y te ayudo de inmediato."""

def extract_search_criteria(message: str) -> dict:
    """Extraer criterios de búsqueda del mensaje"""
    criteria = {}
    message_lower = message.lower()
    
    # Tipo de propiedad
    if 'casa' in message_lower:
        criteria['tipo'] = 'casa'
    elif 'apartamento' in message_lower:
        criteria['tipo'] = 'apartamento'
    elif 'finca' in message_lower:
        criteria['tipo'] = 'finca'
    elif 'lote' in message_lower:
        criteria['tipo'] = 'lote'
    
    # Ciudad
    cities = ['bogotá', 'medellín', 'cali', 'cartagena', 'barranquilla', 'bucaramanga']
    for city in cities:
        if city in message_lower:
            criteria['ciudad'] = city.title()
            break
    
    # Habitaciones (buscar números)
    import re
    rooms_match = re.search(r'(\d+)\s*(habitacion|cuarto|alcoba)', message_lower)
    if rooms_match:
        criteria['habitaciones'] = int(rooms_match.group(1))
    
    return criteria

def extract_city_from_message(message: str) -> str:
    """Extraer ciudad del mensaje"""
    message_lower = message.lower()
    cities = {
        'bogotá': 'Bogotá',
        'bogota': 'Bogotá', 
        'medellín': 'Medellín',
        'medellin': 'Medellín',
        'cali': 'Cali',
        'cartagena': 'Cartagena',
        'barranquilla': 'Barranquilla',
        'bucaramanga': 'Bucaramanga'
    }
    
    for key, city in cities.items():
        if key in message_lower:
            return city
    return None

def format_properties_response(properties: list) -> str:
    """Formatear respuesta con propiedades"""
    if not properties:
        return "No encontré propiedades que coincidan con tus criterios. ¿Te gustaría ampliar la búsqueda?"
    
    response = "🏠 ¡Encontré estas opciones para ti!\n\n"
    
    for i, prop in enumerate(properties[:3], 1):  # Máximo 3 propiedades
        response += f"🏡 **Opción {i}**\n"
        response += f"📍 {prop.get('location', 'Ubicación no especificada')}\n"
        response += f"💰 ${prop.get('price', 'Precio a consultar'):,}\n"
        response += f"🛏️ {prop.get('bedrooms', 'N/A')} habitaciones\n"
        response += f"🚿 {prop.get('bathrooms', 'N/A')} baños\n\n"
    
    response += "¿Te interesa alguna de estas opciones? ¿Quieres que busque algo diferente?"
    
    return response
