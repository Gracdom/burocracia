require("dotenv").config(); // Cargar variables de entorno
const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Verificar que las variables de entorno estén definidas
if (!process.env.STRIPE_SECRET_KEY || !process.env.FRONTEND_URL || !process.env.STRIPE_PUBLIC_KEY) {
    console.error("❌ ERROR: Faltan variables de entorno. Verifica tu archivo .env");
    console.error("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✅" : "❌");
    console.error("STRIPE_PUBLIC_KEY:", process.env.STRIPE_PUBLIC_KEY ? "✅" : "❌");
    console.error("FRONTEND_URL:", process.env.FRONTEND_URL ? "✅" : "❌");
    console.error("STRIPE_WEBHOOK_SECRET:", process.env.STRIPE_WEBHOOK_SECRET ? "✅" : "❌");
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Inicializa Stripe con la clave secreta

// Middleware para manejar errores globales
function errorHandler(err, req, res, next) {
    console.error("❌ Error global:", err.message);
    res.status(500).json({
        error: "Error interno del servidor",
        details: err.message,
    });
}
app.use(errorHandler);

// Ruta de prueba para verificar que el servidor está corriendo
app.get("/", (req, res) => {
    res.send("🚀 API de pagos funcionando correctamente.");
});

// Ruta para proporcionar la clave pública de Stripe al frontend
app.get("/config-stripe", (req, res) => {
    res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY }); // Envía la clave pública al frontend
});

// Ruta para crear una sesión de pago con validación
app.post("/crear-sesion-pago", async (req, res) => {
    try {
        const { amount, currency = "eur", description = "Pago de trámite" } = req.body;

        // Validar el monto
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Monto inválido" });
        }

        // Crear la sesión de pago en Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: { name: description },
                        unit_amount: Math.round(amount * 100), // Monto en céntimos
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/success`, // URL de éxito
            cancel_url: `${process.env.FRONTEND_URL}/cancel`, // URL de cancelación
        });

        // Devolver el ID de la sesión de pago
        res.json({ id: session.id });
    } catch (error) {
        console.error("❌ Error al crear la sesión de pago:", error.message);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message, // Enviar detalles del error al frontend
        });
    }
});

// Ruta para manejar webhooks de Stripe
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
        // Verificar el webhook
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("⚠️  Error verificando el webhook:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejo de eventos de Stripe
    switch (event.type) {
        case "checkout.session.completed":
            console.log("✅ Pago completado:", event.data.object);
            // Aquí puedes actualizar tu base de datos
            break;
        case "payment_intent.succeeded":
            console.log("✅ Pago exitoso:", event.data.object);
            break;
        default:
            console.log(`🔔 Evento recibido: ${event.type}`);
    }

    res.json({ received: true });
});

// Definir puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("✅ Servidor corriendo en el puerto:", PORT);
    console.log("🔍 STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "Cargada" : "No cargada");
    console.log("🔍 STRIPE_PUBLIC_KEY:", process.env.STRIPE_PUBLIC_KEY ? "Cargada" : "No cargada");
    console.log("🔍 FRONTEND_URL:", process.env.FRONTEND_URL);
    console.log("🔍 STRIPE_WEBHOOK_SECRET:", process.env.STRIPE_WEBHOOK_SECRET ? "Cargada" : "No cargada");
});