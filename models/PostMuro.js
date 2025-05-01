const mongoose = require("mongoose");

const postMuroSchema = new mongoose.Schema({
  contenido: { type: String, required: true },
  categoria: {
    type: String,
    enum: ["oracion", "reflexion", "otro"],
    default: "otro",
  },
  archivoUrl: [{ type: String }],
  tipoArchivo: { type: String, enum: ["imagen", "pdf", "documento", "texto"], default: "texto" },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PostMuro", postMuroSchema);
