const Evento = require("../models/Evento");
const { enviarMensajeGeneral } = require("../services/telegramBot");
const cron = require("node-cron");

// ✅ Cron: notificar eventos del día siguiente a las 8 AM
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Verificando eventos de mañana...");

  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  manana.setHours(0, 0, 0, 0);

  const pasado = new Date(manana);
  pasado.setDate(manana.getDate() + 1);

  try {
    const eventos = await Evento.find({
      start: { $gte: manana, $lt: pasado },
    });

    if (eventos.length === 0) {
      console.log("📭 No hay eventos para mañana.");
      return;
    }

    for (const evento of eventos) {
      const fecha = new Date(evento.start);
      const hora = fecha.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const fechaStr = fecha.toLocaleDateString("es-AR");

      const mensaje = `📅 *¡Recordatorio!*\n\nMañana hay un evento:\n\n📝 *${evento.title}*\n📆 Fecha: ${fechaStr}\n⏰ Hora: ${hora}\n🗒️ ${evento.descripcion || ""}`;
      await enviarMensajeGeneral(mensaje);
    }
  } catch (error) {
    console.error("❌ Error al verificar eventos:", error.message);
  }
});

// ✅ MongoDB Change Stream: notificar solo ediciones relevantes
Evento.watch().on("change", async (change) => {
  try {
    let mensaje = "";

    // ⛔️ Ignorar inserts: ya se notifican manualmente desde la ruta POST
    if (change.operationType === "insert") return;

    if (change.operationType === "update") {
      const updatedFields = Object.keys(change.updateDescription?.updatedFields || {});
      const camposImportantes = ["title", "start", "end", "descripcion", "color"];

      const cambioRelevante = updatedFields.some((campo) =>
        camposImportantes.includes(campo)
      );

      if (!cambioRelevante) {
        console.log("📭 Cambio irrelevante, no se notifica");
        return;
      }

      const id = change.documentKey._id;
      const evento = await Evento.findById(id);
      if (evento) {
        const fecha = new Date(evento.start);
        const hora = fecha.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const fechaStr = fecha.toLocaleDateString("es-AR");

        mensaje = `✏️ *Evento modificado:*\n\n📝 *${evento.title}*\n📆 Fecha: ${fechaStr}\n⏰ Hora: ${hora}\n🗒️ ${evento.descripcion || ""}`;
      }
    }

    if (mensaje) {
      await enviarMensajeGeneral(mensaje);
    }
  } catch (e) {
    console.error("❌ Error en notificación de cambios de eventos:", e.message);
  }
});
