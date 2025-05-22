const admin = require("firebase-admin");

// Detecta si estamos en producción o desarrollo
let firebaseConfig;

if (process.env.FIREBASE_CONFIG_JSON) {
  // 🌐 Producción (Render)
  firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG_JSON);

  // 🔧 Corrige el formato del private_key
  if (firebaseConfig.private_key) {
    firebaseConfig.private_key = firebaseConfig.private_key.replace(/\\n/g, '\n');
  }

  console.log("✅ Usando configuración desde FIREBASE_CONFIG_JSON");
} else {
  // 🧪 Local
  firebaseConfig = require("../firebase-key.json");
  console.log("✅ Usando configuración local desde firebase-key.json");
}

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
}

// Función para enviar notificación
const sendPush = async (token, title, body, data = {}) => {
  const message = {
    notification: {
      title,
      body,
    },
    token,
    data: {
      link: "https://tu-app.vercel.app/", // opcional
      ...data,
    },
  };


  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Notificación enviada:", response);
  } catch (err) {
    console.error("❌ Error enviando notificación:", err);
  }
};

module.exports = sendPush;
