const mongoose = require('mongoose');

const recursoSchema = new mongoose.Schema({
  url: String,
  nombre: String,
  edad: String,
  categoria: String,
  objetivo: String,
  tipoArchivo: {
    type: String,
    enum: ["imagen", "pdf", "documento", "otro"],
    default: "otro",
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  grupoId: String, // 👈 para agrupar recursos subidos juntos
});

module.exports = mongoose.model('Recurso', recursoSchema);
