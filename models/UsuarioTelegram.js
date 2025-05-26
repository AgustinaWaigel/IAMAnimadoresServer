const mongoose = require("mongoose");

const UsuarioTelegramSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  nombre: String,
  username: String,
  rol: { type: String, default: "animador" }, // opcional
  zona: String, // opcional
  creadoEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UsuarioTelegram", UsuarioTelegramSchema);
