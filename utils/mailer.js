const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
});

// Reutilizable para cualquier tipo de email
const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"IAM Animadores" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};

const sendVerificationEmail = (to, token) => {
  const url = `${process.env.BACKEND_URL}/api/auth/verify-email/${token}`;

  return sendEmail({
    to,
    subject: "Verificá tu correo ✉️",
    html: `<p>Gracias por registrarte. Hacé clic para verificar tu correo:</p>
           <a href="${url}">${url}</a>`,
  });
};

const sendResetPasswordEmail = (to, token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  return sendEmail({
    to,
    subject: "Recuperación de contraseña 🔐",
    html: `<p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p>
           <a href="${url}">${url}</a>
           <p>Este enlace expira en 1 hora.</p>`,
  });
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
