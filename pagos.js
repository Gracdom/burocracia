// Agrega SweetAlert2 desde un CDN en tu archivo HTML
// <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

// Función para mostrar el resumen del trámite
function mostrarResumen() {
  // Obtener el total de la sección de Precio
  const total = parseFloat(document.getElementById("total").textContent.replace(" €", ""));

  // Actualizar el total en la sección de Pago
  document.getElementById("pagoTotal").textContent = total.toFixed(2);
  document.getElementById("pagoTotalBoton").textContent = total.toFixed(2);
}

// Función para cargar la clave pública de Stripe desde el backend
async function cargarStripe() {
  const response = await fetch("/config-stripe");
  const { publicKey } = await response.json();
  return Stripe(publicKey); // Inicializa Stripe con la clave pública
}

// Función para manejar el envío del formulario de pago
document.getElementById("formPago").addEventListener("submit", async function (event) {
  event.preventDefault(); // Evitar el envío del formulario

  // Validar los campos del formulario de pago
  const nombreApellidos = document.getElementById("nombreApellidos").value;
  const telefono = document.getElementById("telefono").value;

  if (!nombreApellidos || !telefono) {
    Swal.fire({
      icon: "error",
      title: "Campos incompletos",
      text: "Por favor, completa todos los campos del formulario de pago.",
    });
    return;
  }

  // Obtener el total a pagar
  const total = parseFloat(document.getElementById("pagoTotal").textContent);

  // Simular el proceso de pago (sin integración real de Stripe por ahora)
  try {
    // Aquí puedes agregar la lógica real de Stripe más adelante
    console.log("Simulando pago por:", total.toFixed(2), "€");

    // Mostrar mensaje de éxito con SweetAlert2
    Swal.fire({
      icon: "success",
      title: "¡Pago realizado correctamente!",
      text: `El pago de ${total.toFixed(2)} € se ha procesado exitosamente.`,
      confirmButtonText: "Aceptar",
    });

    // Limpiar el formulario después del pago
    document.getElementById("formPago").reset();
    document.getElementById("pagoTotal").textContent = "0.00";
    document.getElementById("pagoTotalBoton").textContent = "0.00";
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error al procesar el pago",
      text: "Hubo un problema al realizar el pago. Por favor, inténtalo más tarde.",
    });
  }
});

// Función para actualizar el total en la sección de pago
function actualizarTotalPago() {
  // Obtener el total de la sección de Precio
  const total = parseFloat(document.getElementById("total").textContent.replace(" €", ""));

  // Actualizar el total en la sección de Pago
  document.getElementById("pagoTotal").textContent = total.toFixed(2);
  document.getElementById("pagoTotalBoton").textContent = total.toFixed(2);
}

// Llamar a actualizarTotalPago cuando se calcule el precio
document.getElementById("calcularPrecioBtn").addEventListener("click", function () {
  calcularPrecioYGuardar();
  actualizarTotalPago(); // Actualizar el total en la sección de pago
});

// Asociar el botón "Ver resumen del trámite" a la función mostrarResumen
document.getElementById("verResumenBtn").addEventListener("click", mostrarResumen);

// Función para calcular el precio y guardar en Firebase
async function calcularPrecioYGuardar() {
  console.log("Función calcularPrecioYGuardar llamada"); // Depuración

  // Primero calcula los precios
  calcularPrecioSinGuardar();

  // Obtener los valores del formulario
  const fechaMatriculacion = document.getElementById("fechaMatriculacion")?.value;
  const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador")?.value;
  const precioContrato = parseFloat(document.getElementById("precioContrato")?.value);
  const combustible = document.getElementById("combustible")?.value;
  const correo = document.getElementById("correo")?.value;
  const marca = document.getElementById("marca")?.value;
  const modelo = document.getElementById("modelo")?.value;

  // Obtener los valores calculados
  const valorFiscal = parseFloat(document.getElementById("valorFiscal").textContent.replace(" €", ""));
  const impuesto = parseFloat(document.getElementById("impuesto").textContent.replace(" €", ""));
  const total = parseFloat(document.getElementById("total").textContent.replace(" €", ""));

  // Guardar los datos en Firebase
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
    // Guardar el registro en Firebase
    await addDoc(vehiculosCollection, nuevoRegistro);
    console.log("Datos guardados correctamente en Firebase.");
    listarVehiculos(); // Actualizar la tabla después de guardar
  } catch (error) {
    console.error("Error al guardar en Firebase:", error.message || error);
    alert("Hubo un error al guardar los datos. Detalles: " + (error.message || error));
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

  // Valor base de Hacienda específico para el modelo Abarth 124 Spider TB Multiair 6V
  const valorBaseHacienda = 32800; // Valor de tablas de Hacienda para el modelo específico

  // Calcular la antigüedad
  const antigüedad = new Date().getFullYear() - new Date(fechaMatriculacion).getFullYear();

  // Obtener el coeficiente de depreciación según la antigüedad
  const depreciacion = coeficientesDepreciacionVehiculos.find(c => antigüedad >= c.años)?.coef || 0.10;

  // Calcular el valor fiscal
  const valorFiscal = calcularValorVenal(valorBaseHacienda, fechaMatriculacion, comunidadAutonoma);

  // Calcular el ITP (4% sobre el valor más alto entre el precio de compraventa y el valor fiscal)
  const porcentajeITP = 4;
  const baseITP = Math.max(precioContrato, valorFiscal); // Usar el valor más alto
  const impuesto = calcularITP(baseITP, porcentajeITP);

  // Calcular el total (incluyendo tasas DGT, gestión, IVA y costos adicionales)
  const tasasDGT = 55.70;
  const gestion = 61.36;
  const iva = 12.89;
  const costoAdicional1 = 12; // Ejemplo: Seguro temporal
  const costoAdicional2 = 9.90; // Ejemplo: Otro servicio
  const total = tasasDGT + gestion + iva + impuesto + costoAdicional1 + costoAdicional2;

  // Mostrar resultados en la interfaz
  document.getElementById("tasasDGT").textContent = `${tasasDGT.toFixed(2)} €`;
  document.getElementById("gestion").textContent = `${gestion.toFixed(2)} €`;
  document.getElementById("iva").textContent = `${iva.toFixed(2)} €`;
  document.getElementById("impuesto").textContent = `${impuesto.toFixed(2)} €`;
  document.getElementById("total").textContent = `${total.toFixed(2)} €`;

  // Actualizar el modal con los valores calculados
  actualizarModal(valorBaseHacienda, depreciacion, valorFiscal, impuesto);
}