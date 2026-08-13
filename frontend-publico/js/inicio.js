/* ============================================================
   INICIO.JS - Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Responsabilidad:
   - Consultar el contenido público de la página Inicio.
   - Mostrar el Hero, botones principales y accesos rápidos.
   - Mantener el contenido HTML original si la API falla.
   - Cargar los boletines y actividades resumidas de Inicio.
   ============================================================ */

(function iniciarModuloInicio(global) {
  "use strict";

  /* ==========================================================
     1. CONFIGURACIÓN
     ========================================================== */

  const API_BASE_URL = String(
    global.API_PUBLICA_URL ||
    "http://127.0.0.1:3001/api"
  ).replace(/\/+$/, "");

  const ORIGEN_BACKEND = (() => {
    try {
      return new URL(API_BASE_URL).origin;
    } catch (_error) {
      return "http://127.0.0.1:3001";
    }
  })();

  const ENDPOINT_INICIO =
    `${API_BASE_URL}/paginas/publicas/inicio`;

  const TIEMPO_ESPERA_MS = 10000;

  const CLAVES = Object.freeze({
    HERO: "HERO_INICIO",

    BOTON_CONOCE:
      "BOTON_CONOCE_LICEO",

    BOTON_CONTACTO:
      "BOTON_CONTACTO",

    ENCABEZADO_ACCESOS:
      "ENCABEZADO_ACCESOS_RAPIDOS",

    PREFIJO_ACCESO:
      "ACCESO_RAPIDO_"
  });

  let plantillasAccesos =
    new Map();

  /* ==========================================================
     2. UTILIDADES
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
    return texto(valor).toUpperCase();
  }

  function obtenerElemento(id) {
    return document.getElementById(id);
  }

  function obtenerElementos() {
    return {
      hero:
        obtenerElemento(
          "heroInicio"
        ),

      imagenHero:
        obtenerElemento(
          "imagenHeroInicio"
        ),

      tituloHero:
        obtenerElemento(
          "tituloHeroInicio"
        ),

      subtituloHero:
        obtenerElemento(
          "subtituloHeroInicio"
        ),

      accionesHero:
        obtenerElemento(
          "accionesHeroInicio"
        ),

      botonConoce:
        obtenerElemento(
          "botonConoceInicio"
        ),

      botonContacto:
        obtenerElemento(
          "botonContactoInicio"
        ),

      seccionAccesos:
        obtenerElemento(
          "seccionAccesosInicio"
        ),

      tituloAccesos:
        obtenerElemento(
          "tituloAccesosInicio"
        ),

      descripcionAccesos:
        obtenerElemento(
          "descripcionAccesosInicio"
        ),

      listaAccesos:
        obtenerElemento(
          "accesosRapidosInicio"
        )
    };
  }

  function obtenerDatosRespuesta(
    respuesta
  ) {
    if (
      respuesta?.datos &&
      typeof respuesta.datos ===
        "object"
    ) {
      return respuesta.datos;
    }

    if (
      respuesta?.data &&
      typeof respuesta.data ===
        "object"
    ) {
      return respuesta.data;
    }

    return respuesta;
  }

  function obtenerSeccion(
    secciones,
    clave
  ) {
    const claveBuscada =
      normalizarClave(clave);

    return (
      secciones.find(
        (seccion) =>
          normalizarClave(
            seccion?.clave
          ) === claveBuscada
      ) ||
      null
    );
  }

  function obtenerAccesosRapidos(
    secciones
  ) {
    return secciones
      .filter(
        (seccion) =>
          normalizarClave(
            seccion?.clave
          ).startsWith(
            CLAVES.PREFIJO_ACCESO
          )
      )
      .sort(
        (a, b) =>
          Number(a?.orden || 0) -
          Number(b?.orden || 0)
      );
  }

  /* ==========================================================
     3. SOLICITUD A LA API
     ========================================================== */

  async function consultarContenidoInicio() {
    const controlador =
      new AbortController();

    const temporizador =
      global.setTimeout(
        () =>
          controlador.abort(),
        TIEMPO_ESPERA_MS
      );

    try {
      const respuesta =
        await fetch(
          ENDPOINT_INICIO,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json"
            },

            signal:
              controlador.signal
          }
        );

      const contenido =
        await respuesta
          .json()
          .catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          contenido?.mensaje ||
          "No fue posible cargar la página Inicio."
        );
      }

      if (
        contenido?.exito === false
      ) {
        throw new Error(
          contenido?.mensaje ||
          "La API no pudo cargar la página Inicio."
        );
      }

      return contenido;
    } finally {
      global.clearTimeout(
        temporizador
      );
    }
  }

  /* ==========================================================
     4. CONSTRUCCIÓN DE RUTAS
     ========================================================== */

  function construirUrlArchivo(
    seccion
  ) {
    const ruta =
      texto(
        seccion?.rutaArchivo ||
        seccion
          ?.rutaRelativaArchivo ||
        seccion
          ?.archivo
          ?.rutaRelativa ||
        seccion
          ?.archivo
          ?.ruta
      );

    if (
      !ruta ||
      !esUrlPermitida(ruta, "ARCHIVO")
    ) {
      return "";
    }

    try {
      return new URL(ruta).href;
    } catch (error) {
      /*
       * La ruta no es absoluta.
       * Se construirá con el origen del backend.
       */
    }

    try {
      return new URL(
        ruta.replace(
          /^\/+/,
          ""
        ),
        `${ORIGEN_BACKEND}/`
      ).href;
    } catch (error) {
      return "";
    }
  }

  function esUrlPermitida(url, tipoEnlace) {
    const valor =
      texto(url);

    if (!valor) {
      return false;
    }

    if (
      /[\u0000-\u001F\u007F]/.test(valor) ||
      valor.startsWith("//")
    ) {
      return false;
    }

    const protocolo =
      valor.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]
        ?.toLowerCase();

    if (protocolo) {
      if (!["http", "https"].includes(protocolo)) {
        return false;
      }

      try {
        new URL(valor);
      } catch (_error) {
        return false;
      }
    }

    return tipoEnlace === "EXTERNO"
      ? Boolean(protocolo)
      : true;
  }

  function configurarEnlace(
    enlace,
    seccion
  ) {
    if (!enlace) {
      return false;
    }

    const tipoEnlace =
      normalizarClave(
        seccion?.tipoEnlace
      );

    const url =
      texto(
        seccion?.urlBoton ||
        seccion?.url
      );

    if (
      tipoEnlace === "NINGUNO" ||
      !esUrlPermitida(url, tipoEnlace)
    ) {
      enlace.hidden = true;
      enlace.removeAttribute(
        "href"
      );

      return false;
    }

    enlace.hidden = false;
    enlace.href = url;

    if (tipoEnlace === "EXTERNO") {
      enlace.target = "_blank";

      enlace.rel =
        "noopener noreferrer";
    } else {
      enlace.removeAttribute(
        "target"
      );

      enlace.removeAttribute(
        "rel"
      );
    }

    return true;
  }

  /* ==========================================================
     5. HERO
     ========================================================== */

  function renderizarHero(
    secciones
  ) {
    const elementos =
      obtenerElementos();

    const hero =
      obtenerSeccion(
        secciones,
        CLAVES.HERO
      );

    /*
     * El endpoint público solo devuelve secciones publicadas.
     * Si el Hero no viene en la respuesta, se oculta.
     */
    if (!hero) {
      if (elementos.hero) {
        elementos.hero.hidden =
          true;
      }

      return;
    }

    if (elementos.hero) {
      elementos.hero.hidden =
        false;
    }

    const titulo =
      texto(hero.titulo) ||
      "Liceo Hernán Vargas Ramírez";

    const subtitulo =
      texto(hero.subtitulo);

    if (elementos.tituloHero) {
      elementos
        .tituloHero
        .textContent =
          titulo;
    }

    if (elementos.subtituloHero) {
      elementos
        .subtituloHero
        .textContent =
          subtitulo;

      elementos
        .subtituloHero
        .hidden =
          !subtitulo;
    }

    if (elementos.imagenHero) {
      const urlImagen =
        construirUrlArchivo(
          hero
        );

      elementos
        .imagenHero
        .src =
          urlImagen ||
          "assets/logos/logo-liceo.jpg";

      elementos
        .imagenHero
        .alt =
          texto(
            hero.textoAlternativo
          ) ||
          `Imagen principal de ${titulo}`;

      elementos
        .imagenHero
        .onerror = function manejarErrorImagen() {
          this.onerror = null;

          this.src =
            "assets/logos/logo-liceo.jpg";
        };
    }
  }

  /* ==========================================================
     6. BOTONES PRINCIPALES
     ========================================================== */

  function renderizarBoton(
    enlace,
    seccion,
    textoPredeterminado
  ) {
    if (!enlace) {
      return;
    }

    if (!seccion) {
      enlace.hidden = true;
      return;
    }

    enlace.textContent =
      texto(
        seccion.textoBoton
      ) ||
      texto(
        seccion.titulo
      ) ||
      textoPredeterminado;

    configurarEnlace(
      enlace,
      seccion
    );
  }

  function renderizarBotones(
    secciones
  ) {
    const elementos =
      obtenerElementos();

    const botonConoce =
      obtenerSeccion(
        secciones,
        CLAVES.BOTON_CONOCE
      );

    const botonContacto =
      obtenerSeccion(
        secciones,
        CLAVES.BOTON_CONTACTO
      );

    renderizarBoton(
      elementos.botonConoce,
      botonConoce,
      "Conoce el liceo"
    );

    renderizarBoton(
      elementos.botonContacto,
      botonContacto,
      "Contáctanos"
    );

    const hayBotones =
      Boolean(
        elementos.botonConoce &&
        !elementos.botonConoce.hidden
      ) ||
      Boolean(
        elementos.botonContacto &&
        !elementos
          .botonContacto
          .hidden
      );

    if (
      elementos.accionesHero
    ) {
      elementos
        .accionesHero
        .hidden =
          !hayBotones;
    }
  }

  /* ==========================================================
     7. ENCABEZADO DE ACCESOS RÁPIDOS
     ========================================================== */

  function renderizarEncabezadoAccesos(
    secciones
  ) {
    const elementos =
      obtenerElementos();

    const encabezado =
      obtenerSeccion(
        secciones,
        CLAVES.ENCABEZADO_ACCESOS
      );

    if (!encabezado) {
      return;
    }

    const titulo =
      texto(
        encabezado.titulo
      );

    const subtitulo =
      texto(
        encabezado.subtitulo
      );

    if (
      elementos.tituloAccesos &&
      titulo
    ) {
      elementos
        .tituloAccesos
        .textContent =
          titulo;
    }

    if (
      elementos.descripcionAccesos
    ) {
      elementos
        .descripcionAccesos
        .textContent =
          subtitulo;

      elementos
        .descripcionAccesos
        .hidden =
          !subtitulo;
    }
  }

  /* ==========================================================
     8. PLANTILLAS DE ACCESOS
     ========================================================== */

  function guardarPlantillasAccesos() {
    const elementos =
      obtenerElementos();

    if (!elementos.listaAccesos) {
      return;
    }

    plantillasAccesos =
      new Map();

    elementos
      .listaAccesos
      .querySelectorAll(
        "[data-clave-acceso]"
      )
      .forEach(
        (tarjeta) => {
          const clave =
            normalizarClave(
              tarjeta.dataset
                .claveAcceso
            );

          if (clave) {
            plantillasAccesos.set(
              clave,
              tarjeta.cloneNode(true)
            );
          }
        }
      );
  }

  function crearIconoGenerico() {
    const contenedor =
      document.createElement(
        "span"
      );

    contenedor.className =
      "tarjeta__icono";

    contenedor.setAttribute(
      "aria-hidden",
      "true"
    );

    contenedor.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"></path>
        <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15"></path>
      </svg>
    `;

    return contenedor;
  }

  function crearTarjetaGenerica() {
    const tarjeta =
      document.createElement(
        "a"
      );

    tarjeta.className =
      "tarjeta acceso";

    tarjeta.appendChild(
      crearIconoGenerico()
    );

    const titulo =
      document.createElement(
        "h3"
      );

    titulo.className =
      "tarjeta__titulo";

    tarjeta.appendChild(
      titulo
    );

    const descripcion =
      document.createElement(
        "p"
      );

    descripcion.className =
      "tarjeta__texto";

    tarjeta.appendChild(
      descripcion
    );

    return tarjeta;
  }

  function crearTarjetaAcceso(
    seccion
  ) {
    const clave =
      normalizarClave(
        seccion?.clave
      );

    const plantilla =
      plantillasAccesos.get(
        clave
      );

    const tarjeta =
      plantilla
        ? plantilla.cloneNode(true)
        : crearTarjetaGenerica();

    tarjeta.hidden = false;

    tarjeta.dataset
      .claveAcceso =
        clave;

    const titulo =
      texto(
        seccion?.titulo
      ) ||
      texto(
        seccion?.textoBoton
      ) ||
      texto(
        seccion?.etiqueta
      ) ||
      "Acceso";

    const descripcion =
      texto(
        seccion?.subtitulo
      ) ||
      texto(
        seccion?.contenido
      );

    const tituloElemento =
      tarjeta.querySelector(
        ".tarjeta__titulo"
      );

    const descripcionElemento =
      tarjeta.querySelector(
        ".tarjeta__texto"
      );

    if (tituloElemento) {
      tituloElemento.textContent =
        titulo;
    }

    if (descripcionElemento) {
      descripcionElemento.textContent =
        descripcion;

      descripcionElemento.hidden =
        !descripcion;
    }

    const enlaceValido =
      configurarEnlace(
        tarjeta,
        seccion
      );

    if (!enlaceValido) {
      return null;
    }

    tarjeta.setAttribute(
      "aria-label",
      descripcion
        ? `${titulo}: ${descripcion}`
        : titulo
    );

    return tarjeta;
  }

  /* ==========================================================
     9. ACCESOS RÁPIDOS
     ========================================================== */

  function renderizarAccesosRapidos(
    secciones
  ) {
    const elementos =
      obtenerElementos();

    if (!elementos.listaAccesos) {
      return;
    }

    const accesos =
      obtenerAccesosRapidos(
        secciones
      );

    elementos
      .listaAccesos
      .innerHTML = "";

    accesos.forEach(
      (acceso) => {
        const tarjeta =
          crearTarjetaAcceso(
            acceso
          );

        if (tarjeta) {
          elementos
            .listaAccesos
            .appendChild(
              tarjeta
            );
        }
      }
    );

    const hayAccesos =
      elementos
        .listaAccesos
        .children
        .length > 0;

    if (
      elementos.seccionAccesos
    ) {
      elementos
        .seccionAccesos
        .hidden =
          !hayAccesos;
    }
  }

  /* ==========================================================
     10. RENDERIZADO GENERAL
     ========================================================== */

  function renderizarContenidoInicio(
    contenido
  ) {
    const datos =
      obtenerDatosRespuesta(
        contenido
      );

    const secciones =
      Array.isArray(
        datos?.secciones
      )
        ? datos.secciones
        : [];

    if (
      !Array.isArray(
        datos?.secciones
      )
    ) {
      throw new Error(
        "La API no devolvió las secciones de la página Inicio."
      );
    }

    renderizarHero(
      secciones
    );

    renderizarBotones(
      secciones
    );

    renderizarEncabezadoAccesos(
      secciones
    );

    renderizarAccesosRapidos(
      secciones
    );
  }

  /* ==========================================================
     11. CONTENIDO AUTOMÁTICO EXISTENTE
     ========================================================== */

  function cargarContenidoAutomatico() {
    if (
      typeof global
        .renderBoletines ===
      "function"
    ) {
      global.renderBoletines(
        "boletinesInicio",
        {
          limite: 3
        }
      );
    }

    if (
      typeof global
        .renderCalendario ===
      "function"
    ) {
      global.renderCalendario(
        "calendarioInicio",
        {
          limite: 3,
          soloProximas: true
        }
      );
    }
  }

  /* ==========================================================
     12. INICIALIZACIÓN
     ========================================================== */

  async function cargarInicio() {
    guardarPlantillasAccesos();

    /*
     * Boletines y calendario siguen funcionando
     * independientemente de la API de páginas.
     */
    cargarContenidoAutomatico();

    try {
      const contenido =
        await consultarContenidoInicio();

      renderizarContenidoInicio(
        contenido
      );
    } catch (error) {
      /*
       * Si el backend no responde, se mantiene el contenido
       * predeterminado que ya está escrito en index.html.
       */
      console.warn(
        "No se pudo cargar el contenido dinámico de Inicio. Se utilizará el contenido predeterminado.",
        error
      );
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      cargarInicio,
      {
        once: true
      }
    );
  } else {
    cargarInicio();
  }

  global.INICIO_PUBLICO = Object.freeze({
    recargar:
      cargarInicio
  });
})(window);
