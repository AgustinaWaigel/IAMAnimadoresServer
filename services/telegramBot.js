const TelegramBot = require("node-telegram-bot-api");
const UsuarioTelegram = require("../models/UsuarioTelegram");
const NoticiaPrueba = require("../models/pruebaNoticias");
const Evento = require("../models/Evento");

const token = process.env.TELEGRAM_BOT_TOKEN;
const groupId = process.env.TELEGRAM_GROUP_ID || "-1002476216329";
const bot = new TelegramBot(token, { polling: true });

// Guardar usuario y mostrar menú si es mensaje privado
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

  // ✅ En grupo: enviar botón para ir al privado
  if (msg.chat.type.includes("group") && text && text.includes("hola")) {
    return enviarPreguntaPrivada();
  }

  // ✅ En privado: mostrar menú
  if (msg.chat.type === "private" && text && ["hola", "menu", "menú", "📋 menú"].some(p => text.includes(p))) {
    const opciones = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📰 Últimas noticias", callback_data: "ultimas" }],
          [{ text: "📅 Ver eventos", callback_data: "eventos" }]
        ]
      }
    };
    return bot.sendMessage(chatId, "📋 Menú privado:", opciones);
  }
});

// Comando /start con teclado personalizado (solo en privado)
bot.onText(/\/start/, async (msg) => {
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

  if (msg.chat.type === "private") {
    const tecladoMenu = {
      reply_markup: {
        keyboard: [[{ text: "📋 Menú" }]],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
    bot.sendMessage(chatId, "Bienvenido/a, tocá el botón para abrir el menú 👇", tecladoMenu);
  }
});

// Enviar mensaje con botón al grupo para abrir chat privado
const enviarPreguntaPrivada = async () => {
  const opciones = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔒 Hablar en privado", url: `https://t.me/${process.env.BOT_USERNAME}` }]
      ]
    }
  };
  await bot.sendMessage(groupId, "¿Querés recibir más información por privado?", opciones);
};

const enviarNoticia = async (titulo, slug) => {
  const mensaje = `🗞 Nueva noticia publicada:\n\n📌 *${titulo}*\n👉 https://iam-animadores-client.vercel.app/mostrar-noticias/${slug}`;
  try {
    await bot.sendMessage(groupId, mensaje, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("❌ Error al enviar noticia al grupo:", err.message);
  }
};

const enviarMensajeGeneral = async (texto) => {
  try {
    await bot.sendMessage(groupId, texto, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("❌ Error al enviar mensaje al grupo:", err.message);
  }
};

bot.on("callback_query", async (query) => {
  const { chat } = query.message;
  const data = query.data;

  if (data === "ultimas") return handleUltimasNoticias(chat.id);
  if (data === "eventos") return handleEventos(chat.id);

  bot.answerCallbackQuery(query.id);
});

const handleUltimasNoticias = async (chatId) => {
  const noticias = await NoticiaPrueba.find().sort({ createdAt: -1 }).limit(3);
  const respuesta = noticias.map(n => `🗞 *${n.titulo}*\nhttps://iam-animadores-client.vercel.app/noticias/${n.slug}`).join("\n\n");
  bot.sendMessage(chatId, respuesta, { parse_mode: "Markdown" });
};

const handleEventos = async (chatId) => {
  const ahora = new Date();
  const eventos = await Evento.find({ start: { $gte: ahora } }).sort({ start: 1 }).limit(3);
  const respuesta = eventos.map(e => {
    const fecha = new Date(e.start).toLocaleDateString("es-AR");
    const hora = new Date(e.start).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    return `📅 *${e.title}*\n📆 ${fecha} ⏰ ${hora}`;
  }).join("\n\n");
  bot.sendMessage(chatId, respuesta, { parse_mode: "Markdown" });
};

module.exports = { enviarNoticia, enviarMensajeGeneral, enviarPreguntaPrivada };
