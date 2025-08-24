#!/usr/bin/env python3
"""
Test completo del sistema MicreroSport WhatsApp Bot
==================================================
"""

import urllib.request
import urllib.parse
import json
import time

def test_backend_health():
    """Probar health del backend"""
    print("🔧 Probando backend...")
    try:
        with urllib.request.urlopen("http://localhost:8000/health") as response:
            data = json.loads(response.read().decode())
            print(f"  ✅ Backend: {data['status']}")
            return True
    except Exception as e:
        print(f"  ❌ Error en backend: {e}")
        return False

def test_whatsapp_status():
    """Probar estado del WhatsApp bot"""
    print("📱 Probando WhatsApp bot...")
    try:
        with urllib.request.urlopen("http://localhost:3001/status") as response:
            data = json.loads(response.read().decode())
            print(f"  ✅ WhatsApp: Conectado ({data['api_type']})")
            print(f"  📊 Mensajes enviados: {data['messages_sent']}")
            print(f"  📞 Phone ID: {data['phone_number_id']}")
            return True
    except Exception as e:
        print(f"  ❌ Error en WhatsApp bot: {e}")
        return False

def test_message_processing():
    """Probar procesamiento de mensajes"""
    print("💬 Probando procesamiento de mensajes...")
    
    test_messages = [
        {
            "message": "Hola, busco apartamento en Bogotá",
            "expected_keyword": "asistente de bienes raíces"
        },
        {
            "message": "¿Cuánto cuesta una casa en Medellín?", 
            "expected_keyword": "rangos típicos por ciudad"
        },
        {
            "message": "Necesito información de propiedades",
            "expected_keyword": "base de datos de finca raíz"
        }
    ]
    
    success_count = 0
    
    for i, test in enumerate(test_messages, 1):
        try:
            # Crear request
            data = {
                "from": "573208536808",
                "message": test["message"],
                "messageId": f"test{i}"
            }
            
            req = urllib.request.Request(
                "http://localhost:8000/api/whatsapp/process-message",
                data=json.dumps(data).encode(),
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode())
                
                if result["processed"] and test["expected_keyword"] in result["reply"].lower():
                    print(f"  ✅ Test {i}: '{test['message'][:30]}...'")
                    success_count += 1
                else:
                    print(f"  ⚠️  Test {i}: Procesado pero respuesta inesperada")
                    
        except Exception as e:
            print(f"  ❌ Test {i} falló: {e}")
    
    print(f"  📊 Resultado: {success_count}/{len(test_messages)} tests exitosos")
    return success_count == len(test_messages)

def test_whatsapp_sending():
    """Probar envío de mensajes de WhatsApp"""
    print("📤 Probando envío de mensajes...")
    
    try:
        req = urllib.request.Request(
            "http://localhost:3001/test-message",
            data=b'',
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            
            if result["success"] and "messages" in result["result"]:
                message_id = result["result"]["messages"][0]["id"]
                print(f"  ✅ Mensaje enviado exitosamente!")
                print(f"  🆔 Message ID: {message_id[:20]}...")
                print(f"  📱 Enviado a: {result['sent_to']}")
                return True
            else:
                print("  ❌ Respuesta inesperada del bot")
                return False
                
    except Exception as e:
        print(f"  ❌ Error enviando mensaje: {e}")
        return False

def main():
    """Función principal"""
    print("🤖 MICREROSPORT WHATSAPP BOT")
    print("Test completo del sistema")
    print("=" * 60)
    
    results = []
    
    # Ejecutar todas las pruebas
    results.append(("Backend Health", test_backend_health()))
    results.append(("WhatsApp Status", test_whatsapp_status()))
    results.append(("Message Processing", test_message_processing()))
    results.append(("WhatsApp Sending", test_whatsapp_sending()))
    
    # Mostrar resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN FINAL")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Resultado: {passed}/{total} tests exitosos")
    
    if passed == total:
        print("🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!")
        print("\n✨ El bot está listo para:")
        print("  📱 Recibir mensajes de WhatsApp")
        print("  🤖 Responder inteligentemente sobre propiedades")
        print("  📊 Consultar información de finca raíz")
        print("  💬 Procesar múltiples tipos de consultas")
        print("\n🚀 Próximos pasos:")
        print("  1. Configurar webhook público en Meta Developer Console")
        print("  2. Probar con mensajes reales desde WhatsApp")
        print("  3. Conectar con la base de datos real de PostgreSQL")
    else:
        print("⚠️  Algunos tests fallaron. Revisar configuración.")
        
    print(f"\n⏰ Test completado: {time.strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()