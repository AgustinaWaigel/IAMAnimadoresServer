const axios = require("axios");

const token = process.env.WHATSAPP_TOKEN; // lo agregás después en Render
const phoneNumberId = process.env.WHATSAPP_PHONE_ID; // ID del número de WhatsApp

const enviarWhatsApp = async (to, plantilla, variables = []) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to, // número del destinatario con código país, ej. 549341XXXXXXX
        type: "template",
        template: {
          name: plantilla, // ej. "recordatorio_evento"
          language: { code: "es_AR" },
          components: [
            {
              type: "body",
              parameters: variables.map((v) => ({ type: "text", text: v })),
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ WhatsApp enviado:", response.data);
  } catch (err) {
    console.error("❌ Error enviando WhatsApp:", err.response?.data || err.message);
  }
};

module.exports = enviarWhatsApp;
