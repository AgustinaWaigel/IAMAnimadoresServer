// routes/notificaciones.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const User = require("../models/User");
const sendPush = require("../utils/sendPush");


router.post("/token", verifyToken, async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});


router.post("/probar", async (req, res) => {
  try {
    const user = await User.findOne({ username: "soledad.waigel" });
    if (!user || !user.fcmToken) {
      return res.status(400).json({ error: "Usuario o token no encontrado" });
    }

    await sendPush(
      user.fcmToken,
      "🔔 Notificación desde la app",
      "Esto es una prueba enviada desde la app",
      { link: "https://iam-animadores-client.vercel.app/" }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error al enviar push:", err);
    res.status(500).json({ error: "Error interno", detalle: err.message });
  }
});



module.exports = router;
