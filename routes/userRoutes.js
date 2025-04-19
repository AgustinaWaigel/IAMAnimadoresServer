const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyToken = require("../middleware/auth");
const multer = require("multer");
const hasRole = require("../middleware/hasRole");
const upload = multer({ dest: "uploads/" });

router.get("/check-username", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ disponible: false });

  try {
    const existe = await User.findOne({ username });
    res.json({ disponible: !existe });
  } catch (err) {
    console.error("❌ Error al verificar username:", err);
    res.status(500).json({ disponible: false });
  }
});

router.get("/check-email", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ disponible: false });

  try {
    const existe = await User.findOne({ email });
    res.json({ disponible: !existe });
  } catch (err) {
    console.error("❌ Error al verificar email:", err);
    res.status(500).json({ disponible: false });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al obtener usuario" });
  }
});

router.post("/upload-profile-pic", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.filename;
    const userId = req.user.id;
    await User.findByIdAndUpdate(userId, { profilePic: filePath });
    res.json({ success: true, filename: filePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al subir imagen" });
  }
});

// Ver todos los usuarios (solo admin)
router.get("/usuarios", verifyToken, hasRole("admin"), async (req, res) => {
  const usuarios = await User.find().select("-password -emailVerificationToken");
  res.json(usuarios);
});


// Cambiar rol de un usuario (solo admin)
router.put("/usuarios/:id/rol", verifyToken, hasRole("admin"), async (req, res) => {
  try {
    const { rol } = req.body;
    const actualizado = await User.findByIdAndUpdate(req.params.id, { rol }, { new: true });
    res.json({ success: true, usuario: actualizado });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al cambiar rol" });
  }
});

// 🧾 Obtener todos los usuarios (solo admin)
router.get("/usuarios", verifyToken, hasRole("admin"), async (req, res) => {
  try {
    const usuarios = await User.find().select("-password -emailVerificationToken");
    res.json({ success: true, usuarios });
  } catch (err) {
    console.error("❌ Error al obtener usuarios:", err);
    res.status(500).json({ success: false, message: "Error al obtener usuarios" });
  }
});

// 🔄 Cambiar rol de usuario (solo admin)
router.put("/usuarios/:id/rol", verifyToken, hasRole("admin"), async (req, res) => {
  try {
    const { rol } = req.body;
    if (!["admin", "usuario"].includes(rol)) {
      return res.status(400).json({ success: false, message: "Rol inválido" });
    }

    const usuario = await User.findByIdAndUpdate(req.params.id, { rol }, { new: true }).select("-password");
    res.json({ success: true, usuario });
  } catch (err) {
    console.error("❌ Error al actualizar rol:", err);
    res.status(500).json({ success: false, message: "Error al actualizar rol" });
  }
});



module.exports = router;
