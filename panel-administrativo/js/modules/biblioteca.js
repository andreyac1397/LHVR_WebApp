(function iniciarSolicitudesBibliocra(global) {
  "use strict";

  const api = global.API_ADMIN_CLIENT;
  const estado = {
    solicitudes: [],
    estados: [],
    destinatarios: [],
    maximoDestinatarios: 3,
    solicitudGestionada: null,
    paginacion: {
      paginaActual: 1,
      limite: 20,
      totalRegistros: 0,
      totalPaginas: 1,
      tieneAnterior: false,
      tieneSiguiente: false
    }
  };

  const obtener = (id) => document.getElementById(id);
  const texto = (valor) => String(valor ?? "").trim();
  const datosRespuesta = (respuesta) => respuesta?.datos ?? respuesta ?? {};

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
      return "Sin registrar";
    }
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime())
      ? texto(valor)
      : new Intl.DateTimeFormat("es-CR", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(fecha);
  }

  function formatearFechaCalendario(valor) {
    const coincidencia = texto(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!coincidencia) {
      return valor ? texto(valor) : "Sin registrar";
    }
    const fecha = new Date(Date.UTC(
      Number(coincidencia[1]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[3])
    ));
    return new Intl.DateTimeFormat("es-CR", {
      dateStyle: "medium",
      timeZone: "UTC"
    }).format(fecha);
  }

  function formatearTipoDestinatario(tipo) {
    return ({
      DOCENTE: "Docente",
      ADMINISTRADOR: "Administrador",
      PADRE_MADRE: "Padre/Madre",
      ESTUDIANTE: "Estudiante",
      SECRETARIA: "Secretaría"
    })[texto(tipo).toUpperCase()] || texto(tipo);
  }

  function informar(mensaje, tipo = "informacion") {
    const elemento = obtener("estadoSolicitudesBibliocra");
    elemento.textContent = mensaje;
    elemento.className =
      `gestion-contenido__mensaje gestion-contenido__mensaje--${tipo}`;
  }

  function notificarExito(titulo, mensaje) {
    if (global.AlertasAdmin?.exito) {
      global.AlertasAdmin.exito(titulo, mensaje);
      return;
    }
    informar(mensaje, "exito");
  }

  function notificarError(error, titulo = "Ocurrió un problema") {
    const mensaje = error?.message || "No fue posible completar la operación.";
    if (global.AlertasAdmin?.error) {
      global.AlertasAdmin.error(titulo, mensaje);
    } else {
      informar(mensaje, "error");
    }
    console.error(error);
  }

  async function confirmar(opciones) {
    if (typeof global.ModalAdmin?.confirmar === "function") {
      return global.ModalAdmin.confirmar(opciones);
    }
    notificarError(
      new Error("No se pudo cargar el componente de confirmación del panel."),
      "No fue posible mostrar la confirmación"
    );
    return false;
  }

  function opcionesEstado(idEstadoSolicitud) {
    return estado.estados.map((item) => `
      <option
        value="${Number(item.idEstadoSolicitud)}"
        ${Number(idEstadoSolicitud) === Number(item.idEstadoSolicitud) ? "selected" : ""}
      >${escapar(item.nombre)}</option>
    `).join("");
  }

  function renderSolicitudes() {
    const filtro = obtener("filtroEstadoBibliocra");
    const filtroActual = filtro.value;
    filtro.innerHTML = '<option value="">Todos los estados</option>' +
      estado.estados.map((item) => `
        <option value="${Number(item.idEstadoSolicitud)}">
          ${escapar(item.nombre)}
        </option>
      `).join("");
    filtro.value = filtroActual;

    const cuerpo = obtener("cuerpoSolicitudesBibliocra");
    cuerpo.innerHTML = estado.solicitudes.map((solicitud) => `
      <tr>
        <td><strong>#${Number(solicitud.idSolicitudBibliocra)}</strong></td>
        <td>${escapar(formatearFecha(solicitud.fechaSolicitud))}</td>
        <td>${escapar(formatearFechaCalendario(solicitud.fechaDevolucion))}</td>
        <td><strong>${escapar(solicitud.nombreSolicitante)}</strong></td>
        <td>${escapar(solicitud.identificacionSolicitante)}</td>
        <td>${escapar(solicitud.tipoSolicitante)}</td>
        <td><strong>${escapar(solicitud.nombreMaterial || "Material sin nombre")}</strong></td>
        <td>${escapar(solicitud.tipoMaterial || "Sin tipo")}</td>
        <td>${escapar(solicitud.estado)}</td>
        <td>
          <button
            class="admin-boton admin-boton--primario admin-boton--pequeno"
            type="button"
            data-gestionar-solicitud="${Number(solicitud.idSolicitudBibliocra)}"
          >Gestionar</button>
        </td>
      </tr>
    `).join("");

    if (!estado.solicitudes.length) {
      cuerpo.innerHTML = `
        <tr>
          <td colspan="10">No hay solicitudes con esos filtros.</td>
        </tr>
      `;
    }

    informar(
      estado.solicitudes.length
        ? `${estado.solicitudes.length} solicitud(es) cargadas.`
        : "No hay solicitudes con esos filtros."
    );
  }

  function renderPaginacionSolicitudes() {
    const inicio = estado.paginacion.totalRegistros
      ? ((estado.paginacion.paginaActual - 1) * estado.paginacion.limite) + 1
      : 0;
    const fin = Math.min(
      estado.paginacion.paginaActual * estado.paginacion.limite,
      estado.paginacion.totalRegistros
    );
    obtener("resumenPaginacionBibliocra").textContent =
      estado.paginacion.totalRegistros
      ? `Mostrando ${inicio}–${fin} de ${estado.paginacion.totalRegistros} registros`
        : "Mostrando 0 de 0 registros";
    obtener("paginaBibliocra").textContent =
      `Página ${estado.paginacion.paginaActual} de ${estado.paginacion.totalPaginas}`;
    obtener("limiteBibliocra").value = String(estado.paginacion.limite);
    obtener("anteriorBibliocra").disabled = !estado.paginacion.tieneAnterior;
    obtener("siguienteBibliocra").disabled = !estado.paginacion.tieneSiguiente;
  }

  async function cargarSolicitudes({ reiniciarPagina = false } = {}) {
    if (reiniciarPagina) {
      estado.paginacion.paginaActual = 1;
    }
    const parametros = new URLSearchParams();
    parametros.set("pagina", estado.paginacion.paginaActual);
    parametros.set("limite", estado.paginacion.limite);
    const filtro = obtener("filtroEstadoBibliocra").value;
    const busqueda = texto(obtener("busquedaBibliocra").value);
    if (filtro) {
      parametros.set("idEstado", filtro);
    }
    if (busqueda) {
      parametros.set("busqueda", busqueda);
    }

    const respuesta = await api.get(
      `/solicitudes-bibliocra/administracion${
        parametros.size ? `?${parametros}` : ""
      }`
    );
    const datos = datosRespuesta(respuesta);
    estado.solicitudes = Array.isArray(datos.solicitudes)
      ? datos.solicitudes
      : [];
    estado.estados = Array.isArray(datos.estados)
      ? datos.estados
      : [];
    estado.paginacion = {
      paginaActual: Number(datos.paginaActual) || 1,
      limite: Number(datos.limite) || 20,
      totalRegistros: Number(datos.totalRegistros) || 0,
      totalPaginas: Number(datos.totalPaginas) || 1,
      tieneAnterior: Boolean(datos.tieneAnterior),
      tieneSiguiente: Boolean(datos.tieneSiguiente)
    };
    renderSolicitudes();
    renderPaginacionSolicitudes();
  }

  function detalle(etiqueta, valor, completo = false) {
    return `
      <div class="biblioteca-solicitudes__detalle-item${completo ? " biblioteca-solicitudes__detalle-item--completo" : ""}">
        <strong>${escapar(etiqueta)}</strong>
        <span>${escapar(valor || "No indicado")}</span>
      </div>
    `;
  }

  function abrirGestionSolicitud(idSolicitud) {
    const solicitud = estado.solicitudes.find(
      (item) => Number(item.idSolicitudBibliocra) === Number(idSolicitud)
    );
    if (!solicitud) {
      return;
    }

    estado.solicitudGestionada = solicitud;
    obtener("tituloModalGestionSolicitudBibliocra").textContent =
      `Gestionar solicitud #${solicitud.idSolicitudBibliocra}`;
    obtener("detalleGestionSolicitudBibliocra").innerHTML = [
      detalle("Solicitante", solicitud.nombreSolicitante),
      detalle("Identificación", solicitud.identificacionSolicitante),
      detalle("Tipo de usuario", solicitud.tipoSolicitante),
      detalle("Fecha", formatearFecha(solicitud.fechaSolicitud)),
      detalle("Sección", solicitud.nivelSeccion),
      detalle("Teléfono", solicitud.telefono),
      detalle("Correo", solicitud.correo, true),
      detalle("Material", solicitud.nombreMaterial, true),
      detalle("Tipo de préstamo", solicitud.tipoMaterial),
      detalle("Datos del material", solicitud.observacionesMaterial, true),
      detalle("Observaciones del solicitante", solicitud.observacionesSolicitante, true)
    ].join("");
    obtener("estadoGestionSolicitudBibliocra").innerHTML =
      opcionesEstado(solicitud.idEstadoSolicitud);
    obtener("observacionGestionSolicitudBibliocra").value =
      texto(solicitud.observacionesInternas);
    obtener("modalGestionSolicitudBibliocra").hidden = false;
    document.body.classList.add("modal-abierto");
    global.setTimeout(() => obtener("estadoGestionSolicitudBibliocra").focus(), 0);
  }

  function cerrarGestionSolicitud() {
    estado.solicitudGestionada = null;
    obtener("modalGestionSolicitudBibliocra").hidden = true;
    document.body.classList.remove("modal-abierto");
  }

  async function guardarGestionSolicitud(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    if (!formulario.checkValidity()) {
      formulario.reportValidity();
      return;
    }
    if (!estado.solicitudGestionada) {
      return;
    }

    const boton = obtener("botonGuardarGestionSolicitudBibliocra");
    boton.disabled = true;
    try {
      const respuesta = await api.patch(
        `/solicitudes-bibliocra/administracion/${estado.solicitudGestionada.idSolicitudBibliocra}`,
        {
          idEstadoSolicitud: Number(
            obtener("estadoGestionSolicitudBibliocra").value
          ),
          observacionesInternas:
            texto(obtener("observacionGestionSolicitudBibliocra").value) || null
        }
      );
      const resultado = datosRespuesta(respuesta);
      cerrarGestionSolicitud();
      await cargarSolicitudes();
      notificarExito(
        "Solicitud actualizada",
        resultado.cambioEstado && resultado.notificacionSolicitanteEnviada
          ? "El estado se guardó y se notificó por correo a la persona solicitante."
          : resultado.cambioEstado
            ? "El estado se guardó, pero no fue posible enviar el correo a la persona solicitante."
            : "La solicitud se guardó sin cambiar su estado."
      );
    } finally {
      boton.disabled = false;
    }
  }

  function renderDestinatarios() {
    const cuerpo = obtener("cuerpoDestinatariosBibliocra");
    const vacio = obtener("destinatariosBibliocraVacios");
    const botonAgregar = obtener("botonAgregarDestinatarioBibliocra");
    const cantidad = estado.destinatarios.length;

    cuerpo.innerHTML = estado.destinatarios.map((destinatario) => `
      <tr>
        <td><strong>${escapar(destinatario.nombre)}</strong></td>
        <td>${escapar(destinatario.correo)}</td>
        <td>${escapar(formatearTipoDestinatario(destinatario.tipo))}</td>
        <td>
          <button
            class="admin-boton admin-boton--peligro admin-boton--pequeno"
            type="button"
            data-eliminar-destinatario="${Number(destinatario.idDestinatario)}"
          >Eliminar</button>
        </td>
      </tr>
    `).join("");

    vacio.hidden = cantidad > 0;
    obtener("contadorDestinatariosBibliocra").textContent =
      `${cantidad} de ${estado.maximoDestinatarios}`;
    botonAgregar.disabled = cantidad >= estado.maximoDestinatarios;
    botonAgregar.title = botonAgregar.disabled
      ? "Se alcanzó el máximo de tres destinatarios."
      : "Agregar un destinatario";
  }

  async function cargarDestinatarios() {
    const respuesta = await api.get(
      "/solicitudes-bibliocra/administracion/destinatarios"
    );
    const datos = datosRespuesta(respuesta);
    estado.destinatarios = Array.isArray(datos.destinatarios)
      ? datos.destinatarios
      : [];
    estado.maximoDestinatarios = Number(datos.maximo) || 3;
    renderDestinatarios();
  }

  function abrirModalDestinatario() {
    if (estado.destinatarios.length >= estado.maximoDestinatarios) {
      return;
    }
    const formulario = obtener("formularioDestinatarioBibliocra");
    formulario.reset();
    obtener("modalDestinatarioBibliocra").hidden = false;
    document.body.classList.add("modal-abierto");
    global.setTimeout(() => obtener("nombreDestinatarioBibliocra").focus(), 0);
  }

  function cerrarModalDestinatario() {
    obtener("modalDestinatarioBibliocra").hidden = true;
    document.body.classList.remove("modal-abierto");
  }

  async function agregarDestinatario(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    if (!formulario.checkValidity()) {
      formulario.reportValidity();
      return;
    }

    const boton = obtener("botonGuardarDestinatarioBibliocra");
    boton.disabled = true;
    try {
      await api.post(
        "/solicitudes-bibliocra/administracion/destinatarios",
        {
          nombre: texto(obtener("nombreDestinatarioBibliocra").value),
          correo: texto(obtener("correoDestinatarioBibliocra").value).toLowerCase(),
          tipo: texto(obtener("tipoDestinatarioBibliocra").value).toUpperCase()
        }
      );
      cerrarModalDestinatario();
      await cargarDestinatarios();
      notificarExito(
        "Destinatario agregado",
        "El destinatario recibirá las nuevas solicitudes BiblioCRA."
      );
    } finally {
      boton.disabled = false;
    }
  }

  async function eliminarDestinatario(idDestinatario) {
    const destinatario = estado.destinatarios.find(
      (item) => Number(item.idDestinatario) === Number(idDestinatario)
    );
    if (!destinatario) {
      return;
    }

    const confirmado = await confirmar({
      tipo: "peligro",
      titulo: "Eliminar destinatario",
      mensaje: `¿Desea eliminar a “${destinatario.nombre}”?`,
      detalle: `${destinatario.correo} dejará de recibir nuevas solicitudes BiblioCRA.`,
      textoConfirmar: "Eliminar",
      textoCancelar: "Cancelar"
    });
    if (!confirmado) {
      return;
    }

    await api.delete(
      `/solicitudes-bibliocra/administracion/destinatarios/${idDestinatario}`
    );
    await cargarDestinatarios();
    notificarExito(
      "Destinatario eliminado",
      "El destinatario fue eliminado correctamente."
    );
  }

  function vincularEventos() {
    let temporizadorBusqueda;
    obtener("filtroEstadoBibliocra").addEventListener(
      "change",
      () => cargarSolicitudes({ reiniciarPagina: true }).catch((error) =>
        notificarError(error, "No fue posible cargar las solicitudes")
      )
    );
    obtener("busquedaBibliocra").addEventListener("input", () => {
      global.clearTimeout(temporizadorBusqueda);
      temporizadorBusqueda = global.setTimeout(
        () => cargarSolicitudes({ reiniciarPagina: true }).catch((error) =>
          notificarError(error, "No fue posible buscar solicitudes")
        ),
        350
      );
    });
    obtener("limiteBibliocra").addEventListener("change", () => {
      estado.paginacion.limite = Number(obtener("limiteBibliocra").value) || 20;
      cargarSolicitudes({ reiniciarPagina: true }).catch((error) =>
        notificarError(error, "No fue posible cargar las solicitudes")
      );
    });
    obtener("anteriorBibliocra").addEventListener("click", () => {
      if (!estado.paginacion.tieneAnterior) return;
      estado.paginacion.paginaActual -= 1;
      cargarSolicitudes().catch((error) =>
        notificarError(error, "No fue posible cargar las solicitudes")
      );
    });
    obtener("siguienteBibliocra").addEventListener("click", () => {
      if (!estado.paginacion.tieneSiguiente) return;
      estado.paginacion.paginaActual += 1;
      cargarSolicitudes().catch((error) =>
        notificarError(error, "No fue posible cargar las solicitudes")
      );
    });
    obtener("cuerpoSolicitudesBibliocra").addEventListener(
      "click",
      (evento) => {
        const boton = evento.target.closest("[data-gestionar-solicitud]");
        if (boton) {
          abrirGestionSolicitud(boton.dataset.gestionarSolicitud);
        }
      }
    );

    obtener("botonCerrarGestionSolicitudBibliocra").addEventListener(
      "click",
      cerrarGestionSolicitud
    );
    obtener("botonCancelarGestionSolicitudBibliocra").addEventListener(
      "click",
      cerrarGestionSolicitud
    );
    obtener("modalGestionSolicitudBibliocra").addEventListener(
      "click",
      (evento) => {
        if (evento.target === evento.currentTarget) {
          cerrarGestionSolicitud();
        }
      }
    );
    obtener("formularioGestionSolicitudBibliocra").addEventListener(
      "submit",
      (evento) => guardarGestionSolicitud(evento).catch((error) =>
        notificarError(error, "No fue posible actualizar la solicitud")
      )
    );

    obtener("botonAgregarDestinatarioBibliocra").addEventListener(
      "click",
      abrirModalDestinatario
    );
    obtener("botonCerrarDestinatarioBibliocra").addEventListener(
      "click",
      cerrarModalDestinatario
    );
    obtener("botonCancelarDestinatarioBibliocra").addEventListener(
      "click",
      cerrarModalDestinatario
    );
    obtener("modalDestinatarioBibliocra").addEventListener(
      "click",
      (evento) => {
        if (evento.target === evento.currentTarget) {
          cerrarModalDestinatario();
        }
      }
    );
    obtener("formularioDestinatarioBibliocra").addEventListener(
      "submit",
      (evento) => agregarDestinatario(evento).catch((error) =>
        notificarError(error, "No fue posible agregar el destinatario")
      )
    );
    obtener("cuerpoDestinatariosBibliocra").addEventListener(
      "click",
      (evento) => {
        const boton = evento.target.closest("[data-eliminar-destinatario]");
        if (boton) {
          eliminarDestinatario(
            boton.dataset.eliminarDestinatario
          ).catch((error) =>
            notificarError(error, "No fue posible eliminar el destinatario")
          );
        }
      }
    );
    document.addEventListener("keydown", (evento) => {
      if (evento.key !== "Escape") {
        return;
      }
      if (!obtener("modalDestinatarioBibliocra").hidden) {
        cerrarModalDestinatario();
      }
      if (!obtener("modalGestionSolicitudBibliocra").hidden) {
        cerrarGestionSolicitud();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!api) {
      return;
    }
    vincularEventos();
    Promise.all([
      cargarSolicitudes(),
      cargarDestinatarios()
    ]).catch((error) =>
      notificarError(error, "No fue posible cargar Solicitudes BiblioCRA")
    );
  }, { once: true });
})(window);
