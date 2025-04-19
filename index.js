require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const noticiaRoutes = require("./routes/noticiaRoutes");
const allowedOrigins = [
  "http://localhost:5173", // para desarrollo local
  "https://iam-animadores-client.vercel.app/", // tu frontend en Vercel
];

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        "http://localhost:5173",
        "https://iam-animadores-client.vercel.app/"
      ];
      if (!origin || allowed.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  console.log("👉 Headers recibidos:", req.headers.authorization);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas separadas
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const recursoRoutes = require("./routes/recursoRoutes");
const eventoRoutes = require("./routes/eventoRoutes");
const comunicacionRoutes = require("./routes/comunicacionRoutes");
const muroRoutes = require("./routes/muroRoutes");
const fs = require("fs");
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// Usar rutas
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/recursos", recursoRoutes); // ✅ ahora va bien
app.use("/api/eventos", eventoRoutes);
app.use("/api/noticias", noticiaRoutes);
app.use("/api/comunicacion", comunicacionRoutes);
app.use("/api/muro", muroRoutes);


// Ruta raíz
app.get("/", (req, res) => {
  res.send("API funcionando ✅");
});

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error de conexión a MongoDB:", err);
  });
