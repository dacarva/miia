"""
MicreroSport AI Sales Agent - Backend Simplificado
==================================================
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os
import structlog

# Configurar logging simple
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()

# Crear aplicación FastAPI
app = FastAPI(
    title="MicreroSport AI Sales Agent (Simple)",
    description="Agente de ventas con IA - Versión simplificada",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Endpoint principal"""
    return {
        "message": "MicreroSport AI Sales Agent (Simple)",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Verificación de salud"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "healthy",
            "whatsapp_integration": "ready"
        }
    }

@app.post("/api/whatsapp/process-message")
async def process_whatsapp_message(request: Request):
    """Procesar mensajes entrantes de WhatsApp - Versión simplificada"""
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
        
        # Respuestas inteligentes simples basadas en palabras clave
        response_text = generate_simple_response(message)
        
        return {
            "reply": response_text,
            "processed": True,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error("❌ Error procesando mensaje WhatsApp", error=str(e))
        
        return {
            "reply": "¡Hola! Soy el asistente de MicreroSport ⚽. Puedo ayudarte con información sobre propiedades. ¿En qué ciudad estás buscando?",
            "processed": False,
            "error": str(e)
        }

def generate_simple_response(message: str) -> str:
    """Generar respuesta simple basada en palabras clave"""
    
    message_lower = message.lower()
    
    # Saludos
    if any(word in message_lower for word in ['hola', 'buenas', 'hey', 'hello', 'hi']):
        return """¡Hola! 👋 Soy tu asistente de bienes raíces de MicreroSport ⚽

Puedo ayudarte a encontrar la propiedad perfecta. ¿Qué estás buscando?
🏠 Casa
🏢 Apartamento  
🏞️ Finca o lote
💰 Consultar precios

¿En qué ciudad te interesa buscar?"""
    
    # Búsqueda de propiedades
    if any(word in message_lower for word in ['casa', 'apartamento', 'propiedad', 'finca', 'lote', 'terreno']):
        return """🏠 Te ayudo a encontrar propiedades disponibles.

Por favor, comparte más detalles:
📍 ¿En qué ciudad buscas?
💰 ¿Cuál es tu presupuesto?
🛏️ ¿Cuántos cuartos necesitas?

¡Con esta información podré encontrar las mejores opciones para ti!

Estamos consultando nuestra base de datos de finca raíz..."""
    
    # Ubicaciones
    if any(word in message_lower for word in ['bogotá', 'medellín', 'cali', 'cartagena', 'barranquilla', 'bucaramanga']):
        city = extract_city(message_lower)
        return f"""📍 ¡Excelente elección! {city} es una ciudad con gran potencial inmobiliario.

🏙️ Disponemos de propiedades en {city}:
• Apartamentos modernos
• Casas familiares  
• Oficinas comerciales
• Lotes para construir

¿Qué tipo de propiedad te interesa más?
¿Tienes un presupuesto específico en mente?"""
    
    # Precios
    if any(word in message_lower for word in ['precio', 'costo', 'valor', 'cuanto', 'millones', '$']):
        return """💰 Te ayudo con información de precios.

Los rangos típicos por ciudad son:
🏙️ Bogotá: $200M - $800M+
🌆 Medellín: $180M - $600M+  
🏖️ Cartagena: $250M - $1.2B+
🌊 Barranquilla: $150M - $400M+

¿Tienes un presupuesto específico en mente? 
¿En qué ciudad estás buscando?"""
    
    # Respuesta general
    return """¡Hola! Soy tu asistente inmobiliario de MicreroSport ⚽

¿En qué puedo ayudarte hoy?
🏠 Buscar propiedades
📍 Consultar por ciudad  
💰 Información de precios
📞 Hablar con un asesor

Escribe lo que necesitas y te ayudo de inmediato.

📊 Tenemos acceso a la base de datos de finca raíz más completa de Colombia."""

def extract_city(message_lower: str) -> str:
    """Extraer ciudad del mensaje"""
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
    return "esta ciudad"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main.simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )