// ==============================
// ⚙️ VARIABLES GLOBALES
// ==============================
let configTicketCache = {}; // Se cargará desde la BD al iniciar
let usuarioActual = null;   // Se guarda usuario logueado
// ==============================
// 🔐 FUNCIONES DE AUTENTICACIÓN Y SESIÓN
// ==============================
function iniciarSesion() {
  const usuario = document.getElementById("loginUsuario").value;
  const clave = document.getElementById("loginClave").value;

  fetch('/api/usuarios/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: usuario, clave })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      usuarioActual = data.usuario;
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      document.getElementById("loginModal").style.display = "none";
      actualizarUIsegunRol();
      verificarTurnoActivo();  // Aquí puedes llamar esto luego de login
    } else {
      alert("Credenciales incorrectas.");
    }
  });
}


async function cargarConfiguracionDesdeBD() {
  try {
    const res = await fetch("/api/config");
    configTicketCache = await res.json();
  } catch (error) {
    console.error("Error cargando configuración:", error);
  }
}

function actualizarUIsegunRol() {
  const labelUsuario = document.getElementById('usuarioActual');
  if (labelUsuario) {
    labelUsuario.textContent = usuarioActual.nombre;
  }

  const esAdmin = usuarioActual.rol === 'admin';

  const ajustesBtn = document.getElementById('btnAjustes');
  if (ajustesBtn) {
    ajustesBtn.style.display = esAdmin ? 'inline-block' : 'none';
  }

  const btnUsuariosTab = document.querySelector("button[onclick*='usuarios']");
  if (btnUsuariosTab) {
    btnUsuariosTab.style.display = esAdmin ? 'inline-block' : 'none';
  }
}
function cerrarSesion() {
  usuarioActual = null;
  document.getElementById("loginModal").style.display = "flex";
}
function mostrarModalAbrirTurno() {
  if (!usuarioActual || !usuarioActual.nombre) {
    alert("No hay un usuario autenticado. Inicia sesión primero.");
    return;
  }

  document.getElementById("turno-operador").value = usuarioActual.nombre;
  document.getElementById("modal-turno").style.display = "flex";
}


async function iniciarTurno() {
  const clave = document.getElementById("claveTurno").value;
  const operador = usuarioActual.nombre;

  if (!clave) {
    alert("Ingresa tu clave");
    return;
  }

  try {
    const res = await fetch("/api/turnos/iniciar", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operador, clave })
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ Turno iniciado");
      localStorage.setItem('turnoId', data.turnoId);
      document.getElementById("modal-turno").remove();
    } else {
      alert("❌ No se pudo iniciar turno");
    }
  } catch (err) {
    console.error("Error al iniciar turno:", err);
    alert("Error al iniciar turno");
  }
}
async function cerrarTurnoActivo() {
  try {
    if (!turnoActivo || !turnoActivo.id) {
      alert("⚠️ No hay turno activo para cerrar.");
      return;
    }

    const confirmar = confirm(`¿Deseas cerrar el turno #${turnoActivo.id}? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    const res = await fetch("/api/turnos/cerrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: turnoActivo.id })
    });

    const data = await res.json();
    if (data.success) {
      alert("✅ Turno cerrado exitosamente.");
      turnoActivo = null;
      document.getElementById("turnoActual").textContent = "Sin turno activo";
    } else {
      alert("❌ Error al cerrar turno.");
    }
  } catch (err) {
    console.error("Error cerrando turno:", err);
    alert("❌ Ocurrió un error al cerrar el turno.");
  }
}
async function cerrarTurno() {
  const turnoId = localStorage.getItem("turnoId");

  if (!turnoId) {
    alert("No hay turno activo para cerrar.");
    return;
  }

  const confirmar = confirm("¿Deseas cerrar el turno actual?");
  if (!confirmar) return;

  try {
    const res = await fetch('/api/turnos/cerrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: turnoId })
    });

    const data = await res.json();

    if (data.success) {
      alert("Turno cerrado correctamente ✅");
      localStorage.removeItem("turnoId");
      location.reload();
    } else {
      alert("Error al cerrar el turno");
    }
  } catch (err) {
    console.error("Error cerrando turno:", err);
    alert("Error al cerrar el turno");
  }
}


// ==============================
// 🧾 MODAL DE SERVICIO Y GENERACIÓN DE TICKETS
// ==============================
// ... [Contenido completo de funciones: abrirModal, cerrarModal, generarFolio, registrarServicio, generarTicketYImprimir]
const modalServicio = document.getElementById("modal-servicio");
const nombreEl = document.getElementById("modal-paquete-nombre");
const precioEl = document.getElementById("modal-paquete-precio");

let paqueteSeleccionado = "";

function abrirModal(paquete, precio) {
  paqueteSeleccionado = paquete;
  nombreEl.innerText = `Paquete: ${paquete}`;
  precioEl.innerText = `Precio: $${parseFloat(precio).toFixed(2)}`;

  document.getElementById("input-marca").value = "";
  document.getElementById("input-modelo").value = "";
  document.getElementById("input-whatsapp").value = "";
  document.getElementById("input-notificar").checked = false;

  modalServicio.style.display = "flex";
}

function cerrarModal() {
  modalServicio.style.display = "none";
}

document.getElementById("btn-modal-cancelar").addEventListener('click', cerrarModal);

function generarFolio() {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minuto = String(fecha.getMinutes()).padStart(2, '0');
  const segundo = String(fecha.getSeconds()).padStart(2, '0');
  const timestamp = `${año}${mes}${dia}${hora}${minuto}${segundo}`;

  let contador = parseInt(localStorage.getItem("contadorFolio") || "0");
  const ultimaFecha = localStorage.getItem("ultimaFechaFolio");

  const hoy = `${año}${mes}${dia}`;
  if (ultimaFecha !== hoy) {
    contador = 1;
    localStorage.setItem("ultimaFechaFolio", hoy);
  } else {
    contador++;
  }

  localStorage.setItem("contadorFolio", contador);

  const consecutivo = String(contador).padStart(6, '0');
  return `${timestamp}-${consecutivo}`;
}

document.getElementById("btn-modal-aceptar").addEventListener('click', () => {
  const marca = document.getElementById("input-marca").value;
  const modelo = document.getElementById("input-modelo").value;
  const whatsapp = document.getElementById("input-whatsapp").value;
  const notificar = document.getElementById("input-notificar").checked;
  const precio = parseFloat(precioEl.innerText.replace("Precio: $", ""));
  const folio = generarFolio();

  fetch('/api/servicios/registrar', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paquete: paqueteSeleccionado,
      precio,
      marca,
      modelo,
      whatsapp,
      notificar,
      folio
    })
  })
  .then(res => res.json())
  .then(data => {
    cerrarModal();
    generarTicketYImprimir({
      paquete: paqueteSeleccionado,
      precio,
      marca,
      modelo,
      whatsapp,
      notificar,
      folio
    });
  });
});

function generarTicketYImprimir(datos) {
  const config = configTicketCache || {};
  const logo = config.logoBase64 ? `<img src="${config.logoBase64}" style="max-height:80px; display:block; margin: 0 auto 10px;">` : "";
  const fecha = new Date().toLocaleString();

  const ticketHTML = `
    <html>
      <head>
        <style>
          body {
            font-family: monospace;
            font-size: 12px;
            width: 80mm;
            padding: 10px;
          }
          h2, h3 {
            text-align: center;
            margin: 0;
          }
          .info {
            margin-top: 10px;
          }
          .line {
            border-top: 1px dashed black;
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        ${logo}
        <h2>${config.nombre || "AUTOLAVADO"}</h2>
        <h3>${config.direccion || ""}</h3>
        ${config.leyenda1 ? `<p style="text-align:center;">${config.leyenda1}</p>` : ""}
        <div class="line"></div>
        <div class="info">
          <strong>Fecha:</strong> ${fecha}<br>
          <strong>Folio:</strong> ${datos.folio}<br>
          <strong>Paquete:</strong> ${datos.paquete}<br>
          <strong>Precio:</strong> $${parseFloat(datos.precio).toFixed(2)}<br>
          <strong>Marca:</strong> ${datos.marca}<br>
          <strong>Modelo:</strong> ${datos.modelo}<br>
          ${datos.notificar ? `<strong>📲 Aviso:</strong> Notificar.<br>` : `<strong>⏳ Estado:</strong> En espera.<br>`}
        </div>
        <div class="line"></div>
        <p style="text-align:center;">${config.leyendaTicket || "¡Gracias por su preferencia!"}</p>
      </body>
    </html>
  `;

  const iframe = document.getElementById("ticket-frame");
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(ticketHTML);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow.print();
    setTimeout(() => iframe.contentWindow.print(), 500);
  };
}
// ==============================
// 🛠️ FUNCIONES DE AJUSTES Y CONFIGURACIÓN
// ==============================
// ... [Contenido completo: abrir modal ajustes, guardar ajustes, cerrar modal, subir logo]
document.getElementById("btnajustes").addEventListener("click", async () => {
  const res = await fetch("/api/config");
  const config = await res.json();

  document.getElementById("aj-nombre").value = config.nombre || "";
  document.getElementById("aj-direccion").value = config.direccion || "";
  document.getElementById("aj-leyenda1").value = config.leyenda1 || "";
  document.getElementById("aj-leyenda").value = config.leyenda || "";
  document.getElementById("aj-ticket").value = config.leyendaTicket || "";
  document.getElementById("aj-whatsapp").value = config.whatsappOrigen || "";
  document.getElementById("vista-logo").src = config.logoBase64 || "";

  document.getElementById("modal-ajustes").style.display = "flex";
  cargarPaquetes();
});

document.getElementById("aj-logo").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      localStorage.setItem("logoBase64", e.target.result);
      document.getElementById("vista-logo").src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById("btn-guardar-ajustes").addEventListener("click", async () => {
  const data = {
    nombre: document.getElementById("aj-nombre").value,
    direccion: document.getElementById("aj-direccion").value,
    leyenda1: document.getElementById("aj-leyenda1").value,
    leyenda: document.getElementById("aj-leyenda").value,
    leyendaTicket: document.getElementById("aj-ticket").value,
    whatsappOrigen: document.getElementById("aj-whatsapp").value,  
    logoBase64: document.getElementById("vista-logo").src || ""
  };

  await fetch("/api/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  configTicketCache = data;

  alert("Ajustes guardados correctamente ✅");
  cerrarModalAjustes();
});

function cerrarModalAjustes() {
  document.getElementById("modal-ajustes").style.display = "none";
}

// ==============================
// 📦 GESTIÓN DE PAQUETES
// ==============================
// ... [CRUD completo de paquetes, renderizar botones, editar, eliminar, agregar]
function cargarPaquetes() {
  fetch('/api/paquetes')
    .then(res => res.json())
    .then(data => {
      const tabla = document.getElementById("tabla-paquetes");
      tabla.innerHTML = "";

      data.forEach(pkg => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${pkg.nombre}</td>
          <td>$${pkg.precio.toFixed(2)}</td>
          <td>
            <button onclick='abrirModalEditarPaquete(${JSON.stringify(pkg)})'>✏️</button>
            <button onclick='eliminarPaquete(${pkg.id})'>🗑️</button>
          </td>
        `;

        tabla.appendChild(row);
      });
    });
}

function abrirModalEditarPaquete(paquete) {
  document.getElementById('editarId').value = paquete.id;
  document.getElementById('editarNombre').value = paquete.nombre;
  document.getElementById('editarPrecio').value = paquete.precio;
  document.getElementById('editarColorFondo').value = paquete.color_fondo || '#00BCD4';
  document.getElementById('editarColorTexto').value = paquete.color_texto || '#FFFFFF';
  document.getElementById('modalEditarPaquete').style.display = 'block';
}

function cerrarModalEditar() {
  document.getElementById('modalEditarPaquete').style.display = 'none';
}

function guardarCambiosPaquete() {
  const id = document.getElementById('editarId').value;
  const nombre = document.getElementById('editarNombre').value;
  const precio = parseFloat(document.getElementById('editarPrecio').value);
  const color_fondo = document.getElementById('editarColorFondo').value;
  const color_texto = document.getElementById('editarColorTexto').value;

  if (!nombre || isNaN(precio)) {
    alert("Debes ingresar nombre y precio válido.");
    return;
  }

  fetch(`/api/paquetes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, precio, color_fondo, color_texto })
  })
    .then(res => res.json())
    .then(() => {
      cerrarModalEditar();
      cargarPaquetes();
      renderizarBotonesDesdeBD();
    })
    .catch(err => {
      console.error('Error al editar paquete:', err);
      alert('Hubo un error al actualizar el paquete.');
    });
}

document.getElementById("btn-agregar-paquete").addEventListener("click", () => {
  const nombre = document.getElementById("nuevo-nombre").value.trim();
  const precio = parseFloat(document.getElementById("nuevo-precio").value);

  if (!nombre || isNaN(precio)) {
    alert("Debes ingresar nombre y precio válido.");
    return;
  }

  fetch('/api/paquetes', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, precio })
  })
    .then(res => res.json())
    .then(() => {
      document.getElementById("nuevo-nombre").value = "";
      document.getElementById("nuevo-precio").value = "";
      cargarPaquetes();
      renderizarBotonesDesdeBD();
    });
});

function eliminarPaquete(id) {
  if (!confirm("¿Eliminar este paquete?")) return;

  fetch(`/api/paquetes/${id}`, {
    method: "DELETE"
  }).then(() => {
    cargarPaquetes();
    renderizarBotonesDesdeBD();
  });
}
function renderizarBotonesDesdeBD() {
  fetch('/api/paquetes')
    .then(res => res.json())
    .then(data => {
      const contenedor = document.getElementById('contenedor-paquetes');
      contenedor.innerHTML = '';

      const col1 = document.createElement('div');
      const col2 = document.createElement('div');
      const col3 = document.createElement('div');
      col1.className = col2.className = col3.className = 'paquetes-col';

      data.forEach((paquete, index) => {
        const btn = document.createElement('button');
        btn.className = 'paquete-btn';
        btn.textContent = `$${parseFloat(paquete.precio).toFixed(2)} ${paquete.nombre}`;

        if (paquete.color_fondo) {
          btn.style.backgroundColor = paquete.color_fondo;
        }

        if (paquete.color_texto) {
          btn.style.color = paquete.color_texto;
        }

        btn.addEventListener('click', () => {
          abrirModal(paquete.nombre, paquete.precio);
        });

        if (index % 3 === 0) col1.appendChild(btn);
        else if (index % 3 === 1) col2.appendChild(btn);
        else col3.appendChild(btn);
      });

      contenedor.appendChild(col1);
      contenedor.appendChild(col2);
      contenedor.appendChild(col3);
    });
}
// ==============================
// 📊 FUNCIONES DE REPORTE Y CONSULTAS
// ==============================
// ... [cargarReporte, cargarReporteHoy, borrarTodosLosServicios, cargarServiciosDelDia, cerrarModalReporte]
// Obtener la fecha local en formato ISO (YYYY-MM-DD)
// ==============================
// Funciones Utilitarias
// ==============================
function obtenerFechaLocalISO() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatearFecha(fechaISO) {
  const [fecha, hora] = fechaISO.split("T");
  const [yyyy, mm, dd] = fecha.split("-");
  return `${dd}/${mm}/${yyyy} ${hora?.slice(0,5) || ''}`;
}

// ==============================
// Reportes de Lavados
// ==============================

document.getElementById("btnReporte").addEventListener("click", () => {
  const hoy = obtenerFechaLocalISO();
  const inicio = document.getElementById("filtro-inicio");
  const fin = document.getElementById("filtro-fin");

  inicio.value = hoy;
  fin.value = hoy;

  document.getElementById("modal-reportes").style.display = "flex";
  cargarReporte(hoy, hoy);
});

document.getElementById("btn-buscar-reporte").addEventListener("click", () => {
  const inicio = document.getElementById("filtro-inicio").value;
  const fin = document.getElementById("filtro-fin").value;

  if (!inicio || !fin) {
    alert("Selecciona ambas fechas.");
    return;
  }

  cargarReporte(inicio, fin);
});

function cargarReporte(inicio = null, fin = null) {
  let url = "/api/servicios";
  if (inicio && fin) {
    url += `?inicio=${inicio}&fin=${fin}`;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const tabla = document.getElementById("tabla-reporte");
      tabla.innerHTML = "";

      let total = 0;

      if (data.length === 0) {
        tabla.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center;">
              🔍 No se encontraron servicios para este rango de fechas.
            </td>
          </tr>`;
        document.getElementById("total-dia").innerText = "0.00";
        document.getElementById("total-servicios").innerText = "0";
        return;
      }

      data.forEach(s => {
        const [fechaStr, horaStr] = s.fecha.split(' ');
        const fechaFormateada = fechaStr.split('-').reverse().join('/');

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${fechaFormateada}</td>
          <td>${horaStr}</td>
          <td>${s.paquete}</td>
          <td>${s.marca} / ${s.modelo}</td>
          <td>$${parseFloat(s.precio).toFixed(2)}</td>
        `;
        tabla.appendChild(row);

        total += parseFloat(s.precio);
      });

      document.getElementById("total-dia").innerText = total.toFixed(2);
      document.getElementById("total-servicios").innerText = data.length;
    })
    .catch(err => {
      console.error("Error cargando reporte:", err);
      alert("Ocurrió un error al cargar el reporte.");
    });
}

function cerrarModalReporte() {
  document.getElementById("modal-reportes").style.display = "none";
}

// ==============================
// Corte de Caja por Rango
// ==============================

document.getElementById("btn-corte").addEventListener("click", async () => {
  const inicio = document.getElementById("filtro-inicio").value;
  const fin = document.getElementById("filtro-fin").value;

  if (!inicio || !fin) {
    alert("Selecciona ambas fechas para generar el corte.");
    return;
  }

  try {
    const resTurnos = await fetch(`/api/turnos/resumen-por-rango?inicio=${inicio}&fin=${fin}`);
    const turnos = await resTurnos.json();

    if (!turnos || turnos.length === 0) {
      alert("No hay turnos registrados en ese rango.");
      return;
    }

    const resServicios = await fetch(`/api/servicios?inicio=${inicio}&fin=${fin}`);
    const todosLosServicios = await resServicios.json();

    const cont = document.getElementById("detalle-corte");
    cont.innerHTML = "";

    for (const turno of turnos) {
      const serviciosDelTurno = todosLosServicios.filter(s => s.turno_id === turno.id);
      const total = serviciosDelTurno.reduce((acc, s) => acc + parseFloat(s.precio), 0);
      const cantidad = serviciosDelTurno.length;

      const resumen = {
        turno,
        servicios: serviciosDelTurno,
        total,
        cantidad
      };

      cont.innerHTML += generarHTMLCorte(resumen);
    }

    document.getElementById("corte-caja").style.display = "block";

  } catch (err) {
    console.error("Error generando corte:", err);
    alert("Hubo un error al generar el corte de caja.");
  }
});

function generarHTMLCorte(data) {
  const { turno, servicios, total, cantidad } = data;

  let html = `
    <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
      <p><strong>Turno #${turno.id}</strong></p>
      <p><strong>Operador:</strong> ${turno.operador}</p>
      <p><strong>Inicio:</strong> ${formatearFecha(turno.inicio)}</p>
      <p><strong>Fin:</strong> ${turno.fin ? formatearFecha(turno.fin) : '(aún abierto)'}</p>
      <table style="width: 100%; border-collapse: collapse;" border="1" cellpadding="5">
        <thead>
          <tr><th>Servicio</th><th>Cantidad</th><th>Total</th></tr>
        </thead>
        <tbody>
  `;

  const resumen = {};
  servicios.forEach(s => {
    if (!resumen[s.paquete]) resumen[s.paquete] = { cantidad: 0, total: 0 };
    resumen[s.paquete].cantidad++;
    resumen[s.paquete].total += s.precio;
  });

  for (const paquete in resumen) {
    const r = resumen[paquete];
    html += `<tr>
      <td>${paquete}</td>
      <td style="text-align:center;">${r.cantidad}</td>
      <td style="text-align:right;">$${r.total.toFixed(2)}</td>
    </tr>`;
  }

  html += `
        </tbody>
      </table>
      <p><strong>Total servicios:</strong> ${cantidad}</p>
      <p><strong>Total ingresos:</strong> $${total.toFixed(2)}</p>
    </div>
  `;

  return html;
}

// ==============================
// Borrar todos los servicios
// ==============================
function borrarTodosLosServicios() {
  const confirmacion = confirm("⚠️ Esta acción eliminará TODOS los servicios registrados. ¿Deseas continuar?");
  if (!confirmacion) return;

  fetch('/api/servicios/borrar-todos', { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(`✅ Se eliminaron ${data.deleted} servicios.`);
        cargarServiciosDelDia();
      } else {
        alert('❌ Error al borrar servicios: ' + data.error);
      }
    })
    .catch(err => {
      console.error(err);
      alert('❌ Error de red al intentar borrar los servicios.');
    });
}

document.getElementById('btnBorrarServicios')?.addEventListener('click', borrarTodosLosServicios);

// ==============================
// Cargar servicios del día actual
// ==============================
function cargarServiciosDelDia() {
  const hoy = obtenerFechaLocalISO();
  fetch(`/api/servicios?inicio=${hoy}&fin=${hoy}`)
    .then(res => res.json())
    .then(servicios => {
      mostrarServiciosEnTabla(servicios); // función personalizada si aplica
    });
}



// ==============================
// 🔔 NOTIFICACIONES POR WHATSAPP
// ==============================
// ... [mostrarModalNotificaciones, cerrarModalNotificaciones, enviarWhatsapp]
document.getElementById("btnNotificaciones").addEventListener("click", async () => {
  const res = await fetch("/api/servicios/pendientes-notificar");
  const servicios = await res.json();
  mostrarModalNotificaciones(servicios);
});

function mostrarModalNotificaciones(servicios) {
  const tbody = document.querySelector("#tabla-notificaciones tbody");
  tbody.innerHTML = "";

  const notificados = JSON.parse(localStorage.getItem("notificados") || "[]");

  if (servicios.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">✅ No hay notificaciones pendientes</td></tr>`;
    return document.getElementById("modal-notificaciones").style.display = "flex";
  }

  servicios.forEach(s => {
    const tr = document.createElement("tr");

    const yaNotificado = notificados.includes(s.folio);

    tr.innerHTML = `
      <td>${s.folio}</td>
      <td>${s.marca}</td>
      <td>${s.modelo}</td>
      <td>${s.whatsapp}</td>
      <td>
        <button 
          onclick="enviarWhatsapp('${s.whatsapp}', '${s.marca}', '${s.modelo}', this, '${s.folio}')"
          ${yaNotificado ? "disabled" : ""}
        >
          ${yaNotificado ? "✅ Enviado" : "📲 Enviar"}
        </button>
      </td>
    `;

    if (yaNotificado) {
      tr.classList.add("fila-enviada");
    }

    tbody.appendChild(tr);
  });

  document.getElementById("modal-notificaciones").style.display = "flex";
}

function cerrarModalNotificaciones() {
  document.getElementById("modal-notificaciones").style.display = "none";
}

function enviarWhatsapp(numero, marca, modelo, btn, folio) {
  const mensaje = encodeURIComponent(`Hola 👋, su vehículo ${marca} ${modelo} ya está listo para entrega. ¡Gracias por elegirnos!`);
  const url = `https://wa.me/52${numero}?text=${mensaje}`;
  window.open(url, "_blank");

  // Cambiar visualmente
  btn.textContent = "✅ Enviado";
  btn.disabled = true;
  btn.closest("tr").classList.add("fila-enviada");

  // Marcar en base de datos
  fetch("/api/servicios/marcar-notificado", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folio })
  }).then(res => res.json())
    .then(data => {
      if (!data.success) {
        alert("⚠️ Error al marcar como notificado");
      }
    });
}

// ==============================
// 👥 GESTIÓN DE USUARIOS
// ==============================
// ... [crearUsuario, cargarUsuarios, cambiarClave, eliminarUsuario, cargarUsuariosEnSelect, cambiarTab]
function mostrarLoginModal() {
  cerrarModalAjustes();
  document.getElementById('loginModal').style.display = 'flex';
}

function abrirPestana(evt, nombrePestana) {
  const tabs = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].style.display = "none";
  }

  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }

  document.getElementById(nombrePestana).style.display = "block";
  evt.currentTarget.classList.add("active");

  if (nombrePestana === "usuarios") cargarUsuarios();
}

function crearUsuario() {
  const nombre = document.getElementById('nuevoNombre').value;
  const clave = document.getElementById('nuevaClave').value;
  const rol = document.getElementById('nuevoRol').value;

  fetch('/api/usuarios/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, clave, rol })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Usuario creado correctamente');
        cargarUsuarios();
      } else {
        alert('Error al crear usuario: ' + data.message);
      }
    });
}

function cargarUsuarios() {
  fetch('/api/usuarios')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('selectUsuario');
      select.innerHTML = '';
      data.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.nombre} (${u.rol})`;
        select.appendChild(opt);
      });
    });
}
function cambiarClave() {
  const id = document.getElementById('selectUsuario').value;
  const nuevaClave = document.getElementById('claveNueva').value;

  fetch('/api/usuarios/cambiar-clave', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nuevaClave })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Contraseña actualizada');
        document.getElementById('claveNueva').value = '';
      } else {
        alert('Error al cambiar contraseña');
      }
    });
}

function cambiarTab(tab) {
  const tabs = ['generales', 'paquetes', 'usuarios'];

  tabs.forEach(t => {
    const tabContent = document.getElementById(`tab-${t}`);
    const tabBtn = document.querySelector(`.tab-btn[onclick*="${t}"]`);

    if (tabContent) tabContent.style.display = (t === tab) ? "block" : "none";
    if (tabBtn) tabBtn.classList.toggle('active', t === tab);
  });

  if (tab === 'usuarios') {
    cargarUsuariosEnSelect();
  }
}
async function cargarUsuariosEnSelect() {
  try {
    const res = await fetch("/api/usuarios");
    const usuarios = await res.json();
    const select = document.getElementById("selectUsuario");

    if (!select) return;

    select.innerHTML = ""; // Limpiar opciones anteriores

    usuarios.forEach(user => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = `${user.nombre} (${user.rol})`;
      select.appendChild(option);
    });

  } catch (err) {
    console.error("Error al cargar usuarios:", err);
  }
}

async function eliminarUsuario() {
  const select = document.getElementById("selectUsuario");
  const userId = select.value;
  const nombre = select.options[select.selectedIndex].textContent;

  if (!userId) {
    alert("Selecciona un usuario para eliminar.");
    return;
  }

  if (!confirm(`¿Estás seguro de eliminar a ${nombre}? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/usuarios/${userId}`, {
      method: "DELETE"
    });

    if (res.ok) {
      alert("Usuario eliminado correctamente ✅");
      await cargarUsuariosEnSelect(); // Refresca el listado
    } else {
      alert("Error al eliminar el usuario.");
    }
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    alert("Ocurrió un error al eliminar.");
  }
}


// ==============================
// 💰 MÓDULO DE CORTE DE CAJA
// ==============================
// ... [mostrarCorteCaja, mostrarCorteCajaSinTurno, botón de corte]
document.getElementById("btn-corte").addEventListener("click", () => {
  const hoy = obtenerFechaLocalISO(); // ✅ USO correcto


  fetch(`/api/servicios?inicio=${hoy}&fin=${hoy}`)
    .then(res => res.json())
    .then(data => mostrarCorteCajaSinTurno(data, hoy))
    .catch(err => {
      console.error("Error al obtener corte de caja:", err);
      alert("No se pudo generar el corte.");
    });
});
function mostrarCorteCaja(data) {
  const cont = document.getElementById("detalle-corte");
  const { turno, servicios, total, cantidad } = data;

  let html = `
    <p><strong>Turno:</strong> ${turno.id}</p>
    <p><strong>Operador:</strong> ${turno.operador}</p>
    <p><strong>Inicio:</strong> ${formatearFecha(turno.inicio)}</p>
    <p><strong>Fin:</strong> ${turno.fin ? formatearFecha(turno.fin) : '(aún abierto)'}</p>
    <hr>
    <table style="width: 100%; border-collapse: collapse;" border="1" cellpadding="5">
      <thead>
        <tr><th>Servicio</th><th>Cantidad</th><th>Total</th></tr>
      </thead>
      <tbody>
  `;

  const resumen = {};
  servicios.forEach(s => {
    if (!resumen[s.paquete]) {
      resumen[s.paquete] = { cantidad: 0, total: 0 };
    }
    resumen[s.paquete].cantidad++;
    resumen[s.paquete].total += s.precio;
  });

  for (const paquete in resumen) {
    const r = resumen[paquete];
    html += `<tr>
      <td>${paquete}</td>
      <td style="text-align:center;">${r.cantidad}</td>
      <td style="text-align:right;">$${r.total.toFixed(2)}</td>
    </tr>`;
  }

  html += `
      </tbody>
    </table>
    <hr>
    <p><strong>Total servicios:</strong> ${cantidad}</p>
    <p><strong>Total ingresos:</strong> $${total.toFixed(2)}</p>
    <button onclick="cerrarTurnoDesdeCorte(${turno.id})" style="margin-top: 15px;">🔒 Cerrar Turno</button>
  `;

  cont.innerHTML = html;
  document.getElementById("corte-caja").style.display = "block";
}

function mostrarCorteCajaSinTurno(servicios, fechaTexto) {
  const cont = document.getElementById("detalle-corte");

  const total = servicios.reduce((sum, s) => sum + parseFloat(s.precio), 0);
  const cantidad = servicios.length;

  let html = `
    <p><strong>Fecha:</strong> ${fechaTexto}</p>
    <hr>
    <table style="width: 100%; border-collapse: collapse;" border="1" cellpadding="5">
      <thead>
        <tr><th>Servicio</th><th>Cantidad</th><th>Total</th></tr>
      </thead>
      <tbody>
  `;

  const resumen = {};
  servicios.forEach(s => {
    if (!resumen[s.paquete]) {
      resumen[s.paquete] = { cantidad: 0, total: 0 };
    }
    resumen[s.paquete].cantidad++;
    resumen[s.paquete].total += s.precio;
  });

  for (const paquete in resumen) {
    const r = resumen[paquete];
    html += `<tr>
      <td>${paquete}</td>
      <td style="text-align:center;">${r.cantidad}</td>
      <td style="text-align:right;">$${r.total.toFixed(2)}</td>
    </tr>`;
  }

  html += `
      </tbody>
    </table>
    <hr>
    <p><strong>Total servicios:</strong> ${cantidad}</p>
    <p><strong>Total ingresos:</strong> $${total.toFixed(2)}</p>
  `;

  cont.innerHTML = html;
  document.getElementById("corte-caja").style.display = "block";
}
async function cerrarTurnoDesdeCorte(turnoId) {
  const confirmar = confirm(`¿Deseas cerrar el turno #${turnoId}? Esta acción no se puede deshacer.`);
  if (!confirmar) return;

  try {
    const res = await fetch("/api/turnos/cerrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: turnoId })
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ Turno cerrado correctamente.");
      document.getElementById("turnoActual").textContent = "Sin turno activo";
      // Opcional: ocultar corte
      // document.getElementById("corte-caja").style.display = "none";
    } else {
      alert("❌ No se pudo cerrar el turno.");
    }
  } catch (err) {
    console.error("Error cerrando turno:", err);
    alert("⚠️ Error al cerrar turno.");
  }
}


// ==============================
// 🔄 INICIALIZACIÓN DE COMPONENTES AL CARGAR

window.addEventListener("DOMContentLoaded", async () => {
  if (!usuarioActual) {
    mostrarLoginModal();
    return;
  }

  await verificarTurnoActivo();
  renderizarBotonesDesdeBD();
});

//TURNOS CONFIGURACIÓN
async function verificarTurnoActivo() {
  try {
    const res = await fetch('/api/turnos/activo');
    const data = await res.json();

    if (data.activo && data.turno && data.turno.id) {
      localStorage.setItem('turnoId', data.turno.id);
    } else {
      mostrarModalAbrirTurno();
    }
  } catch (error) {
    console.error("Error verificando turno activo:", error);
    alert("Error al verificar turno activo.");
  }
}



function mostrarModalTurno() {
  document.getElementById("modal-turno").style.display = "flex";
}

async function iniciarTurno() {
  const operador = document.getElementById("turno-operador").value;
  const clave = document.getElementById("turno-clave").value;

  if (!operador || !clave) {
    alert("Debes ingresar operador y clave.");
    return;
  }

  const res = await fetch("/api/turnos/iniciar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operador, clave })
  });

  const data = await res.json();

  if (data.success) {
    sessionStorage.setItem("turno_id", data.id);
    document.getElementById("modal-turno").style.display = "none";
  } else {
    alert("Error al iniciar turno.");
  }
}

// ==============================
window.addEventListener('DOMContentLoaded', () => {
  renderizarBotonesDesdeBD();
});