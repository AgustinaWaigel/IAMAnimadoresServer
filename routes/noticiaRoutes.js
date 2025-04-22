const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const verifyToken = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { cloudinary } = require("../utils/cloudinaryStorage");
const fs = require("fs");
const Noticia = require("../models/Noticias"); // 👈 esta línea importa el modelo
const path = require("path");
const { uploadFileToDrive } = require("../utils/googleDrive");


// 📥 Crear comunicado (solo admin)
router.post("/", verifyToken, isAdmin, upload.single("archivo"), async (req, res) => {
  try {
    const { titulo, contenido, tipo, tipoArchivo: tipoArchivoManual } = req.body;

    if (!titulo || !tipo) {
      return res.status(400).json({ success: false, message: "Faltan campos requeridos" });
    }

    let archivoUrl = null;
    let tipoArchivo = tipoArchivoManual || "texto";

    if (req.file) {
      const filePath = req.file.path;
      const extension = path.extname(req.file.originalname).toLowerCase();
      const mimeType = req.file.mimetype;

      const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(extension);
      const isPdf = extension === ".pdf";
      const isWord = [".doc", ".docx"].includes(extension);

      if (isImage) {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: "noticias",
          resource_type: "image",
          use_filename: true,
          unique_filename: false,
        });
        archivoUrl = result.secure_url;
        tipoArchivo = "imagen";
      } else {
        const uploadedFile = await uploadFileToDrive(filePath, req.file.originalname, mimeType);
        archivoUrl = uploadedFile.webViewLink; // link público
        if (!tipoArchivoManual) {
          tipoArchivo = isImage
            ? "imagen"
            : isPdf
            ? "pdf"
            : isWord
            ? "documento"
            : "otro";
        }
        
      }

      fs.unlinkSync(filePath); // 🔥 borrar temporal
    }

    const noticia = new Noticia({
      titulo,
      contenido,
      tipo,
      archivoUrl,
      tipoArchivo,
      autor: req.user.id,
    });

    await noticia.save();

    res.json({ success: true, noticia });

  } catch (err) {
    console.error("❌ Error al subir noticia:", err);
    res.status(500).json({ success: false, message: err.message || "Error al subir noticia" });
  }
});

// 📤 Obtener todos los comunicados
router.get("/", async (req, res) => {
  try {
    const noticias = await Noticia.find()
      .sort({ createdAt: -1 })
      .populate("autor", "username");
    res.json(noticias);
  } catch (err) {
    console.error("❌ Error al obtener noticias:", err);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener noticias" });
  }
});

// ❌ Borrar comunicado (solo admin)
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const noticia = await Noticia.findById(req.params.id);

    if (!noticia) {
      return res
        .status(404)
        .json({ success: false, message: "Noticia no encontrada" });
    }

    await noticia.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al borrar noticia:", err);
    res
      .status(500)
      .json({ success: false, message: "Error al borrar noticia" });
  }
});

// ✅ Ruta para actualizar una noticia
router.put("/:id", verifyToken, upload.single("archivo"), async (req, res) => {
  try {
    const noticia = await Noticia.findById(req.params.id);

    if (!noticia) {
      return res
        .status(404)
        .json({ success: false, message: "Noticia no encontrada" });
    }

    // Actualizar campos si se envían nuevos
    noticia.titulo = req.body.titulo || noticia.titulo;
    noticia.contenido = req.body.contenido || noticia.contenido;
    noticia.tipo = req.body.tipo || noticia.tipo;

    // Si suben un nuevo archivo, actualizamos el archivoUrl
    if (req.file) {
      noticia.archivoUrl = `/uploads/${req.file.filename}`;
    }

    await noticia.save();

    res.json({ success: true, noticia });
  } catch (err) {
    console.error("❌ Error al actualizar noticia:", err);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

module.exports = router;
