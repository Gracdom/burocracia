require("dotenv").config(); // Cargar variables de entorno

const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Verificar que las variables de entorno estén definidas
if (!process.env.STRIPE_SECRET_KEY || !process.env.FRONTEND_URL) {
    console.error("❌ ERROR: Faltan variables de entorno. Verifica tu archivo .env");
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Ruta de prueba para verificar que el servidor está corriendo
app.get("/", (req, res) => {
    res.send("🚀 API de pagos funcionando correctamente.");
});

// Ruta para crear sesión de pago con validación
app.post("/crear-sesion-pago", async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Monto inválido" });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "eur",
                    product_data: { name: "Pago de trámite" },
                    unit_amount: parseInt(amount), // Convertir a entero para evitar errores
                },
                quantity: 1,
            }],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error("❌ Error al crear la sesión de pago:", error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Definir puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));
console.log("🔍 STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "Cargada" : "No cargada");
console.log("🔍 FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("🔍 PORT:", process.env.PORT);
