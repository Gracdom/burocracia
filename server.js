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
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Inicializa Stripe con la clave secreta

// Ruta para proporcionar la clave pública de Stripe al frontend
app.get("/config-stripe", (req, res) => {
    res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY }); // Envía la clave pública al frontend
});

// Ruta para crear una sesión de pago con validación
app.post("/crear-sesion-pago", async (req, res) => {
    try {
        const { amount } = req.body;

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
                        currency: "eur",
                        product_data: { name: "Pago de trámite" },
                        unit_amount: Math.round(amount * 100), // Monto en céntimos
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        });

        // Devolver el ID de la sesión de pago
        res.json({ id: session.id });
    } catch (error) {
        console.error("❌ Error al crear la sesión de pago:", error.message);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
});

// Definir puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("✅ Servidor corriendo en el puerto:", PORT);
});