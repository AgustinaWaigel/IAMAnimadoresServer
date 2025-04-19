const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const Recurso = require("../models/Recurso");
const verifyToken = require("../middleware/auth");
const { cloudinary } = require("../utils/cloudinaryStorage");

// Subir PDF
router.post("/upload-pdf", verifyToken, upload.single("archivo"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `pdfs/${req.body.edad}/${req.body.categoria}`,
      resource_type: "raw",
    });

    const newRecurso = new Recurso({
      url: result.secure_url,
      edad: req.body.edad,
      categoria: req.body.categoria,
      nombre: req.file.originalname,
      objetivo: req.body.objetivo, // 👈 acá
      uploadedBy: req.user.id,
    });
    

    await newRecurso.save();
    res.json({ success: true, recurso: newRecurso });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al subir PDF" });
  }
});

router.get("/", async (req, res) => {
  try {
    const filtro = req.query.area ? { area: req.query.area } : {};
    const recursos = await Recurso.find(filtro);
    res.json(recursos);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al obtener recursos" });
  }
});


// Obtener recursos por edad
router.get("/por-edad/:edad", async (req, res) => {
  try {
    const recursos = await Recurso.find({ edad: req.params.edad });
    res.json(recursos);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al obtener recursos" });
  }
});

// Eliminar recurso
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const recurso = await Recurso.findById(req.params.id);
    if (!recurso) return res.status(404).json({ success: false, message: "Recurso no encontrado" });

    if (recurso.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "No autorizado" });
    }

    await recurso.deleteOne();
    res.json({ success: true, message: "Recurso eliminado" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al eliminar recurso" });
  }
});

module.exports = router;
