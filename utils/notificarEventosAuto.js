const cron = require("node-cron");
const Evento = require("../models/Evento");
const User = require("../models/User");
const { format } = require("date-fns");
const { es } = require("date-fns/locale");
const enviarWhatsApp = require("./enviarWhatsapp");

// Corre todos los días a las 8 AM
cron.schedule("0 8 * * *", async () => {
    const hoy = new Date();
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);
    mañana.setHours(0, 0, 0, 0);

    const pasado = new Date(mañana);
    pasado.setDate(manana.getDate() + 1);

    const eventos = await Evento.find({
        start: { $gte: mañana, $lt: pasado },
    });

    if (!eventos.length) return;

    const usuarios = await User.find({ phone: { $exists: true } }); // necesitás que tengan teléfono

    for (const evento of eventos) {
        const fecha = format(new Date(evento.start), "eeee d 'de' MMMM", { locale: es });
        const hora = format(new Date(evento.start), "HH:mm");

        await enviarWhatsApp(
            "5493435449137", // tu número con formato completo
            "recordatorio_evento", // nombre de la plantilla en Meta
            ["Agus", evento.title, `${fecha} – ${hora}`]
        );
    }

});
