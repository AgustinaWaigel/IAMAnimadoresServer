const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  contenido: { type: String },
  archivo: { type: String }, // URL del archivo en Cloudinary
  tipoArchivo: { type: String, enum: ["imagen", "pdf", "documento", "otro"], default: "otro" },
  tipo: { type: String, default: "general" }, // noticia, comunicado, etc.
  area: { type: String, enum: ["comunicacion", "formacion", "espiritualidad", "logistica", "animacion"], default: "comunicacion" },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fecha: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", postSchema);
