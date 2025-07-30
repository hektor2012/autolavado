let configTicketCache = {}; // Se cargará desde la BD al iniciar

let usuarioActual = null; // Se guarda usuario logueado

function iniciarSesion() {
  const nombre = document.getElementById('loginUsuario').value;
  const clave = document.getElementById('loginClave').value;

  fetch('/api/usuarios/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, clave })
  })
    .then(res => res.json())
    .then(async data => { // 👈 ahora es async
      if (data.success) {
        usuarioActual = data.usuario;
        document.getElementById('loginModal').style.display = 'none';
        actualizarUIsegunRol();
        await cargarConfiguracionDesdeBD(); // ✅ cargar config inmediatamente
      } else {
        alert('Credenciales incorrectas');
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





// ==============================
// MODAL DE SERVICIO
// ==============================

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
// ✅ Esta función debe ir FUERA del event listener
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

// 🎯 Este es el botón de aceptar del modal
document.getElementById("btn-modal-aceptar").addEventListener('click', () => {
  const marca = document.getElementById("input-marca").value;
  const modelo = document.getElementById("input-modelo").value;
  const whatsapp = document.getElementById("input-whatsapp").value;
  const notificar = document.getElementById("input-notificar").checked;
  const precio = parseFloat(precioEl.innerText.replace("Precio: $", ""));
  const folio = generarFolio(); // ✅ Aquí se llama

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
      folio  // ✅ Se envía al backend
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
      folio  // ✅ Se imprime también
    });
  });
});



  // Aquí irá lógica para guardar/imprimir
  cerrarModal();
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
          ${datos.notificar
  ? `<strong>📲 Aviso:</strong> Notificar.<br>`
  : `<strong>⏳ Estado:</strong> En espera.<br>`}

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

  // Imprimir 2 copias
  iframe.onload = () => {
    iframe.contentWindow.print();
    setTimeout(() => iframe.contentWindow.print(), 500); // segunda copia
  };
}


// ==============================
// MODAL DE AJUSTES
// ==============================

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
  configTicketCache = data; // 🔁 Actualiza el caché en memoria

  alert("Ajustes guardados correctamente ✅");
  cerrarModalAjustes();
});
function cerrarModalAjustes() {
  document.getElementById("modal-ajustes").style.display = "none";
}

// ==============================
// GESTIÓN DE PAQUETES (AJUSTES)
// ==============================

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
          <td><button onclick="eliminarPaquete(${pkg.id})">🗑</button></td>
        `;
        tabla.appendChild(row);
      });
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
      renderizarBotonesDesdeBD(); // Actualizar vista principal
    });
});

function eliminarPaquete(id) {
  if (!confirm("¿Eliminar este paquete?")) return;

  fetch(`/api/paquetes/${id}`, {
    method: "DELETE"
  }).then(() => {
    cargarPaquetes();
    renderizarBotonesDesdeBD(); // Actualizar vista principal
  });
}

// ==============================
// BOTONES DINÁMICOS PRINCIPALES
// ==============================

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
        btn.dataset.nombre = paquete.nombre;
        btn.dataset.precio = paquete.precio;

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

window.addEventListener('DOMContentLoaded', () => {
  renderizarBotonesDesdeBD();
});

document.getElementById("btnReporte").addEventListener("click", () => {
  document.getElementById("modal-reportes").style.display = "flex";
});

function cerrarModalReporte() {
  document.getElementById("modal-reportes").style.display = "none";
}
// ==============================
// FUNCIONES DE REPORTE
// ==============================

document.getElementById("btnReporte").addEventListener("click", () => {
  document.getElementById("modal-reportes").style.display = "flex";
  cargarReporte(); // Por defecto, carga el día actual
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

function cerrarModalReporte() {
  document.getElementById("modal-reportes").style.display = "none";
}

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

      data.forEach(s => {
        const fecha = new Date(s.fecha);
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${fecha.toLocaleDateString()}</td>
          <td>${fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td>${s.paquete}</td>
          <td>${s.marca} / ${s.modelo}</td>
          <td>$${parseFloat(s.precio).toFixed(2)}</td>
        `;
        tabla.appendChild(row);

        total += parseFloat(s.precio);
      });

      document.getElementById("total-dia").innerText = total.toFixed(2);
      document.getElementById("total-servicios").innerText = data.length;
    });
}

function cargarReporte() {
  const inicioInput = document.getElementById("filtro-inicio");
  const finInput = document.getElementById("filtro-fin");

  // Si no hay fechas definidas, usamos la de hoy
  const hoy = new Date().toISOString().split("T")[0];
  const inicio = inicioInput.value || hoy;
  const fin = finInput.value || hoy;

  fetch(`/api/servicios?inicio=${inicio}&fin=${fin}`)
    .then(res => res.json())
    .then(data => {
      const tabla = document.getElementById("tabla-reporte");
      const totalServicios = document.getElementById("total-servicios");
      const totalDia = document.getElementById("total-dia");

      tabla.innerHTML = "";
      let total = 0;

      data.forEach(row => {
        total += parseFloat(row.precio);

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.fecha}</td>
          <td>${row.hora}</td>
          <td>${row.paquete}</td>
          <td>${row.marca} / ${row.modelo}</td>
          <td>$${parseFloat(row.precio).toFixed(2)}</td>
        `;
        tabla.appendChild(tr);
      });

      totalServicios.textContent = data.length;
      totalDia.textContent = total.toFixed(2);
    })
    .catch(err => {
      console.error("Error cargando reporte:", err);
    });
}
function borrarTodosLosServicios() {
  const confirmacion = confirm("⚠️ Esta acción eliminará TODOS los servicios registrados. ¿Deseas continuar?");
  if (!confirmacion) return;

  fetch('/api/servicios/borrar-todos', {
    method: 'DELETE'
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert(`✅ Se eliminaron ${data.deleted} servicios.`);
      cargarServiciosDelDia(); // Asegúrate de tener esta función implementada
    } else {
      alert('❌ Error al borrar servicios: ' + data.error);
    }
  })
  .catch(err => {
    console.error(err);
    alert('❌ Error de red al intentar borrar los servicios.');
  });
}
document.getElementById('btnBorrarServicios').addEventListener('click', borrarTodosLosServicios);

function cargarServiciosDelDia() {
  const hoy = new Date().toISOString().split('T')[0];
  fetch(`/api/servicios?inicio=${hoy}&fin=${hoy}`)
    .then(res => res.json())
    .then(servicios => {
      mostrarServiciosEnTabla(servicios); // ← tu función que actualiza la tabla del modal
    });
}
function mostrarLoginModal() {
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
  method: 'PUT', // ← debe ser PUT
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
  const tabs = ['generales', 'paquetes', 'usuarios']; // Incluye todas las pestañas

  tabs.forEach(t => {
    const tabContent = document.getElementById(`tab-${t}`);
    const tabBtn = document.querySelector(`.tab-btn[onclick*="${t}"]`);

    if (tabContent) tabContent.style.display = (t === tab) ? "block" : "none";
    if (tabBtn) tabBtn.classList.toggle('active', t === tab);
  });

  // ✅ Recargar usuarios cada vez que se abre la pestaña
  if (tab === 'usuarios') {
    cargarUsuariosEnSelect();
  }
}





function mostrarLoginModal() {
  cerrarModalAjustes(); // Asegura que el de ajustes se cierre si estaba abierto
  document.getElementById('loginModal').style.display = 'flex';
}
// Abrir modal al hacer clic en el botón
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
// ... funciones enviar whatsapp

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



