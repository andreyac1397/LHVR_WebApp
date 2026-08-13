(function iniciarAdministradores(global) {
  "use strict";

  const api = global.API_ADMIN_CLIENT;
  const cuerpo = document.getElementById("cuerpoAdministradores");
  const busqueda = document.getElementById("busquedaAdministradores");
  const filtroEstado = document.getElementById("filtroEstadoAdministradores");
  const estadoVista = document.getElementById("estadoAdministradores");
  const panelNuevo = document.getElementById("panelNuevoAdministrador");
  const formulario = document.getElementById("formularioAdministrador");
  let estados = [];
  let administradores = [];

  const escapar = (valor) => String(valor ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const fecha = (valor) => valor
    ? new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(valor))
    : "—";

  function mostrar(mensaje, tipo = "informacion") {
    estadoVista.textContent = mensaje;
    estadoVista.className = `gestion-contenido__mensaje gestion-contenido__mensaje--${tipo}`;
  }

  function opcionesEstado(idActual) {
    return estados.map((item) => `<option value="${item.idEstadoAdministrador}" ${Number(item.idEstadoAdministrador) === Number(idActual) ? "selected" : ""}>${escapar(item.nombre)}</option>`).join("");
  }

  function cargarSelectores() {
    const actual = filtroEstado.value;
    filtroEstado.innerHTML = '<option value="">Todos</option>' + opcionesEstado(actual);
    filtroEstado.value = actual;
    document.getElementById("estadoNuevoAdmin").innerHTML = opcionesEstado(estados.find((item) => item.permiteAcceso)?.idEstadoAdministrador);
  }

  function renderizar() {
    cuerpo.innerHTML = administradores.map((item) => `
      <tr data-id="${item.idAdministrador}">
        <td><strong>${escapar(item.nombreCompleto)}</strong><br><small>${escapar(item.correo)}</small></td>
        <td>${item.correoVerificado ? "Correo verificado" : "Correo pendiente"}<br><small>${item.requiereVerificacion ? "Segundo factor activo" : "Sin segundo factor"}</small></td>
        <td>${escapar(fecha(item.ultimoAcceso))}</td>
        <td><select class="gestion-contenido__control" data-estado>${opcionesEstado(item.idEstadoAdministrador)}</select></td>
        <td><button class="admin-boton admin-boton--primario admin-boton--pequeno" type="button" data-guardar-estado>Guardar</button></td>
      </tr>
    `).join("");
    mostrar(administradores.length ? `${administradores.length} cuenta(s) encontrada(s).` : "No se encontraron cuentas.");
  }

  async function cargar() {
    const parametros = new URLSearchParams();
    if (busqueda.value.trim()) parametros.set("busqueda", busqueda.value.trim());
    if (filtroEstado.value) parametros.set("idEstado", filtroEstado.value);
    mostrar("Cargando cuentas...");
    const respuesta = await api.get(`/administradores${parametros.size ? `?${parametros}` : ""}`);
    administradores = respuesta?.datos?.administradores || [];
    estados = respuesta?.datos?.estados || [];
    cargarSelectores();
    renderizar();
  }

  async function guardarEstado(fila, boton) {
    boton.disabled = true;
    try {
      await api.patch(`/administradores/${fila.dataset.id}/estado`, {
        idEstadoAdministrador: Number(fila.querySelector("[data-estado]").value)
      });
      await cargar();
      mostrar("El estado se actualizó correctamente.", "exito");
    } catch (error) {
      mostrar(error.message || "No fue posible cambiar el estado.", "error");
    } finally {
      boton.disabled = false;
    }
  }

  async function crear(evento) {
    evento.preventDefault();
    const boton = formulario.querySelector('[type="submit"]');
    boton.disabled = true;
    try {
      await api.post("/administradores", {
        nombreCompleto: document.getElementById("nombreNuevoAdmin").value,
        correo: document.getElementById("correoNuevoAdmin").value,
        contrasena: document.getElementById("contrasenaNuevoAdmin").value,
        idEstadoAdministrador: Number(document.getElementById("estadoNuevoAdmin").value)
      });
      formulario.reset();
      panelNuevo.hidden = true;
      await cargar();
      mostrar("La cuenta se creó correctamente.", "exito");
    } catch (error) {
      mostrar(error.message || "No fue posible crear la cuenta.", "error");
    } finally {
      boton.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    let temporizador;
    document.getElementById("botonMostrarNuevoAdmin").addEventListener("click", () => { panelNuevo.hidden = false; });
    document.getElementById("botonCancelarNuevoAdmin").addEventListener("click", () => { panelNuevo.hidden = true; formulario.reset(); });
    formulario.addEventListener("submit", crear);
    filtroEstado.addEventListener("change", () => cargar().catch((error) => mostrar(error.message, "error")));
    busqueda.addEventListener("input", () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => cargar().catch((error) => mostrar(error.message, "error")), 350);
    });
    cuerpo.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-guardar-estado]");
      if (boton) guardarEstado(boton.closest("tr"), boton);
    });
    cargar().catch((error) => mostrar(error.message, "error"));
  });
})(window);
