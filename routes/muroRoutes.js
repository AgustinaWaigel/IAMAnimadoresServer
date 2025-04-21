const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const PostMuro = require("../models/PostMuro");
const verifyToken = require("../middleware/auth");
const { cloudinary } = require("../utils/cloudinaryStorage");
const { uploadFileToDrive } = require("../utils/googleDrive");

// 📥 Crear mensaje en el muro
router.post("/", verifyToken, upload.single("archivo"), async (req, res) => {
  try {
    const { contenido, categoria, tipoArchivo } = req.body;

    if (!contenido) {
      return res.status(400).json({ success: false, message: "El contenido es obligatorio" });
    }

    let archivoUrl = null;
    let tipoArchivoFinal = tipoArchivo || "texto";

    if (req.file && tipoArchivo !== "texto") {
      const filePath = req.file.path;
      const extension = path.extname(req.file.originalname).toLowerCase();
      const mimeType = req.file.mimetype;
      const folderPath = `muro/${categoria || "general"}`;

      console.log("🛠 Procesando archivo:", req.file.originalname);

      const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(extension);
      const isPdf = extension === ".pdf";
      const isWord = [".doc", ".docx"].includes(extension);

      // Validaciones:
      if (tipoArchivo === "imagen" && !isImage) {
        throw new Error("Seleccionaste imagen pero subiste otro tipo de archivo");
      }
      if (tipoArchivo === "pdf" && !isPdf) {
        throw new Error("Seleccionaste PDF pero el archivo no es un PDF");
      }
      if (tipoArchivo === "documento" && !isWord) {
        throw new Error("Seleccionaste Word pero el archivo no es .doc o .docx");
      }

      if (isImage) {
        // 📷 Subir imagen a Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
          folder: folderPath,
          resource_type: "image",
          use_filename: true,
          unique_filename: false,
        });
        archivoUrl = result.secure_url;
        tipoArchivoFinal = "imagen";
        console.log("✅ Imagen subida a Cloudinary:", archivoUrl);
      } else {
        // 📄 Subir documento a Google Drive
        const uploadedFile = await uploadFileToDrive(filePath, req.file.originalname, mimeType);
        archivoUrl = uploadedFile.webViewLink; // Usamos el link público
        console.log("✅ Archivo subido a Google Drive:", archivoUrl);

        // Tipo de archivo lo mantenemos como pdf, documento u otro
      }

      // 🧹 Borrar archivo temporal
      fs.unlinkSync(filePath);
      console.log("🧹 Archivo temporal borrado");
    }

    const nuevo = new PostMuro({
      contenido,
      categoria,
      archivoUrl,
      tipoArchivo: tipoArchivoFinal,
      autor: req.user.id,
    });

    const guardado = await nuevo.save();
    const completo = await guardado.populate("autor", "username foto");

    res.status(201).json({ success: true, post: completo });

  } catch (err) {
    console.error("❌ Error en subida de mensaje:", err);
    res.status(500).json({ success: false, message: err.message || "Error al crear mensaje" });
  }
});



// 📤 Obtener todos los mensajes del muro
// Backend: routes/muroRoutes.js
router.get("/", async (req, res) => {
  try {
    const mensajes = await PostMuro.find()
      .sort({ createdAt: -1 })
      .populate("autor", "username foto");

    res.json({
      success: true,
      posts: mensajes,  // 👈 MUY IMPORTANTE devolver así
    });

  } catch (err) {
    console.error("❌ Error al obtener mensajes:", err);
    res.status(500).json({ success: false, message: "Error al obtener mensajes" });
  }
});


// ❌ Borrar mensaje (solo el autor o admin)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await PostMuro.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Mensaje no encontrado" });
    }

    if (post.autor.toString() !== req.user.id && req.user.rol !== "admin") {
      return res.status(403).json({ success: false, message: "No autorizado para eliminar" });
    }

    await post.deleteOne();
    console.log("✅ Mensaje eliminado:", post._id);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Error al eliminar mensaje:", err);
    res.status(500).json({ success: false, message: "Error al eliminar mensaje" });
  }
});

// ✏️ Editar publicación del muro (solo autor o admin)
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

    console.log("✅ Mensaje actualizado:", actualizado._id);
    res.json({ success: true, post: actualizado });

  } catch (err) {
    console.error("❌ Error al actualizar mensaje:", err);
    res.status(500).json({ success: false, message: "Error al actualizar mensaje" });
  }
});

module.exports = router;
