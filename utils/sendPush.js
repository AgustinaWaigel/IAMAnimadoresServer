const admin = require("firebase-admin");

let firebaseConfig;

if (process.env.FIREBASE_CONFIG_JSON) {
  firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
  if (firebaseConfig.private_key) {
    firebaseConfig.private_key = firebaseConfig.private_key.replace(/\\n/g, '\n');
  }
  console.log("✅ Usando configuración desde FIREBASE_CONFIG_JSON");
} else {
  firebaseConfig = require("../firebase-key.json");
  console.log("✅ Usando configuración local desde firebase-key.json");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
}

const sendPush = async (token, title, body, data = {}) => {
  const message = {
  token: fcmToken,
  notification: {
    title: "🔔 ¡Notificación de prueba!",
    body: "Esto es un mensaje de test desde tu backend.",
  },
  data: {
    link: "https://iam-animadores-client.vercel.app/",
  }
};


  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Notificación enviada:", response);
  } catch (err) {
    console.error("❌ Error enviando notificación:", err);
  }
};

module.exports = sendPush;
