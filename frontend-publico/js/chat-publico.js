(function configurarChatPublico(global) {
  "use strict";

  const CLAVE_TOKEN = "lhvr_chat_token";
  const INTERVALO_POLLING = 4000;
  let iniciado = false;
  let temporizador = null;
  let token = null;
  let conversacion = null;
  let elementos = null;

  const apiBase = () => String(
    global.API_PUBLICA_URL || "http://127.0.0.1:3001/api"
  ).replace(/\/+$/, "");

  function leerToken() {
    try {
      return global.localStorage.getItem(CLAVE_TOKEN);
    } catch (_error) {
      return null;
    }
  }

  function guardarToken(valor) {
    token = valor;
    try {
      global.localStorage.setItem(CLAVE_TOKEN, valor);
    } catch (_error) {
      // El chat continúa durante la pestaña aunque el almacenamiento esté bloqueado.
    }
  }

  function limpiarToken() {
    token = null;
    conversacion = null;
    try {
      global.localStorage.removeItem(CLAVE_TOKEN);
    } catch (_error) {
      // No interrumpir la interfaz si localStorage no está disponible.
    }
  }

  async function solicitar(ruta, opciones = {}) {
    const headers = { Accept: "application/json" };
    if (opciones.datos !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (opciones.token) {
      headers.Authorization = `Bearer ${opciones.token}`;
    }

    const respuesta = await fetch(`${apiBase()}${ruta}`, {
      method: opciones.metodo || "GET",
      headers,
      body: opciones.datos === undefined
        ? undefined
        : JSON.stringify(opciones.datos)
    });
    const contenido = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      const error = new Error(
        contenido.mensaje || "No fue posible completar la operación."
      );
      error.statusCode = respuesta.status;
      error.codigo = contenido.codigo || `HTTP_${respuesta.status}`;
      throw error;
    }
    return contenido?.datos ?? contenido ?? {};
  }

  function mostrarEstado(mensaje, tipo = "informacion") {
    elementos.estado.textContent = mensaje || "";
    elementos.estado.className = `chat-publico__estado chat-publico__estado--${tipo}`;
    elementos.estado.hidden = !mensaje;
  }

  function fecha(valor) {
    if (!valor) {
      return "";
    }
    const objeto = new Date(valor);
    if (Number.isNaN(objeto.getTime())) {
      return "";
    }
    return new Intl.DateTimeFormat("es-CR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(objeto);
  }

  function renderMensajes(mensajes) {
    const cercaDelFinal =
      elementos.mensajes.scrollHeight -
      elementos.mensajes.scrollTop -
      elementos.mensajes.clientHeight < 80;
    elementos.mensajes.replaceChildren();

    if (!mensajes.length) {
      const vacio = document.createElement("p");
      vacio.className = "chat-publico__vacio";
      vacio.textContent = "Escriba su primer mensaje para iniciar la consulta.";
      elementos.mensajes.appendChild(vacio);
      return;
    }

    const fragmento = document.createDocumentFragment();
    mensajes.forEach((item) => {
      const externo = item.tipoRemitente === "EXTERNO";
      const bloque = document.createElement("article");
      bloque.className = `chat-publico__mensaje ${
        externo
          ? "chat-publico__mensaje--propio"
          : "chat-publico__mensaje--liceo"
      }`;

      const autor = document.createElement("strong");
      autor.textContent = externo ? "Usted" : "Administrador";
      const contenido = document.createElement("p");
      contenido.textContent = item.mensaje;
      const momento = document.createElement("time");
      momento.textContent = fecha(item.fechaEnvio);
      bloque.append(autor, contenido, momento);
      fragmento.appendChild(bloque);
    });
    elementos.mensajes.appendChild(fragmento);
    if (cercaDelFinal) {
      elementos.mensajes.scrollTop = elementos.mensajes.scrollHeight;
    }
  }

  function renderConversacion(datos) {
    conversacion = datos.conversacion;
    elementos.inicio.hidden = true;
    elementos.conversacion.hidden = false;
    elementos.persona.textContent = conversacion.nombreCompleto;
    elementos.estadoConversacion.textContent = conversacion.estado;
    elementos.estadoConversacion.dataset.estado = conversacion.estado;

    const cerrada = ["Cerrado", "Archivado"].includes(conversacion.estado);
    elementos.avisoCerrado.textContent = conversacion.estado === "Archivado"
      ? "Esta conversación fue archivada por el liceo."
      : "Esta conversación fue cerrada por el liceo.";
    elementos.avisoCerrado.hidden = !cerrada;
    elementos.formularioMensaje.hidden = cerrada;
    elementos.botonNueva.hidden = !cerrada;
    renderMensajes(Array.isArray(datos.mensajes) ? datos.mensajes : []);
  }

  function mostrarInicio() {
    detenerPolling();
    elementos.inicio.hidden = false;
    elementos.conversacion.hidden = true;
    elementos.formularioInicio.reset();
    mostrarEstado("");
  }

  function sesionInvalida(error) {
    return error?.statusCode === 401 || error?.codigo === "TOKEN_CHAT_INVALIDO";
  }

  async function cargarConversacion(opciones = {}) {
    if (!token) {
      mostrarInicio();
      return;
    }
    try {
      const datos = await solicitar("/chat/publico/mensajes", { token });
      renderConversacion(datos);
      const pendientes = datos.mensajes?.some(
        (item) =>
          item.tipoRemitente === "ADMINISTRADOR" && !item.fechaLectura
      );
      if (pendientes) {
        await solicitar("/chat/publico/marcar-leidos", {
          metodo: "POST",
          token
        }).catch(() => null);
      }
      if (!opciones.silencioso) {
        mostrarEstado("");
      }
    } catch (error) {
      if (sesionInvalida(error)) {
        limpiarToken();
        mostrarInicio();
        mostrarEstado(
          "La conversación anterior ya no está disponible. Puede iniciar una nueva.",
          "informacion"
        );
        return;
      }
      if (!opciones.silencioso) {
        mostrarEstado(error.message, "error");
      }
    }
  }

  function detenerPolling() {
    if (temporizador) {
      global.clearInterval(temporizador);
      temporizador = null;
    }
  }

  function iniciarPolling() {
    detenerPolling();
    if (!token || elementos.panel.hidden) {
      return;
    }
    temporizador = global.setInterval(() => {
      if (document.visibilityState === "visible" && !elementos.panel.hidden) {
        cargarConversacion({ silencioso: true });
      }
    }, INTERVALO_POLLING);
  }

  async function iniciarConversacion(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    if (!formulario.checkValidity()) {
      formulario.reportValidity();
      return;
    }

    elementos.botonIniciar.disabled = true;
    mostrarEstado("Iniciando conversación...");
    try {
      const datos = await solicitar("/chat/publico/conversaciones", {
        metodo: "POST",
        datos: {
          nombreCompleto: elementos.nombre.value,
          cedula: elementos.cedula.value
        }
      });
      guardarToken(datos.token);
      await cargarConversacion();
      iniciarPolling();
      elementos.mensaje.focus();
    } catch (error) {
      mostrarEstado(error.message, "error");
    } finally {
      elementos.botonIniciar.disabled = false;
    }
  }

  async function enviarMensaje(evento) {
    evento.preventDefault();
    const mensaje = elementos.mensaje.value.trim();
    if (!mensaje || !token) {
      elementos.mensaje.focus();
      return;
    }

    elementos.botonEnviar.disabled = true;
    try {
      await solicitar("/chat/publico/mensajes", {
        metodo: "POST",
        token,
        datos: { mensaje }
      });
      elementos.mensaje.value = "";
      await cargarConversacion({ silencioso: true });
      elementos.mensaje.focus();
    } catch (error) {
      if (error.codigo === "CONVERSACION_CHAT_CERRADA") {
        await cargarConversacion({ silencioso: true });
      }
      mostrarEstado(error.message, "error");
    } finally {
      elementos.botonEnviar.disabled = false;
    }
  }

  function abrirPanel() {
    elementos.panel.hidden = false;
    elementos.boton.setAttribute("aria-expanded", "true");
    token = leerToken() || token;
    if (token) {
      cargarConversacion().then(iniciarPolling);
    } else {
      mostrarInicio();
      elementos.nombre.focus();
    }
  }

  function cerrarPanel() {
    elementos.panel.hidden = true;
    elementos.boton.setAttribute("aria-expanded", "false");
    detenerPolling();
    elementos.boton.focus();
  }

  function nuevaConversacion() {
    limpiarToken();
    mostrarInicio();
    elementos.nombre.focus();
  }

  function construir() {
    const raiz = document.createElement("div");
    raiz.id = "chatPublicoLhvr";
    raiz.className = "chat-publico";
    raiz.innerHTML = `
      <button id="botonChatPublico" class="chat-publico__boton" type="button" aria-label="¿Necesita ayuda?" aria-expanded="false" aria-controls="panelChatPublico">
        <span aria-hidden="true">💬</span>
        <span>¿Necesita ayuda?</span>
      </button>
      <section id="panelChatPublico" class="chat-publico__panel" role="dialog" aria-modal="false" aria-labelledby="tituloChatPublico" hidden>
        <header class="chat-publico__cabecera">
          <div>
            <strong id="tituloChatPublico">Chat con el Liceo</strong>
            <small>Liceo Hernán Vargas Ramírez</small>
          </div>
          <button id="cerrarChatPublico" class="chat-publico__cerrar" type="button" aria-label="Cerrar chat">×</button>
        </header>
        <p id="estadoChatPublico" class="chat-publico__estado" role="status" aria-live="polite" hidden></p>
        <div id="inicioChatPublico" class="chat-publico__inicio">
          <p>Ingrese sus datos para conversar con el personal del liceo.</p>
          <form id="formularioInicioChatPublico">
            <label>Nombre completo
              <input id="nombreChatPublico" name="nombreCompleto" type="text" minlength="3" maxlength="180" autocomplete="name" required>
            </label>
            <label>Cédula o identificación
              <input id="cedulaChatPublico" name="cedula" type="text" minlength="3" maxlength="30" autocomplete="off" required>
            </label>
            <button id="iniciarChatPublico" type="submit">Iniciar chat</button>
          </form>
          <small class="chat-publico__privacidad">La cédula se utiliza únicamente para identificar su consulta.</small>
        </div>
        <div id="conversacionChatPublico" class="chat-publico__conversacion" hidden>
          <div class="chat-publico__datos">
            <strong id="personaChatPublico"></strong>
            <span id="estadoConversacionChatPublico" class="chat-publico__etiqueta"></span>
          </div>
          <div id="mensajesChatPublico" class="chat-publico__mensajes" role="log" aria-live="polite"></div>
          <p id="avisoChatCerrado" class="chat-publico__cerrado" hidden>Esta conversación fue cerrada por el liceo.</p>
          <form id="formularioMensajeChatPublico" class="chat-publico__envio">
            <label class="chat-publico__etiqueta-oculta" for="mensajeChatPublico">Escriba su mensaje</label>
            <textarea id="mensajeChatPublico" name="mensaje" maxlength="4000" rows="2" placeholder="Escriba su mensaje..." required></textarea>
            <button id="enviarMensajeChatPublico" type="submit">Enviar</button>
          </form>
          <button id="nuevaConversacionChatPublico" class="chat-publico__nueva" type="button" hidden>Iniciar nueva conversación</button>
        </div>
      </section>
    `;
    document.body.appendChild(raiz);

    elementos = {
      boton: document.getElementById("botonChatPublico"),
      panel: document.getElementById("panelChatPublico"),
      cerrar: document.getElementById("cerrarChatPublico"),
      estado: document.getElementById("estadoChatPublico"),
      inicio: document.getElementById("inicioChatPublico"),
      conversacion: document.getElementById("conversacionChatPublico"),
      formularioInicio: document.getElementById("formularioInicioChatPublico"),
      nombre: document.getElementById("nombreChatPublico"),
      cedula: document.getElementById("cedulaChatPublico"),
      botonIniciar: document.getElementById("iniciarChatPublico"),
      persona: document.getElementById("personaChatPublico"),
      estadoConversacion: document.getElementById("estadoConversacionChatPublico"),
      mensajes: document.getElementById("mensajesChatPublico"),
      avisoCerrado: document.getElementById("avisoChatCerrado"),
      formularioMensaje: document.getElementById("formularioMensajeChatPublico"),
      mensaje: document.getElementById("mensajeChatPublico"),
      botonEnviar: document.getElementById("enviarMensajeChatPublico"),
      botonNueva: document.getElementById("nuevaConversacionChatPublico")
    };

    elementos.boton.addEventListener("click", () => {
      if (elementos.panel.hidden) {
        abrirPanel();
      } else {
        cerrarPanel();
      }
    });
    elementos.cerrar.addEventListener("click", cerrarPanel);
    elementos.formularioInicio.addEventListener("submit", iniciarConversacion);
    elementos.formularioMensaje.addEventListener("submit", enviarMensaje);
    elementos.botonNueva.addEventListener("click", nuevaConversacion);
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && !elementos.panel.hidden) {
        cerrarPanel();
      }
    });
    global.addEventListener("pagehide", detenerPolling);
  }

  function iniciar() {
    if (iniciado || document.getElementById("chatPublicoLhvr")) {
      return;
    }
    iniciado = true;
    construir();
  }

  global.CHAT_PUBLICO_LHVR = Object.freeze({ iniciar });
  if (document.readyState !== "loading") {
    iniciar();
  } else {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  }
})(window);
