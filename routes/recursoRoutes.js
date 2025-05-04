const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const Recurso = require("../models/Recurso");
const verifyToken = require("../middleware/auth");
const upload = require("../middleware/multer");
const { uploadFileToDrive } = require("../utils/googleDrive");

// 📤 Obtener recursos
router.get("/", async (req, res) => {
  try {
    const filtro = req.query.area ? { area: req.query.area } : {};
    const recursos = await Recurso.find(filtro);
    res.json(recursos);
  } catch (err) {
    console.error("❌ Error al obtener recursos:", err);
    res.status(500).json({ success: false, message: "Error al obtener recursos" });
  }
});

// 📅 Subir recursos con grupoId
router.post("/upload", verifyToken, upload.array("archivo"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No se recibieron archivos" });
    }

    const grupoId = uuidv4(); // ✨ ID para este conjunto de archivos
    const recursosGuardados = [];

    for (const file of req.files) {
      const extension = path.extname(file.originalname).toLowerCase();
      const mimeType = file.mimetype;
      const filePath = file.path;
      const fileName = Buffer.from(file.originalname, "latin1").toString("utf8");

      const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(extension);
      let tipoArchivo = req.body.tipoArchivo || "otro";

      if (!req.body.tipoArchivo) {
        if (isImage) tipoArchivo = "imagen";
        else if (extension === ".pdf") tipoArchivo = "pdf";
        else if ([".doc", ".docx"].includes(extension)) tipoArchivo = "documento";
      }

      const folderPath = `recursos/${req.body.edad || "general"}/${req.body.categoria || "otros"}`;
      const uploadedFile = await uploadFileToDrive(filePath, fileName, mimeType);
      const archivoUrl = uploadedFile.webViewLink;

      fs.unlinkSync(filePath);

      const nuevoRecurso = new Recurso({
        url: archivoUrl,
        edad: req.body.edad,
        categoria: req.body.categoria,
        nombre: fileName,
        objetivo: req.body.objetivo || "",
        uploadedBy: req.user.id,
        tipoArchivo,
        grupoId,
      });

      const guardado = await nuevoRecurso.save();
      recursosGuardados.push(guardado);
    }

    return res.status(201).json({ success: true, recursos: recursosGuardados });
  } catch (err) {
    console.error("❌ ERROR AL SUBIR RECURSO:", err);
    res.status(500).json({ success: false, message: "Error al subir recurso" });
  }
});

// 🗑️ Eliminar recurso
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const recurso = await Recurso.findById(req.params.id);
    if (!recurso) {
      return res.status(404).json({ success: false, message: "Recurso no encontrado" });
    }

    if (recurso.uploadedBy.toString() !== req.user.id && req.user.rol !== "admin") {
      return res.status(403).json({ success: false, message: "No autorizado para eliminar este recurso" });
    }

    await recurso.deleteOne();
    console.log("✅ Recurso eliminado:", recurso._id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al eliminar recurso:", err);
    res.status(500).json({ success: false, message: "Error al eliminar recurso" });
  }
});

// 📅 Obtener recursos por edad
router.get("/por-edad/:edad", async (req, res) => {
  try {
    const recursos = await Recurso.find({ edad: req.params.edad });
    res.json(recursos);
  } catch (err) {
    console.error("❌ Error al obtener recursos por edad:", err);
    res.status(500).json({ success: false, message: "Error al obtener recursos por edad" });
  }
});

module.exports = router;