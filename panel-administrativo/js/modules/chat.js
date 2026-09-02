(function iniciarChatAdministrativo(global) {
  "use strict";

  const api = global.API_ADMIN_CLIENT;
  const INTERVALO_POLLING = 5000;
  const estado = {
    conversaciones: [],
    estados: [],
    seleccionada: null,
    mensajes: [],
    temporizador: null
  };
  const obtener = (id) => document.getElementById(id);
  const datosRespuesta = (respuesta) => respuesta?.datos ?? respuesta ?? {};

  function fecha(valor) {
    if (!valor) {
      return "—";
    }
    const objeto = new Date(valor);
    return Number.isNaN(objeto.getTime())
      ? String(valor)
      : new Intl.DateTimeFormat("es-CR", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(objeto);
  }

  function relativo(valor) {
    const momento = new Date(valor).getTime();
    if (!Number.isFinite(momento)) {
      return fecha(valor);
    }
    const diferencia = Date.now() - momento;
    const minutos = Math.max(0, Math.floor(diferencia / 60000));
    if (minutos < 1) return "Ahora";
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;
    return fecha(valor);
  }

  function mostrarLista(mensaje, tipo = "informacion") {
    const elemento = obtener("estadoListaChat");
    elemento.textContent = mensaje;
    elemento.className =
      `gestion-contenido__mensaje gestion-contenido__mensaje--${tipo}`;
  }

  function notificarExito(titulo, mensaje) {
    if (global.AlertasAdmin?.exito) {
      global.AlertasAdmin.exito(titulo, mensaje);
    } else {
      mostrarLista(mensaje, "exito");
    }
  }

  function notificarError(error, titulo) {
    if (global.AlertasAdmin?.error) {
      global.AlertasAdmin.error(
        titulo || "No fue posible completar la operación",
        error?.message || "Ocurrió un error inesperado."
      );
    } else {
      mostrarLista(error?.message || "Ocurrió un error.", "error");
    }
  }

  async function confirmar(opciones) {
    if (typeof global.ModalAdmin?.confirmar === "function") {
      return global.ModalAdmin.confirmar(opciones);
    }
    return global.confirm(opciones.mensaje);
  }

  function crearElemento(etiqueta, clase, contenido) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (contenido !== undefined) elemento.textContent = contenido;
    return elemento;
  }

  function renderEstados() {
    const filtro = obtener("filtroEstadoChat");
    const actual = filtro.value;
    filtro.replaceChildren();
    const todos = document.createElement("option");
    todos.value = "";
    todos.textContent = "Todos";
    filtro.appendChild(todos);
    estado.estados.forEach((item) => {
      const opcion = document.createElement("option");
      opcion.value = String(item.idEstadoChat);
      opcion.textContent = item.nombre;
      filtro.appendChild(opcion);
    });
    filtro.value = actual;
  }

  function renderLista() {
    const lista = obtener("listaConversacionesChat");
    lista.replaceChildren();

    estado.conversaciones.forEach((item) => {
      const boton = crearElemento("button", "chat-admin__conversacion");
      boton.type = "button";
      boton.dataset.idConversacion = String(item.idConversacion);
      if (Number(item.idConversacion) === Number(estado.seleccionada?.idConversacion)) {
        boton.classList.add("chat-admin__conversacion--activa");
      }

      const cabecera = crearElemento("span", "chat-admin__conversacion-cabecera");
      cabecera.appendChild(crearElemento("strong", "", item.nombreCompleto));
      if (item.mensajesNoLeidos > 0) {
        cabecera.appendChild(
          crearElemento(
            "span",
            "chat-admin__no-leidos",
            String(item.mensajesNoLeidos)
          )
        );
      }
      const cedula = crearElemento("small", "", `Cédula: ${item.cedula}`);
      const pie = crearElemento("span", "chat-admin__conversacion-pie");
      const etiqueta = crearElemento("span", "chat-admin__estado", item.estado);
      etiqueta.dataset.estado = item.estado;
      pie.append(
        etiqueta,
        crearElemento("small", "", relativo(item.fechaUltimaActividad))
      );
      boton.append(cabecera, cedula, pie);
      lista.appendChild(boton);
    });

    if (!estado.conversaciones.length) {
      lista.appendChild(
        crearElemento(
          "p",
          "chat-admin__sin-mensajes",
          "No se encontraron conversaciones."
        )
      );
    }
  }

  async function cargarLista(opciones = {}) {
    const parametros = new URLSearchParams();
    const busqueda = obtener("busquedaChat").value.trim();
    const idEstado = obtener("filtroEstadoChat").value;
    if (busqueda) parametros.set("busqueda", busqueda);
    if (idEstado) parametros.set("idEstadoChat", idEstado);
    if (!opciones.silencioso) mostrarLista("Cargando conversaciones...");

    const respuesta = await api.get(
      `/chat/administracion/conversaciones${
        parametros.size ? `?${parametros}` : ""
      }`
    );
    const datos = datosRespuesta(respuesta);
    estado.conversaciones = Array.isArray(datos.conversaciones)
      ? datos.conversaciones
      : [];
    estado.estados = Array.isArray(datos.estados) ? datos.estados : [];
    obtener("totalNoLeidosChat").textContent = String(datos.totalNoLeidos || 0);
    renderEstados();
    renderLista();
    if (!opciones.silencioso) {
      mostrarLista(
        estado.conversaciones.length
          ? `${estado.conversaciones.length} conversación(es).`
          : "No se encontraron conversaciones."
      );
    }
  }

  function renderMensajes() {
    const contenedor = obtener("mensajesConversacionChat");
    const cercaDelFinal =
      contenedor.scrollHeight - contenedor.scrollTop - contenedor.clientHeight < 100;
    contenedor.replaceChildren();
    estado.mensajes.forEach((item) => {
      const esAdmin = item.tipoRemitente === "ADMINISTRADOR";
      const bloque = crearElemento(
        "article",
        `chat-admin__mensaje${esAdmin ? " chat-admin__mensaje--administrador" : ""}`
      );
      bloque.appendChild(
        crearElemento(
          "strong",
          "",
          esAdmin ? (item.administrador || "Administrador") : estado.seleccionada.nombreCompleto
        )
      );
      bloque.appendChild(crearElemento("p", "", item.mensaje));
      const tiempo = crearElemento("time", "", fecha(item.fechaEnvio));
      bloque.appendChild(tiempo);
      contenedor.appendChild(bloque);
    });

    if (!estado.mensajes.length) {
      contenedor.appendChild(
        crearElemento("p", "chat-admin__sin-mensajes", "Todavía no hay mensajes.")
      );
    }
    if (cercaDelFinal) {
      contenedor.scrollTop = contenedor.scrollHeight;
    }
  }

  function renderDetalle() {
    const item = estado.seleccionada;
    obtener("detalleChatVacio").hidden = true;
    obtener("detalleChat").hidden = false;
    obtener("nombreConversacionChat").textContent = item.nombreCompleto;
    obtener("cedulaConversacionChat").textContent = `Cédula: ${item.cedula}`;
    obtener("administradorConversacionChat").textContent =
      item.administradorAtencion
        ? `Atiende: ${item.administradorAtencion}`
        : "Sin administrador asignado";

    const etiqueta = obtener("estadoConversacionChat");
    etiqueta.textContent = item.estado;
    etiqueta.dataset.estado = item.estado;
    const accion = obtener("accionEstadoChat");
    const accionArchivar = obtener("accionArchivarChat");
    const archivada = item.estado === "Archivado";
    accion.hidden = archivada;
    accionArchivar.hidden = archivada;
    if (item.estado === "Nuevo") {
      accion.textContent = "Tomar conversación";
      accion.dataset.estadoDestino = "EN_ATENCION";
    } else if (item.estado === "En atención") {
      accion.textContent = "Cerrar conversación";
      accion.dataset.estadoDestino = "CERRADO";
    } else if (item.estado === "Cerrado") {
      accion.textContent = "Reabrir conversación";
      accion.dataset.estadoDestino = "EN_ATENCION";
    }

    const noPermiteResponder = item.estado === "Cerrado" || archivada;
    const aviso = obtener("conversacionChatCerrada");
    aviso.textContent = archivada
      ? "Esta conversación está archivada y conserva su historial."
      : "Esta conversación está cerrada. Reábrala para responder.";
    aviso.hidden = !noPermiteResponder;
    obtener("formularioRespuestaChat").hidden = noPermiteResponder;
    renderMensajes();
  }

  function limpiarDetalle() {
    estado.seleccionada = null;
    estado.mensajes = [];
    obtener("detalleChat").hidden = true;
    obtener("detalleChatVacio").hidden = false;
  }

  async function abrirConversacion(idConversacion, opciones = {}) {
    const id = Number(idConversacion);
    const [respuestaConversacion, respuestaMensajes] = await Promise.all([
      api.get(`/chat/administracion/conversaciones/${id}`),
      api.get(`/chat/administracion/conversaciones/${id}/mensajes`)
    ]);
    estado.seleccionada = datosRespuesta(respuestaConversacion);
    const datosMensajes = datosRespuesta(respuestaMensajes);
    estado.mensajes = Array.isArray(datosMensajes.mensajes)
      ? datosMensajes.mensajes
      : [];
    renderDetalle();
    renderLista();

    if (estado.mensajes.some(
      (item) => item.tipoRemitente === "EXTERNO" && !item.fechaLectura
    )) {
      await api.post(
        `/chat/administracion/conversaciones/${id}/marcar-leidos`,
        {}
      );
      if (opciones.refrescarLista !== false) {
        await cargarLista({ silencioso: true });
      }
    }
  }

  async function enviarRespuesta(evento) {
    evento.preventDefault();
    const mensaje = obtener("respuestaChat").value.trim();
    if (!mensaje || !estado.seleccionada) return;
    const boton = obtener("enviarRespuestaChat");
    boton.disabled = true;
    try {
      await api.post(
        `/chat/administracion/conversaciones/${estado.seleccionada.idConversacion}/mensajes`,
        { mensaje }
      );
      obtener("respuestaChat").value = "";
      await abrirConversacion(estado.seleccionada.idConversacion);
      await cargarLista({ silencioso: true });
      notificarExito("Respuesta enviada", "El mensaje fue enviado correctamente.");
    } catch (error) {
      notificarError(error, "No fue posible enviar la respuesta");
    } finally {
      boton.disabled = false;
    }
  }

  async function cambiarEstado() {
    if (!estado.seleccionada) return;
    const boton = obtener("accionEstadoChat");
    const destino = boton.dataset.estadoDestino;
    if (destino === "CERRADO") {
      const aceptado = await confirmar({
        tipo: "advertencia",
        titulo: "Cerrar conversación",
        mensaje: "¿Desea cerrar esta conversación?",
        detalle: "El historial se conservará y podrá reabrirse posteriormente.",
        textoConfirmar: "Cerrar",
        textoCancelar: "Cancelar"
      });
      if (!aceptado) return;
    }

    boton.disabled = true;
    try {
      await api.patch(
        `/chat/administracion/conversaciones/${estado.seleccionada.idConversacion}/estado`,
        { estado: destino }
      );
      await abrirConversacion(estado.seleccionada.idConversacion);
      await cargarLista({ silencioso: true });
      notificarExito("Estado actualizado", "La conversación fue actualizada.");
    } catch (error) {
      notificarError(error, "No fue posible cambiar el estado");
    } finally {
      boton.disabled = false;
    }
  }

  async function archivarConversacion() {
    if (!estado.seleccionada) return;
    const conversacion = estado.seleccionada;
    const aceptado = await confirmar({
      tipo: "advertencia",
      titulo: "Archivar conversación",
      mensaje: `¿Desea archivar la conversación de ${conversacion.nombreCompleto}?`,
      detalle: "El historial se conservará y podrá consultarse usando el filtro Archivado.",
      textoConfirmar: "Archivar",
      textoCancelar: "Cancelar"
    });
    if (!aceptado) return;

    const boton = obtener("accionArchivarChat");
    boton.disabled = true;
    try {
      await api.patch(
        `/chat/administracion/conversaciones/${conversacion.idConversacion}/archivar`,
        {}
      );
      limpiarDetalle();
      await cargarLista({ silencioso: true });
      notificarExito(
        "Conversación archivada",
        "El historial se conservó en el estado Archivado."
      );
    } catch (error) {
      notificarError(error, "No fue posible archivar la conversación");
    } finally {
      boton.disabled = false;
    }
  }

  async function eliminarConversacion() {
    if (!estado.seleccionada) return;
    const conversacion = estado.seleccionada;
    const aceptado = await confirmar({
      tipo: "peligro",
      titulo: "Eliminar conversación",
      mensaje: `¿Desea eliminar la conversación de ${conversacion.nombreCompleto}?`,
      detalle: "Se eliminarán también todos sus mensajes. Esta acción no se puede deshacer.",
      textoConfirmar: "Eliminar definitivamente",
      textoCancelar: "Cancelar"
    });
    if (!aceptado) return;

    const boton = obtener("accionEliminarChat");
    boton.disabled = true;
    try {
      await api.delete(
        `/chat/administracion/conversaciones/${conversacion.idConversacion}`
      );
      limpiarDetalle();
      await cargarLista({ silencioso: true });
      notificarExito(
        "Conversación eliminada",
        "La conversación y sus mensajes fueron eliminados."
      );
    } catch (error) {
      notificarError(error, "No fue posible eliminar la conversación");
    } finally {
      boton.disabled = false;
    }
  }

  async function actualizarSilenciosamente() {
    try {
      await cargarLista({ silencioso: true });
      if (estado.seleccionada) {
        await abrirConversacion(estado.seleccionada.idConversacion, {
          refrescarLista: false
        });
      }
    } catch (_error) {
      // El siguiente ciclo de polling vuelve a intentarlo sin llenar la consola.
    }
  }

  function iniciarPolling() {
    if (estado.temporizador) global.clearInterval(estado.temporizador);
    estado.temporizador = global.setInterval(() => {
      if (document.visibilityState === "visible") {
        actualizarSilenciosamente();
      }
    }, INTERVALO_POLLING);
  }

  function vincularEventos() {
    let temporizadorBusqueda;
    obtener("busquedaChat").addEventListener("input", () => {
      global.clearTimeout(temporizadorBusqueda);
      temporizadorBusqueda = global.setTimeout(
        () => cargarLista().catch((error) => notificarError(error)),
        350
      );
    });
    obtener("filtroEstadoChat").addEventListener(
      "change",
      () => cargarLista().catch((error) => notificarError(error))
    );
    obtener("listaConversacionesChat").addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-id-conversacion]");
      if (boton) {
        abrirConversacion(boton.dataset.idConversacion)
          .catch((error) => notificarError(error, "No fue posible abrir la conversación"));
      }
    });
    obtener("formularioRespuestaChat").addEventListener("submit", enviarRespuesta);
    obtener("accionEstadoChat").addEventListener("click", cambiarEstado);
    obtener("accionArchivarChat").addEventListener("click", archivarConversacion);
    obtener("accionEliminarChat").addEventListener("click", eliminarConversacion);
    global.addEventListener("pagehide", () => {
      if (estado.temporizador) global.clearInterval(estado.temporizador);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!api) return;
    vincularEventos();
    cargarLista()
      .then(iniciarPolling)
      .catch((error) => notificarError(error, "No fue posible cargar el chat"));
  }, { once: true });
})(window);
