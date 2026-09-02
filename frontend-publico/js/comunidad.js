/* ============================================================
   COMUNIDAD.JS - SITIO PÚBLICO LHVR
   ------------------------------------------------------------
   Carga dinámicamente el contenido público de Comunidad desde
   la API y conserva el diseño visual original del sitio.

   Endpoint:
   GET /api/paginas/publicas-parciales/comunidad

   Renderiza:
   - Introducción.
   - Tarjetas intermedias.
   - Imágenes.
   - Botones y enlaces.
   - Cierre.
   - Nuevas tarjetas creadas desde el panel administrativo.

   Las tarjetas mantienen automáticamente la alternancia:
   texto | imagen
   imagen | texto
   ============================================================ */

(function iniciarComunidad(global) {
  "use strict";

  /* ==========================================================
     1. CONFIGURACIÓN
     ========================================================== */

  const API_BASE_URL = String(
    global.API_PUBLICA_URL ||
    "http://localhost:3001/api"
  ).replace(/\/+$/, "");

  const CLAVE_INTRO =
    "INTRO_COMUNIDAD";

  const CLAVE_CIERRE =
    "CIERRE_COMUNIDAD";


  /* ==========================================================
     2. UTILIDADES GENERALES
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


  function normalizarClave(valor) {
    return texto(valor)
      .toUpperCase()
      .trim();
  }


  function numero(valor) {
    const convertido =
      Number(valor);

    return Number.isFinite(convertido)
      ? convertido
      : 0;
  }


  function ordenarSecciones(secciones) {
    return [...secciones].sort(
      (a, b) => {
        const ordenA =
          numero(a?.orden);

        const ordenB =
          numero(b?.orden);

        if (ordenA !== ordenB) {
          return ordenA - ordenB;
        }

        return (
          numero(a?.idSeccionPagina) -
          numero(b?.idSeccionPagina)
        );
      }
    );
  }


  function seccionPorClave(
    secciones,
    clave
  ) {
    return (
      secciones.find(
        (seccion) =>
          normalizarClave(
            seccion?.clave
          ) === clave
      ) ||
      null
    );
  }


  function extraerPagina(
    respuesta
  ) {
    return (
      respuesta?.datos?.pagina ||
      respuesta?.pagina ||
      null
    );
  }


  function renderizarEncabezado(
    pagina
  ) {
    const encabezado =
      document.getElementById(
        "encabezadoComunidadPublico"
      );

    const visible =
      pagina?.encabezadoVisible !==
        false;

    if (encabezado) {
      encabezado.hidden =
        !visible;

      encabezado.setAttribute(
        "aria-hidden",
        visible ? "false" : "true"
      );

      if (visible) {
        encabezado.style
          .removeProperty("display");
      } else {
        encabezado.style
          .setProperty(
            "display",
            "none",
            "important"
          );
      }
    }

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

    const tituloHtml =
      document.getElementById(
        "tituloEncabezadoComunidad"
      );

    const descripcionHtml =
      document.getElementById(
        "descripcionEncabezadoComunidad"
      );

    if (titulo && tituloHtml) {
      tituloHtml.textContent =
        titulo;

      document.title =
        `${titulo} · Liceo Hernán Vargas Ramírez`;
    }

    if (descripcionHtml) {
      descripcionHtml.textContent =
        descripcion;

      descripcionHtml.hidden =
        !descripcion;
    }
  }


  /* ==========================================================
     3. URL DE IMÁGENES
     ========================================================== */

  function construirUrlArchivo(
    seccion
  ) {
    const ruta = texto(
      seccion?.rutaArchivo ||
      seccion?.rutaRelativaArchivo ||
      seccion?.rutaRelativa ||
      seccion?.archivo?.rutaRelativa ||
      seccion?.archivo?.ruta ||
      ""
    );

    if (!ruta) {
      return "";
    }

    /*
     * Si ya viene como URL absoluta,
     * solamente aceptamos HTTP o HTTPS.
     */
    try {
      const urlAbsoluta =
        new URL(ruta);

      if (
        urlAbsoluta.protocol !==
          "http:" &&
        urlAbsoluta.protocol !==
          "https:"
      ) {
        return "";
      }

      return urlAbsoluta.href;
    } catch (_error) {
      /*
       * Si es una ruta relativa como:
       *
       * /uploads/images/paginas/imagen.png
       *
       * se construye usando el mismo origen
       * donde está ejecutándose el backend.
       */
    }

    try {
      const origenBackend =
        new URL(
          API_BASE_URL
        ).origin;

      return new URL(
        ruta.replace(/^\/+/, ""),
        `${origenBackend}/`
      ).href;
    } catch (_errorUrl) {
      return "";
    }
  }


  /* ==========================================================
     4. URL DE BOTONES
     ========================================================== */

  function urlPublicaSegura(valor) {
    const url =
      texto(valor);

    if (!url) {
      return "";
    }

    /*
     * Evita protocolos inseguros.
     */
    if (
      /^(javascript|data|vbscript):/i
        .test(url)
    ) {
      return "";
    }

    /*
     * URL absoluta HTTP/HTTPS.
     */
    if (/^https?:\/\//i.test(url)) {
      try {
        const urlAbsoluta =
          new URL(url);

        return urlAbsoluta.href;
      } catch (_error) {
        return "";
      }
    }

    /*
     * No aceptar otros esquemas.
     */
    if (
      /^[a-z][a-z0-9+.-]*:/i
        .test(url) ||
      url.startsWith("//")
    ) {
      return "";
    }

    /*
     * Enlaces internos:
     *
     * galeria.html
     * biblioteca-recursos.html
     * ../archivo.pdf
     * /ruta/interna
     */
    return url;
  }


  /* ==========================================================
     5. CREACIÓN DE PÁRRAFOS
     ========================================================== */

  function crearParrafos(
    contenido
  ) {
    const fragmento =
      document.createDocumentFragment();

    const contenidoLimpio =
      texto(contenido);

    if (!contenidoLimpio) {
      return fragmento;
    }

    /*
     * Cada línea en blanco separa un párrafo.
     */
    const parrafos =
      contenidoLimpio
        .split(/\n\s*\n/)
        .map(
          (parrafo) =>
            parrafo.trim()
        )
        .filter(Boolean);

    /*
     * Si por alguna razón no se detectó
     * ningún párrafo, usamos todo el contenido.
     */
    if (parrafos.length === 0) {
      const parrafo =
        document.createElement("p");

      parrafo.textContent =
        contenidoLimpio;

      fragmento.appendChild(
        parrafo
      );

      return fragmento;
    }

    parrafos.forEach(
      (contenidoParrafo) => {
        const parrafo =
          document.createElement("p");

        parrafo.textContent =
          contenidoParrafo;

        fragmento.appendChild(
          parrafo
        );
      }
    );

    return fragmento;
  }


  /* ==========================================================
     6. ETIQUETA
     ========================================================== */

  function crearEtiqueta(
    seccion
  ) {
    const contenidoEtiqueta =
      texto(
        seccion?.subtitulo ||
        seccion?.etiqueta
      );

    if (!contenidoEtiqueta) {
      return null;
    }

    const etiqueta =
      document.createElement(
        "span"
      );

    etiqueta.className =
      "comunidad-etiqueta";

    etiqueta.textContent =
      contenidoEtiqueta;

    return etiqueta;
  }


  /* ==========================================================
     7. BOTONES
     ========================================================== */

  function crearBoton(
    seccion,
    clases
  ) {
    const tipoEnlace =
      normalizarClave(
        seccion?.tipoEnlace ||
        "NINGUNO"
      );

    const textoBoton =
      texto(
        seccion?.textoBoton
      );

    const urlBoton =
      urlPublicaSegura(
        seccion?.urlBoton
      );

    if (
      tipoEnlace ===
        "NINGUNO" ||
      !textoBoton ||
      !urlBoton
    ) {
      return null;
    }

    const enlace =
      document.createElement("a");

    enlace.className =
      clases;

    enlace.textContent =
      textoBoton;

    enlace.href =
      urlBoton;

    /*
     * Los enlaces externos se abren
     * en una pestaña nueva.
     */
    if (
      tipoEnlace ===
      "EXTERNO"
    ) {
      enlace.target =
        "_blank";

      enlace.rel =
        "noopener noreferrer";
    }

    return enlace;
  }


  /* ==========================================================
     8. IMAGEN DE TARJETA
     ========================================================== */

  function crearImagen(
    seccion
  ) {
    const urlImagen =
      construirUrlArchivo(
        seccion
      );

    if (!urlImagen) {
      return null;
    }

    const figura =
      document.createElement(
        "figure"
      );

    figura.className =
      "comunidad-bloque__imagen";

    const imagen =
      document.createElement(
        "img"
      );

    imagen.src =
      urlImagen;

    imagen.alt =
      texto(
        seccion
          ?.textoAlternativo
      );

    imagen.loading =
      "lazy";

    imagen.decoding =
      "async";

    /*
     * Si una imagen no existe físicamente,
     * evitamos mostrar el espacio roto.
     */
    imagen.addEventListener(
      "error",
      () => {
        figura.hidden =
          true;
      },
      {
        once: true
      }
    );

    figura.appendChild(
      imagen
    );

    return figura;
  }


  /* ==========================================================
     9. CONTENIDO DE UNA TARJETA
     ========================================================== */

  function crearContenidoTarjeta(
    seccion
  ) {
    const contenedor =
      document.createElement(
        "div"
      );

    contenedor.className =
      "comunidad-bloque__texto";

    const etiqueta =
      crearEtiqueta(
        seccion
      );

    if (etiqueta) {
      contenedor.appendChild(
        etiqueta
      );
    }

    const titulo =
      texto(
        seccion?.titulo
      );

    if (titulo) {
      const encabezado =
        document.createElement(
          "h2"
        );

      encabezado.textContent =
        titulo;

      contenedor.appendChild(
        encabezado
      );
    }

    contenedor.appendChild(
      crearParrafos(
        seccion?.contenido
      )
    );

    /*
     * Botón opcional.
     */
    const boton =
      crearBoton(
        seccion,
        "boton boton--primario boton--pequeno"
      );

    if (boton) {
      const acciones =
        document.createElement(
          "div"
        );

      acciones.className =
        "comunidad-bloque__acciones";

      acciones.appendChild(
        boton
      );

      contenedor.appendChild(
        acciones
      );
    }

    return contenedor;
  }


  /* ==========================================================
     10. CREAR TARJETA
     ========================================================== */

  function crearTarjeta(
    seccion,
    indice
  ) {
    const invertida =
      indice % 2 !== 0;

    const articulo =
      document.createElement(
        "article"
      );

    articulo.className =
      "comunidad-bloque";

    if (invertida) {
      articulo.classList.add(
        "comunidad-bloque--invertido"
      );
    }

    const contenido =
      crearContenidoTarjeta(
        seccion
      );

    const imagen =
      crearImagen(
        seccion
      );

    /*
     * Mantiene exactamente el patrón
     * del HTML original.
     *
     * Tarjeta 1:
     * texto | imagen
     *
     * Tarjeta 2:
     * imagen | texto
     *
     * Tarjeta 3:
     * texto | imagen
     *
     * etc.
     */
    if (invertida) {
      if (imagen) {
        articulo.appendChild(
          imagen
        );
      }

      articulo.appendChild(
        contenido
      );
    } else {
      articulo.appendChild(
        contenido
      );

      if (imagen) {
        articulo.appendChild(
          imagen
        );
      }
    }

    return articulo;
  }


  /* ==========================================================
     11. INTRODUCCIÓN
     ========================================================== */

  function renderizarIntroduccion(
    seccion
  ) {
    const seccionHtml =
      document.getElementById(
        "seccionIntroComunidad"
      );

    const contenedor =
      document.getElementById(
        "contenidoIntroComunidad"
      );

    if (
      !seccionHtml ||
      !contenedor
    ) {
      return;
    }

    contenedor.innerHTML =
      "";

    if (!seccion) {
      seccionHtml.hidden =
        true;

      return;
    }

    const etiqueta =
      crearEtiqueta(
        seccion
      );

    if (etiqueta) {
      contenedor.appendChild(
        etiqueta
      );
    }

    const titulo =
      texto(
        seccion?.titulo
      );

    if (titulo) {
      const encabezado =
        document.createElement(
          "h2"
        );

      encabezado.textContent =
        titulo;

      contenedor.appendChild(
        encabezado
      );
    }

    contenedor.appendChild(
      crearParrafos(
        seccion?.contenido
      )
    );

    seccionHtml.hidden =
      false;
  }


  /* ==========================================================
     12. LISTADO DE TARJETAS
     ========================================================== */

  function renderizarTarjetas(
    secciones
  ) {
    const seccionHtml =
      document.getElementById(
        "seccionListadoComunidad"
      );

    const lista =
      document.getElementById(
        "listaComunidad"
      );

    if (
      !seccionHtml ||
      !lista
    ) {
      return;
    }

    lista.innerHTML =
      "";

    if (
      !Array.isArray(secciones) ||
      secciones.length === 0
    ) {
      seccionHtml.hidden =
        true;

      return;
    }

    secciones.forEach(
      (seccion, indice) => {
        lista.appendChild(
          crearTarjeta(
            seccion,
            indice
          )
        );
      }
    );

    seccionHtml.hidden =
      false;
  }


  /* ==========================================================
     13. CIERRE
     ========================================================== */

  function renderizarCierre(
    seccion
  ) {
    const seccionHtml =
      document.getElementById(
        "seccionCierreComunidad"
      );

    const tarjeta =
      document.getElementById(
        "contenidoCierreComunidad"
      );

    if (
      !seccionHtml ||
      !tarjeta
    ) {
      return;
    }

    tarjeta.innerHTML =
      "";

    if (!seccion) {
      seccionHtml.hidden =
        true;

      return;
    }

    const titulo =
      texto(
        seccion?.titulo
      );

    if (titulo) {
      const encabezado =
        document.createElement(
          "h2"
        );

      encabezado.textContent =
        titulo;

      tarjeta.appendChild(
        encabezado
      );
    }

    tarjeta.appendChild(
      crearParrafos(
        seccion?.contenido
      )
    );

    const boton =
      crearBoton(
        seccion,
        "boton boton--secundario"
      );

    if (boton) {
      tarjeta.appendChild(
        boton
      );
    }

    seccionHtml.hidden =
      false;
  }


  /* ==========================================================
     14. EXTRAER SECCIONES DE LA RESPUESTA
     ========================================================== */

  function extraerSecciones(
    respuesta
  ) {
    /*
     * Forma principal esperada:
     *
     * {
     *   datos: {
     *     secciones: [...]
     *   }
     * }
     */
    if (
      Array.isArray(
        respuesta
          ?.datos
          ?.secciones
      )
    ) {
      return respuesta
        .datos
        .secciones;
    }

    /*
     * Compatibilidad por si el controlador
     * devuelve directamente:
     *
     * {
     *   secciones: [...]
     * }
     */
    if (
      Array.isArray(
        respuesta?.secciones
      )
    ) {
      return respuesta.secciones;
    }

    /*
     * Compatibilidad adicional.
     */
    if (
      Array.isArray(
        respuesta?.datos
      )
    ) {
      return respuesta.datos;
    }

    return [];
  }


  /* ==========================================================
     15. RENDERIZACIÓN GENERAL
     ========================================================== */

  function renderizar(
    pagina,
    seccionesRecibidas
  ) {
    renderizarEncabezado(
      pagina
    );

    const secciones =
      ordenarSecciones(
        seccionesRecibidas
      );

    /*
     * Introducción especial.
     */
    const introduccion =
      seccionPorClave(
        secciones,
        CLAVE_INTRO
      );

    /*
     * Cierre especial.
     */
    const cierre =
      seccionPorClave(
        secciones,
        CLAVE_CIERRE
      );

    /*
     * Todas las demás secciones son tarjetas.
     *
     * Esto permite que cualquier tarjeta nueva
     * creada desde el panel administrativo
     * aparezca automáticamente aquí sin tener
     * que modificar este JavaScript.
     */
    const tarjetas =
      secciones.filter(
        (seccion) => {
          const clave =
            normalizarClave(
              seccion?.clave
            );

          return (
            clave !==
              CLAVE_INTRO &&
            clave !==
              CLAVE_CIERRE
          );
        }
      );

    renderizarIntroduccion(
      introduccion
    );

    renderizarTarjetas(
      tarjetas
    );

    renderizarCierre(
      cierre
    );
  }


  /* ==========================================================
     16. OCULTAR CONTENIDO
     ========================================================== */

  function ocultarContenido() {
    const intro =
      document.getElementById(
        "seccionIntroComunidad"
      );

    const listado =
      document.getElementById(
        "seccionListadoComunidad"
      );

    const cierre =
      document.getElementById(
        "seccionCierreComunidad"
      );

    if (intro) {
      intro.hidden =
        true;
    }

    if (listado) {
      listado.hidden =
        true;
    }

    if (cierre) {
      cierre.hidden =
        true;
    }
  }


  function establecerPaginaVisible(
    visible
  ) {
    const contenidoPagina =
      document.getElementById(
        "contenidoComunidadPublico"
      );

    if (!contenidoPagina) {
      return;
    }

    contenidoPagina.hidden =
      !visible;

    contenidoPagina.setAttribute(
      "aria-hidden",
      visible ? "false" : "true"
    );

    if (visible) {
      contenidoPagina.style
        .removeProperty("display");
    } else {
      contenidoPagina.style
        .setProperty(
          "display",
          "none",
          "important"
        );
    }
  }


  /* ==========================================================
     17. CARGAR DESDE LA API
     ========================================================== */

  async function cargar() {
    ocultarContenido();

    const controlador =
      new AbortController();

    const temporizador =
      global.setTimeout(
        () =>
          controlador.abort(),
        10000
      );

    try {
      const endpoint =
        `${API_BASE_URL}/paginas/publicas-parciales/comunidad` +
        `?_actualizacion=${Date.now()}`;

      const respuesta =
        await fetch(
          endpoint,
          {
            method:
              "GET",

            headers: {
              Accept:
                "application/json"
            },

            cache:
              "no-store",

            signal:
              controlador.signal
          }
        );

      if (!respuesta.ok) {
        const error = new Error(
          `La API respondió con HTTP ${respuesta.status}.`
        );

        error.statusCode =
          respuesta.status;

        throw error;
      }

      const contenido =
        await respuesta.json();

      const secciones =
        extraerSecciones(
          contenido
        );

      const pagina =
        extraerPagina(
          contenido
        );

      if (!pagina) {
        throw new Error(
          "La API no devolvió la página pública de Comunidad."
        );
      }

      establecerPaginaVisible(true);

      renderizar(
        pagina,
        Array.isArray(secciones)
          ? secciones
          : []
      );

      document.body.dataset
        .contenidoDinamico =
          "cargado";
    } catch (error) {
      console.error(
        "No fue posible cargar el contenido público de Comunidad.",
        error
      );

      ocultarContenido();

      if (error.statusCode === 404) {
        establecerPaginaVisible(false);

        document.body.dataset
          .contenidoDinamico =
            "no-disponible";
      } else {
        document.body.dataset
          .contenidoDinamico =
            "respaldo";
      }
    } finally {
      global.clearTimeout(
        temporizador
      );
    }
  }


  /* ==========================================================
     18. INICIO
     ========================================================== */

  document.addEventListener(
    "DOMContentLoaded",
    cargar
  );

})(window);
