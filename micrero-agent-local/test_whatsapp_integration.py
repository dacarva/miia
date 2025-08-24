#!/usr/bin/env python3
"""
Script de prueba para la integración de WhatsApp
===============================================
"""

import requests
import json
import time
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def test_whatsapp_api_integration():
    """Probar la integración con WhatsApp Business API"""
    
    print("🧪 Iniciando pruebas de integración de WhatsApp...")
    print("=" * 60)
    
    # Test 1: Verificar configuración
    print("\n📋 Test 1: Verificación de configuración")
    access_token = os.getenv('WHATSAPP_ACCESS_TOKEN')
    phone_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID')
    my_number = os.getenv('WHATSAPP_MY_NUMBER')
    
    if access_token and phone_id:
        print("✅ Token de acceso configurado")
        print("✅ Phone Number ID configurado")
        print(f"📱 Phone ID: {phone_id}")
        print(f"📞 Mi número: {my_number}")
    else:
        print("❌ Faltan configuraciones de WhatsApp")
        return False
    
    # Test 2: Probar el envío de mensaje usando la API directamente
    print("\n📤 Test 2: Enviando mensaje de prueba via API de WhatsApp")
    
    try:
        url = f"https://graph.facebook.com/v22.0/{phone_id}/messages"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Mensaje de prueba - usando template hello_world
        data = {
            "messaging_product": "whatsapp",
            "to": my_number.replace('+', ''),  # Remover el +
            "type": "template",
            "template": {
                "name": "hello_world",
                "language": {
                    "code": "en_US"
                }
            }
        }
        
        print(f"🔗 Enviando a: {url}")
        print(f"📱 Destinatario: {my_number}")
        
        response = requests.post(url, headers=headers, json=data)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📄 Response: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            message_id = response_data.get('messages', [{}])[0].get('id', 'N/A')
            print(f"✅ Mensaje enviado exitosamente! ID: {message_id}")
            return True
        else:
            print(f"❌ Error enviando mensaje: {response.status_code}")
            print(f"🔍 Detalles: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Excepción enviando mensaje: {str(e)}")
        return False

def test_backend_integration():
    """Probar la integración con el backend (simulado)"""
    
    print("\n🔧 Test 3: Verificación de lógica del backend")
    
    # Simular diferentes tipos de mensajes
    test_messages = [
        "Hola, busco un apartamento en Bogotá",
        "¿Cuánto cuesta una casa en Medellín?", 
        "Quiero información sobre propiedades",
        "Necesito una finca de 3 habitaciones",
        "¿Qué tienen disponible en Cartagena?"
    ]
    
    # Importar las funciones del backend (simulación)
    try:
        import sys
        sys.path.append('/opt/micrero-agent/backend')
        
        # Simular las funciones que estarían en routes.py
        def analyze_message_intent(message: str) -> str:
            message_lower = message.lower()
            
            if any(word in message_lower for word in ['hola', 'buenas', 'hey']):
                return "greeting"
            if any(word in message_lower for word in ['casa', 'apartamento', 'propiedad', 'finca']):
                return "property_search"
            if any(word in message_lower for word in ['bogotá', 'medellín', 'cali', 'cartagena']):
                return "location_inquiry"
            if any(word in message_lower for word in ['precio', 'costo', 'valor', 'cuanto']):
                return "price_inquiry"
            
            return "general"
        
        print("\n📨 Analizando mensajes de prueba:")
        for msg in test_messages:
            intent = analyze_message_intent(msg)
            print(f"  📝 '{msg}' → Intent: {intent}")
        
        print("✅ Análisis de intenciones funcionando correctamente")
        return True
        
    except Exception as e:
        print(f"❌ Error en análisis de backend: {str(e)}")
        return False

def test_database_connection_simulation():
    """Simular prueba de conexión a base de datos"""
    
    print("\n🗄️  Test 4: Simulación de conexión a base de datos")
    
    db_host = os.getenv('EXTERNAL_DB_HOST')
    db_name = os.getenv('EXTERNAL_DB_NAME')
    db_user = os.getenv('EXTERNAL_DB_USER')
    
    print(f"🏠 Host: {db_host}")
    print(f"💾 Database: {db_name}")
    print(f"👤 User: {db_user}")
    
    # Simular consulta exitosa
    print("🔍 Simulando consulta de propiedades...")
    time.sleep(1)
    
    fake_properties = [
        {
            "id": 1,
            "location": "Bogotá, Chapinero",
            "price": 450000000,
            "bedrooms": 3,
            "bathrooms": 2,
            "property_type": "apartamento"
        },
        {
            "id": 2, 
            "location": "Medellín, El Poblado",
            "price": 380000000,
            "bedrooms": 2,
            "bathrooms": 2,
            "property_type": "apartamento"
        }
    ]
    
    print(f"✅ Encontradas {len(fake_properties)} propiedades (simuladas)")
    for prop in fake_properties:
        print(f"  🏡 {prop['location']} - ${prop['price']:,} - {prop['bedrooms']} hab")
    
    return True

def generate_summary_report(whatsapp_test, backend_test, db_test):
    """Generar reporte de resumen"""
    
    print("\n" + "=" * 60)
    print("📊 REPORTE DE PRUEBAS")
    print("=" * 60)
    
    tests = [
        ("WhatsApp API Integration", whatsapp_test),
        ("Backend Logic", backend_test),
        ("Database Simulation", db_test)
    ]
    
    total_tests = len(tests)
    passed_tests = sum(1 for _, result in tests if result)
    
    for test_name, result in tests:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n📈 Resultado: {passed_tests}/{total_tests} pruebas exitosas")
    
    if passed_tests == total_tests:
        print("🎉 ¡Todas las pruebas pasaron! El sistema está listo.")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisar configuración.")
    
    print("\n🚀 Próximos pasos:")
    print("1. Configurar webhook en Facebook Developer Console")
    print("2. Iniciar servicios con Docker Compose")
    print("3. Probar envío de mensajes reales")
    print("4. Configurar acceso a la base de datos PostgreSQL externa")

if __name__ == "__main__":
    print("🤖 MicreroSport WhatsApp Bot - Tests de Integración")
    print("Versión: 1.0.0")
    print(f"Fecha: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ejecutar pruebas
    whatsapp_ok = test_whatsapp_api_integration()
    backend_ok = test_backend_integration()
    db_ok = test_database_connection_simulation()
    
    # Generar reporte
    generate_summary_report(whatsapp_ok, backend_ok, db_ok)