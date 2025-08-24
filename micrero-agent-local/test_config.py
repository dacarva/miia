#!/usr/bin/env python3
"""
Script de verificación de configuración - SIN dependencias externas
================================================================
"""

import os

def test_environment_config():
    """Verificar configuración de variables de entorno"""
    
    print("🔧 VERIFICACIÓN DE CONFIGURACIÓN")
    print("=" * 50)
    
    # Variables requeridas
    required_vars = {
        'WHATSAPP_ACCESS_TOKEN': 'Token de acceso de WhatsApp Business',
        'WHATSAPP_PHONE_NUMBER_ID': 'ID del número de teléfono',
        'WHATSAPP_MY_NUMBER': 'Tu número de WhatsApp',
        'EXTERNAL_DB_HOST': 'Host de la base de datos externa',
        'EXTERNAL_DB_NAME': 'Nombre de la base de datos',
        'EXTERNAL_DB_USER': 'Usuario de la base de datos'
    }
    
    print("\n📋 Variables de entorno:")
    configured_count = 0
    
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            # Mostrar solo los primeros y últimos caracteres para seguridad
            if 'TOKEN' in var and len(value) > 10:
                display_value = f"{value[:8]}...{value[-4:]}"
            elif len(value) > 20:
                display_value = f"{value[:15]}...{value[-3:]}"
            else:
                display_value = value
            
            print(f"  ✅ {var}: {display_value}")
            configured_count += 1
        else:
            print(f"  ❌ {var}: No configurado - {description}")
    
    print(f"\n📊 Configuración: {configured_count}/{len(required_vars)} variables")
    
    return configured_count == len(required_vars)

def test_file_structure():
    """Verificar estructura de archivos del proyecto"""
    
    print("\n📁 ESTRUCTURA DE ARCHIVOS")
    print("=" * 50)
    
    required_files = [
        '/opt/micrero-agent/.env',
        '/opt/micrero-agent/whatsapp-bot/index.js',
        '/opt/micrero-agent/backend/main.py',
        '/opt/micrero-agent/backend/app/services/mcp_client.py',
        '/opt/micrero-agent/backend/app/api/routes.py',
        '/opt/micrero-agent/docker-compose.yml',
        '/opt/micrero-agent/mcp-config.json'
    ]
    
    existing_count = 0
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"  ✅ {file_path}")
            existing_count += 1
        else:
            print(f"  ❌ {file_path} - No encontrado")
    
    print(f"\n📊 Archivos: {existing_count}/{len(required_files)} encontrados")
    
    return existing_count == len(required_files)

def test_whatsapp_config():
    """Verificar configuración específica de WhatsApp"""
    
    print("\n📱 CONFIGURACIÓN DE WHATSAPP")
    print("=" * 50)
    
    # Leer archivo .env
    env_file = '/opt/micrero-agent/.env'
    whatsapp_configs = {}
    
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    if 'WHATSAPP' in key:
                        whatsapp_configs[key] = value
    
    print("\n🔑 Configuraciones de WhatsApp encontradas:")
    for key, value in whatsapp_configs.items():
        if value:
            display_value = f"{value[:6]}...{value[-4:]}" if len(value) > 12 else value
            print(f"  ✅ {key}: {display_value}")
        else:
            print(f"  ❌ {key}: Vacío")
    
    # Verificar que el token tenga formato correcto
    token = whatsapp_configs.get('WHATSAPP_ACCESS_TOKEN', '')
    if token and len(token) > 50 and token.startswith('EAAU'):
        print("  ✅ Formato del token parece válido")
        token_valid = True
    else:
        print("  ❌ Formato del token inválido")
        token_valid = False
    
    # Verificar número de teléfono
    phone_id = whatsapp_configs.get('WHATSAPP_PHONE_NUMBER_ID', '')
    if phone_id and phone_id.isdigit() and len(phone_id) > 10:
        print("  ✅ Phone Number ID parece válido")
        phone_valid = True
    else:
        print("  ❌ Phone Number ID inválido")
        phone_valid = False
    
    return token_valid and phone_valid and len(whatsapp_configs) >= 4

def test_database_config():
    """Verificar configuración de base de datos"""
    
    print("\n🗄️  CONFIGURACIÓN DE BASE DE DATOS")
    print("=" * 50)
    
    db_host = os.getenv('EXTERNAL_DB_HOST')
    db_name = os.getenv('EXTERNAL_DB_NAME') 
    db_user = os.getenv('EXTERNAL_DB_USER')
    
    print("\n📡 Configuración de DB externa:")
    
    configs_ok = 0
    
    if db_host == '159.203.92.4':
        print(f"  ✅ Host: {db_host}")
        configs_ok += 1
    else:
        print(f"  ❌ Host: {db_host} (esperado: 159.203.92.4)")
    
    if db_name == 'cluster':
        print(f"  ✅ Database: {db_name}")
        configs_ok += 1
    else:
        print(f"  ❌ Database: {db_name} (esperado: cluster)")
    
    if db_user == 'miia':
        print(f"  ✅ User: {db_user}")
        configs_ok += 1
    else:
        print(f"  ❌ User: {db_user} (esperado: miia)")
    
    return configs_ok == 3

def test_mcp_config():
    """Verificar configuración de MCP"""
    
    print("\n🔧 CONFIGURACIÓN DE MCP")
    print("=" * 50)
    
    mcp_config_file = '/opt/micrero-agent/mcp-config.json'
    
    if os.path.exists(mcp_config_file):
        print(f"  ✅ Archivo MCP config existe: {mcp_config_file}")
        
        # Leer y verificar contenido
        try:
            with open(mcp_config_file, 'r') as f:
                content = f.read()
                if 'postgres' in content and 'mcpServers' in content:
                    print("  ✅ Configuración MCP parece válida")
                    return True
                else:
                    print("  ❌ Configuración MCP inválida")
                    return False
        except Exception as e:
            print(f"  ❌ Error leyendo MCP config: {str(e)}")
            return False
    else:
        print(f"  ❌ Archivo MCP config no encontrado")
        return False

def main():
    """Función principal"""
    
    print("🤖 MICREROSPORT WHATSAPP BOT")
    print("Verificación de configuración del sistema")
    print("=" * 60)
    
    # Ejecutar todas las pruebas
    tests = [
        ("Variables de entorno", test_environment_config),
        ("Estructura de archivos", test_file_structure),
        ("Configuración WhatsApp", test_whatsapp_config),
        ("Configuración Base de datos", test_database_config),
        ("Configuración MCP", test_mcp_config)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Error en {test_name}: {str(e)}")
            results.append((test_name, False))
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE VERIFICACIÓN")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Resultado final: {passed}/{total} verificaciones exitosas")
    
    if passed == total:
        print("🎉 ¡Sistema configurado correctamente!")
        print("\n🚀 Próximos pasos:")
        print("1. Ejecutar: docker-compose up -d")
        print("2. Configurar webhook en Meta Developer Console")
        print("3. Probar envío de mensajes")
    else:
        print("⚠️  Hay problemas de configuración que resolver.")
    
    print(f"\n📅 Verificación completada")

if __name__ == "__main__":
    main()