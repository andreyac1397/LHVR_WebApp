/* ============================================================
   NOSOTROS.JS - SITIO PÚBLICO LHVR
   ------------------------------------------------------------
   Responsabilidades:

   - Consultar el contenido público de la página Nosotros.
   - Mostrar el encabezado de la página.
   - Mostrar Historia e imagen institucional.
   - Mostrar Misión y Visión.
   - Crear dinámicamente las tarjetas de normativa.
   - Ocultar las secciones que no estén publicadas.
   - Mantener el contenido estático del HTML como respaldo
     cuando la API no esté disponible.
   ============================================================ */

(function configurarNosotrosPublico(global) {
  "use strict";

  const SLUG_PAGINA =
    "nosotros";

  /*
   * Durante el desarrollo, el backend funciona
   * en http://localhost:3001.
   *
   * Más adelante puede definirse:
   *
   * window.API_PUBLICA_URL = "https://dominio.com/api";
   */
  const API_BASE_URL =
    String(
      global.API_PUBLICA_URL ||
      "http://localhost:3001/api"
    ).replace(
      /\/+$/,
      ""
    );

  const ENDPOINT_CONTENIDO =
    `${API_BASE_URL}/paginas/publicas/` +
    `${encodeURIComponent(
      SLUG_PAGINA
    )}`;

  const CLAVES =
    Object.freeze({
      ENCABEZADO:
        "ENCABEZADO_NOSOTROS",

      HISTORIA:
        "HISTORIA_NOSOTROS",

      MISION:
        "MISION_NOSOTROS",

      VISION:
        "VISION_NOSOTROS",

      ENCABEZADO_NORMATIVA:
        "ENCABEZADO_NORMATIVA",

      PREFIJO_NORMATIVA:
        "NORMATIVA_"
    });

  let cargaIniciada =
    false;

  let secciones =
    [];

  /**
   * Convierte un valor en texto limpio.
   *
   * @param {*} valor
   * @returns {string}
   */
  function texto(valor) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return "";
    }

    return String(valor).trim();
  }

  /**
   * Normaliza claves y categorías.
   *
   * @param {*} valor
   * @returns {string}
   */
  function normalizarClave(valor) {
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

  /**
   * Busca un elemento mediante su id.
   *
   * @param {string} id
   * @returns {HTMLElement|null}
   */
  function porId(id) {
    return document.getElementById(
      id
    );
  }

  /**
   * Muestra u oculta un elemento.
   *
   * @param {HTMLElement|null} elemento
   * @param {boolean} visible
   */
  function establecerVisibilidad(
    elemento,
    visible
  ) {
    if (!elemento) {
      return;
    }

    elemento.hidden =
      !visible;
  }

  /**
   * Asigna texto a un elemento.
   *
   * @param {HTMLElement|null} elemento
   * @param {*} valor
   */
  function establecerTexto(
    elemento,
    valor
  ) {
    if (!elemento) {
      return;
    }

    elemento.textContent =
      texto(valor);
  }

  /**
   * Extrae el objeto útil de una respuesta,
   * aunque la API utilice data o datos.
   *
   * @param {*} respuesta
   * @returns {*}
   */
  function extraerDatos(respuesta) {
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

  /**
   * Indica si una sección puede mostrarse.
   *
   * El endpoint público normalmente devuelve solamente
   * contenido publicado. Esta validación funciona como
   * protección adicional.
   *
   * @param {object} seccion
   * @returns {boolean}
   */
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
      ].includes(estado)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Busca una sección por su clave.
   *
   * @param {string} clave
   * @returns {object|null}
   */
  function obtenerSeccion(clave) {
    const claveBuscada =
      normalizarClave(clave);

    return (
      secciones.find(
        (seccion) =>
          normalizarClave(
            seccion.clave
          ) === claveBuscada
      ) ||
      null
    );
  }

  /**
   * Construye la dirección pública de un archivo.
   *
   * @param {object} seccion
   * @returns {string}
   */
  function construirUrlArchivo(
    seccion
  ) {
    const ruta =
      texto(
        seccion?.urlArchivo ||
        seccion?.rutaArchivo ||
        seccion
          ?.rutaRelativaArchivo ||
        seccion
          ?.archivo
          ?.urlArchivo ||
        seccion
          ?.archivo
          ?.rutaRelativa ||
        seccion
          ?.archivo
          ?.ruta
      );

    if (!ruta) {
      return "";
    }

    try {
      return new URL(ruta).href;
    } catch (error) {
      /*
       * La ruta no era absoluta.
       */
    }

    try {
      const origenApi =
        new URL(
          API_BASE_URL
        ).origin;

      return new URL(
        ruta.replace(
          /^\/+/,
          ""
        ),
        `${origenApi}/`
      ).href;
    } catch (error) {
      try {
        return new URL(
          ruta,
          document.baseURI
        ).href;
      } catch (errorRuta) {
        return ruta;
      }
    }
  }

  /**
   * Crea un párrafo que conserva saltos
   * de línea sencillos.
   *
   * @param {string} contenido
   * @returns {HTMLParagraphElement}
   */
  function crearParrafo(
    contenido
  ) {
    const parrafo =
      document.createElement(
        "p"
      );

    const lineas =
      String(contenido)
        .split(/\r?\n/);

    lineas.forEach(
      (
        linea,
        indice
      ) => {
        if (indice > 0) {
          parrafo.appendChild(
            document.createElement(
              "br"
            )
          );
        }

        parrafo.appendChild(
          document.createTextNode(
            linea
          )
        );
      }
    );

    return parrafo;
  }

  /**
   * Renderiza texto extenso separándolo
   * en párrafos.
   *
   * @param {HTMLElement|null} contenedor
   * @param {*} contenido
   */
  function renderizarContenidoLargo(
    contenedor,
    contenido
  ) {
    if (!contenedor) {
      return;
    }

    contenedor.innerHTML =
      "";

    const valor =
      texto(contenido);

    if (!valor) {
      return;
    }

    const parrafos =
      valor
        .split(
          /\r?\n\s*\r?\n/
        )
        .map(
          (parrafo) =>
            parrafo.trim()
        )
        .filter(Boolean);

    parrafos.forEach(
      (parrafo) => {
        contenedor.appendChild(
          crearParrafo(
            parrafo
          )
        );
      }
    );
  }

  /**
   * Renderiza la banda principal.
   */
  function renderizarEncabezado() {
    const contenedor =
      porId(
        "seccionEncabezadoNosotros"
      );

    const seccion =
      obtenerSeccion(
        CLAVES.ENCABEZADO
      );

    establecerVisibilidad(
      contenedor,
      Boolean(seccion)
    );

    if (!seccion) {
      return;
    }

    establecerTexto(
      porId(
        "tituloEncabezadoNosotros"
      ),
      seccion.titulo
    );

    establecerTexto(
      porId(
        "descripcionEncabezadoNosotros"
      ),
      seccion.subtitulo ||
      seccion.contenido
    );
  }

  /**
   * Renderiza Historia e imagen.
   */
  function renderizarHistoria() {
    const contenedor =
      porId(
        "seccionHistoriaNosotros"
      );

    const seccion =
      obtenerSeccion(
        CLAVES.HISTORIA
      );

    establecerVisibilidad(
      contenedor,
      Boolean(seccion)
    );

    if (!seccion) {
      return;
    }

    establecerTexto(
      porId(
        "tituloHistoriaNosotros"
      ),
      seccion.titulo
    );

    const subtitulo =
      porId(
        "subtituloHistoriaNosotros"
      );

    establecerTexto(
      subtitulo,
      seccion.subtitulo
    );

    establecerVisibilidad(
      subtitulo,
      Boolean(
        texto(
          seccion.subtitulo
        )
      )
    );

    renderizarContenidoLargo(
      porId(
        "contenidoHistoriaNosotros"
      ),
      seccion.contenido
    );

    const imagen =
      porId(
        "imagenHistoriaNosotros"
      );

    if (!imagen) {
      return;
    }

    const imagenPredeterminada =
      texto(
        imagen.dataset
          .imagenPredeterminada
      ) ||
      imagen.src;

    const urlImagen =
      construirUrlArchivo(
        seccion
      );

    if (urlImagen) {
      imagen.src =
        urlImagen;
    } else {
      imagen.src =
        imagenPredeterminada;
    }

    imagen.alt =
      texto(
        seccion.textoAlternativo
      ) ||
      "Fachada del Liceo Hernán Vargas Ramírez";

    imagen.addEventListener(
      "error",
      () => {
        if (
          imagen.src !==
          new URL(
            imagenPredeterminada,
            document.baseURI
          ).href
        ) {
          imagen.src =
            imagenPredeterminada;
        }
      },
      {
        once: true
      }
    );
  }

  /**
   * Renderiza una tarjeta de principio institucional.
   *
   * @param {object} configuracion
   * @returns {boolean}
   */
  function renderizarPrincipio(
    configuracion
  ) {
    const seccion =
      obtenerSeccion(
        configuracion.clave
      );

    const tarjeta =
      porId(
        configuracion.idTarjeta
      );

    establecerVisibilidad(
      tarjeta,
      Boolean(seccion)
    );

    if (!seccion) {
      return false;
    }

    establecerTexto(
      porId(
        configuracion.idTitulo
      ),
      seccion.titulo
    );

    establecerTexto(
      porId(
        configuracion.idDescripcion
      ),
      seccion.subtitulo ||
      seccion.contenido
    );

    return true;
  }

  /**
   * Renderiza Misión y Visión.
   */
  function renderizarPrincipios() {
    const misionVisible =
      renderizarPrincipio({
        clave:
          CLAVES.MISION,

        idTarjeta:
          "tarjetaMisionNosotros",

        idTitulo:
          "tituloMisionNosotros",

        idDescripcion:
          "descripcionMisionNosotros"
      });

    const visionVisible =
      renderizarPrincipio({
        clave:
          CLAVES.VISION,

        idTarjeta:
          "tarjetaVisionNosotros",

        idTitulo:
          "tituloVisionNosotros",

        idDescripcion:
          "descripcionVisionNosotros"
      });

    establecerVisibilidad(
      porId(
        "seccionPrincipiosNosotros"
      ),
      misionVisible ||
      visionVisible
    );
  }

  /**
   * Devuelve las tarjetas de normativa
   * ordenadas.
   *
   * @returns {object[]}
   */
  function obtenerNormativas() {
    return secciones
      .filter(
        (seccion) => {
          const clave =
            normalizarClave(
              seccion.clave
            );

          const tipoDiseno =
            normalizarClave(
              seccion.tipoDiseno
            );

          return (
            clave.startsWith(
              CLAVES.PREFIJO_NORMATIVA
            ) &&
            clave !==
              CLAVES
                .ENCABEZADO_NORMATIVA
          ) ||
          tipoDiseno ===
            "TARJETA_NORMATIVA";
        }
      )
      .sort(
        (a, b) =>
          Number(
            a.orden || 0
          ) -
          Number(
            b.orden || 0
          )
      );
  }

  /**
   * Aplica la apariencia de la etiqueta.
   *
   * @param {HTMLElement} etiqueta
   * @param {object} seccion
   */
  function configurarEtiquetaNormativa(
    etiqueta,
    seccion
  ) {
    if (!etiqueta) {
      return;
    }

    const categoria =
      normalizarClave(
        seccion.contenido ||
        seccion.etiqueta ||
        seccion.clave
      );

    etiqueta.classList.remove(
      "etiqueta--reglamento",
      "etiqueta--boletin"
    );

    if (
      categoria.includes(
        "REGLAMENTO"
      )
    ) {
      etiqueta.classList.add(
        "etiqueta--reglamento"
      );

      return;
    }

    if (
      categoria.includes(
        "CONVIVENCIA"
      ) ||
      categoria.includes(
        "BOLETIN"
      )
    ) {
      etiqueta.classList.add(
        "etiqueta--boletin"
      );
    }
  }

  /**
   * Configura el botón de una normativa.
   *
   * @param {HTMLElement|null} pie
   * @param {HTMLAnchorElement|null} enlace
   * @param {object} seccion
   */
  function configurarEnlaceNormativa(
    pie,
    enlace,
    seccion
  ) {
    if (
      !pie ||
      !enlace
    ) {
      return;
    }

    const tipoEnlace =
      normalizarClave(
        seccion.tipoEnlace ||
        "NINGUNO"
      );

    let url =
      texto(
        seccion.urlBoton
      );

    if (
      !url &&
      tipoEnlace ===
        "ARCHIVO"
    ) {
      url =
        construirUrlArchivo(
          seccion
        );
    }

    const mostrarEnlace =
      tipoEnlace !==
        "NINGUNO" &&
      Boolean(url);

    establecerVisibilidad(
      pie,
      mostrarEnlace
    );

    if (!mostrarEnlace) {
      enlace.removeAttribute(
        "href"
      );

      return;
    }

    enlace.textContent =
      texto(
        seccion.textoBoton
      ) ||
      "Ver documento";

    enlace.href =
      url;

    if (
      [
        "EXTERNO",
        "ARCHIVO"
      ].includes(
        tipoEnlace
      )
    ) {
      enlace.target =
        "_blank";

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
  }

  /**
   * Crea una tarjeta de normativa.
   *
   * @param {object} seccion
   * @returns {HTMLElement|null}
   */
  function crearTarjetaNormativa(
    seccion
  ) {
    const plantilla =
      porId(
        "plantillaNormativaNosotros"
      );

    if (!plantilla) {
      return null;
    }

    const fragmento =
      plantilla.content.cloneNode(
        true
      );

    const tarjeta =
      fragmento.querySelector(
        ".tarjeta"
      );

    if (!tarjeta) {
      return null;
    }

    tarjeta.dataset
      .normativaClave =
        texto(
          seccion.clave
        );

    const etiqueta =
      tarjeta.querySelector(
        ".normativa-nosotros__etiqueta"
      );

    const titulo =
      tarjeta.querySelector(
        ".normativa-nosotros__titulo"
      );

    const descripcion =
      tarjeta.querySelector(
        ".normativa-nosotros__descripcion"
      );

    const pie =
      tarjeta.querySelector(
        ".normativa-nosotros__pie"
      );

    const enlace =
      tarjeta.querySelector(
        ".normativa-nosotros__enlace"
      );

    establecerTexto(
      etiqueta,
      seccion.etiqueta ||
      "Normativa"
    );

    establecerTexto(
      titulo,
      seccion.titulo
    );

    establecerTexto(
      descripcion,
      seccion.subtitulo ||
      seccion.descripcion
    );

    establecerVisibilidad(
      descripcion,
      Boolean(
        texto(
          seccion.subtitulo ||
          seccion.descripcion
        )
      )
    );

    configurarEtiquetaNormativa(
      etiqueta,
      seccion
    );

    configurarEnlaceNormativa(
      pie,
      enlace,
      seccion
    );

    return tarjeta;
  }

  /**
   * Renderiza el encabezado y las tarjetas
   * de normativa.
   */
  function renderizarNormativas() {
    const seccionGeneral =
      porId(
        "seccionNormativaNosotros"
      );

    const encabezado =
      porId(
        "encabezadoNormativaNosotros"
      );

    const lista =
      porId(
        "listaNormativasNosotros"
      );

    const encabezadoDatos =
      obtenerSeccion(
        CLAVES
          .ENCABEZADO_NORMATIVA
      );

    const normativas =
      obtenerNormativas();

    /*
     * La sección completa se oculta cuando
     * no existe ninguna tarjeta publicada.
     */
    establecerVisibilidad(
      seccionGeneral,
      normativas.length > 0
    );

    if (
      normativas.length === 0
    ) {
      return;
    }

    establecerVisibilidad(
      encabezado,
      Boolean(
        encabezadoDatos
      )
    );

    if (encabezadoDatos) {
      establecerTexto(
        porId(
          "tituloNormativaNosotros"
        ),
        encabezadoDatos.titulo
      );

      establecerTexto(
        porId(
          "descripcionNormativaNosotros"
        ),
        encabezadoDatos.subtitulo ||
        encabezadoDatos.contenido
      );
    }

    if (!lista) {
      return;
    }

    /*
     * Se elimina el contenido estático de respaldo
     * solamente después de recibir correctamente la API.
     */
    lista.innerHTML =
      "";

    normativas.forEach(
      (seccion) => {
        const tarjeta =
          crearTarjetaNormativa(
            seccion
          );

        if (tarjeta) {
          lista.appendChild(
            tarjeta
          );
        }
      }
    );
  }

  /**
   * Ajusta información general del documento.
   *
   * @param {object|null} pagina
   */
  function renderizarDatosPagina(
    pagina
  ) {
    if (!pagina) {
      return;
    }

    const nombre =
      texto(
        pagina.nombre ||
        pagina.titulo
      );

    if (nombre) {
      document.title =
        `${nombre} | ` +
        "Liceo Hernán Vargas Ramírez";
    }
  }

  /**
   * Renderiza toda la página.
   *
   * @param {object|null} pagina
   */
  function renderizarPagina(
    pagina
  ) {
    renderizarDatosPagina(
      pagina
    );

    renderizarEncabezado();
    renderizarHistoria();
    renderizarPrincipios();
    renderizarNormativas();

    document.body.dataset
      .contenidoDinamico =
        "cargado";
  }

  /**
   * Consulta el endpoint público.
   *
   * @returns {Promise<object>}
   */
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
    } catch (error) {
      cuerpo =
        null;
    }

    if (!respuesta.ok) {
      const datosError =
        extraerDatos(
          cuerpo
        );

      throw new Error(
        texto(
          datosError?.mensaje ||
          cuerpo?.mensaje
        ) ||
        `No fue posible cargar Nosotros. Código ${respuesta.status}.`
      );
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
        "La API no devolvió el contenido de Nosotros."
      );
    }

    return datos;
  }

  /**
   * Inicializa el contenido dinámico.
   */
  async function cargarNosotros() {
    if (cargaIniciada) {
      return;
    }

    cargaIniciada =
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
          ? contenido.secciones
              .filter(
                esSeccionVisible
              )
          : [];

      if (!pagina) {
        throw new Error(
          "La API no devolvió la información de la página Nosotros."
        );
      }

      renderizarPagina(
        pagina
      );
    } catch (error) {
      /*
       * Si el backend no responde, se conserva
       * el contenido estático del HTML.
       */
      console.error(
        "No fue posible cargar el contenido dinámico de Nosotros:",
        error
      );

      document.body.dataset
        .contenidoDinamico =
          "respaldo";
    }
  }

  /*
   * Compatible con la carga normal del documento
   * y con scripts ejecutados después de DOMContentLoaded.
   */
  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      cargarNosotros,
      {
        once: true
      }
    );
  } else {
    cargarNosotros();
  }
})(window);