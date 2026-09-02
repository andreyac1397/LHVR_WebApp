/* ============================================================
   CONTACTO.JS - SITIO PÚBLICO LHVR
   ------------------------------------------------------------
   Responsabilidades:

   - Consultar el contenido público de la página Contacto.
   - Mostrar el título y descripción de la página.
   - Mostrar los títulos de Datos de contacto y Ubicación.
   - Mostrar el título y texto introductorio del formulario.
   - Aplicar la ubicación administrada desde configuracion_sitio.
   - Mantener el contenido estático como respaldo.
   - Validar el formulario de contacto.

   El formulario guarda cada mensaje en solicitudes_contacto.
   ============================================================ */

(function configurarContactoPublico(global) {
  "use strict";

  const SLUG_PAGINA =
    "contacto";

  const API_BASE_URL =
    String(
      global.API_PUBLICA_URL ||
      "http://127.0.0.1:3001/api"
    ).replace(
      /\/+$/,
      ""
    );

  const ENDPOINT_CONTENIDO =
    `${API_BASE_URL}/paginas/publicas-parciales/` +
    `${encodeURIComponent(
      SLUG_PAGINA
    )}`;

  const CLAVES =
    Object.freeze({
      DATOS:
        "DATOS_CONTACTO",

      UBICACION:
        "UBICACION_CONTACTO",

      FORMULARIO:
        "FORMULARIO_CONTACTO"
    });

  let secciones =
    [];

  let cargaContenidoIniciada =
    false;


  /* ==========================================================
     1. UTILIDADES
     ========================================================== */

  function texto(valor) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return "";
    }

    return String(valor).trim();
  }


  function normalizarClave(
    valor
  ) {
    return texto(valor)
      .toUpperCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^A-Z0-9_]/g,
        "_"
      )
      .replace(
        /_+/g,
        "_"
      )
      .replace(
        /^_|_$/g,
        ""
      );
  }


  function porId(id) {
    return document.getElementById(
      id
    );
  }


  function establecerTexto(
    elemento,
    valor
  ) {
    if (!elemento) {
      return;
    }

    const contenido =
      texto(valor);

    if (contenido) {
      elemento.textContent =
        contenido;
    }
  }


  function establecerVisibilidad(
    elemento,
    visible
  ) {
    if (!elemento) {
      return;
    }

    elemento.hidden =
      !visible;

    elemento.setAttribute(
      "aria-hidden",
      visible ? "false" : "true"
    );

    if (visible) {
      elemento.style.removeProperty(
        "display"
      );
    } else {
      elemento.style.setProperty(
        "display",
        "none",
        "important"
      );
    }
  }


  function extraerDatos(
    respuesta
  ) {
    let resultado =
      respuesta;

    for (
      let nivel = 0;
      nivel < 3;
      nivel += 1
    ) {
      if (
        !resultado ||
        typeof resultado !==
          "object"
      ) {
        break;
      }

      if (
        resultado.datos &&
        typeof resultado.datos ===
          "object"
      ) {
        resultado =
          resultado.datos;

        continue;
      }

      if (
        resultado.data &&
        typeof resultado.data ===
          "object"
      ) {
        resultado =
          resultado.data;

        continue;
      }

      break;
    }

    return resultado;
  }


  function esSeccionVisible(
    seccion
  ) {
    if (!seccion) {
      return false;
    }

    if (
      seccion.estadoVisible ===
        false ||
      seccion.estadoVisible ===
        0 ||
      seccion.esVisible ===
        false ||
      seccion.esVisible ===
        0
    ) {
      return false;
    }

    const estado =
      normalizarClave(
        seccion.nombreEstado ||
        seccion.estadoPublicacion ||
        seccion.estado
      );

    if (
      [
        "BORRADOR",
        "INACTIVO",
        "OCULTO",
        "ARCHIVADO"
      ].includes(
        estado
      )
    ) {
      return false;
    }

    return true;
  }


  function obtenerSeccion(
    clave
  ) {
    const buscada =
      normalizarClave(
        clave
      );

    return (
      secciones.find(
        (seccion) =>
          normalizarClave(
            seccion.clave
          ) === buscada
      ) ||
      null
    );
  }


  /* ==========================================================
     2. ENCABEZADO DE CONTACTO
     ========================================================== */

  function renderizarEncabezado(
    pagina
  ) {
    const visible =
      pagina?.encabezadoVisible !==
        false;

    establecerVisibilidad(
      porId(
        "encabezadoContactoPublico"
      ),
      visible
    );

    if (!pagina || !visible) {
      return;
    }

    const titulo =
      texto(
        pagina.titulo ||
        pagina.nombre
      );

    const descripcion =
      texto(
        pagina.descripcion
      );

    establecerTexto(
      porId(
        "tituloEncabezadoContacto"
      ),
      titulo
    );

    establecerTexto(
      porId(
        "descripcionEncabezadoContacto"
      ),
      descripcion
    );

    establecerVisibilidad(
      porId(
        "descripcionEncabezadoContacto"
      ),
      Boolean(descripcion)
    );

    if (titulo) {
      document.title =
        `${titulo} · Liceo Hernán Vargas Ramírez`;
    }
  }


  /* ==========================================================
     3. DATOS DE CONTACTO
     ========================================================== */

  function renderizarDatosContacto() {
    const seccion =
      obtenerSeccion(
        CLAVES.DATOS
      );

    const bloque =
      porId(
        "bloqueDatosContactoPublico"
      );

    /*
     * Si la sección existe en la API, se respeta
     * su estado de publicación.
     *
     * Si la API no respondió, el HTML estático queda intacto.
     */
    establecerVisibilidad(
      bloque,
      Boolean(seccion)
    );

    if (!seccion) {
      return;
    }

    establecerTexto(
      porId(
        "tituloDatosContactoPublico"
      ),
      seccion.titulo
    );
  }


  /* ==========================================================
     4. UBICACIÓN
     ========================================================== */

  function renderizarUbicacion() {
    const seccion =
      obtenerSeccion(
        CLAVES.UBICACION
      );

    const bloque =
      porId(
        "bloqueUbicacionContactoPublico"
      );

    establecerVisibilidad(
      bloque,
      Boolean(seccion)
    );

    if (!seccion) {
      return;
    }

    establecerTexto(
      porId(
        "tituloUbicacionContactoPublico"
      ),
      seccion.titulo
    );
  }


  /*
   * Convierte el enlace administrado de Google Maps en una
   * dirección que pueda utilizar el iframe cuando sea posible.
   *
   * Ejemplo:
   *
   * https://www.google.com/maps/search/?api=1&query=...
   *
   * se transforma en:
   *
   * https://www.google.com/maps?q=...&output=embed
   */
  function crearUrlMapaEmbebido(
    valor
  ) {
    const mapa =
      texto(valor);

    if (!mapa) {
      return "";
    }

    try {
      const url =
        new URL(
          mapa,
          global.location.href
        );

      /*
       * Si ya es una URL de embed, se utiliza directamente.
       */
      if (
        url.pathname.includes(
          "/maps/embed"
        ) ||
        url.searchParams.get(
          "output"
        ) === "embed"
      ) {
        return url.href;
      }

      /*
       * URLs de Google Maps con ?query=
       */
      const query =
        texto(
          url.searchParams.get(
            "query"
          )
        );

      if (query) {
        return (
          "https://www.google.com/maps" +
          `?q=${encodeURIComponent(query)}` +
          "&output=embed"
        );
      }
    } catch (_error) {
      return "";
    }

    /*
     * Para enlaces cortos maps.app.goo.gl no intentamos
     * convertirlos automáticamente porque requieren resolver
     * una redirección externa.
     *
     * En ese caso se conserva el iframe estático de respaldo.
     */
    return "";
  }


  function aplicarMapaConfiguracion(
    datos
  ) {
    const mapa =
      porId(
        "mapaContactoPublico"
      );

    if (!mapa) {
      return;
    }

    const urlMapa =
      crearUrlMapaEmbebido(
        datos?.maps
      );

    if (urlMapa) {
      mapa.src =
        urlMapa;
    }

    if (
      datos?.nombre
    ) {
      mapa.title =
        `Ubicación del ${datos.nombre}`;
    }
  }


  /* ==========================================================
     5. FORMULARIO
     ========================================================== */

  function renderizarFormulario() {
    const seccion =
      obtenerSeccion(
        CLAVES.FORMULARIO
      );

    const bloque =
      porId(
        "bloqueFormularioContactoPublico"
      );

    establecerVisibilidad(
      bloque,
      Boolean(seccion)
    );

    if (!seccion) {
      return;
    }

    establecerTexto(
      porId(
        "tituloFormularioContactoPublico"
      ),
      seccion.titulo
    );

    const descripcion =
      texto(
        seccion.contenido ||
        seccion.subtitulo
      );

    const elementoDescripcion =
      porId(
        "descripcionFormularioContactoPublico"
      );

    if (descripcion) {
      establecerTexto(
        elementoDescripcion,
        descripcion
      );

      establecerVisibilidad(
        elementoDescripcion,
        true
      );
    } else {
      establecerVisibilidad(
        elementoDescripcion,
        false
      );
    }
  }


  /* ==========================================================
     6. RENDERIZAR CONTENIDO DE LA PÁGINA
     ========================================================== */

  function renderizarPagina(
    pagina
  ) {
    establecerVisibilidad(
      porId(
        "contenidoContactoPublico"
      ),
      true
    );

    renderizarEncabezado(
      pagina
    );

    renderizarDatosContacto();

    renderizarUbicacion();

    establecerVisibilidad(
      porId(
        "columnaDatosContactoPublico"
      ),
      Boolean(
        obtenerSeccion(CLAVES.DATOS) ||
        obtenerSeccion(CLAVES.UBICACION)
      )
    );

    renderizarFormulario();

    document.body.dataset
      .contenidoDinamico =
        "cargado";
  }


  /* ==========================================================
     7. CONSULTAR CONTENIDO PÚBLICO
     ========================================================== */

  async function solicitarContenido() {
    const respuesta =
      await fetch(
        ENDPOINT_CONTENIDO,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json"
          },

          cache:
            "no-store"
        }
      );

    let cuerpo =
      null;

    try {
      cuerpo =
        await respuesta.json();
    } catch (_error) {
      cuerpo =
        null;
    }

    if (
      !respuesta.ok
    ) {
      const error = new Error(
        `No fue posible cargar Contacto. Código ${respuesta.status}.`
      );

      error.statusCode =
        respuesta.status;

      error.codigo =
        cuerpo?.codigo ||
        `HTTP_${respuesta.status}`;

      throw error;
    }

    const datos =
      extraerDatos(
        cuerpo
      );

    if (
      !datos ||
      typeof datos !==
        "object"
    ) {
      throw new Error(
        "La API no devolvió el contenido de Contacto."
      );
    }

    return datos;
  }


  async function cargarContenidoContacto() {
    if (
      cargaContenidoIniciada
    ) {
      return;
    }

    cargaContenidoIniciada =
      true;

    try {
      const contenido =
        await solicitarContenido();

      const pagina =
        contenido.pagina ||
        null;

      secciones =
        Array.isArray(
          contenido.secciones
        )
          ? contenido
              .secciones
              .filter(
                esSeccionVisible
              )
          : [];

      if (!pagina) {
        throw new Error(
          "La API no devolvió la información de la página Contacto."
        );
      }

      renderizarPagina(
        pagina
      );
    } catch (error) {
      /*
       * Si la API no está disponible se conserva
       * completamente el contenido estático del HTML.
       */
      console.error(
        "No fue posible cargar el contenido dinámico de Contacto:",
        error
      );

      const paginaNoDisponible =
        error.statusCode === 404 ||
        error.codigo ===
          "PAGINA_NO_DISPONIBLE";

      if (paginaNoDisponible) {
        establecerVisibilidad(
          porId(
            "contenidoContactoPublico"
          ),
          false
        );

        document.body.dataset
          .contenidoDinamico =
            "no-disponible";
      } else {
        document.body.dataset
          .contenidoDinamico =
            "respaldo";
      }
    }
  }


  /* ==========================================================
     8. VALIDACIÓN DEL FORMULARIO
     ========================================================== */

  function configurarFormulario() {
    const formulario =
      porId(
        "formContacto"
      );

    const estado =
      porId(
        "estadoForm"
      );

    if (
      !formulario ||
      !estado
    ) {
      return;
    }


    function mostrarEstado(
      mensaje,
      tipo
    ) {
      estado.textContent =
        mensaje;

      estado.className =
        "formulario__estado " +
        `formulario__estado--${tipo}`;
    }


    formulario.addEventListener(
      "submit",
      async (evento) => {
        evento.preventDefault();

        const nombre =
          formulario
            .nombre
            .value
            .trim();

        const email =
          formulario
            .email
            .value
            .trim();

        const asunto =
          formulario
            .asunto
            .value
            .trim();

        const mensaje =
          formulario
            .mensaje
            .value
            .trim();

        const emailValido =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
              email
            );

        if (
          !nombre ||
          !email ||
          !asunto ||
          !mensaje
        ) {
          mostrarEstado(
            "Por favor completa todos los campos.",
            "error"
          );

          return;
        }

        if (
          !emailValido
        ) {
          mostrarEstado(
            "Escribe un correo electrónico válido.",
            "error"
          );

          return;
        }

        const boton = formulario.querySelector('button[type="submit"]');
        boton.disabled = true;
        mostrarEstado("Enviando mensaje...", "cargando");

        try {
          const respuesta = await fetch(`${API_BASE_URL}/contacto/publico`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              nombre,
              email,
              asunto,
              mensaje,
              sitioWeb: formulario.sitioWeb?.value || ""
            })
          });
          const contenido = await respuesta.json().catch(() => null);

          if (!respuesta.ok) {
            throw new Error(
              contenido?.mensaje || "No fue posible enviar el mensaje."
            );
          }

          mostrarEstado(
            `¡Gracias, ${nombre}! Tu mensaje fue recibido correctamente.`,
            "exito"
          );
          formulario.reset();
        } catch (error) {
          mostrarEstado(
            error.message || "No fue posible enviar el mensaje. Intente nuevamente.",
            "error"
          );
        } finally {
          boton.disabled = false;
        }
      }
    );
  }


  /* ==========================================================
     9. CONFIGURACIÓN INSTITUCIONAL
     ========================================================== */

  function escucharConfiguracionPublica() {
    /*
     * Si main.js ya terminó de cargar la configuración.
     */
    if (
      global.CONFIGURACION_PUBLICA
    ) {
      aplicarMapaConfiguracion(
        global.CONFIGURACION_PUBLICA
      );
    }

    /*
     * Si configuracion-publica.js todavía está consultando
     * el backend, esperamos su evento.
     */
    document.addEventListener(
      "configuracionpublicacargada",
      (evento) => {
        aplicarMapaConfiguracion(
          evento.detail ||
          {}
        );
      }
    );
  }


  /* ==========================================================
     10. INICIO
     ========================================================== */

  function iniciar() {
    configurarFormulario();

    escucharConfiguracionPublica();

    cargarContenidoContacto();
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      iniciar,
      {
        once: true
      }
    );
  } else {
    iniciar();
  }

})(window);
