// routes/notificaciones.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const User = require("../models/User");

router.post("/token", verifyToken, async (req, res) => {
  const { token } = req.body;
  try {
    await User.findByIdAndUpdate(req.user.id, { fcmToken: token });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
