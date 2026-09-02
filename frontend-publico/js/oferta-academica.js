/* ============================================================
   OFERTA ACADÉMICA - SITIO PÚBLICO LHVR
   ------------------------------------------------------------
   Carga desde la API:
   - Encabezado de Oferta académica.
   - Encabezado de Programas de estudio.
   - Ciclos educativos.
   - Materias publicadas.
   - Relaciones entre materias y ciclos.
   - Nota informativa final.

   Requiere:
   - filtros.js
   ============================================================ */

(function () {
  "use strict";

  const URL_API = String(
    window.API_PUBLICA_URL ||
    "http://127.0.0.1:3001/api"
  ).replace(/\/+$/, "");

  const ENDPOINT =
    "/oferta-academica/publica";

  const CLAVES = Object.freeze({
    ENCABEZADO:
      "ENCABEZADO_OFERTA_ACADEMICA",

    PROGRAMAS:
      "ENCABEZADO_PROGRAMAS_ESTUDIO",

    NOTA:
      "NOTA_OFERTA_ACADEMICA"
  });

  /*
   * ==========================================================
   * ELEMENTOS
   * ==========================================================
   */

  const elementos = {
    encabezadoOferta:
      document.getElementById(
        "encabezadoOferta"
      ),

    tituloOferta:
      document.getElementById(
        "tituloOferta"
      ),

    descripcionOferta:
      document.getElementById(
        "descripcionOferta"
      ),

    encabezadoProgramas:
      document.getElementById(
        "encabezadoProgramasOferta"
      ),

    tituloProgramas:
      document.getElementById(
        "tituloProgramasOferta"
      ),

    descripcionProgramas:
      document.getElementById(
        "descripcionProgramasOferta"
      ),

    filtros:
      document.getElementById(
        "filtrosOferta"
      ),

    tarjetas:
      document.getElementById(
        "tarjetasOferta"
      ),

    nota:
      document.getElementById(
        "notaOferta"
      )
  };

  /*
   * ==========================================================
   * UTILIDADES
   * ==========================================================
   */

  function texto(valor) {
    return String(
      valor ?? ""
    ).trim();
  }

  function normalizarClave(valor) {
    return texto(valor)
      .toUpperCase();
  }

  function extraerDatos(respuesta) {
    if (
      respuesta &&
      typeof respuesta === "object" &&
      respuesta.datos !== undefined
    ) {
      return respuesta.datos;
    }

    return respuesta;
  }

  function obtenerSeccion(
    secciones,
    clave
  ) {
    if (
      !Array.isArray(secciones)
    ) {
      return null;
    }

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

  function establecerVisibilidad(
    elemento,
    visible
  ) {
    if (!elemento) {
      return;
    }

    elemento.hidden = !visible;
    elemento.setAttribute(
      "aria-hidden",
      visible
        ? "false"
        : "true"
    );

    if (visible) {
      elemento.style.removeProperty(
        "display"
      );

      return;
    }

    elemento.style.setProperty(
      "display",
      "none"
    );
  }

  function convertirCategoria(
    nombre
  ) {
    const nombreNormalizado =
      texto(nombre)
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .toLowerCase();

    if (
      nombreNormalizado ===
      "iii ciclo"
    ) {
      return "tercer-ciclo";
    }

    if (
      nombreNormalizado ===
      "educacion diversificada"
    ) {
      return "diversificada";
    }

    return nombreNormalizado
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  }

  function ordenarPorOrden(
    lista
  ) {
    return [...lista].sort(
      (a, b) => {
        const ordenA =
          Number(
            a.orden ?? 0
          );

        const ordenB =
          Number(
            b.orden ?? 0
          );

        if (
          ordenA !== ordenB
        ) {
          return (
            ordenA -
            ordenB
          );
        }

        return texto(
          a.nombre
        ).localeCompare(
          texto(
            b.nombre
          ),
          "es"
        );
      }
    );
  }

  /*
   * ==========================================================
   * URL SEGURA
   * ==========================================================
   */

  function obtenerUrlSegura(
    url,
    tipoEnlace
  ) {
    const valor =
      texto(url);

    const tipo =
      normalizarClave(
        tipoEnlace
      );

    if (
      !valor ||
      valor === "#" ||
      tipo === "NINGUNO"
    ) {
      return null;
    }

    /*
     * Enlaces externos:
     * únicamente HTTP y HTTPS.
     */
    if (
      tipo === "EXTERNO"
    ) {
      try {
        const direccion =
          new URL(valor);

        if (
          direccion.protocol !==
            "http:" &&
          direccion.protocol !==
            "https:"
        ) {
          return null;
        }

        return direccion.href;
      } catch (error) {
        return null;
      }
    }

    /*
     * Enlaces internos o archivos:
     * pueden ser rutas relativas del sitio.
     */
    if (
      tipo === "INTERNO" ||
      tipo === "ARCHIVO"
    ) {
      try {
        const direccion =
          new URL(
            valor,
            window.location.href
          );

        if (
          direccion.protocol !==
            "http:" &&
          direccion.protocol !==
            "https:"
        ) {
          return null;
        }

        return valor;
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  /*
   * ==========================================================
   * CONSULTA DE API
   * ==========================================================
   */

  async function obtenerOfertaAcademica() {
    const separador =
      ENDPOINT.includes("?")
        ? "&"
        : "?";

    const url =
      `${URL_API}${ENDPOINT}` +
      `${separador}` +
      `_actualizacion=${Date.now()}`;

    const respuesta =
      await fetch(
        url,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json"
          }
        }
      );

    let contenido = null;

    try {
      contenido =
        await respuesta.json();
    } catch (error) {
      contenido = null;
    }

    if (!respuesta.ok) {
      throw new Error(
        contenido?.mensaje ||
        "No fue posible cargar la Oferta académica."
      );
    }

    return extraerDatos(
      contenido
    );
  }

  /*
   * ==========================================================
   * ENCABEZADOS Y NOTA
   * ==========================================================
   */

  function renderizarContenidoGeneral(
    secciones
  ) {
    const encabezado =
      obtenerSeccion(
        secciones,
        CLAVES.ENCABEZADO
      );

    const programas =
      obtenerSeccion(
        secciones,
        CLAVES.PROGRAMAS
      );

    const nota =
      obtenerSeccion(
        secciones,
        CLAVES.NOTA
      );

    establecerVisibilidad(
      elementos.encabezadoOferta,
      Boolean(encabezado)
    );

    establecerVisibilidad(
      elementos.encabezadoProgramas,
      Boolean(programas)
    );

    establecerVisibilidad(
      elementos.nota,
      Boolean(nota)
    );

    if (
      encabezado &&
      elementos.tituloOferta
    ) {
      const titulo =
        texto(
          encabezado.titulo
        );

      if (titulo) {
        elementos
          .tituloOferta
          .textContent =
            titulo;
      }
    }

    if (
      encabezado &&
      elementos.descripcionOferta
    ) {
      const descripcion =
        texto(
          encabezado.subtitulo ||
          encabezado.contenido
        );

      if (descripcion) {
        elementos
          .descripcionOferta
          .textContent =
            descripcion;
      }
    }

    if (
      programas &&
      elementos.tituloProgramas
    ) {
      const titulo =
        texto(
          programas.titulo
        );

      if (titulo) {
        elementos
          .tituloProgramas
          .textContent =
            titulo;
      }
    }

    if (
      programas &&
      elementos.descripcionProgramas
    ) {
      const descripcion =
        texto(
          programas.subtitulo ||
          programas.contenido
        );

      if (descripcion) {
        elementos
          .descripcionProgramas
          .textContent =
            descripcion;
      }
    }

    if (
      nota &&
      elementos.nota
    ) {
      const contenido =
        texto(
          nota.contenido ||
          nota.subtitulo ||
          nota.titulo
        );

      if (contenido) {
        elementos
          .nota
          .textContent =
            contenido;
      }
    }
  }

  /*
   * ==========================================================
   * FILTROS
   * ==========================================================
   */

  function crearBotonFiltro(
    textoBoton,
    categoria,
    activo = false
  ) {
    const boton =
      document.createElement(
        "button"
      );

    boton.type =
      "button";

    boton.className =
      activo
        ? "filtro activo"
        : "filtro";

    boton.dataset.filtro =
      categoria;

    boton.textContent =
      textoBoton;

    return boton;
  }

  function renderizarFiltros(
    ciclos
  ) {
    if (
      !elementos.filtros
    ) {
      return;
    }

    elementos
      .filtros
      .innerHTML = "";

    elementos
      .filtros
      .appendChild(
        crearBotonFiltro(
          "Todos",
          "todos",
          true
        )
      );

    ordenarPorOrden(
      Array.isArray(ciclos)
        ? ciclos
        : []
    ).forEach(
      (ciclo) => {
        const nombre =
          texto(
            ciclo.nombre
          );

        if (!nombre) {
          return;
        }

        elementos
          .filtros
          .appendChild(
            crearBotonFiltro(
              nombre,
              convertirCategoria(
                nombre
              )
            )
          );
      }
    );
  }

  /*
   * ==========================================================
   * RELACIONES MATERIA - CICLO
   * ==========================================================
   */

  function obtenerCiclosMateria(
    materia,
    ciclos,
    relaciones
  ) {
    const idMateria =
      Number(
        materia.idMateria
      );

    const idsCiclos =
      new Set(
        relaciones
          .filter(
            (relacion) =>
              Number(
                relacion.idMateria
              ) === idMateria
          )
          .map(
            (relacion) =>
              Number(
                relacion
                  .idCicloEducativo
              )
          )
      );

    return ordenarPorOrden(
      ciclos.filter(
        (ciclo) =>
          idsCiclos.has(
            Number(
              ciclo
                .idCicloEducativo
            )
          )
      )
    );
  }

  function obtenerTextoCiclos(
    ciclosMateria
  ) {
    const nombres =
      ciclosMateria
        .map(
          (ciclo) =>
            texto(
              ciclo.nombre
            )
        )
        .filter(Boolean);

    if (
      nombres.length === 0
    ) {
      return "";
    }

    /*
     * Conserva el texto corto que tenía
     * originalmente la página pública.
     */
    if (
      nombres.length === 2 &&
      nombres.includes(
        "III Ciclo"
      ) &&
      nombres.includes(
        "Educación Diversificada"
      )
    ) {
      return (
        "III Ciclo y Diversificada"
      );
    }

    return nombres.join(
      " y "
    );
  }

  function obtenerCategoriasMateria(
    ciclosMateria
  ) {
    return ciclosMateria
      .map(
        (ciclo) =>
          convertirCategoria(
            ciclo.nombre
          )
      )
      .filter(Boolean)
      .join(" ");
  }

  /*
   * ==========================================================
   * TARJETA
   * ==========================================================
   */

  function crearBotonMateria(
    materia
  ) {
    const tipo =
      normalizarClave(
        materia.tipoEnlace
      );

    const url =
      obtenerUrlSegura(
        materia.urlPlanEstudio,
        tipo
      );

    const textoBoton =
      texto(
        materia.textoBoton
      );

    if (
      tipo === "NINGUNO" ||
      !url ||
      !textoBoton
    ) {
      return null;
    }

    const pie =
      document.createElement(
        "div"
      );

    pie.className =
      "tarjeta__pie";

    const enlace =
      document.createElement(
        "a"
      );

    enlace.className =
      "boton boton--primario boton--pequeno";

    enlace.href =
      url;

    enlace.textContent =
      textoBoton;

    if (
      tipo === "EXTERNO" ||
      tipo === "ARCHIVO"
    ) {
      enlace.target =
        "_blank";

      enlace.rel =
        "noopener noreferrer";
    }

    pie.appendChild(
      enlace
    );

    return pie;
  }

  function crearTarjetaMateria(
    materia,
    ciclos,
    relaciones
  ) {
    const ciclosMateria =
      obtenerCiclosMateria(
        materia,
        ciclos,
        relaciones
      );

    const articulo =
      document.createElement(
        "article"
      );

    articulo.className =
      "tarjeta";

    articulo.dataset.categoria =
      obtenerCategoriasMateria(
        ciclosMateria
      );

    const textoCiclos =
      obtenerTextoCiclos(
        ciclosMateria
      );

    if (textoCiclos) {
      const etiqueta =
        document.createElement(
          "span"
        );

      etiqueta.className =
        "etiqueta";

      etiqueta.textContent =
        textoCiclos;

      articulo.appendChild(
        etiqueta
      );
    }

    const titulo =
      document.createElement(
        "h3"
      );

    titulo.className =
      "tarjeta__titulo";

    titulo.textContent =
      texto(
        materia.nombre
      );

    articulo.appendChild(
      titulo
    );

    const descripcion =
      texto(
        materia.descripcionPublica
      );

    if (descripcion) {
      const parrafo =
        document.createElement(
          "p"
        );

      parrafo.className =
        "tarjeta__texto";

      parrafo.textContent =
        descripcion;

      articulo.appendChild(
        parrafo
      );
    }

    const boton =
      crearBotonMateria(
        materia
      );

    if (boton) {
      articulo.appendChild(
        boton
      );
    }

    return articulo;
  }

  /*
   * ==========================================================
   * RENDERIZAR MATERIAS
   * ==========================================================
   */

  function renderizarMaterias(
    materias,
    ciclos,
    relaciones
  ) {
    if (
      !elementos.tarjetas
    ) {
      return;
    }

    elementos
      .tarjetas
      .innerHTML = "";

    const listaMaterias =
      ordenarPorOrden(
        Array.isArray(materias)
          ? materias
          : []
      );

    if (
      listaMaterias.length === 0
    ) {
      const mensaje =
        document.createElement(
          "p"
        );

      mensaje.className =
        "estado";

      mensaje.textContent =
        "Actualmente no hay materias publicadas en la Oferta académica.";

      elementos
        .tarjetas
        .appendChild(
          mensaje
        );

      return;
    }

    listaMaterias.forEach(
      (materia) => {
        elementos
          .tarjetas
          .appendChild(
            crearTarjetaMateria(
              materia,
              ciclos,
              relaciones
            )
          );
      }
    );
  }

  /*
   * ==========================================================
   * ACTIVAR FILTROS
   * ==========================================================
   */

  function iniciarFiltros() {
    if (
      typeof window.activarFiltros !==
      "function"
    ) {
      console.warn(
        "No se encontró activarFiltros() en filtros.js."
      );

      return;
    }

    window.activarFiltros(
      "filtrosOferta",
      "tarjetasOferta"
    );
  }

  /*
   * ==========================================================
   * ESTADO DE ERROR
   * ==========================================================
   */

  function mostrarError(
    mensaje
  ) {
    if (
      !elementos.tarjetas
    ) {
      return;
    }

    elementos
      .tarjetas
      .innerHTML = "";

    const estado =
      document.createElement(
        "p"
      );

    estado.className =
      "estado";

    estado.textContent =
      mensaje;

    elementos
      .tarjetas
      .appendChild(
        estado
      );
  }

  /*
   * ==========================================================
   * CARGA PRINCIPAL
   * ==========================================================
   */

  async function cargarOfertaAcademica() {
    try {
      const datos =
        await obtenerOfertaAcademica();

      const secciones =
        Array.isArray(
          datos?.secciones
        )
          ? datos.secciones
          : [];

      const ciclos =
        Array.isArray(
          datos?.ciclos
        )
          ? datos.ciclos
          : [];

      const materias =
        Array.isArray(
          datos?.materias
        )
          ? datos.materias
          : [];

      const relaciones =
        Array.isArray(
          datos?.relaciones
        )
          ? datos.relaciones
          : [];

      renderizarContenidoGeneral(
        secciones
      );

      renderizarFiltros(
        ciclos
      );

      renderizarMaterias(
        materias,
        ciclos,
        relaciones
      );

      iniciarFiltros();

    } catch (error) {
      console.error(
        "Error al cargar Oferta académica:",
        error
      );

      mostrarError(
        "No fue posible cargar la Oferta académica en este momento."
      );
    }
  }

  /*
   * ==========================================================
   * INICIALIZACIÓN
   * ==========================================================
   */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      cargarOfertaAcademica,
      {
        once: true
      }
    );
  } else {
    cargarOfertaAcademica();
  }
})();
