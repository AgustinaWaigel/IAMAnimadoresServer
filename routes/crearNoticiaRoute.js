const express = require("express");
const multer = require("multer");
const slugify = require("slugify");
const { uploader } = require("cloudinary").v2;
const NoticiaPrueba = require("../models/pruebaNoticias");

const router = express.Router();

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Subida a Cloudinary
async function subirACloudinary(file) {
  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${b64}`;
  const res = await uploader.upload(dataURI, {
    folder: "noticias_animadores",
  });
  return res.secure_url;
}

// POST /api/crear-noticia
router.post(
  "/",
  upload.fields([
    { name: "portada", maxCount: 1 },
    { name: "imagenes" },
  ]),
  async (req, res) => {
    try {
      const { titulo, contenido } = req.body;
      const slug = slugify(titulo, { lower: true });

      const portadaFile = req.files?.portada?.[0];
      const portadaUrl = portadaFile ? await subirACloudinary(portadaFile) : null;

      const imagenesFiles = req.files?.imagenes || [];
      const imagenesUrls = await Promise.all(
        imagenesFiles.map((file) => subirACloudinary(file))
      );

      const noticia = new NoticiaPrueba({
        titulo,
        contenido,
        slug,
        portadaUrl,
        imagenes: imagenesUrls,
        creadoPor: req.user?._id,
      });

      await noticia.save();
      res.status(201).json(noticia);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al subir la noticia" });
    }
  }
);

// GET todas las noticias de prueba
router.get("/", async (req, res) => {
  try {
    const noticias = await NoticiaPrueba.find().sort({ fecha: -1 });
    res.json(noticias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener las noticias" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const noticia = await NoticiaPrueba.findOne({ slug: req.params.slug });
    if (!noticia) return res.status(404).json({ error: "Noticia no encontrada" });
    res.json(noticia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la noticia" });
  }
});



module.exports = router;
