const express = require("express");
const router = express.Router();
const Evento = require("../models/Evento");
const verifyToken = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

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

// Eliminar evento
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await Evento.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al eliminar evento" });
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
