import { app, db } from "./firebase.js";
import { collection, getDocs, addDoc } from "firebase/firestore";
// Agrega estos imports al inicio de tu archivo JavaScript
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";


const vehiculosCollection = collection(db, "Vehículo");

const coeficientesDepreciacionVehiculos = [
  { años: 1, coef: 1.0 }, { años: 2, coef: 0.84 }, { años: 3, coef: 0.67 },
  { años: 4, coef: 0.56 }, { años: 5, coef: 0.47 }, { años: 6, coef: 0.39 },
  { años: 7, coef: 0.34 }, { años: 8, coef: 0.28 }, { años: 9, coef: 0.24 },
  { años: 10, coef: 0.19 }, { años: 11, coef: 0.17 }, { años: 12, coef: 0.13 },
  { años: Infinity, coef: 0.10 }
];

const coeficientesComunidad = {
  "Andalucía": 0.90, "Aragón": 0.93, "Asturias": 0.94, "Islas Baleares": 0.96,
  "Canarias": 0.85, "Cantabria": 0.95, "Castilla-La Mancha": 0.89,
  "Castilla y León": 0.91, "Cataluña": 0.95, "Comunidad Valenciana": 0.88,
  "Extremadura": 0.87, "Galicia": 0.92, "La Rioja": 0.90, "Madrid": 1.0,
  "Murcia": 0.89, "Navarra": 1.0, "País Vasco": 1.0, "Ceuta": 0.80, "Melilla": 0.80
};

async function listarVehiculos() {
  const tbody = document.querySelector("#tablaVehiculos tbody");
  tbody.innerHTML = "";
  
  try {
    const querySnapshot = await getDocs(vehiculosCollection);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tbody.innerHTML += `
        <tr>
          <td>${data.FechaMatriculacion}</td>
          <td>${data.ComunidadAutonoma}</td>
          <td>${data.Combustible}</td>
          <td>${data.Correo}</td>
          <td>${data.Marca}</td>
          <td>${data.Modelo}</td>
          <td>${data.PrecioContrato} €</td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error al listar vehículos:", error);
  }
}

function calcularValorVenal(valorBase, fechaMatriculacion, comunidad) {
  const añoActual = new Date().getFullYear();
  const añoVehiculo = new Date(fechaMatriculacion).getFullYear();
  const antigüedad = añoActual - añoVehiculo;

  const coefDepreciacion = coeficientesDepreciacionVehiculos
    .find(c => antigüedad >= c.años)?.coef || 0.10;

  const coefComunidad = coeficientesComunidad[comunidad] || 1.0;

  return valorBase * coefDepreciacion * coefComunidad;
}

function calcularITP(valorVenal, porcentajeITP) {
  return valorVenal * (porcentajeITP / 100);
}

function actualizarModal(valorHacienda, depreciacion, valorFiscal, itp) {
  document.getElementById("valorHacienda").textContent = `${valorHacienda.toFixed(2)} €`;
  document.getElementById("depreciacion").textContent = `${(depreciacion * 100).toFixed(0)}%`;
  document.getElementById("valorFiscal").textContent = `${valorFiscal.toFixed(2)} €`;
  document.getElementById("itpCalculado").textContent = `${itp.toFixed(2)} €`;
}

async function calcularPrecio() {
  const fechaMatriculacion = document.getElementById("fechaMatriculacion").value;
  const comunidad = document.getElementById("comunidadAutonomaComprador").value;
  const precioContrato = parseFloat(document.getElementById("precioContrato").value) || 0;

  if (!fechaMatriculacion || !comunidad || precioContrato <= 0) return;

  const valorBaseHacienda = 11700; // Valor específico para el modelo
  const valorFiscal = calcularValorVenal(valorBaseHacienda, fechaMatriculacion, comunidad);
  const baseImponible = Math.max(precioContrato, valorFiscal);
  const itp = calcularITP(baseImponible, 4);

  // Actualizar interfaz
  document.getElementById("tasasDGT").textContent = "55.70 €";
  document.getElementById("gestion").textContent = "61.36 €";
  document.getElementById("iva").textContent = "12.89 €";
  document.getElementById("impuesto").textContent = `${itp.toFixed(2)} €`;
  document.getElementById("total").textContent = 
    `${(55.70 + 61.36 + 12.89 + itp).toFixed(2)} €`;

  // Actualizar modal
  const añoVehiculo = new Date(fechaMatriculacion).getFullYear();
  const antigüedad = new Date().getFullYear() - añoVehiculo;
  const coefDepreciacion = coeficientesDepreciacionVehiculos
    .find(c => antigüedad >= c.años)?.coef || 0.10;

  actualizarModal(
    valorBaseHacienda,
    coefDepreciacion,
    valorFiscal,
    itp
  );

  // Guardar en Firebase
  const nuevoRegistro = {
    FechaMatriculacion: fechaMatriculacion,
    ComunidadAutonoma: comunidad,
    PrecioContrato: precioContrato,
    ValorFiscal: valorFiscal,
    ITP: itp,
    Total: 55.70 + 61.36 + 12.89 + itp,
    FechaRegistro: new Date().toISOString()
  };

  try {
    await addDoc(vehiculosCollection, nuevoRegistro);
    listarVehiculos();
  } catch (error) {
    console.error("Error al guardar:", error);
  }

  showTab('precio');
}

// Event listeners
document.getElementById("calcularPrecioBtn").addEventListener("click", calcularPrecio);
document.addEventListener("DOMContentLoaded", listarVehiculos);

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => 
    tab.classList.remove('active-tab'));
  document.querySelectorAll('.tab-button').forEach(btn => 
    btn.classList.remove('active'));
  document.getElementById(tabId).classList.add('active-tab');
  document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`)
    .classList.add('active');
}

// Modal handlers
document.getElementById("mostrarInfo").addEventListener("click", (e) => {
  e.preventDefault();
  calcularPrecio();
  document.getElementById("modalInfo").style.display = "block";
});

document.getElementById("cerrarModal").addEventListener("click", () => 
  document.getElementById("modalInfo").style.display = "none");

window.onclick = (e) => {
  if (e.target === document.getElementById("modalInfo")) {
    document.getElementById("modalInfo").style.display = "none";
  }
};

























document.addEventListener("DOMContentLoaded", () => {
  function generarVistaPrevia() {
    const documentoPreview = document.getElementById("documentoPreview");
    if (!documentoPreview) return;

    // Obtener datos del formulario
    const fechaMatriculacion = document.getElementById("fechaMatriculacion")?.value || "No especificado";
    const marca = document.getElementById("marca")?.value || "No especificado";
    const modelo = document.getElementById("modelo")?.value || "No especificado";
    const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador")?.value || "No especificado";
    const combustible = document.getElementById("combustible")?.value || "No especificado";
    const correo = document.getElementById("correo")?.value || "No especificado";
    const precioContrato = document.getElementById("precioContrato")?.value || "No especificado";
    
    // Sección de pago
    const nombreApellidos = document.getElementById("nombreApellidos")?.value.trim() || "No especificado";
    const telefono = document.getElementById("telefono")?.value.trim() || "No especificado";
    const tasasDGT = document.getElementById("tasasDGT")?.textContent || "0 €";
    const gestion = document.getElementById("gestion")?.textContent || "0 €";
    const iva = document.getElementById("iva")?.textContent || "0 €";
    const impuesto = document.getElementById("impuesto")?.textContent || "0 €";
    const total = document.getElementById("total")?.textContent || "0 €";

    // Crear contenido
    const contenido = `
      <h3>Documento de Trámite</h3>
      <p><strong>Fecha de Matriculación:</strong> ${fechaMatriculacion}</p>
      <p><strong>Marca:</strong> ${marca}</p>
      <p><strong>Modelo:</strong> ${modelo}</p>
      <p><strong>Comunidad Autónoma del Comprador:</strong> ${comunidadAutonoma}</p>
      <p><strong>Combustible:</strong> ${combustible}</p>
      <p><strong>Precio de Compraventa:</strong> ${precioContrato} €</p>
      <hr>
      <h4>Datos de Usuario</h4>
      <p><strong>Nombre y Apellidos:</strong> ${nombreApellidos}</p>
      <p><strong>Teléfono:</strong> ${telefono}</p>
      <p><strong>Correo:</strong> ${correo}</p>
      <hr>
      <h4>Detalles del Cálculo</h4>
      <p><strong>Tasas DGT:</strong> ${tasasDGT}</p>
      <p><strong>Gestión:</strong> ${gestion}</p>
      <p><strong>IVA:</strong> ${iva}</p>
      <p><strong>Impuesto de Transmisiones:</strong> ${impuesto}</p>
      <p><strong>Total:</strong> ${total}</p>
      <hr>
      <p><strong>Envío a domicilio:</strong> Gratuito</p>
    `;

    // Insertar contenido y mostrar modal
    documentoPreview.innerHTML = contenido;
    document.getElementById("modalDocumento").style.display = "block";
  }

  function cerrarModalDocumento() {
    document.getElementById("modalDocumento").style.display = "none";
  }

  function cerrarModalFuera(event) {
    if (event.target === document.getElementById("modalDocumento")) {
      cerrarModalDocumento();
    }
  }

  function cerrarModalConEsc(event) {
    if (event.key === "Escape") {
      cerrarModalDocumento();
    }
  }

  function descargarPDF() {
    console.log("Función descargarPDF ejecutada");

    if (!window.jspdf) {
      console.error("La biblioteca jsPDF no está cargada.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cargar imagen antes de generar el PDF
    const logoImg = new Image();
    logoImg.src = "logo.png"; // Ruta de la imagen

    logoImg.onload = function () {
      console.log("Logo cargado correctamente.");
      doc.addImage(logoImg, "PNG", 10, 10, 50, 20); // x, y, ancho, alto

      // Agregar título
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Documento de Trámite", 10, 40);

      // Obtener contenido
      const documentoTexto = document.getElementById("documentoPreview").textContent.trim();
      console.log("Contenido del modal:", documentoTexto);

      // Formato de texto
      const marginLeft = 10;
      const marginTop = 50;
      const maxWidth = 180;
      const lineHeight = 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(documentoTexto, maxWidth);
      doc.text(lines, marginLeft, marginTop + lineHeight);

      // Guardar PDF
      console.log("Guardando PDF...");
      doc.save("documento_tramite.pdf");
    };

    logoImg.onerror = function () {
      console.error("Error al cargar el logo. Generando PDF sin logo.");

      // Generar PDF sin logo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Documento de Trámite", 10, 20);

      const documentoTexto = document.getElementById("documentoPreview").textContent.trim();
      const marginLeft = 10;
      const marginTop = 30;
      const maxWidth = 180;
      const lineHeight = 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(documentoTexto, maxWidth);
      doc.text(lines, marginLeft, marginTop + lineHeight);

      doc.save("documento_tramite.pdf");
    };
  }

  document.getElementById("verResumenBtn")?.addEventListener("click", generarVistaPrevia);
  document.getElementById("cerrarModalDocumentoBtn")?.addEventListener("click", cerrarModalDocumento);
  document.getElementById("descargarPDFBtn")?.addEventListener("click", descargarPDF);
  document.getElementById("modalDocumento")?.addEventListener("click", cerrarModalFuera);
  document.addEventListener("keydown", cerrarModalConEsc);
});










//// Agrega esto al inicio de tu archivo
const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const fileList = document.getElementById('fileList');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');

// Modifica la función handleFiles
async function handleFiles(files) {
  progressContainer.style.display = 'block';
  
  // Usar for...of para manejar async correctamente
  for (const file of files) {
    if (!file.type.match('image.(png|jpg|jpeg)')) {
      alert('Solo se permiten archivos PNG/JPG');
      continue;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no puede superar 5MB');
      continue;
    }

    await subirArchivo(file);
  }
}

// Modifica la función subirArchivo
async function subirArchivo(file) {
  // Crear elemento de lista con miniatura
  const listItem = document.createElement('li');
  listItem.className = 'file-item';
  
  // Crear elemento de imagen
  const img = document.createElement('img');
  img.classList.add('thumbnail');
  
  // Leer archivo para vista previa
  const reader = new FileReader();
  reader.onload = function() {
    img.src = reader.result;
  };
  reader.readAsDataURL(file);

  // Estructura del elemento
  listItem.innerHTML = `
    <div class="file-info">
      ${file.name}
      <div class="progress-bar-container">
        <div class="progress-bar"></div>
      </div>
    </div>
  `;
  listItem.prepend(img);
  fileList.appendChild(listItem);
  
  const progressBarItem = listItem.querySelector('.progress-bar');

  // Subir a Firebase
  const storageRef = ref(storage, `documentos/${Date.now()}-${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressBarItem.style.width = `${progress}%`;
        
        if (progress === 100) {
          setTimeout(() => {
            progressBarItem.parentElement.style.display = 'none';
          }, 500);
        }
      },
      (error) => {
        console.error('Error al subir:', error);
        listItem.innerHTML += ' - Error';
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Actualizar elemento con enlace
        listItem.innerHTML = `
          <div class="file-info">
            <a href="${downloadURL}" target="_blank">${file.name}</a>
            <span class="success">✓</span>
          </div>
        `;
        listItem.prepend(img); // Mantener miniatura
        
        // Guardar en Firestore
        await addDoc(collection(db, "documentos"), {
          nombre: file.name,
          url: downloadURL,
          fecha: new Date().toISOString()
        });
        
        resolve();
      }
    );
  });
}