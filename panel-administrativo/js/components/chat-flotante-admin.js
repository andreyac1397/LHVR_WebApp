(function configurarChatFlotanteAdmin(global) {
  "use strict";

  const INTERVALO_POLLING = 5000;
  const MAXIMO_VENTANAS = 3;
  const ES_PAGINA_CHAT = /\/pages\/chat\/chat\.html$/i.test(
    global.location.pathname
  );
  const api = global.API_ADMIN_CLIENT;
  const estado = {
    iniciado: false,
    consultaEnCurso: false,
    resumenInicialCargado: false,
    conversaciones: [],
    conteosAnteriores: new Map(),
    ventanas: new Map(),
    temporizador: null,
    panelAbierto: false
  };
  let elementos = null;

  const datosRespuesta = (respuesta) => respuesta?.datos ?? respuesta ?? {};

  function crearElemento(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
  }

  function rutaPanel(ruta) {
    return global.AdminLayout?.obtenerRutaPanel
      ? global.AdminLayout.obtenerRutaPanel(ruta)
      : new URL(`../../${ruta}`, document.baseURI).href;
  }

  function fecha(valor) {
    const objeto = new Date(valor);
    if (Number.isNaN(objeto.getTime())) return "";
    return new Intl.DateTimeFormat("es-CR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(objeto);
  }

  function cantidadVisible(valor) {
    const cantidad = Number(valor || 0);
    return cantidad > 99 ? "99+" : String(cantidad);
  }

  function actualizarBadge(total) {
    const cantidad = Number(total || 0);
    elementos.contador.textContent = cantidadVisible(cantidad);
    elementos.contador.hidden = cantidad <= 0;

    const enlace = document.querySelector('[data-menu-id="chat"]');
    if (!enlace) return;
    let badge = enlace.querySelector(".chat-notificaciones-admin__badge-menu");
    if (!badge) {
      badge = crearElemento("span", "chat-notificaciones-admin__badge-menu");
      badge.setAttribute("aria-label", "Mensajes de chat no leídos");
      enlace.appendChild(badge);
    }
    badge.textContent = cantidadVisible(cantidad);
    badge.hidden = cantidad <= 0;
  }

  function actualizarTotalLocal() {
    const total = estado.conversaciones.reduce(
      (acumulado, item) => acumulado + Number(item.mensajesNoLeidos || 0),
      0
    );
    actualizarBadge(total);
    renderLista();
  }

  function renderLista() {
    elementos.lista.replaceChildren();
    const conversaciones = [...estado.conversaciones].sort((a, b) => {
      const diferencia = Number(b.mensajesNoLeidos || 0) -
        Number(a.mensajesNoLeidos || 0);
      if (diferencia) return diferencia;
      return new Date(b.fechaUltimaActividad) - new Date(a.fechaUltimaActividad);
    });

    if (!conversaciones.length) {
      elementos.lista.appendChild(
        crearElemento(
          "p",
          "chat-notificaciones-admin__vacio",
          "Todavía no hay conversaciones."
        )
      );
      return;
    }

    conversaciones.forEach((conversacion) => {
      const boton = crearElemento("button", "chat-notificaciones-admin__item");
      boton.type = "button";
      boton.dataset.idConversacion = String(conversacion.idConversacion);
      boton.append(
        crearElemento("strong", "", conversacion.nombreCompleto),
        crearElemento(
          "small",
          "",
          `${conversacion.estado} · ${fecha(conversacion.fechaUltimaActividad)}`
        )
      );
      if (Number(conversacion.mensajesNoLeidos) > 0) {
        boton.appendChild(
          crearElemento(
            "span",
            "chat-notificaciones-admin__item-contador",
            cantidadVisible(conversacion.mensajesNoLeidos)
          )
        );
      }
      elementos.lista.appendChild(boton);
    });
  }

  function emitirSonido() {
    try {
      const ContextoAudio = global.AudioContext || global.webkitAudioContext;
      if (!ContextoAudio) return;
      const contexto = new ContextoAudio();
      const oscilador = contexto.createOscillator();
      const ganancia = contexto.createGain();
      oscilador.frequency.value = 620;
      ganancia.gain.setValueAtTime(.035, contexto.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(
        .0001,
        contexto.currentTime + .18
      );
      oscilador.connect(ganancia);
      ganancia.connect(contexto.destination);
      oscilador.start();
      oscilador.stop(contexto.currentTime + .18);
      oscilador.addEventListener("ended", () => contexto.close());
    } catch (_error) {
      // Los avisos visuales siguen funcionando si el navegador bloquea audio.
    }
  }

  function mostrarNotificacionSistema(conversacion, incremento) {
    if (!("Notification" in global) || global.Notification.permission !== "granted") {
      return;
    }
    const notificacion = new global.Notification(
      `Nuevo mensaje de ${conversacion.nombreCompleto}`,
      {
        body: incremento > 1
          ? `${incremento} mensajes nuevos en el chat institucional.`
          : "Tiene un mensaje nuevo en el chat institucional.",
        tag: `chat-lhvr-${conversacion.idConversacion}`
      }
    );
    notificacion.addEventListener("click", () => {
      global.focus();
      abrirVentana(conversacion.idConversacion);
      notificacion.close();
    });
  }

  function mostrarAviso(conversacion, incremento) {
    const aviso = crearElemento("button", "chat-notificaciones-admin__aviso");
    aviso.type = "button";
    aviso.appendChild(
      crearElemento("span", "chat-notificaciones-admin__aviso-icono", "💬")
    );
    const contenido = crearElemento("span", "");
    contenido.append(
      crearElemento("strong", "", `Nuevo mensaje de ${conversacion.nombreCompleto}`),
      crearElemento(
        "small",
        "",
        incremento > 1 ? `${incremento} mensajes nuevos` : "1 mensaje nuevo"
      )
    );
    aviso.append(
      contenido,
      crearElemento("span", "chat-notificaciones-admin__aviso-accion", "Abrir")
    );
    aviso.addEventListener("click", () => {
      aviso.remove();
      abrirVentana(conversacion.idConversacion);
    });
    elementos.avisos.appendChild(aviso);
    global.setTimeout(() => aviso.remove(), 9000);
    emitirSonido();
    mostrarNotificacionSistema(conversacion, incremento);
  }

  function detectarMensajesNuevos(conversaciones) {
    if (!estado.resumenInicialCargado) return;
    conversaciones.forEach((conversacion) => {
      const anterior = Number(
        estado.conteosAnteriores.get(Number(conversacion.idConversacion)) || 0
      );
      const actual = Number(conversacion.mensajesNoLeidos || 0);
      if (actual > anterior) mostrarAviso(conversacion, actual - anterior);
    });
  }

  function guardarConteos(conversaciones) {
    estado.conteosAnteriores = new Map(
      conversaciones.map((item) => [
        Number(item.idConversacion),
        Number(item.mensajesNoLeidos || 0)
      ])
    );
  }

  async function consultarResumen(opciones = {}) {
    if (estado.consultaEnCurso || document.visibilityState === "hidden") return;
    estado.consultaEnCurso = true;
    try {
      const respuesta = await api.get("/chat/administracion/conversaciones");
      const datos = datosRespuesta(respuesta);
      const conversaciones = Array.isArray(datos.conversaciones)
        ? datos.conversaciones
        : [];
      if (!opciones.omitirAvisos) detectarMensajesNuevos(conversaciones);
      estado.conversaciones = conversaciones;
      guardarConteos(conversaciones);
      estado.resumenInicialCargado = true;
      actualizarBadge(datos.totalNoLeidos);
      renderLista();
      if (!opciones.omitirVentanas) {
        await actualizarVentanasAbiertas();
      }
    } catch (error) {
      if (!opciones.silencioso && error?.statusCode !== 401) {
        global.AlertasAdmin?.advertencia(
          "Chat temporalmente no disponible",
          "Las notificaciones volverán a intentarlo automáticamente."
        );
      }
    } finally {
      estado.consultaEnCurso = false;
    }
  }

  function renderMensajes(ventana, mensajes) {
    const cercaDelFinal = ventana.mensajes.scrollHeight -
      ventana.mensajes.scrollTop - ventana.mensajes.clientHeight < 90;
    ventana.mensajes.replaceChildren();
    if (!mensajes.length) {
      ventana.mensajes.appendChild(
        crearElemento(
          "p",
          "chat-flotante-admin__sin-mensajes",
          "Todavía no hay mensajes."
        )
      );
      return;
    }
    mensajes.forEach((mensaje) => {
      const esAdmin = mensaje.tipoRemitente === "ADMINISTRADOR";
      const bloque = crearElemento(
        "article",
        `chat-flotante-admin__mensaje${
          esAdmin ? " chat-flotante-admin__mensaje--admin" : ""
        }`
      );
      bloque.append(
        crearElemento(
          "strong",
          "",
          esAdmin ? (mensaje.administrador || "Administrador") : ventana.datos.nombreCompleto
        ),
        crearElemento("p", "", mensaje.mensaje),
        crearElemento("time", "", fecha(mensaje.fechaEnvio))
      );
      ventana.mensajes.appendChild(bloque);
    });
    if (cercaDelFinal) ventana.mensajes.scrollTop = ventana.mensajes.scrollHeight;
  }

  function renderEstadoVentana(ventana) {
    const conversacion = ventana.datos;
    ventana.nombre.textContent = conversacion.nombreCompleto;
    ventana.cedula.textContent = `Cédula: ${conversacion.cedula}`;
    ventana.estado.textContent = conversacion.estado;
    ventana.estado.dataset.estado = conversacion.estado;
    ventana.botonEstado.hidden = false;

    if (conversacion.estado === "Nuevo") {
      ventana.botonEstado.textContent = "Tomar";
      ventana.botonEstado.dataset.estadoDestino = "EN_ATENCION";
    } else if (conversacion.estado === "En atención") {
      ventana.botonEstado.textContent = "Cerrar";
      ventana.botonEstado.dataset.estadoDestino = "CERRADO";
    } else {
      ventana.botonEstado.textContent = "Reabrir";
      ventana.botonEstado.dataset.estadoDestino = "EN_ATENCION";
    }

    const cerrada = conversacion.estado === "Cerrado";
    ventana.avisoCerrado.hidden = !cerrada;
    ventana.formulario.hidden = cerrada;
  }

  async function cargarVentana(ventana, opciones = {}) {
    if (ventana.cargando) return;
    ventana.cargando = true;
    try {
      const id = ventana.idConversacion;
      const respuestaMensajes = await api.get(
        `/chat/administracion/conversaciones/${id}/mensajes`
      );
      const datosMensajes = datosRespuesta(respuestaMensajes);
      ventana.datos = datosMensajes.conversacion || ventana.datos;
      const mensajes = Array.isArray(datosMensajes.mensajes)
        ? datosMensajes.mensajes
        : [];
      renderEstadoVentana(ventana);
      renderMensajes(ventana, mensajes);
      if (mensajes.some((item) =>
        item.tipoRemitente === "EXTERNO" && !item.fechaLectura
      )) {
        await api.post(
          `/chat/administracion/conversaciones/${id}/marcar-leidos`,
          {}
        );
        const conocida = estado.conversaciones.find(
          (item) => Number(item.idConversacion) === id
        );
        if (conocida) conocida.mensajesNoLeidos = 0;
        estado.conteosAnteriores.set(id, 0);
        actualizarTotalLocal();
      }
    } catch (error) {
      if (!opciones.silencioso) {
        global.AlertasAdmin?.error(
          "No fue posible abrir el chat",
          error?.message || "Intente nuevamente."
        );
      }
    } finally {
      ventana.cargando = false;
    }
  }

  function cerrarVentana(idConversacion) {
    const id = Number(idConversacion);
    const ventana = estado.ventanas.get(id);
    if (!ventana) return;
    ventana.elemento.remove();
    estado.ventanas.delete(id);
  }

  function limitarVentanas() {
    const maximo = global.matchMedia("(max-width: 700px)").matches
      ? 1
      : MAXIMO_VENTANAS;
    while (estado.ventanas.size >= maximo) {
      const primera = estado.ventanas.keys().next().value;
      cerrarVentana(primera);
    }
  }

  async function enviarMensaje(evento, ventana) {
    evento.preventDefault();
    const mensaje = ventana.textarea.value.trim();
    if (!mensaje) return;
    ventana.botonEnviar.disabled = true;
    try {
      await api.post(
        `/chat/administracion/conversaciones/${ventana.idConversacion}/mensajes`,
        { mensaje }
      );
      ventana.textarea.value = "";
      await cargarVentana(ventana);
      await consultarResumen({
        silencioso: true,
        omitirAvisos: true,
        omitirVentanas: true
      });
      ventana.textarea.focus();
    } catch (error) {
      global.AlertasAdmin?.error(
        "No fue posible enviar la respuesta",
        error?.message || "Intente nuevamente."
      );
    } finally {
      ventana.botonEnviar.disabled = false;
    }
  }

  async function cambiarEstado(ventana) {
    const destino = ventana.botonEstado.dataset.estadoDestino;
    if (destino === "CERRADO") {
      const aceptado = typeof global.ModalAdmin?.confirmar === "function"
        ? await global.ModalAdmin.confirmar({
          tipo: "advertencia",
          titulo: "Cerrar conversación",
          mensaje: "¿Desea cerrar esta conversación?",
          detalle: "El historial se conservará y podrá reabrirse.",
          textoConfirmar: "Cerrar",
          textoCancelar: "Cancelar"
        })
        : global.confirm("¿Desea cerrar esta conversación?");
      if (!aceptado) return;
    }
    ventana.botonEstado.disabled = true;
    try {
      await api.patch(
        `/chat/administracion/conversaciones/${ventana.idConversacion}/estado`,
        { estado: destino }
      );
      await cargarVentana(ventana);
      await consultarResumen({
        silencioso: true,
        omitirAvisos: true,
        omitirVentanas: true
      });
    } catch (error) {
      global.AlertasAdmin?.error(
        "No fue posible cambiar el estado",
        error?.message || "Intente nuevamente."
      );
    } finally {
      ventana.botonEstado.disabled = false;
    }
  }

  function crearVentana(conversacion) {
    const elemento = crearElemento("section", "chat-flotante-admin");
    elemento.setAttribute("aria-label", `Chat con ${conversacion.nombreCompleto}`);
    elemento.innerHTML = `
      <header class="chat-flotante-admin__cabecera">
        <div class="chat-flotante-admin__identidad">
          <strong></strong>
          <small></small>
        </div>
        <div class="chat-flotante-admin__acciones">
          <button type="button" data-accion="minimizar" aria-label="Minimizar chat">−</button>
          <button type="button" data-accion="cerrar" aria-label="Cerrar ventana de chat">×</button>
        </div>
      </header>
      <div class="chat-flotante-admin__cuerpo">
        <div class="chat-flotante-admin__estado-barra">
          <span class="chat-flotante-admin__estado"></span>
          <button class="chat-flotante-admin__accion-estado" type="button"></button>
        </div>
        <div class="chat-flotante-admin__mensajes" role="log" aria-live="polite"></div>
        <p class="chat-flotante-admin__cerrado" hidden>La conversación está cerrada.</p>
        <form class="chat-flotante-admin__formulario">
          <label class="chat-flotante-admin__etiqueta-oculta">
            Escribir respuesta
            <textarea maxlength="4000" rows="2" placeholder="Escriba una respuesta..." required></textarea>
          </label>
          <button type="submit">Enviar</button>
        </form>
      </div>
    `;
    const ventana = {
      idConversacion: Number(conversacion.idConversacion),
      datos: conversacion,
      elemento,
      cargando: false,
      nombre: elemento.querySelector(".chat-flotante-admin__identidad strong"),
      cedula: elemento.querySelector(".chat-flotante-admin__identidad small"),
      estado: elemento.querySelector(".chat-flotante-admin__estado"),
      botonEstado: elemento.querySelector(".chat-flotante-admin__accion-estado"),
      mensajes: elemento.querySelector(".chat-flotante-admin__mensajes"),
      avisoCerrado: elemento.querySelector(".chat-flotante-admin__cerrado"),
      formulario: elemento.querySelector(".chat-flotante-admin__formulario"),
      textarea: elemento.querySelector("textarea"),
      botonEnviar: elemento.querySelector('[type="submit"]')
    };
    elemento.querySelector('[data-accion="cerrar"]').addEventListener(
      "click",
      () => cerrarVentana(ventana.idConversacion)
    );
    elemento.querySelector('[data-accion="minimizar"]').addEventListener(
      "click",
      (evento) => {
        const minimizada = elemento.classList.toggle(
          "chat-flotante-admin--minimizado"
        );
        evento.currentTarget.textContent = minimizada ? "□" : "−";
        evento.currentTarget.setAttribute(
          "aria-label",
          minimizada ? "Restaurar chat" : "Minimizar chat"
        );
      }
    );
    ventana.formulario.addEventListener(
      "submit",
      (evento) => enviarMensaje(evento, ventana)
    );
    ventana.botonEstado.addEventListener("click", () => cambiarEstado(ventana));
    return ventana;
  }

  async function abrirVentana(idConversacion) {
    const id = Number(idConversacion);
    let ventana = estado.ventanas.get(id);
    if (ventana) {
      ventana.elemento.classList.remove("chat-flotante-admin--minimizado");
      await cargarVentana(ventana);
      ventana.textarea.focus();
      return;
    }
    const conversacion = estado.conversaciones.find(
      (item) => Number(item.idConversacion) === id
    );
    if (!conversacion) return;
    limitarVentanas();
    ventana = crearVentana(conversacion);
    estado.ventanas.set(id, ventana);
    elementos.ventanas.appendChild(ventana.elemento);
    cerrarPanel();
    renderEstadoVentana(ventana);
    await cargarVentana(ventana);
    await consultarResumen({
      silencioso: true,
      omitirAvisos: true,
      omitirVentanas: true
    });
    if (!ventana.formulario.hidden) ventana.textarea.focus();
  }

  async function actualizarVentanasAbiertas() {
    const ventanas = [...estado.ventanas.values()];
    await Promise.all(
      ventanas.map((ventana) => cargarVentana(ventana, { silencioso: true }))
    );
  }

  function abrirPanel() {
    estado.panelAbierto = true;
    elementos.panel.hidden = false;
    elementos.lanzador.setAttribute("aria-expanded", "true");
  }

  function cerrarPanel() {
    estado.panelAbierto = false;
    elementos.panel.hidden = true;
    elementos.lanzador.setAttribute("aria-expanded", "false");
  }

  async function activarNotificacionesSistema() {
    if (!("Notification" in global)) return;
    const permiso = await global.Notification.requestPermission();
    elementos.activarNotificaciones.hidden = permiso !== "default";
    if (permiso === "granted") {
      global.AlertasAdmin?.exito(
        "Notificaciones activadas",
        "El navegador avisará cuando lleguen mensajes nuevos."
      );
    }
  }

  function construir() {
    const raiz = crearElemento("div", "chat-notificaciones-admin");
    raiz.id = "chatNotificacionesAdmin";
    raiz.innerHTML = `
      <button class="chat-notificaciones-admin__lanzador" type="button" aria-label="Abrir chats" aria-expanded="false" aria-controls="panelNotificacionesChat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path>
        </svg>
        <span class="chat-notificaciones-admin__contador" hidden>0</span>
      </button>
      <section id="panelNotificacionesChat" class="chat-notificaciones-admin__panel" aria-label="Conversaciones de chat" hidden>
        <header class="chat-notificaciones-admin__panel-cabecera">
          <h2>Chat institucional</h2>
          <div class="chat-notificaciones-admin__panel-acciones">
            <button type="button" data-accion="recargar" aria-label="Recargar conversaciones">↻</button>
            <button type="button" data-accion="cerrar-panel" aria-label="Cerrar lista de chats">×</button>
          </div>
        </header>
        <button class="chat-notificaciones-admin__activar" type="button" hidden>Activar avisos del navegador</button>
        <div class="chat-notificaciones-admin__lista"></div>
        <a class="chat-notificaciones-admin__ir-chat">Abrir gestión completa de Chat</a>
      </section>
      <div class="chat-notificaciones-admin__ventanas"></div>
      <div class="chat-notificaciones-admin__avisos" aria-live="polite"></div>
    `;
    document.body.appendChild(raiz);
    elementos = {
      raiz,
      lanzador: raiz.querySelector(".chat-notificaciones-admin__lanzador"),
      contador: raiz.querySelector(".chat-notificaciones-admin__contador"),
      panel: raiz.querySelector(".chat-notificaciones-admin__panel"),
      lista: raiz.querySelector(".chat-notificaciones-admin__lista"),
      ventanas: raiz.querySelector(".chat-notificaciones-admin__ventanas"),
      avisos: raiz.querySelector(".chat-notificaciones-admin__avisos"),
      activarNotificaciones: raiz.querySelector(".chat-notificaciones-admin__activar")
    };
    raiz.querySelector(".chat-notificaciones-admin__ir-chat").href = rutaPanel(
      "pages/chat/chat.html"
    );
    if ("Notification" in global) {
      elementos.activarNotificaciones.hidden =
        global.Notification.permission !== "default";
    }
  }

  function vincularEventos() {
    elementos.lanzador.addEventListener("click", () => {
      if (estado.panelAbierto) cerrarPanel();
      else abrirPanel();
    });
    elementos.panel.querySelector('[data-accion="cerrar-panel"]').addEventListener(
      "click",
      cerrarPanel
    );
    elementos.panel.querySelector('[data-accion="recargar"]').addEventListener(
      "click",
      () => consultarResumen({ omitirAvisos: true })
    );
    elementos.activarNotificaciones.addEventListener(
      "click",
      activarNotificacionesSistema
    );
    elementos.lista.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-id-conversacion]");
      if (boton) abrirVentana(boton.dataset.idConversacion);
    });
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && estado.panelAbierto) cerrarPanel();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        consultarResumen({ silencioso: true });
      }
    });
    global.addEventListener("pagehide", detener);
  }

  function iniciarPolling() {
    if (estado.temporizador) global.clearInterval(estado.temporizador);
    estado.temporizador = global.setInterval(
      () => consultarResumen({ silencioso: true }),
      INTERVALO_POLLING
    );
  }

  function detener() {
    if (estado.temporizador) global.clearInterval(estado.temporizador);
    estado.temporizador = null;
  }

  async function iniciar() {
    if (estado.iniciado || ES_PAGINA_CHAT || !api) return;
    const sesion = global.PROTECCION_RUTAS_ADMIN?.obtenerSesionActual?.();
    if (!sesion) return;
    estado.iniciado = true;
    construir();
    vincularEventos();
    await consultarResumen({ silencioso: true, omitirAvisos: true });
    iniciarPolling();
  }

  const apiPublica = Object.freeze({
    iniciar,
    detener,
    abrirConversacion: abrirVentana,
    actualizar: () => consultarResumen({ silencioso: true })
  });
  global.ChatNotificacionesAdmin = apiPublica;

  function intentarIniciar() {
    iniciar().catch(() => null);
  }

  document.addEventListener("layoutAdminListo", intentarIniciar, { once: true });
  document.addEventListener("sesionadministradorlista", intentarIniciar, { once: true });
  if (document.readyState !== "loading") intentarIniciar();
})(window);
