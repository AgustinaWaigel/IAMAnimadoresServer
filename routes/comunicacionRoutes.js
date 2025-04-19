const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const Post = require("../models/Post");
const verifyToken = require("../middleware/auth");
const requireAdmin = require("../middleware/isAdmin");
const { cloudinary } = require("../utils/cloudinaryStorage");
const { uploadFileToDrive } = require("../utils/googleDrive"); // 👈 nuevo import

// 📤 Obtener comunicados (todos pueden ver)
router.get("/", async (req, res) => {
  try {
    const comunicados = await Post.find({ area: "comunicacion" })
      .sort({ fecha: -1 })
      .populate("autor", "username");
    res.json(comunicados);
  } catch (err) {
    console.error("❌ Error al obtener comunicados:", err);
    res.status(500).json({ success: false, message: "Error al obtener comunicados" });
  }
});

// 📥 Crear comunicado (solo admin)
router.post("/", verifyToken, requireAdmin, upload.single("archivo"), async (req, res) => {
  try {
    console.log("🟡 Body recibido:", req.body);
    console.log("📎 Archivo recibido:", req.file);

    let archivoUrl = null;

    if (req.file) {
      const extension = path.extname(req.file.originalname).toLowerCase();
      const mimeType = req.file.mimetype;
      const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(extension);

      const filePath = req.file.path;
      const fileName = req.file.originalname;

      if (isImage) {
        // 📷 Subir imagen a Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
          folder: "comunicados",
          resource_type: "image",
          use_filename: true,
          unique_filename: false,
        });
        archivoUrl = result.secure_url;
        console.log("✅ Imagen subida a Cloudinary:", archivoUrl);
      } else {
        // 📄 Subir archivo a Google Drive
        const uploadedFile = await uploadFileToDrive(filePath, fileName, mimeType);
        archivoUrl = uploadedFile.webViewLink; // usamos la vista pública
        console.log("✅ Archivo subido a Google Drive:", archivoUrl);
      }

      // 🧹 Borrar archivo temporal
      fs.unlinkSync(filePath);
    }

    const comunicado = new Post({
      titulo: req.body.titulo,
      contenido: req.body.contenido || "",
      area: "comunicacion",
      archivo: archivoUrl,
      autor: req.user.id,
    });

    const guardado = await comunicado.save();
    console.log("✅ Comunicado guardado:", guardado);
    res.status(201).json(guardado);
  } catch (err) {
    console.error("❌ ERROR AL SUBIR COMUNICADO:", err);
    res.status(500).json({ success: false, message: "Error al subir comunicado" });
  }
});

// 🗑️ Eliminar comunicado (solo admin)
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const eliminado = await Post.findByIdAndDelete(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ success: false, message: "Comunicado no encontrado" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al eliminar comunicado:", err);
    res.status(500).json({ success: false, message: "Error al eliminar comunicado" });
  }
});

module.exports = router;
