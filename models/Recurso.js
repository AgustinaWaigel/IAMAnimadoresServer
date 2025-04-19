const mongoose = require('mongoose');

const recursoSchema = new mongoose.Schema({
  url: String,
  nombre: String,
  edad: String,
  categoria: String,
  objetivo: String, // 👈 nuevo campo
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Recurso', recursoSchema);
