(function configurarTramitesAdmin(global) {
  "use strict";

  const MAXIMO_TRAMITES = 12;
  const api = global.API_ADMIN_CLIENT;
  const estado = {
    pagina: null,
    estadosPublicacion: [],
    colecciones: [],
    elementos: [],
    idColeccion: null
  };

  const porId = (id) => document.getElementById(id);
  const texto = (valor) => String(valor ?? "").trim();
  const datosRespuesta = (respuesta) => respuesta?.datos ?? respuesta ?? {};
  const escapar = (valor) => texto(valor)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function mostrarMensaje(mensaje, tipo = "info") {
    const contenedor = porId("mensajeTramites");
    if (!contenedor) return;
    contenedor.textContent = mensaje;
    contenedor.dataset.tipo = tipo;
    contenedor.hidden = !mensaje;
  }

  function mensajeError(error) {
    return error?.message || error?.mensaje || "Ocurrió un error inesperado.";
  }

  function notificarExito(titulo, mensaje) {
    if (global.AlertasAdmin?.exito) {
      global.AlertasAdmin.exito(titulo, mensaje);
    } else {
      mostrarMensaje(mensaje, "exito");
    }
  }

  async function confirmar(opciones) {
    if (global.ModalAdmin?.confirmar) return global.ModalAdmin.confirmar(opciones);
    return global.confirm([opciones.mensaje, opciones.detalle].filter(Boolean).join("\n\n"));
  }

  function nombreEstado(elemento) {
    return texto(elemento?.estado || elemento?.nombreEstado || "BORRADOR").toUpperCase();
  }

  function claseEstado(valor) {
    return valor === "PUBLICADO" ? "admin-etiqueta--exito" : "admin-etiqueta--advertencia";
  }

  function formatearFecha(valor) {
    if (!valor) return "Sin registrar";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return texto(valor) || "Sin registrar";
    return new Intl.DateTimeFormat("es-CR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(fecha);
  }

  function renderizarInformacionPagina() {
    const pagina = estado.pagina;
    porId("nombrePaginaTramites").textContent = pagina?.nombre || pagina?.titulo || "Trámites";
    porId("rutaPaginaTramites").textContent = pagina?.ruta || "/pages/documentos-importantes.html";

    const estadoPagina = porId("estadoPaginaTramites");
    const visible = pagina?.estadoVisible === true || pagina?.estadoVisible === 1;
    estadoPagina.textContent = pagina?.nombreEstado || pagina?.estadoPublicacion || (pagina ? "Sin estado" : "No disponible");
    estadoPagina.className = `admin-etiqueta ${visible ? "admin-etiqueta--exito" : "admin-etiqueta--advertencia"}`;

    porId("fechaActualizacionPaginaTramites").textContent = formatearFecha(
      pagina?.fechaActualizacion || pagina?.fechaCreacion
    );
  }

  function llenarEstados() {
    const selector = porId("estadoEncabezadoTramites");
    if (!selector) return;
    selector.innerHTML = '<option value="">Seleccione un estado</option>';
    estado.estadosPublicacion.forEach((item) => {
      const opcion = document.createElement("option");
      opcion.value = item.idEstadoPublicacion;
      opcion.textContent = item.nombre;
      selector.appendChild(opcion);
    });
    selector.value = estado.pagina?.idEstadoPublicacion || "";
  }

  function renderizarEncabezado() {
    porId("idPaginaTramites").value = estado.pagina?.idPagina || "";
    porId("tituloEncabezadoTramites").value = estado.pagina?.titulo || "Horarios y trámites";
    porId("descripcionEncabezadoTramites").value = estado.pagina?.descripcion || "Consulte horarios, requisitos, formularios y documentos importantes de la institución.";
    llenarEstados();
    porId("botonGuardarEncabezadoTramites").disabled = !estado.pagina?.idPagina;
    renderizarInformacionPagina();
  }

  async function cargarEncabezado() {
    try {
      const [respuestaPagina, respuestaEstados] = await Promise.all([
        api.get(`/paginas/administracion/tramites?_actualizacion=${Date.now()}`),
        api.get("/paginas/estados-publicacion")
      ]);
      const contenido = datosRespuesta(respuestaPagina);
      const estados = datosRespuesta(respuestaEstados);
      estado.pagina = contenido.pagina || null;
      estado.estadosPublicacion = Array.isArray(estados.estados) ? estados.estados : (Array.isArray(estados) ? estados : []);
    } catch (error) {
      estado.pagina = null;
      estado.estadosPublicacion = [];
      mostrarMensaje("El encabezado aún no está disponible en la base de datos. Las tarjetas pueden administrarse de forma independiente.", "info");
      console.warn("No fue posible cargar el encabezado de Trámites.", error);
    }
    renderizarEncabezado();
  }

  async function guardarEncabezado(evento) {
    evento.preventDefault();
    if (!estado.pagina?.idPagina) return;
    const boton = porId("botonGuardarEncabezadoTramites");
    boton.disabled = true;
    try {
      await api.put(`/paginas/administracion/${estado.pagina.idPagina}`, {
        titulo: texto(porId("tituloEncabezadoTramites").value),
        descripcion: texto(porId("descripcionEncabezadoTramites").value) || null,
        idEstadoPublicacion: Number(porId("estadoEncabezadoTramites").value)
      });
      await cargarEncabezado();
      notificarExito("Encabezado guardado", "El encabezado de Horarios y trámites fue actualizado.");
    } catch (error) {
      mostrarMensaje(mensajeError(error), "error");
    } finally {
      boton.disabled = false;
    }
  }

  function coleccionActual() {
    return estado.colecciones.find((item) => Number(item.idColeccion) === Number(estado.idColeccion)) || null;
  }

  function renderizarSelectorColeccion() {
    const selector = porId("selectorColeccionTramites");
    selector.replaceChildren();
    if (!estado.colecciones.length) {
      selector.appendChild(new Option("No hay versiones", ""));
      selector.disabled = true;
    } else {
      estado.colecciones.forEach((coleccion) => {
        selector.appendChild(new Option(`${coleccion.nombre}${coleccion.esPublicada ? " · Pública" : ""}`, coleccion.idColeccion));
      });
      selector.disabled = false;
      selector.value = estado.idColeccion;
    }
    const coleccion = coleccionActual();
    const etiqueta = porId("estadoColeccionTramites");
    etiqueta.textContent = coleccion?.esPublicada ? "Versión pública" : (coleccion ? "Borrador" : "Sin versión");
    etiqueta.className = `admin-etiqueta ${coleccion?.esPublicada ? "admin-etiqueta--exito" : "admin-etiqueta--advertencia"}`;
    porId("botonPublicarTramites").disabled = !coleccion || coleccion.esPublicada;
  }

  function datosOriginales(elemento) {
    return JSON.stringify({
      titulo: elemento.titulo || "",
      descripcion: elemento.descripcion || elemento.subtitulo || "",
      categoria: elemento.datos?.categoria || "tramite",
      url: elemento.url || "",
      orden: Number(elemento.orden || 0) || 1,
      estado: nombreEstado(elemento)
    });
  }

  function plantillaTarjeta(elemento = {}) {
    const nuevo = !elemento.idElemento;
    const categoria = elemento.datos?.categoria || "tramite";
    const estadoElemento = nombreEstado(elemento);
    const orden = Number(elemento.orden || (estado.elementos.length + 1));
    return `
      <article class="comunidad-admin__tarjeta${nuevo ? " comunidad-admin__tarjeta--nueva" : ""}" data-id="${escapar(elemento.idElemento || "")}" data-original='${escapar(datosOriginales({ ...elemento, orden }))}'>
        <div class="comunidad-admin__vista tramite-admin__vista">
          <div class="comunidad-admin__vista-contenido">
            <div class="comunidad-admin__vista-superior">
              <div class="comunidad-admin__vista-titulos">
                <span class="tramite-admin__categoria">${escapar(categoria)}</span>
                <h3 class="comunidad-seccion__titulo-visual">${escapar(elemento.titulo || "Nuevo trámite")}</h3>
              </div>
            </div>
            <p class="comunidad-seccion__contenido-visual tramite-admin__descripcion">${escapar(elemento.descripcion || elemento.subtitulo || "Complete la información de esta tarjeta.")}</p>
            <p class="tramite-admin__enlace" title="${escapar(elemento.url || "")}">${escapar(elemento.url || "Sin enlace")}</p>
            <span class="admin-etiqueta ${claseEstado(estadoElemento)}">${escapar(estadoElemento)}</span>
          </div>
        </div>
        <details class="comunidad-admin__desplegable"${nuevo ? " open" : ""}>
          <summary class="comunidad-admin__editar">Editar trámite</summary>
          <form class="comunidad-admin__editor tramite-admin__formulario">
            <div class="formulario-admin__cuadricula">
              <div class="formulario-admin__grupo formulario-admin__grupo--completo">
                <label class="formulario-admin__etiqueta">Título <span aria-hidden="true">*</span></label>
                <input class="formulario-admin__control" name="titulo" maxlength="250" value="${escapar(elemento.titulo || "")}" required>
              </div>
              <div class="formulario-admin__grupo">
                <label class="formulario-admin__etiqueta">Categoría <span aria-hidden="true">*</span></label>
                <input class="formulario-admin__control" name="categoria" maxlength="80" value="${escapar(categoria)}" required>
              </div>
              <div class="formulario-admin__grupo">
                <label class="formulario-admin__etiqueta">Orden</label>
                <input class="formulario-admin__control" name="orden" type="number" min="1" max="12" value="${orden}" required>
              </div>
              <div class="formulario-admin__grupo formulario-admin__grupo--completo">
                <label class="formulario-admin__etiqueta">Descripción <span aria-hidden="true">*</span></label>
                <textarea class="formulario-admin__control formulario-admin__control--textarea" name="descripcion" maxlength="2000" rows="5" required>${escapar(elemento.descripcion || elemento.subtitulo || "")}</textarea>
              </div>
              <div class="formulario-admin__grupo formulario-admin__grupo--completo">
                <label class="formulario-admin__etiqueta">Enlace del documento <span aria-hidden="true">*</span></label>
                <input class="formulario-admin__control" name="url" type="url" maxlength="1000" value="${escapar(elemento.url || "")}" placeholder="https://drive.google.com/..." required>
              </div>
              <div class="formulario-admin__grupo">
                <label class="formulario-admin__etiqueta">Estado</label>
                <select class="formulario-admin__control" name="estado">
                  ${["PUBLICADO", "BORRADOR", "INACTIVO"].map((item) => `<option value="${item}"${item === estadoElemento ? " selected" : ""}>${item}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="formulario-admin__acciones tramite-admin__acciones">
              <button class="admin-boton admin-boton--texto tramite-admin__retirar" type="button"${nuevo ? " hidden" : ""}>Retirar tarjeta</button>
              <span></span>
              <button class="admin-boton admin-boton--secundario tramite-admin__cancelar" type="button">Cancelar</button>
              <button class="admin-boton admin-boton--secundario tramite-admin__replegar" type="button">Cerrar edición</button>
              <button class="admin-boton admin-boton--primario" type="submit">Guardar cambios</button>
            </div>
          </form>
        </details>
      </article>`;
  }

  function renderizarTarjetas() {
    const lista = porId("listaTramitesAdmin");
    lista.innerHTML = estado.elementos
      .slice().sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
      .map(plantillaTarjeta).join("");
    porId("contadorTramites").textContent = estado.elementos.length;
    porId("estadoVacioTramites").hidden = estado.elementos.length > 0;
    porId("botonAgregarTramite").disabled = !estado.idColeccion || estado.elementos.length >= MAXIMO_TRAMITES;
  }

  async function cargarTarjetas(idColeccion = null) {
    try {
      const sufijo = idColeccion ? `?idColeccion=${encodeURIComponent(idColeccion)}` : "";
      const respuesta = await api.get(`/tramites/administracion${sufijo}`);
      const datos = datosRespuesta(respuesta);
      estado.colecciones = Array.isArray(datos.colecciones) ? datos.colecciones : [];
      estado.idColeccion = Number(datos.coleccion?.idColeccion || idColeccion || estado.colecciones[0]?.idColeccion) || null;
      estado.elementos = Array.isArray(datos.elementos) ? datos.elementos : [];
      renderizarSelectorColeccion();
      renderizarTarjetas();
    } catch (error) {
      estado.colecciones = [];
      estado.elementos = [];
      estado.idColeccion = null;
      renderizarSelectorColeccion();
      renderizarTarjetas();
      mostrarMensaje(mensajeError(error), "error");
    }
  }

  function restaurarFormulario(tarjeta) {
    if (tarjeta.classList.contains("comunidad-admin__tarjeta--nueva")) {
      tarjeta.remove();
      return;
    }
    let original = {};
    try { original = JSON.parse(tarjeta.dataset.original || "{}"); } catch (_error) { original = {}; }
    Object.entries(original).forEach(([nombre, valor]) => {
      const control = tarjeta.querySelector(`[name="${nombre}"]`);
      if (control) control.value = valor;
    });
    tarjeta.querySelector("details").open = false;
  }

  function leerTarjeta(tarjeta) {
    const formulario = tarjeta.querySelector("form");
    const datos = new FormData(formulario);
    return {
      idColeccion: Number(estado.idColeccion),
      titulo: texto(datos.get("titulo")),
      descripcion: texto(datos.get("descripcion")),
      url: texto(datos.get("url")),
      orden: Number(datos.get("orden")),
      estado: texto(datos.get("estado")),
      destacado: false,
      datos: { categoria: texto(datos.get("categoria")).toLowerCase() }
    };
  }

  async function guardarTarjeta(evento) {
    evento.preventDefault();
    const tarjeta = evento.currentTarget.closest("article");
    const boton = evento.currentTarget.querySelector('[type="submit"]');
    const id = Number(tarjeta.dataset.id) || null;
    boton.disabled = true;
    try {
      const datos = leerTarjeta(tarjeta);
      if (id) await api.put(`/tramites/elementos/${id}`, datos);
      else await api.post("/tramites/elementos", datos);
      await cargarTarjetas(estado.idColeccion);
      notificarExito("Trámite guardado", "La tarjeta fue guardada correctamente.");
    } catch (error) {
      mostrarMensaje(mensajeError(error), "error");
      boton.disabled = false;
    }
  }

  async function retirarTarjeta(tarjeta) {
    const id = Number(tarjeta.dataset.id);
    if (!id) return;
    const aceptado = await confirmar({
      titulo: "Retirar trámite",
      mensaje: "¿Desea retirar esta tarjeta?",
      detalle: "Dejará de estar disponible públicamente.",
      textoConfirmar: "Retirar",
      textoCancelar: "Cancelar"
    });
    if (!aceptado) return;
    try {
      await api.delete(`/tramites/elementos/${id}`);
      await cargarTarjetas(estado.idColeccion);
      notificarExito("Trámite retirado", "La tarjeta fue retirada correctamente.");
    } catch (error) {
      mostrarMensaje(mensajeError(error), "error");
    }
  }

  function agregarTarjeta() {
    if (!estado.idColeccion) {
      mostrarMensaje("Primero debe existir una versión de trámites en la base de datos.", "error");
      return;
    }
    if (estado.elementos.length >= MAXIMO_TRAMITES || porId("listaTramitesAdmin").querySelector(".comunidad-admin__tarjeta--nueva")) return;
    porId("listaTramitesAdmin").insertAdjacentHTML("afterbegin", plantillaTarjeta());
    porId("listaTramitesAdmin").querySelector(".comunidad-admin__tarjeta--nueva input[name='titulo']")?.focus();
  }

  async function publicarVersion() {
    const coleccion = coleccionActual();
    if (!coleccion) return;
    const aceptado = await confirmar({
      titulo: "Publicar versión",
      mensaje: `¿Desea publicar “${coleccion.nombre}”?`,
      detalle: "Estas tarjetas pasarán a mostrarse en el sitio público.",
      textoConfirmar: "Publicar",
      textoCancelar: "Cancelar"
    });
    if (!aceptado) return;
    try {
      await api.post(`/tramites/colecciones/${coleccion.idColeccion}/publicar`, {});
      await cargarTarjetas(coleccion.idColeccion);
      notificarExito("Versión publicada", "Los trámites ya están disponibles públicamente.");
    } catch (error) {
      mostrarMensaje(mensajeError(error), "error");
    }
  }

  function configurarEventos() {
    porId("formularioEncabezadoTramites").addEventListener("submit", guardarEncabezado);
    porId("botonRecargarTramites").addEventListener("click", cargarTodo);
    porId("botonAgregarTramite").addEventListener("click", agregarTarjeta);
    porId("botonPublicarTramites").addEventListener("click", publicarVersion);
    porId("selectorColeccionTramites").addEventListener("change", (evento) => cargarTarjetas(evento.target.value));
    porId("listaTramitesAdmin").addEventListener("submit", guardarTarjeta);
    porId("listaTramitesAdmin").addEventListener("click", (evento) => {
      const tarjeta = evento.target.closest("article");
      if (!tarjeta) return;
      if (evento.target.closest(".tramite-admin__cancelar")) restaurarFormulario(tarjeta);
      if (evento.target.closest(".tramite-admin__replegar")) tarjeta.querySelector("details").open = false;
      if (evento.target.closest(".tramite-admin__retirar")) retirarTarjeta(tarjeta);
    });
  }

  async function cargarTodo() {
    mostrarMensaje("", "info");
    await Promise.all([cargarEncabezado(), cargarTarjetas(estado.idColeccion)]);
  }

  async function iniciar() {
    if (!api) return;
    configurarEventos();
    porId("contenidoTramitesAdmin").hidden = false;
    await cargarTodo();
  }

  document.addEventListener("DOMContentLoaded", iniciar, { once: true });
})(window);
