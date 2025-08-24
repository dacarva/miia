/**
 * MicreroSport WhatsApp Business API Bot
 * =====================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const winston = require('winston');
const crypto = require('crypto');

// Configuración
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const API_URL = process.env.API_URL || 'http://backend:8000';
const SECRET_KEY = process.env.SECRET_KEY;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Configurar logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ 
      filename: '/app/logs/whatsapp-bot.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Variables globales
let messageCount = { sent: 0, received: 0 };
let startTime = Date.now();

// Crear app Express
const app = express();

// Middlewares
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Demasiadas solicitudes, intenta más tarde' }
});
app.use('/webhook', limiter);

// Funciones de WhatsApp Business API
async function sendWhatsAppMessage(to, message, messageType = 'text') {
  try {
    const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    let messageData = {
      messaging_product: 'whatsapp',
      to: to,
      type: messageType
    };

    if (messageType === 'text') {
      messageData.text = { body: message };
    } else if (messageType === 'template') {
      messageData.template = message;
    }

    const response = await axios.post(url, messageData, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info('✅ Mensaje enviado', { to, messageId: response.data.messages?.[0]?.id });
    messageCount.sent++;
    return response.data;

  } catch (error) {
    logger.error('❌ Error enviando mensaje', { 
      error: error.message, 
      response: error.response?.data 
    });
    throw error;
  }
}

async function processIncomingMessage(from, messageBody, messageId) {
  try {
    logger.info('📨 Procesando mensaje', { from, body: messageBody, messageId });
    
    // Llamar al backend para procesar el mensaje con IA
    const response = await axios.post(`${API_URL}/api/whatsapp/process-message`, {
      from: from,
      message: messageBody,
      messageId: messageId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SECRET_KEY}`
      }
    });
    
    if (response.data && response.data.reply) {
      await sendWhatsAppMessage(from, response.data.reply);
      logger.info('🤖 Respuesta IA enviada', { from, reply: response.data.reply });
    }
    
  } catch (error) {
    logger.error('❌ Error procesando mensaje', { error: error.message });
    
    // Respuesta de fallback
    const fallbackMessage = '¡Hola! Soy el asistente de MicreroSport ⚽. En este momento estoy teniendo algunos problemas técnicos, pero puedo ayudarte con información sobre propiedades en finca raíz. ¿En qué ciudad estás buscando?';
    
    try {
      await sendWhatsAppMessage(from, fallbackMessage);
    } catch (sendError) {
      logger.error('❌ Error enviando mensaje de fallback', { error: sendError.message });
    }
  }
}

// Verificar webhook
function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    logger.info('✅ Webhook verificado correctamente');
    res.status(200).send(challenge);
  } else {
    logger.error('❌ Fallo en verificación de webhook');
    res.sendStatus(403);
  }
}

// Verificar firma del webhook
function verifySignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  const body = JSON.stringify(req.body);
  
  if (!signature) {
    logger.error('❌ Firma faltante en webhook');
    return res.sendStatus(400);
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', WHATSAPP_VERIFY_TOKEN)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.error('❌ Firma inválida en webhook');
    return res.sendStatus(400);
  }

  next();
}

// Routes de la API
app.get('/webhook', verifyWebhook);

app.post('/webhook', verifySignature, async (req, res) => {
  try {
    const body = req.body;
    
    if (body.object === 'whatsapp_business_account') {
      body.entry.forEach(entry => {
        entry.changes.forEach(change => {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            
            if (messages) {
              messages.forEach(message => {
                if (message.type === 'text') {
                  const from = message.from;
                  const messageBody = message.text.body;
                  const messageId = message.id;
                  
                  messageCount.received++;
                  
                  // Procesar mensaje de forma asíncrona
                  processIncomingMessage(from, messageBody, messageId)
                    .catch(error => {
                      logger.error('❌ Error en procesamiento asíncrono', { error: error.message });
                    });
                }
              });
            }
          }
        });
      });
    }
    
    res.status(200).send('EVENT_RECEIVED');
    
  } catch (error) {
    logger.error('❌ Error en webhook', { error: error.message });
    res.status(500).send('Error interno');
  }
});

app.get('/status', (req, res) => {
  res.json({
    connected: true,
    api_type: 'whatsapp_business',
    uptime: Date.now() - startTime,
    messages_sent: messageCount.sent,
    messages_received: messageCount.received,
    phone_number_id: WHATSAPP_PHONE_NUMBER_ID
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    whatsapp_ready: true,
    uptime: Date.now() - startTime,
    api_type: 'business_api'
  });
});

// Endpoint para enviar mensajes manualmente (testing)
app.post('/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Faltan parámetros: to, message' });
    }
    
    const result = await sendWhatsAppMessage(to, message);
    res.json({ success: true, result });
    
  } catch (error) {
    logger.error('❌ Error enviando mensaje manual', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para enviar mensaje de prueba
app.post('/test-message', async (req, res) => {
  try {
    const testMessage = '¡Hola! Este es un mensaje de prueba del asistente de MicreroSport ⚽. El bot está funcionando correctamente.';
    const testNumber = process.env.WHATSAPP_MY_NUMBER;
    
    if (!testNumber) {
      return res.status(400).json({ error: 'WHATSAPP_MY_NUMBER no configurado' });
    }
    
    const result = await sendWhatsAppMessage(testNumber, testMessage);
    res.json({ success: true, result, sent_to: testNumber });
    
  } catch (error) {
    logger.error('❌ Error enviando mensaje de prueba', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Inicializar servidor
function startServer() {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Bot de WhatsApp Business API iniciado en puerto ${PORT}`);
      logger.info(`📱 Phone Number ID: ${WHATSAPP_PHONE_NUMBER_ID}`);
      logger.info(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
    });
    
  } catch (error) {
    logger.error('❌ Error iniciando servidor', { error: error.message });
    process.exit(1);
  }
}

// Iniciar aplicación
startServer();
