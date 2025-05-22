// routes/notificaciones.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const User = require("../models/User");
const sendPush = require("../utils/sendPush");


router.post("/token", verifyToken, async (req, res) => {
  const { token } = req.body;
  try {
    await User.findByIdAndUpdate(req.user.id, { fcmToken: token });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

router.post("/probar", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.fcmToken) {
      return res.status(400).json({ success: false, message: "Token FCM no encontrado" });
    }

    await sendPush(
      user.fcmToken,
      "🔔 Notificación de prueba",
      "Si ves esto, ¡tu sistema funciona!",
      { link: "https://iam-animadores-client.vercel.app/" }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error enviando notificación:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
