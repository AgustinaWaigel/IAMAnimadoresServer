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
    from: `"IAM Animadores • Verificación" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html: `
      ${html}
      <hr />
      <p style="font-size: 0.85em; color: #777;">
        IAM Animadores<br/>
        https://iam-animadores-client.vercel.app
      </p>
    `,
    headers: {
      'X-Priority': '3',
      'X-Mailer': 'IAM App Mailer',
    },
  });
};


const sendVerificationEmail = (to, token) => {
  const url = `${process.env.BACKEND_URL}/api/auth/verify-email/${token}`;

  return sendEmail({
    to,
    subject: "Confirmá tu cuenta en IAM Animadores",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #b91c1c;">¡Bienvenida/o a IAM Animadores!</h2>
        <p>Gracias por registrarte en nuestra plataforma.</p>
        <p>Para comenzar, por favor confirmá tu dirección de correo electrónico haciendo clic en el siguiente botón:</p>
        <p style="text-align: center;">
          <a href="${url}" style="display: inline-block; background-color: #b91c1c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verificar cuenta
          </a>
        </p>
        <p>Si el botón no funciona, podés copiar y pegar el siguiente enlace en tu navegador:</p>
        <p style="word-break: break-all;">${url}</p>
        <hr />
        <p style="font-size: 0.9em; color: #777;">
          Este mensaje fue enviado automáticamente por IAM Animadores. Si no te registraste, podés ignorarlo.
        </p>
      </div>
    `,
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
