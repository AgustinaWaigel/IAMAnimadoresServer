const mongoose = require("mongoose");

const eventoSchema = new mongoose.Schema({
  title: String,
  start: Date,
  end: Date,
  color: String,
  descripcion: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Evento", eventoSchema);
