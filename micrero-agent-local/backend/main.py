"""
MicreroSport AI Sales Agent - Backend Main Application
=====================================================
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import asyncio
from datetime import datetime
import structlog

# Importar rutas
from app.api.routes import router as api_router

# Configurar logging estructurado
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación"""
    
    logger.info("🚀 Iniciando MicreroSport AI Agent...")
    
    # Inicializar MCP client
    try:
        from app.services.mcp_client import mcp_client
        await mcp_client.start_postgres_server()
        logger.info("✅ MCP PostgreSQL client iniciado")
    except Exception as e:
        logger.error("⚠️ Error iniciando MCP client", error=str(e))
    
    logger.info("✅ Servicios iniciados correctamente")
    
    yield
    
    # Cleanup
    logger.info("🔄 Cerrando servicios...")
    try:
        from app.services.mcp_client import mcp_client
        await mcp_client.stop()
        logger.info("✅ MCP client cerrado correctamente")
    except Exception as e:
        logger.error("⚠️ Error cerrando MCP client", error=str(e))

# Crear aplicación FastAPI
app = FastAPI(
    title="MicreroSport AI Sales Agent",
    description="Agente de ventas con IA para tienda de artículos deportivos",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas de la API
app.include_router(api_router, prefix="/api", tags=["api"])

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware para logging de requests"""
    start_time = datetime.now()
    
    response = await call_next(request)
    
    process_time = (datetime.now() - start_time).total_seconds()
    
    logger.info(
        "HTTP Request",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        process_time=process_time
    )
    
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Manejador global de excepciones"""
    logger.error(
        "Unhandled exception",
        error=str(exc),
        url=str(request.url),
        method=request.method
    )
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"}
    )

# Rutas principales
@app.get("/")
async def root():
    """Endpoint de salud"""
    return {
        "message": "MicreroSport AI Sales Agent",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Verificación de salud de los servicios"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "healthy",
            "database": "pending",
            "rag_engine": "pending",
            "sales_agent": "pending",
            "whatsapp": "pending"
        }
    }
    
    return health_status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
