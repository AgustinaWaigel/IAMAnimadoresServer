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
const crypto = require("crypto");

async function subirACloudinary(file) {
  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${b64}`;

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "noticias_animadores";

  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");

  const res = await uploader.upload(dataURI, {
    folder,
    timestamp,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY,
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

      if (!contenido) {
        return res.status(400).json({ error: "Falta el contenido" });
      }

      let contenidoParseado = [];
      try {
        contenidoParseado = JSON.parse(contenido);
      } catch (err) {
        return res.status(400).json({ error: "Contenido inválido (no es JSON)" });
      }

      const portadaFile = req.files?.portada?.[0];
      const portadaUrl = portadaFile ? await subirACloudinary(portadaFile) : null;

      const imagenesFiles = req.files?.imagenes || [];
      const imagenesUrls = await Promise.all(
        imagenesFiles.map((file) => subirACloudinary(file))
      );

      let imgIndex = 0;
      const contenidoFinal = contenidoParseado.map((bloque) => {
        if (bloque.tipo === "imagen") {
          const url = imagenesUrls[imgIndex];
          imgIndex++;
          if (!url) throw new Error("Cantidad de imágenes no coincide con los bloques de imagen.");
          return { tipo: "imagen", contenido: url };
        }
        return bloque;
      });


      const noticia = new NoticiaPrueba({
        titulo,
        slug,
        portadaUrl,
        imagenes: imagenesUrls,
        contenido: contenidoFinal,
        creadoPor: req.user?._id,
      });

      await noticia.save();
      res.status(201).json(noticia);
    } catch (err) {
      console.error("❌ Error al subir la noticia:", err);
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

// GET una noticia por ID (usado para editar)
router.get("/id/:id", async (req, res) => {
  try {
    const noticia = await NoticiaPrueba.findById(req.params.id);
    if (!noticia) {
      return res.status(404).json({ error: "Noticia no encontrada" });
    }
    res.json(noticia);
  } catch (err) {
    console.error("❌ Error al obtener noticia por ID:", err);
    res.status(500).json({ error: "Error al obtener la noticia" });
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

router.delete("/:id", async (req, res) => {
  try {
    const noticia = await NoticiaPrueba.findByIdAndDelete(req.params.id);
    if (!noticia) {
      return res.status(404).json({ success: false, message: "Noticia no encontrada" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al eliminar noticia:", err);
    res.status(500).json({ success: false, message: "Error al eliminar" });
  }
});

router.put("/:id", upload.fields([
  { name: "portada", maxCount: 1 },
  { name: "imagenes" }
]), async (req, res) => {
  try {
    console.log("📥 POST /crear-noticia");
    console.log("🔸 titulo:", req.body.titulo);
    console.log("🔸 contenido (raw):", req.body.contenido);
    console.log("🔸 files recibidos:", Object.keys(req.files || {}));
    console.log("🔸 portada:", req.files?.portada?.[0]?.originalname);
    console.log("🔸 imagenes:", req.files?.imagenes?.map(f => f.originalname));

    const noticia = await NoticiaPrueba.findById(req.params.id);
    if (!noticia) {
      return res.status(404).json({ success: false, message: "Noticia no encontrada" });
    }

    const { titulo, contenido } = req.body;
    if (titulo) {
      noticia.titulo = titulo;
      noticia.slug = slugify(titulo, { lower: true });
    }

    let contenidoParseado = [];
    try {
      contenidoParseado = JSON.parse(contenido || "[]");
    } catch (err) {
      return res.status(400).json({ success: false, message: "Contenido inválido" });
    }

    const portadaFile = req.files?.portada?.[0];
    if (portadaFile) {
      const portadaUrl = await subirACloudinary(portadaFile);
      noticia.portadaUrl = portadaUrl;
    }

    const imagenesFiles = req.files?.imagenes || [];
    const imagenesUrls = await Promise.all(
      imagenesFiles.map(file => subirACloudinary(file))
    );

    let imgIndex = 0;
    const contenidoFinal = contenidoParseado.map((bloque) => {
      if (bloque.tipo === "imagen") {
        const url = imagenesUrls[imgIndex];
        imgIndex++;
        return { tipo: "imagen", contenido: url };
      }
      return bloque;
    });

    noticia.contenido = contenidoFinal;
    await noticia.save();

    res.json({ success: true, noticia });

  } catch (err) {
    console.error("❌ Error al actualizar noticia:", err);
    res.status(500).json({ success: false, message: "Error al actualizar la noticia" });
  }
});

module.exports = router;
