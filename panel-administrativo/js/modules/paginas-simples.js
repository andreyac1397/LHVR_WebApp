/**
 * Editores reutilizables para Comunidad y Contacto.
 */
(function configurarPaginasSimples(global) {
  "use strict";

  const comun = global.PAGINAS_CONTENIDO_ADMIN;

  if (!comun) {
    throw new Error(
      "No se pudo cargar paginas-simples.js. " +
      "Debe cargar paginas-contenido.js primero."
    );
  }

  const DEFINICIONES = Object.freeze({
    comunidad: Object.freeze({
      titulo: "Editar Comunidad",
      descripcion:
        "Actualice los bloques informativos de la vida institucional y comunitaria.",
      enlacePublico:
        "../../../frontend-publico/pages/comunidad.html",
      secciones: Object.freeze([
        ["INTRO_COMUNIDAD", "Introducción", 1],
        ["HISTORIA_COMUNIDAD", "Historia institucional", 2],
        ["PARTICIPACION_COMUNIDAD", "Participación estudiantil", 3],
        ["ARTE_COMUNIDAD", "Arte y cultura", 4],
        ["BIBLIOCRA_COMUNIDAD", "BiblioCRA y comunidad", 5],
        ["JUAN_VINAS_COMUNIDAD", "LHVR y Juan Viñas", 6],
        ["CIERRE_COMUNIDAD", "Cierre", 7]
      ])
    }),
    contacto: Object.freeze({
      titulo: "Editar Contacto",
      descripcion:
        "Actualice los datos institucionales, ubicación y textos del formulario de contacto.",
      enlacePublico:
        "../../../frontend-publico/pages/contacto-ubicacion.html",
      secciones: Object.freeze([
        ["DATOS_CONTACTO", "Datos de contacto", 1],
        ["UBICACION_CONTACTO", "Ubicación y mapa", 2],
        ["FORMULARIO_CONTACTO", "Formulario de contacto", 3]
      ])
    })
  });

  const estadosPorSlug = new Map();

  const SECCIONES_CON_IMAGEN = new Set([
    "HISTORIA_COMUNIDAD",
    "PARTICIPACION_COMUNIDAD",
    "ARTE_COMUNIDAD",
    "BIBLIOCRA_COMUNIDAD",
    "JUAN_VINAS_COMUNIDAD"
  ]);

  function escapar(valor) {
    return comun.texto(valor)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function crearContenedor(slug) {
    const contenedorGeneral = comun.porId("contenidoPaginasContenido");

    if (!contenedorGeneral || comun.porId(`editorPagina-${slug}`)) {
      return;
    }

    const contenedor = document.createElement("div");
    contenedor.id = `editorPagina-${slug}`;
    contenedor.dataset.editorPagina = slug;
    contenedor.hidden = true;
    contenedor.innerHTML = `
      <section class="admin-panel">
        <header class="admin-panel__encabezado">
          <div>
            <h2 class="admin-panel__titulo">Contenido editable</h2>
            <p class="admin-panel__descripcion">
              Cada bloque se guarda de forma independiente y mantiene su estado de publicación.
            </p>
          </div>
        </header>
        <div
          id="listaSecciones-${slug}"
          class="gestion-contenido gestion-contenido--con-relleno"
        ></div>
      </section>
    `;

    const pie = comun.porId("pieGestionPaginasContenido");

    if (pie) {
      contenedorGeneral.insertBefore(contenedor, pie);
    } else {
      contenedorGeneral.appendChild(contenedor);
    }
  }

  function obtenerSeccion(clave) {
    return comun.obtenerSeccion(clave) || null;
  }

  function crearFormulario(slug, definicion, indice) {
    const [clave, etiqueta, orden] = definicion;
    const seccion = obtenerSeccion(clave);
    const formulario = document.createElement("form");
    formulario.className = "admin-panel formulario-admin";
    formulario.dataset.claveSeccion = clave;
    formulario.dataset.ordenSeccion = String(orden);

    const campoImagen = SECCIONES_CON_IMAGEN.has(clave)
      ? `
        <input
          name="idArchivo"
          type="hidden"
          value="${escapar(seccion?.idArchivo || "")}"
        >
        <div class="formulario-admin__grupo formulario-admin__grupo--completo">
          <label class="formulario-admin__etiqueta">Imagen del bloque</label>
          <input
            name="imagen"
            class="formulario-admin__control"
            type="file"
            accept="image/jpeg,image/png,image/webp"
          >
          <small>La imagen nueva se aplica al guardar. Si no selecciona otra, se conserva la actual.</small>
        </div>
      `
      : "";

    formulario.innerHTML = `
      <header class="admin-panel__encabezado">
        <div>
          <h3 class="admin-panel__titulo">${escapar(etiqueta)}</h3>
          <p class="admin-panel__descripcion">Clave: ${escapar(clave)}</p>
        </div>
      </header>
      <div class="admin-panel__contenido formulario-admin__cuadricula">
        <input
          name="idSeccionPagina"
          type="hidden"
          value="${escapar(seccion?.idSeccionPagina || "")}"
        >
        <div class="formulario-admin__grupo formulario-admin__grupo--completo">
          <label class="formulario-admin__etiqueta">Título</label>
          <input
            name="titulo"
            class="formulario-admin__control"
            type="text"
            maxlength="250"
            value="${escapar(seccion?.titulo || "")}"
          >
        </div>
        <div class="formulario-admin__grupo formulario-admin__grupo--completo">
          <label class="formulario-admin__etiqueta">Subtítulo o etiqueta</label>
          <input
            name="subtitulo"
            class="formulario-admin__control"
            type="text"
            maxlength="300"
            value="${escapar(seccion?.subtitulo || "")}"
          >
        </div>
        <div class="formulario-admin__grupo formulario-admin__grupo--completo">
          <label class="formulario-admin__etiqueta">Contenido</label>
          <textarea
            name="contenido"
            class="formulario-admin__control"
            rows="6"
          >${escapar(seccion?.contenido || "")}</textarea>
        </div>
        <div class="formulario-admin__grupo">
          <label class="formulario-admin__etiqueta">Texto complementario</label>
          <input
            name="textoAlternativo"
            class="formulario-admin__control"
            type="text"
            maxlength="300"
            value="${escapar(seccion?.textoAlternativo || "")}"
          >
        </div>
        <div class="formulario-admin__grupo">
          <label class="formulario-admin__etiqueta">Texto del botón</label>
          <input
            name="textoBoton"
            class="formulario-admin__control"
            type="text"
            maxlength="120"
            value="${escapar(seccion?.textoBoton || "")}"
          >
        </div>
        <div class="formulario-admin__grupo formulario-admin__grupo--completo">
          <label class="formulario-admin__etiqueta">Enlace, dirección o dato adicional</label>
          <input
            name="urlBoton"
            class="formulario-admin__control"
            type="text"
            maxlength="1000"
            value="${escapar(seccion?.urlBoton || "")}"
          >
        </div>
        ${campoImagen}
        <div class="formulario-admin__grupo">
          <label class="formulario-admin__etiqueta">Estado</label>
          <select
            id="estado-${slug}-${indice}"
            name="idEstadoPublicacion"
            class="formulario-admin__control"
            required
          ></select>
        </div>
      </div>
      <footer class="admin-panel__pie">
        <button class="admin-boton admin-boton--primario" type="submit">
          Guardar bloque
        </button>
      </footer>
    `;

    const selector = formulario.querySelector("select");
    comun.llenarSelectEstados(
      selector,
      seccion?.idEstadoPublicacion ||
      comun.obtenerEstadoPredeterminado()?.idEstadoPublicacion
    );

    formulario.addEventListener("submit", (evento) => {
      guardarFormulario(evento, slug, etiqueta);
    });

    return formulario;
  }

  async function guardarFormulario(evento, slug, etiqueta) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datosFormulario = new FormData(formulario);
    const boton = formulario.querySelector('button[type="submit"]');

    let idArchivo = comun.numeroOpcional(
      datosFormulario.get("idArchivo")
    );
    const imagen = datosFormulario.get("imagen");

    try {
      comun.establecerBotonCargando(boton, true, "Guardando...");

      if (imagen instanceof File && imagen.size > 0) {
        comun.validarImagen(imagen);
        const respuestaImagen = await comun.subirImagenPagina(
          imagen,
          datosFormulario.get("textoAlternativo")
        );
        idArchivo = comun.obtenerIdArchivoRespuesta(respuestaImagen);

        if (!idArchivo) {
          throw new Error(
            "La imagen se subió, pero no se recibió su identificador."
          );
        }
      }

      const datos = comun.crearDatosBase({
      idSeccionPagina: datosFormulario.get("idSeccionPagina"),
      clave: formulario.dataset.claveSeccion,
      etiqueta,
      titulo: datosFormulario.get("titulo"),
      subtitulo: datosFormulario.get("subtitulo"),
      contenido: datosFormulario.get("contenido"),
      textoAlternativo: datosFormulario.get("textoAlternativo"),
      textoBoton: datosFormulario.get("textoBoton"),
      urlBoton: datosFormulario.get("urlBoton"),
      tipoEnlace: datosFormulario.get("urlBoton")
        ? "INTERNO"
        : "NINGUNO",
      tipoDiseno: slug.toUpperCase(),
      orden: formulario.dataset.ordenSeccion,
      idEstadoPublicacion: datosFormulario.get("idEstadoPublicacion"),
      idArchivo
    });

      await comun.guardarSeccion(datos);
      comun.mostrarMensaje(
        `El bloque ${etiqueta} fue guardado correctamente.`,
        "exito"
      );
      await comun.cargarContenidoPagina();
    } catch (error) {
      if (!comun.manejarSesionVencida(error)) {
        comun.mostrarMensaje(comun.obtenerMensajeError(error), "error");
      }
    } finally {
      comun.establecerBotonCargando(boton, false);
    }
  }

  function renderizar(slug) {
    const definicion = DEFINICIONES[slug];
    const lista = comun.porId(`listaSecciones-${slug}`);

    if (!lista) {
      return;
    }

    lista.replaceChildren();
    definicion.secciones.forEach((seccion, indice) => {
      lista.appendChild(crearFormulario(slug, seccion, indice));
    });
  }

  function reiniciarEstado(slug) {
    estadosPorSlug.delete(slug);
  }

  Object.entries(DEFINICIONES).forEach(([slug, definicion]) => {
    crearContenedor(slug);
    comun.registrarEditor(slug, {
      titulo: definicion.titulo,
      descripcion: definicion.descripcion,
      descripcionResumen:
        `Datos generales y secciones de la página ${slug}.`,
      enlacePublico: definicion.enlacePublico,
      textoPie: `Gestión de la página ${slug}`,
      renderizar() {
        renderizar(slug);
      },
      configurarEventos() {},
      reiniciarEstado() {
        reiniciarEstado(slug);
      }
    });
  });
})(window);
