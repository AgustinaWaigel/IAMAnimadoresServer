require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const sendPush = require("./utils/sendPush");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ fcmToken: { $exists: true, $ne: null } });

  if (!user) {
    console.log("❌ No hay usuarios con token FCM");
    return;
  }

  console.log("🔔 Enviando notificación a:", user.username || user.email);
await sendPush(
  user.fcmToken,
  "📚 Nuevo recurso disponible",
  "Entrá a ver el material para el próximo encuentro",
  { link: "https://localhost:5173/recursos" }
);


  process.exit();
})();
