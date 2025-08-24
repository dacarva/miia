-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Crear esquemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Tabla de tenants (clientes)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Tabla de conversaciones
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    phone_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mensajes
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id),
    message_type VARCHAR(20) DEFAULT 'text',
    content TEXT,
    metadata JSONB DEFAULT '{}',
    is_from_customer BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(100),
    sizes TEXT[],
    colors TEXT[],
    images TEXT[],
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_conversations_tenant_phone ON conversations(tenant_id, phone_number);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_products_tenant_category ON products(tenant_id, category);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

-- Insertar tenant por defecto
INSERT INTO tenants (name, display_name, settings) VALUES 
('micrerosport', 'MicreroSport', '{
    "business_hours": {"start": "10:00", "end": "19:00"},
    "timezone": "America/Bogota",
    "currency": "COP",
    "language": "es",
    "greeting_message": "¡Hola! Soy el asistente de MicreroSport ⚽. ¿En qué puedo ayudarte hoy?",
    "google_drive_folder": "1dlks4X6cIrdTapnN7UinN4Xozvar0fV3"
}');
