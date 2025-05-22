// models/Notificacion.js
const mongoose = require("mongoose");

const notificacionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  mensaje: String,
  eventoId: { type: mongoose.Schema.Types.ObjectId, ref: "Evento" },
  leida: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notificacion", notificacionSchema);
