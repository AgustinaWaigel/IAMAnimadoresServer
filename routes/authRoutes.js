const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const verifyToken = require("../middleware/auth");
const { sendVerificationEmail, sendResetPasswordEmail } = require("../utils/mailer");


// REGISTRO
router.post("/register", async (req, res) => {
  const { username, nombre, apellido, email, password } = req.body;

  if (!username || !nombre || !apellido || !email || !password) {
    return res.status(400).json({ success: false, message: "Faltan campos obligatorios." });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.",
    });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.json({ success: false, message: "El correo electrónico ya está registrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const newUser = new User({
      username,
      nombre,
      apellido,
      email,
      password: hashedPassword,
      rol: "usuario",
      emailVerified: false,
      emailVerificationToken: verificationToken,
    });

    await newUser.save();
    await sendVerificationEmail(email, verificationToken);

    res.json({ success: true, message: "Usuario registrado. Verificá tu email para continuar." });
  } catch (err) {
    console.error("❌ Error al registrar:", err);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ success: false, message: "Usuario no encontrado" });

    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: "Debés verificar tu correo electrónico antes de iniciar sesión.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ success: false, message: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id, username: user.username, rol: user.rol }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      success: true,
      message: "Login exitoso ✅",
      token,
      user: {
        _id: user._id,
        username: user.username,
        rol: user.rol,
        email: user.email,
        avatarUrl: user.avatarUrl || null,
        avatarDesc: user.avatarDesc || "",
      },
    });
    
  } catch (err) {
    console.error("🔥 Error al iniciar sesión:", err);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});
// VERIFICACIÓN DE EMAIL
router.get("/verify-email/:token", async (req, res) => {
  try {
    const token = req.params.token;
    console.log("📨 Token recibido:", token);

    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      console.log("❌ No se encontró usuario con ese token.");
      return res.status(400).send("Token inválido o expirado");
    }

    user.emailVerificationToken = undefined;
    user.emailVerified = true;
    await user.save();

    console.log("✅ Email verificado correctamente.");

    res.redirect("https://iam-animadores.vercel.app/login?verificado=true");
  } catch (err) {
    console.error("❌ Error al verificar email:", err);
    res.status(500).send("Error interno al verificar el email");
  }
});

// OLVIDÉ MI CONTRASEÑA
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email no registrado" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    
    // 🔐 Guardar token en el usuario
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hora
    await user.save();
    
    await sendResetPasswordEmail(email, token);
    

    res.json({ success: true, message: "📩 Correo enviado con instrucciones" });
  } catch (err) {
    console.error("❌ Error al enviar email de recuperación:", err);
    res.status(500).json({ message: "Error al enviar el correo" });
  }
});


// REESTABLECER CONTRASEÑA
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { nuevaPassword } = req.body;

  try {
    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: "Token inválido o vencido" });

    user.password = await bcrypt.hash(nuevaPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("❌ Error al restablecer contraseña:", err);
    res.status(500).json({ success: false, message: "Error interno" });
  }
});

// PERFIL ACTUAL
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al obtener usuario" });
  }
});


router.put("/avatar", verifyToken, async (req, res) => {
  const { avatarUrl, avatarDesc } = req.body;

  if (!avatarUrl || !avatarDesc) {
    return res.status(400).json({ success: false, message: "Datos incompletos" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl, avatarDesc },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Error al actualizar avatar:", err);
    res.status(500).json({ success: false, message: "Error interno" });
  }
});

router.put('/update-avatar', verifyToken, async (req, res) => {
  try {
    const { avatarUrl, avatarDesc } = req.body;
    const user = await User.findById(req.user.id);
    user.avatarUrl = avatarUrl;
    user.avatarDesc = avatarDesc;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ Error al actualizar avatar:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar avatar' });
  }
});





module.exports = router;