// routes/muroRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const PostMuro = require("../models/PostMuro");
const verifyToken = require("../middleware/auth");
const { cloudinary } = require("../utils/cloudinaryStorage");

// 📥 Crear mensaje en el muro
router.post("/", verifyToken, upload.single("archivo"), async (req, res) => {
  try {
    const { contenido, categoria } = req.body;

    if (!contenido) {
      return res.status(400).json({ success: false, message: "El contenido es obligatorio" });
    }

    let archivoUrl = null;
    let tipoArchivo = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "muro",
        resource_type: "auto",
      });
      archivoUrl = result.secure_url;
      tipoArchivo = result.resource_type === "image" ? "image" : "archivo";
    }

    const nuevo = new PostMuro({
      contenido,
      categoria,
      archivoUrl,
      tipoArchivo,
      autor: req.user.id,
    });

    await nuevo.save();
    const completo = await nuevo.populate("autor", "username foto");
    res.json({ success: true, post: completo });

  } catch (err) {
    console.error("❌ Error al crear mensaje:", err);
    res.status(500).json({ success: false, message: "Error al crear mensaje" });
  }
});


// 📤 Obtener todos los mensajes del muro
router.get("/", async (req, res) => {
  try {
    const mensajes = await PostMuro.find().sort({ fecha: -1 }).populate("autor", "username foto");
    res.json(mensajes);
  } catch (err) {
    console.error("❌ Error al obtener mensajes:", err);
    res.status(500).json({ success: false, message: "Error al obtener mensajes" });
  }
});

// ❌ Borrar mensaje (solo el autor o admin)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await PostMuro.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Mensaje no encontrado" });

    if (post.autor.toString() !== req.user.id && req.user.rol !== "admin") {
      return res.status(403).json({ success: false, message: "No autorizado" });
    }

    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al eliminar mensaje:", err);
    res.status(500).json({ success: false, message: "Error al eliminar mensaje" });
  }
});

/// ✏️ Editar publicación del muro
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { contenido } = req.body;
    if (!contenido) {
      return res.status(400).json({ success: false, message: "El contenido es obligatorio" });
    }

    const post = await PostMuro.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Publicación no encontrada" });
    }

    if (post.autor.toString() !== req.user.id && req.user.rol !== "admin") {
      return res.status(403).json({ success: false, message: "No autorizado para editar" });
    }

    post.contenido = contenido;
    await post.save();

    const actualizado = await post.populate("autor", "username foto");

    res.json({ success: true, post: actualizado });
  } catch (err) {
    console.error("❌ Error al actualizar mensaje:", err);
    res.status(500).json({ success: false, message: "Error al actualizar mensaje" });
  }
});





module.exports = router;
