const TelegramBot = require("node-telegram-bot-api");
const UsuarioTelegram = require("../models/UsuarioTelegram");
const NoticiaPrueba = require("../models/pruebaNoticias");
const Evento = require("../models/Evento");

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookPath = `/bot${token}`;
const webhookUrl = `${process.env.PUBLIC_URL}${webhookPath}`; // debe estar en tu .env

const bot = new TelegramBot(token);

bot.setWebHook(webhookUrl);

// === Handlers del bot ===
bot.on("new_chat_members", async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `👋 ¡Bienvenido/a! Este bot te avisará de eventos y noticias importantes.\n\n🧭 Para recibir más info, escribí: *hola*.\nEl bot te responderá con un botón para hablar en privado.\n\nDesde el chat privado, también podés escribir *hola* para ver el menú.\nEsto es lo que hay por ahora. Estamos trabajando para agregar más opciones.`, { parse_mode: "Markdown" });
});

bot.on("message", async (msg) => {
  const text = msg.text?.toLowerCase();
  const chatId = msg.chat.id;
  const { first_name, username } = msg.chat;

  try {
    await UsuarioTelegram.findOneAndUpdate(
      { chatId },
      { chatId, nombre: first_name || "", username: username || "" },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error("❌ Error al guardar usuario:", e.message);
  }

  if (msg.chat.type.includes("group") && text?.includes("hola")) {
    return bot.sendMessage(chatId, "🔒 Tocá el botón para hablar en privado:", {
      reply_markup: {
        inline_keyboard: [[{ text: "Abrir chat privado", url: `https://t.me/${process.env.BOT_USERNAME}` }]]
      }
    });
  }

  if (msg.chat.type === "private" && text?.includes("hola")) {
    return bot.sendMessage(chatId,
      `🙌 ¡Hola ${first_name || ""}! Este es el menú:\n\n📌 Noticias recientes\n📅 Eventos próximos\n\n✍️ Escribí *menú* en cualquier momento para verlo de nuevo.\n\nEsto es lo que hay por ahora. Estamos trabajando para agregar más opciones.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📰 Últimas noticias", callback_data: "ultimas" }],
            [{ text: "📅 Ver eventos", callback_data: "eventos" }]
          ]
        }
      });
  }
});

bot.on("callback_query", async (query) => {
  const { chat } = query.message;
  const data = query.data;

  if (data === "ultimas") {
    const noticias = await NoticiaPrueba.find().sort({ createdAt: -1 }).limit(3);
    const respuesta = noticias.map(n => `🗞 *${n.titulo}*\nhttps://iam-animadores-client.vercel.app/noticias/${n.slug}`).join("\n\n");
    bot.sendMessage(chat.id, respuesta, { parse_mode: "Markdown" });
  }

  if (data === "eventos") {
    const ahora = new Date();
    const eventos = await Evento.find({ start: { $gte: ahora } }).sort({ start: 1 }).limit(3);
    const respuesta = eventos.map(e => {
      const fecha = new Date(e.start).toLocaleDateString("es-AR");
      const hora = new Date(e.start).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      return `📅 *${e.title}*\n📆 ${fecha} ⏰ ${hora}`;
    }).join("\n\n");
    bot.sendMessage(chat.id, respuesta, { parse_mode: "Markdown" });
  }

  bot.answerCallbackQuery(query.id);
});

// Exporta función para conectar al app
function configurarBotEnApp(app) {
  app.post(webhookPath, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

module.exports = { configurarBotEnApp };
