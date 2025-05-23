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


router.post("/probar", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return res.status(400).json({ error: "Usuario sin tokens FCM registrados" });
    }

    await Promise.all(
      user.fcmTokens.map(token =>
        sendPush(
          token,
          "🔔 Notificación desde la app",
          "Esto es una prueba enviada desde la app",
          { link: "https://iam-animadores-client.vercel.app/" }
        )
      )
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error al enviar notificación:", err);
    res.status(500).json({ error: "Error interno", detalle: err.message });
  }
});



router.post("/guardar-token", verifyToken, async (req, res) => {

  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(userId, { fcmToken }, { new: true });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error al guardar token FCM:", err);
    res.status(500).json({ error: "Error interno", detalle: err.message });
  }
});



module.exports = router;
