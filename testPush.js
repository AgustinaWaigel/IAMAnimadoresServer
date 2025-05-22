const sendPush = require("./utils/sendPush"); // o la ruta donde tengas tu función
const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User"); // asegurate de tener este modelo

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("✅ Conectado a MongoDB");

  const user = await User.findOne({ username: "soledad.waigel" }); // cambialo por tu user

  if (!user || !user.fcmToken) {
    console.error("❌ Usuario o token FCM no encontrado");
    process.exit();
  }

  await sendPush(
    user.fcmToken,
    "🔔 ¡Notificación de prueba!",
    "Esto es un mensaje de test desde tu backend.",
    {
      link: "https://iam-animadores-client.vercel.app/",
    }
  );

  process.exit();
});
