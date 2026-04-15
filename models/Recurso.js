const mongoose = require('mongoose');

const EDADES_RECURSO = [
  'jardin',
  '1er y 2do grado',
  '3er y 4to grado',
  '5to y 6to grado',
  'adolescencia',
  'general',
];

const recursoSchema = new mongoose.Schema({
  url: String,
  nombre: String,
  edad: {
    type: String,
    enum: EDADES_RECURSO,
    default: 'general',
  },
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

module.exports = {
  Recurso: mongoose.model('Recurso', recursoSchema),
  EDADES_RECURSO,
};
