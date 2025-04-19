// routes/postRoutes.js
const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const verifyToken = require("../middleware/auth");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { cloudinary } = require("../utils/cloudinaryStorage");

// Crear publicación (comunicado, noticia, etc.)
router.post("/", verifyToken, upload.single("archivo"), async (req, res) => {
  try {
    let archivoUrl = null;
    let tipoArchivo = "otro"; // ✅ lo definimos de entrada

    if (req.file) {
      const path = require("path");
      const { uploadFileToDrive } = require("../utils/googleDrive");
      const extension = path.extname(req.file.originalname).toLowerCase(); // .jpg, .pdf, etc.
      const filename = path.basename(req.file.originalname, extension);
      const mimeType = req.file.mimetype;
      const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(extension);

      // Definir tipoArchivo según extensión
      if (isImage) {
        tipoArchivo = "imagen";
      } else if (extension === ".pdf") {
        tipoArchivo = "pdf";
      } else if ([".doc", ".docx"].includes(extension)) {
        tipoArchivo = "documento";
      }

      const fs = require("fs");

      if (isImage) {
        // ✅ Subir imagen a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: `posts/${req.body.area || "general"}`,
          resource_type: "image",
          public_id: filename,
          use_filename: true,
          unique_filename: false,
        });
        archivoUrl = result.secure_url;
        console.log("✅ Imagen subida a Cloudinary:", archivoUrl);
      } else {
        // ✅ Subir documento a Drive
        const uploaded = await uploadFileToDrive(req.file.path, req.file.originalname, mimeType);
        archivoUrl = uploaded.webViewLink;
        console.log("✅ Documento subido a Drive:", archivoUrl);
      }

      // 🧹 Borrar archivo temporal
      fs.unlinkSync(req.file.path);
    }

    const nuevo = new Post({
      titulo: req.body.titulo,
      contenido: req.body.contenido,
      archivo: archivoUrl,
      tipoArchivo, // ✅ corregido, usamos el detectado
      tipo: req.body.tipo || "general",
      area: req.body.area || "comunicacion",
      autor: req.user.id,
    });
    
    

    await nuevo.save();
    const postCompleto = await nuevo.populate("autor", "username");
    res.json({ success: true, post: postCompleto });

  } catch (err) {
    console.error("❌ Error al crear post:", err);
    res.status(500).json({ success: false, message: "Error al crear publicación" });
  }
});



// Obtener publicaciones (filtradas por área opcional)
router.get("/", async (req, res) => {
  try {
    const filtro = req.query.area ? { area: req.query.area } : {}; // <- Esto ya lo tenías!
    const posts = await Post.find(filtro)
      .populate("autor", "username")
      .sort({ fecha: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener publicaciones" });
  }
});

// Eliminar publicación
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post no encontrado" });

        const autorId = post.autor._id ? post.autor._id.toString() : post.autor.toString();
        if (autorId !== req.user.id) {
          return res.status(403).json({ success: false, message: "No autorizado" });
        }
        

    await post.deleteOne();
    res.json({ success: true, message: "Post eliminado" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al eliminar post" });
  }
});

module.exports = router;
