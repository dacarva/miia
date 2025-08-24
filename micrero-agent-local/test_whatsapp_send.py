#!/usr/bin/env python3
"""
Script para probar envío de mensajes de WhatsApp usando la API Business
=====================================================================
"""

import urllib.request
import urllib.parse
import json
import os

def load_env_file():
    """Cargar variables de entorno desde .env"""
    env_vars = {}
    env_file = '/opt/micrero-agent/.env'
    
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    
    return env_vars

def send_whatsapp_message():
    """Enviar mensaje de prueba usando WhatsApp Business API"""
    
    print("📱 PRUEBA DE ENVÍO DE MENSAJE WHATSAPP")
    print("=" * 50)
    
    # Cargar configuración
    config = load_env_file()
    
    access_token = config.get('WHATSAPP_ACCESS_TOKEN')
    phone_id = config.get('WHATSAPP_PHONE_NUMBER_ID') 
    my_number = config.get('WHATSAPP_MY_NUMBER', '').replace('+', '')
    
    print(f"🔑 Token: {access_token[:10]}...{access_token[-5:] if access_token else 'N/A'}")
    print(f"📞 Phone ID: {phone_id}")
    print(f"📱 Destinatario: {my_number}")
    
    if not all([access_token, phone_id, my_number]):
        print("❌ Faltan configuraciones necesarias")
        return False
    
    # URL de la API
    url = f"https://graph.facebook.com/v22.0/{phone_id}/messages"
    
    # Datos del mensaje - usando template hello_world
    message_data = {
        "messaging_product": "whatsapp",
        "to": my_number,
        "type": "template",
        "template": {
            "name": "hello_world", 
            "language": {
                "code": "en_US"
            }
        }
    }
    
    print(f"\n🚀 Enviando mensaje...")
    print(f"🔗 URL: {url}")
    print(f"📄 Data: {json.dumps(message_data, indent=2)}")
    
    try:
        # Crear request
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Convertir datos a JSON
        json_data = json.dumps(message_data).encode('utf-8')
        
        # Crear request object
        req = urllib.request.Request(url, data=json_data, headers=headers)
        
        # Enviar request
        with urllib.request.urlopen(req) as response:
            response_data = response.read().decode('utf-8')
            response_json = json.loads(response_data)
            
            print(f"✅ Respuesta exitosa!")
            print(f"📊 Status: {response.status}")
            print(f"📄 Response: {json.dumps(response_json, indent=2)}")
            
            if 'messages' in response_json:
                message_id = response_json['messages'][0]['id']
                print(f"🆔 Message ID: {message_id}")
                print(f"📱 ¡Mensaje enviado a {my_number}!")
                return True
            
    except urllib.error.HTTPError as e:
        print(f"❌ Error HTTP: {e.code}")
        error_response = e.read().decode('utf-8')
        print(f"📄 Error details: {error_response}")
        return False
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_whatsapp_webhook_url():
    """Generar información sobre el webhook"""
    
    print("\n🔗 CONFIGURACIÓN DE WEBHOOK")
    print("=" * 50)
    
    print("Para configurar el webhook en Meta Developer Console:")
    print("1. Ve a https://developers.facebook.com/")
    print("2. Selecciona tu app")
    print("3. Ve a WhatsApp > Configuration")
    print("4. En 'Webhook', configura:")
    print(f"   📍 URL: https://TU_DOMINIO/webhook")
    print(f"   🔑 Verify Token: {load_env_file().get('WHATSAPP_WEBHOOK_SECRET', 'micrero_webhook_2024_secret')}")
    print("5. Suscríbete a 'messages'")
    
    print("\n⚠️  IMPORTANTE:")
    print("- El webhook debe estar accesible públicamente")
    print("- Usa HTTPS (requerido por Meta)")
    print("- El servicio debe estar corriendo antes de verificar")

def main():
    """Función principal"""
    
    print("🤖 MICREROSPORT WHATSAPP BOT")
    print("Test de envío de mensajes")
    print("=" * 60)
    
    # Test de configuración
    config = load_env_file()
    print("\n📋 Configuración cargada:")
    whatsapp_vars = {k: v for k, v in config.items() if 'WHATSAPP' in k}
    for key, value in whatsapp_vars.items():
        if 'TOKEN' in key:
            display_value = f"{value[:8]}...{value[-4:]}" if value else "No configurado"
        else:
            display_value = value or "No configurado"
        print(f"  {key}: {display_value}")
    
    # Enviar mensaje de prueba
    success = send_whatsapp_message()
    
    # Información del webhook
    test_whatsapp_webhook_url()
    
    print("\n" + "=" * 60)
    print("📊 RESUMEN")
    print("=" * 60)
    
    if success:
        print("✅ Mensaje enviado exitosamente!")
        print("📱 Revisa tu WhatsApp para ver el mensaje")
        print("🎉 La integración con WhatsApp Business API funciona")
    else:
        print("❌ Error enviando mensaje")
        print("🔍 Revisa:")
        print("  - Token de acceso válido")
        print("  - Phone Number ID correcto")  
        print("  - Número de destino correcto")
        print("  - Cuenta de WhatsApp Business verificada")
    
    print(f"\n🚀 Próximos pasos:")
    print("1. Configurar webhook público")
    print("2. Probar recepción de mensajes")
    print("3. Iniciar servicios completos con Docker")

if __name__ == "__main__":
    main()