require("dotenv").config();
const enviarWhatsApp = require("./utils/enviarWhatsApp");

(async () => {
  try {
    await enviarWhatsApp(
      "5493435449137", // tu número con código país
      "noticia_publicada", // nombre exacto de la plantilla en Meta
      [
        "¡Ya se aprobó la plantilla!", // {{1}}
        new Date().toLocaleDateString("es-AR"), // {{2}} fecha
        "https://iam-animadores-client.vercel.app/noticias" // {{3}} link
      ]
    );
    console.log("✅ Mensaje enviado correctamente");
  } catch (err) {
    console.error("❌ Error al enviar mensaje:", err.message);
  }
})();
