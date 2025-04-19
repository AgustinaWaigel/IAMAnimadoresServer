const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const verifyToken = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { cloudinary } = require("../utils/cloudinaryStorage");
const fs = require("fs");
const Noticia = require("../models/Noticias"); // 👈 esta línea importa el modelo

// 📥 Crear comunicado (solo admin)
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("archivo"),
  async (req, res) => {
    try {
      const { titulo, contenido, tipo } = req.body;
      if (!titulo || !tipo)
        return res
          .status(400)
          .json({ success: false, message: "Faltan campos requeridos" });

      let archivoUrl = null;
      let tipoArchivo = null;

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "noticias",
          resource_type: "auto",
        });
        archivoUrl = result.secure_url;
        tipoArchivo = result.resource_type === "image" ? "image" : "archivo";
      }

      const noticia = new Noticia({
        titulo: req.body.titulo,
        contenido: req.body.contenido || "",
        tipo: req.body.tipo,
        archivoUrl,
        tipoArchivo,
        autor: req.user.id,
      });

      await noticia.save();

      res.json({ success: true, noticia });
    } catch (err) {
      console.error("❌ Error al subir noticia:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al subir noticia" });
    }
  }
);

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
