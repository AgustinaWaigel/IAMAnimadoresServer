const axios = require("axios");

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = `https://api.telegram.org/bot${token}/deleteWebhook`;

axios.post(url)
  .then(res => {
    console.log("✅ Webhook eliminado:", res.data);
  })
  .catch(err => {
    console.error("❌ Error al eliminar webhook:", err.response?.data || err.message);
  });
