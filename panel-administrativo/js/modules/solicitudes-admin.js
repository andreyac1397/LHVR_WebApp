/**
 * Consulta y seguimiento de solicitudes administrativas.
 */
(function iniciarSolicitudes(global) {
  "use strict";

  const cuerpo = document.body;
  const apiBase = cuerpo.dataset.apiSolicitudes;

  if (!apiBase) {
    return;
  }

  const api = global.API_ADMIN_CLIENT;
  const alertas = global.AlertasAdmin;
  let solicitudes = [];
  let solicitudActual = null;

  function obtener(id) {
    return document.getElementById(id);
  }

  function texto(valor) {
    return valor === null || valor === undefined
      ? ""
      : String(valor).trim();
  }

  function escapar(valor) {
    return texto(valor)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatearFecha(valor) {
    if (!valor) {
      return "—";
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return texto(valor) || "—";
    }

    return new Intl.DateTimeFormat(
      "es-CR",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    ).format(fecha);
  }

  function notificar(tipo, titulo, mensaje) {
    if (alertas && typeof alertas[tipo] === "function") {
      alertas[tipo](titulo, mensaje);
      return;
    }

    console.log(titulo, mensaje);
  }

  function mostrarError(error) {
    notificar(
      "error",
      "No fue posible completar la operación",
      error?.message || "Ocurrió un error inesperado."
    );
    console.error(error);
  }

  function renderizar() {
    const cuerpoTabla = obtener("cuerpoTablaSolicitudes");
    const estadoVacio = obtener("estadoVacioSolicitudes");
    const busqueda = texto(obtener("buscarSolicitud")?.value)
      .toLocaleLowerCase("es");
    const estado = texto(obtener("filtrarEstadoSolicitud")?.value);

    const filtradas = solicitudes.filter((solicitud) => {
      const coincideBusqueda = !busqueda || [
        solicitud.nombreCompleto,
        solicitud.correo,
        solicitud.asunto,
        solicitud.mensaje
      ].some((valor) =>
        texto(valor).toLocaleLowerCase("es").includes(busqueda)
      );

      const coincideEstado = !estado || solicitud.estado === estado;
      return coincideBusqueda && coincideEstado;
    });

    cuerpoTabla?.replaceChildren();

    if (estadoVacio) {
      estadoVacio.hidden = filtradas.length > 0;
    }

    filtradas.forEach((solicitud) => {
      const fila = document.createElement("tr");
      const asunto = solicitud.asunto || "Sin asunto";

      fila.innerHTML = `
        <td>
          <strong>${escapar(solicitud.nombreCompleto)}</strong>
          <small>${escapar(solicitud.correo)}</small>
        </td>
        <td>
          <strong>${escapar(asunto)}</strong>
          <small>${escapar(texto(solicitud.mensaje).slice(0, 120))}</small>
        </td>
        <td>${formatearFecha(solicitud.fechaCreacion)}</td>
        <td><span class="admin-etiqueta">${escapar(solicitud.estado)}</span></td>
        <td>
          <button
            class="admin-boton admin-boton--secundario admin-boton--pequeno"
            type="button"
            data-id-solicitud="${solicitud.idSolicitud}"
          >
            Revisar
          </button>
        </td>
      `;

      cuerpoTabla?.appendChild(fila);
    });

    const pendientes = solicitudes.filter(
      (item) => item.estado === "PENDIENTE"
    ).length;
    const atendidas = solicitudes.filter(
      (item) => item.estado === "ATENDIDA"
    ).length;

    if (obtener("totalSolicitudes")) {
      obtener("totalSolicitudes").textContent = String(solicitudes.length);
    }

    if (obtener("solicitudesPendientes")) {
      obtener("solicitudesPendientes").textContent = String(pendientes);
    }

    if (obtener("solicitudesAtendidas")) {
      obtener("solicitudesAtendidas").textContent = String(atendidas);
    }
  }

  async function cargar() {
    const respuesta = await api.get(`/${apiBase}/administracion`);
    solicitudes = respuesta?.datos?.solicitudes || [];
    renderizar();
  }

  function abrirDetalle(idSolicitud) {
    solicitudActual = solicitudes.find(
      (item) => Number(item.idSolicitud) === Number(idSolicitud)
    );

    if (!solicitudActual) {
      return;
    }

    obtener("detalleNombre").textContent = solicitudActual.nombreCompleto;
    obtener("detalleCorreo").textContent = solicitudActual.correo;
    obtener("detalleTelefono").textContent =
      solicitudActual.telefono || "No indicado";
    obtener("detalleAsunto").textContent =
      solicitudActual.asunto || "Sin asunto";
    obtener("detalleMensaje").textContent = solicitudActual.mensaje;
    obtener("estadoSolicitud").value = solicitudActual.estado;
    obtener("respuestaSolicitud").value = solicitudActual.respuesta || "";

    obtener("modalSolicitud").hidden = false;
    document.body.classList.add("modal-abierto");
  }

  function cerrarDetalle() {
    obtener("modalSolicitud").hidden = true;
    document.body.classList.remove("modal-abierto");
    solicitudActual = null;
  }

  async function guardarDetalle(evento) {
    evento.preventDefault();

    if (!solicitudActual) {
      return;
    }

    try {
      await api.put(
        `/${apiBase}/${solicitudActual.idSolicitud}`,
        {
          estado: obtener("estadoSolicitud").value,
          respuesta: obtener("respuestaSolicitud").value.trim()
        }
      );
      cerrarDetalle();
      await cargar();
      notificar(
        "exito",
        "Solicitud actualizada",
        "El estado y la respuesta se guardaron correctamente."
      );
    } catch (error) {
      mostrarError(error);
    }
  }

  function vincularEventos() {
    obtener("buscarSolicitud")?.addEventListener("input", renderizar);
    obtener("filtrarEstadoSolicitud")?.addEventListener("change", renderizar);
    obtener("botonRecargarSolicitudes")?.addEventListener(
      "click",
      () => cargar().catch(mostrarError)
    );
    obtener("cuerpoTablaSolicitudes")?.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-id-solicitud]");
      if (boton) {
        abrirDetalle(boton.dataset.idSolicitud);
      }
    });
    obtener("formularioSolicitud")?.addEventListener("submit", guardarDetalle);
    obtener("cerrarModalSolicitud")?.addEventListener("click", cerrarDetalle);
    obtener("cancelarModalSolicitud")?.addEventListener("click", cerrarDetalle);
  }

  async function inicializar() {
    vincularEventos();

    try {
      await cargar();
    } catch (error) {
      mostrarError(error);
      renderizar();
    }
  }

  document.addEventListener("DOMContentLoaded", inicializar);
})(window);
