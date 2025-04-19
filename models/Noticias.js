const mongoose = require("mongoose");

const noticiaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  contenido: { type: String }, // ✅ debe ser opcional o enviado siempre
  tipo: { type: String, enum: ["noticia", "recurso"], required: true },
  archivoUrl: { type: String },
  tipoArchivo: { type: String },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Noticia", noticiaSchema);
