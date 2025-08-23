import { NextRequest, NextResponse } from "next/server";
import { createAgent } from "../agent/create-agent";

interface WhatsAppMessage {
  object: string;
  entry: {
    id: string;
    changes: {
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: {
          from: string;
          id: string;
          timestamp: string;
          text: {
            body: string;
          };
          type: string;
        }[];
        statuses?: any[];
      };
      field: string;
    }[];
  }[];
}

interface WhatsAppResponse {
  messaging_product: string;
  to: string;
  type: string;
  text: {
    body: string;
  };
}

async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.error("WhatsApp credentials not configured");
    return false;
  }

  const messageData: WhatsAppResponse = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "text",
    text: {
      body: message
    }
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      }
    );

    if (!response.ok) {
      console.error("WhatsApp API error:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}

async function processUserMessage(phoneNumber: string, messageText: string): Promise<string> {
  try {
    // Create or get existing agent for this phone number
    const agent = await createAgent(phoneNumber);
    
    // Create conversation context with Colombian real estate investment focus
    const systemContext = `
      Eres un asistente experto en inversiones inmobiliarias en Colombia. Ayudas a usuarios colombianos a invertir en propiedades tokenizadas en Pereira a través de WhatsApp.
      
      Información clave:
      - Inversión mínima: $400,000 COP (equivale a $100 USD)
      - Las propiedades están tokenizadas usando estándar ERC-3643 T-REX para cumplimiento regulatorio
      - Los usuarios pueden comprar fracciones de propiedades (ownership fraccionado)
      - Todas las propiedades están en Pereira, Colombia
      - Los precios se muestran en pesos colombianos (COP)
      - Se crea automáticamente una wallet durante el onboarding
      
      Cuando un usuario dice "Quiero ver oportunidades de inversión" o similar:
      1. Salúdalo cordialmente
      2. Explica brevemente la inversión inmobiliaria tokenizada
      3. Ofrece mostrar propiedades disponibles
      4. Si es la primera vez, explica que se creará una wallet automáticamente
      
      Detalles importantes a incluir en las propiedades:
      - Ubicación (barrio en Pereira)
      - Área en metros cuadrados
      - Tipo de propiedad
      - Precio total en COP
      - Inversión mínima (400,000 COP)
      - Porcentaje de propiedad por token
      
      Mantén un tono amigable, profesional y educativo en español.
    `;

    // Process the message through the agent
    const response = await agent.invoke(
      {
        messages: [
          {
            role: "system",
            content: systemContext
          },
          {
            role: "user",
            content: messageText
          }
        ]
      },
      {
        configurable: {
          thread_id: phoneNumber
        }
      }
    );

    // Extract the agent's response
    const agentMessage = response.messages[response.messages.length - 1];
    return agentMessage.content || "Lo siento, hubo un error procesando tu mensaje.";

  } catch (error) {
    console.error("Error processing user message:", error);
    return "Lo siento, hubo un error técnico. Por favor intenta nuevamente en unos momentos.";
  }
}

// Webhook verification for WhatsApp
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "tu_token_de_verificacion";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    return new NextResponse(challenge);
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Handle incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppMessage = await request.json();

    // Extract message data
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: "no_messages" });
    }

    // Process each message
    for (const message of messages) {
      if (message.type === "text") {
        const phoneNumber = message.from;
        const messageText = message.text.body;

        console.log(`Received message from ${phoneNumber}: ${messageText}`);

        // Process the message through the agent
        const agentResponse = await processUserMessage(phoneNumber, messageText);

        // Send response back to WhatsApp
        const sent = await sendWhatsAppMessage(phoneNumber, agentResponse);
        
        if (!sent) {
          console.error("Failed to send WhatsApp response");
        }
      }
    }

    return NextResponse.json({ status: "success" });

  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}