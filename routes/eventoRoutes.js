const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // ← ESTO FALTABA
const Evento = require("../models/Evento");
const verifyToken = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { enviarMensajeGeneral } = require("../services/telegramBot");

// Crear evento
router.post("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, start, end, descripcion, color } = req.body;
    const nuevo = new Evento({
      title,
      start,
      end,
      descripcion,
      color,
      createdBy: req.user.id,
    });
    await nuevo.save();
    res.json({ success: true, evento: nuevo });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al crear evento" });
  }
});

// Obtener eventos
router.get("/", async (req, res) => {
  try {
    const eventos = await Evento.find();
    res.json(eventos);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al obtener eventos" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  // Validar ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID de evento inválido" });
  }

  try {
    const evento = await Evento.findById(id);

    if (!evento) {
      return res.status(404).json({ success: false, message: "Evento no encontrado" });
    }

    // Preparar mensaje para Telegram
    const fecha = new Date(evento.start);
    const fechaStr = fecha.toLocaleDateString("es-AR");
    const hora = fecha.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const mensaje = `❌ *Evento eliminado:*\n\n📝 *${evento.title}*\n📆 Fecha: ${fechaStr}\n⏰ Hora: ${hora}\n🗒️ ${evento.descripcion || ""}`;

    // Enviar aviso al grupo
    try {
      await enviarMensajeGeneral(mensaje);
    } catch (e) {
      console.warn("⚠️ Error al enviar mensaje de Telegram:", e.message);
    }

    await evento.deleteOne();
    console.log("✅ Evento eliminado correctamente:", id);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al eliminar evento:", err.message);
    res.status(500).json({ success: false, message: "Error al eliminar el evento", detalle: err.message });
  }
});

// Editar evento
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, start, end, descripcion, color } = req.body;
    const eventoActualizado = await Evento.findByIdAndUpdate(
      req.params.id,
      { title, start, end, descripcion, color },
      { new: true }
    );
    res.json({ success: true, evento: eventoActualizado });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al actualizar evento" });
  }
});

module.exports = router;
