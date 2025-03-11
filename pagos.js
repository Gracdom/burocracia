// Agrega SweetAlert2 desde un CDN en tu archivo HTML
// <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

// Importar el SDK de Stripe
import { loadStripe } from '@stripe/stripe-js';

// Función para cargar la clave pública de Stripe desde el backend
async function cargarStripePublicKey() {
    try {
        const response = await fetch('/config-stripe'); // Llama al endpoint del backend
        const data = await response.json();
        return data.publicKey; // Retorna la clave pública
    } catch (error) {
        console.error("Error al cargar la clave pública de Stripe:", error.message);
        throw error;
    }
}

// Configura Stripe con la clave pública obtenida del backend
let stripe;
cargarStripePublicKey().then((publicKey) => {
    stripe = Stripe(publicKey); // Inicializa Stripe con la clave pública
}).catch((error) => {
    console.error("No se pudo inicializar Stripe:", error.message);
});

// Crea una instancia de Elements
const elements = stripe.elements();

// Crea y monta los elementos de Stripe
const cardNumber = elements.create('cardNumber', {
  placeholder: 'Número de tarjeta',
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a'
    }
  }
});
cardNumber.mount('#card-number');

const cardExpiry = elements.create('cardExpiry', {
  placeholder: 'MM/AA',
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d'
    }
  }
});
cardExpiry.mount('#card-expiry');

const cardCvc = elements.create('cardCvc', {
  placeholder: 'CVC',
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d'
    }
  }
});
cardCvc.mount('#card-cvc');

// Maneja errores de la tarjeta
const displayError = document.getElementById('card-errors');
cardNumber.on('change', (event) => {
  displayError.textContent = event.error ? event.error.message : '';
});

// Función para mostrar el resumen del trámite
function mostrarResumen() {
  const total = parseFloat(document.getElementById("total").textContent.replace(" €", ""));
  document.getElementById("pagoTotal").textContent = total.toFixed(2);
  document.getElementById("pagoTotalBoton").textContent = total.toFixed(2);
}

// Función para validar los campos del formulario
function validarCampos() {
  const nombreApellidos = document.getElementById("nombreApellidos").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const correo = document.getElementById("correo").value.trim();

  if (!nombreApellidos || !telefono || !correo) {
    Swal.fire({
      icon: "error",
      title: "Campos incompletos",
      text: "Por favor, completa todos los campos del formulario de pago.",
    });
    return false;
  }

  if (!/^\d{9}$/.test(telefono)) {
    Swal.fire({
      icon: "error",
      title: "Teléfono inválido",
      text: "El teléfono debe ser un número de 9 dígitos.",
    });
    return false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    Swal.fire({
      icon: "error",
      title: "Correo inválido",
      text: "Por favor, introduce una dirección de correo válida.",
    });
    return false;
  }

  return true;
}

// Función para manejar el envío del formulario de pago
document.getElementById("formPago").addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!validarCampos()) return;

  const total = parseFloat(document.getElementById("pagoTotal").textContent);

  try {
    const { token, error } = await stripe.createToken(cardNumber, {
      name: document.getElementById("nombreApellidos").value.trim(),
    });

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error en la tarjeta",
        text: error.message,
      });
      return;
    }

    const response = await fetch("/procesar-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        token: token.id, 
        amount: Math.round(total * 100),
        currency: 'eur',
        description: `Pago de trámite - ${document.getElementById("nombreApellidos").value.trim()}`
      }),
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Pago exitoso",
        text: "Tu pago se ha procesado correctamente.",
        confirmButtonText: 'Entendido',
        allowOutsideClick: false
      }).then(() => {
        window.location.href = '/success'; // Redirección tras pago exitoso
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error en el pago",
        text: result.error || "Hubo un problema al procesar el pago.",
      });
    }
  } catch (error) {
    console.error("Error al procesar el pago:", error.message);
    Swal.fire({
      icon: "error",
      title: "Error al procesar el pago",
      text: error.message || "Hubo un problema al realizar el pago. Por favor, inténtalo más tarde.",
    });
  }
});

// Función para actualizar el total en la sección de pago
function actualizarTotalPago() {
  const total = parseFloat(document.getElementById("total").textContent.replace(" €", ""));
  document.getElementById("pagoTotal").textContent = total.toFixed(2);
  document.getElementById("pagoTotalBoton").textContent = total.toFixed(2);
}

// Llamar a actualizarTotalPago cuando se calcule el precio
document.getElementById("calcularPrecioBtn").addEventListener("click", function () {
  calcularPrecioYGuardar();
  actualizarTotalPago();
});

// Asociar el botón "Ver resumen del trámite" a la función mostrarResumen
document.getElementById("verResumenBtn").addEventListener("click", mostrarResumen);

// Función para calcular el precio y guardar en Firebase
async function calcularPrecioYGuardar() {
  console.log("Función calcularPrecioYGuardar llamada");

  calcularPrecioSinGuardar();

  const fechaMatriculacion = document.getElementById("fechaMatriculacion")?.value;
  const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador")?.value;
  const precioContrato = parseFloat(document.getElementById("precioContrato")?.value);
  const combustible = document.getElementById("combustible")?.value;
  const correo = document.getElementById("correo")?.value;
  const marca = document.getElementById("marca")?.value;
  const modelo = document.getElementById("modelo")?.value;

  const valorFiscal = parseFloat(document.getElementById("valorFiscal").textContent.replace(" €", ""));
  const impuesto = parseFloat(document.getElementById("impuesto").textContent.replace(" €", ""));
  const total = parseFloat(document.getElementById("total").textContent.replace(" €", ""));

  const nuevoRegistro = {
    FechaMatriculacion: fechaMatriculacion,
    ComunidadAutonoma: comunidadAutonoma,
    Combustible: combustible,
    Correo: correo,
    Marca: marca,
    Modelo: modelo,
    PrecioContrato: precioContrato,
    ValorFiscal: valorFiscal,
    ITP: impuesto,
    Total: total,
    FechaRegistro: new Date().toISOString(),
  };

  try {
    await addDoc(vehiculosCollection, nuevoRegistro);
    console.log("Datos guardados correctamente en Firebase.");
    listarVehiculos();
  } catch (error) {
    console.error("Error al guardar en Firebase:", error.message || error);
    Swal.fire({
      icon: "error",
      title: "Error al guardar",
      text: "Hubo un problema al guardar los datos. Por favor, inténtalo más tarde.",
    });
  }

  showTab('precio');
}

// Función para calcular el precio sin guardar en Firebase
function calcularPrecioSinGuardar() {
  const fechaMatriculacion = document.getElementById("fechaMatriculacion")?.value;
  const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador")?.value;
  const precioContrato = parseFloat(document.getElementById("precioContrato")?.value);
  const marca = document.getElementById("marca")?.value;
  const modelo = document.getElementById("modelo")?.value;

  if (!validarFormulario()) {
    return;
  }

  const valorBaseHacienda = 32800;
  const antigüedad = new Date().getFullYear() - new Date(fechaMatriculacion).getFullYear();
  const depreciacion = coeficientesDepreciacionVehiculos.find(c => antigüedad >= c.años)?.coef || 0.10;
  const valorFiscal = calcularValorVenal(valorBaseHacienda, fechaMatriculacion, comunidadAutonoma);

  const porcentajeITP = 4;
  const baseITP = Math.max(precioContrato, valorFiscal);
  const impuesto = calcularITP(baseITP, porcentajeITP);

  const tasasDGT = 55.70;
  const gestion = 61.36;
  const iva = 12.89;
  const costoAdicional1 = 12;
  const costoAdicional2 = 9.90;
  const total = tasasDGT + gestion + iva + impuesto + costoAdicional1 + costoAdicional2;

  document.getElementById("tasasDGT").textContent = `${tasasDGT.toFixed(2)} €`;
  document.getElementById("gestion").textContent = `${gestion.toFixed(2)} €`;
  document.getElementById("iva").textContent = `${iva.toFixed(2)} €`;
  document.getElementById("impuesto").textContent = `${impuesto.toFixed(2)} €`;
  document.getElementById("total").textContent = `${total.toFixed(2)} €`;

  actualizarModal(valorBaseHacienda, depreciacion, valorFiscal, impuesto);
}