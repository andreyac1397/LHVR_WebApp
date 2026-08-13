/* ============================================================
   PÁGINA INICIO - PANEL ADMINISTRATIVO LHVR
   ------------------------------------------------------------
   Contiene únicamente la lógica específica del editor Inicio.

   Requiere:
   - paginas-contenido-contenido.js
   - alertas-admin.js
   - modal-admin.js
   ============================================================ */

(function configurarPaginaInicio(global) {
  "use strict";

  const comun =
    global.PAGINAS_CONTENIDO_ADMIN;

  if (!comun) {
    throw new Error(
      "No se pudo cargar paginas-inicio.js. " +
      "Verifique que paginas-contenido.js se cargue primero."
    );
  }

  const MAXIMO_ACCESOS = 12;

  const CLAVES = Object.freeze({
    HERO:
      "HERO_INICIO",

    BOTON_CONOCE:
      "BOTON_CONOCE_LICEO",

    BOTON_CONTACTO:
      "BOTON_CONTACTO",

    ENCABEZADO_ACCESOS:
      "ENCABEZADO_ACCESOS_RAPIDOS",

    PREFIJO_ACCESO:
      "ACCESO_RAPIDO_"
  });

  let eventosConfigurados = false;
  let contadorAccesos = 0;
  let accesosPendientesOcultar = [];

  let imagenHeroPendiente = null;
  let urlTemporalImagenHero = null;

  /*
   * ==========================================================
   * 1. ELEMENTOS DEL DOCUMENTO
   * ==========================================================
   */

  function obtenerElementos() {
    const porId =
      comun.porId;

    return {
      formularioHero:
        porId(
          "formularioHeroInicio"
        ),

      idSeccionHero:
        porId(
          "idSeccionHero"
        ),

      idPaginaHero:
        porId(
          "idPaginaHero"
        ),

      tituloHero:
        porId(
          "tituloHero"
        ),

      subtituloHero:
        porId(
          "subtituloHero"
        ),

      textoAlternativoHero:
        porId(
          "textoAlternativoHero"
        ),

      estadoHero:
        porId(
          "estadoHero"
        ),

      idArchivoHero:
        porId(
          "idArchivoHero"
        ),

      inputImagenHero:
        porId(
          "inputImagenHero"
        ),

      vistaPreviaImagenHero:
        porId(
          "vistaPreviaImagenHero"
        ),

      nombreImagenHero:
        porId(
          "nombreImagenHero"
        ),

      detalleImagenHero:
        porId(
          "detalleImagenHero"
        ),

      botonSeleccionarImagenHero:
        porId(
          "botonSeleccionarImagenHero"
        ),

      botonQuitarImagenHero:
        porId(
          "botonQuitarImagenHero"
        ),

      botonGuardarHero:
        porId(
          "botonGuardarHero"
        ),

      cargadorGuardarHero:
        porId(
          "cargadorGuardarHero"
        ),

      formularioBotones:
        porId(
          "formularioBotonesInicio"
        ),

      idSeccionBotonConoce:
        porId(
          "idSeccionBotonConoce"
        ),

      textoBotonConoce:
        porId(
          "textoBotonConoce"
        ),

      urlBotonConoce:
        porId(
          "urlBotonConoce"
        ),

      tipoEnlaceBotonConoce:
        porId(
          "tipoEnlaceBotonConoce"
        ),

      estadoBotonConoce:
        porId(
          "estadoBotonConoce"
        ),

      idSeccionBotonContacto:
        porId(
          "idSeccionBotonContacto"
        ),

      textoBotonContacto:
        porId(
          "textoBotonContacto"
        ),

      urlBotonContacto:
        porId(
          "urlBotonContacto"
        ),

      tipoEnlaceBotonContacto:
        porId(
          "tipoEnlaceBotonContacto"
        ),

      estadoBotonContacto:
        porId(
          "estadoBotonContacto"
        ),

      botonGuardarBotones:
        porId(
          "botonGuardarBotones"
        ),

      cargadorGuardarBotones:
        porId(
          "cargadorGuardarBotones"
        ),

      formularioEncabezadoAccesos:
        porId(
          "formularioEncabezadoAccesos"
        ),

      idSeccionEncabezadoAccesos:
        porId(
          "idSeccionEncabezadoAccesos"
        ),

      tituloAccesos:
        porId(
          "tituloAccesos"
        ),

      descripcionAccesos:
        porId(
          "descripcionAccesos"
        ),

      estadoEncabezadoAccesos:
        porId(
          "estadoEncabezadoAccesos"
        ),

      botonGuardarEncabezadoAccesos:
        porId(
          "botonGuardarEncabezadoAccesos"
        ),

      botonAgregarAcceso:
        porId(
          "botonAgregarAcceso"
        ),

      listaAccesosRapidos:
        porId(
          "listaAccesosRapidos"
        ),

      estadoVacioAccesos:
        porId(
          "estadoVacioAccesos"
        ),

      botonGuardarAccesos:
        porId(
          "botonGuardarAccesos"
        ),

      cargadorGuardarAccesos:
        porId(
          "cargadorGuardarAccesos"
        ),

      plantillaAccesoRapido:
        porId(
          "plantillaAccesoRapido"
        )
    };
  }

  /*
   * ==========================================================
   * 2. ESTADO TEMPORAL DE LA IMAGEN PRINCIPAL
   * ==========================================================
   */

  function liberarUrlTemporalImagenHero() {
    if (!urlTemporalImagenHero) {
      return;
    }

    comun.liberarUrlTemporal(
      urlTemporalImagenHero
    );

    urlTemporalImagenHero = null;
  }

  function limpiarSeleccionTemporalImagenHero() {
    const elementos =
      obtenerElementos();

    liberarUrlTemporalImagenHero();

    imagenHeroPendiente = null;

    if (
      elementos.inputImagenHero
    ) {
      elementos
        .inputImagenHero
        .value = "";
    }
  }

  /*
   * ==========================================================
   * 3. RENDERIZADO DEL HERO
   * ==========================================================
   */

  function renderizarHero() {
    const elementos =
      obtenerElementos();

    const pagina =
      comun.obtenerPaginaActual();

    const seccion =
      comun.obtenerSeccion(
        CLAVES.HERO
      );

    const estado =
      comun.obtenerEstadoPredeterminado();

    if (
      elementos.idSeccionHero
    ) {
      elementos
        .idSeccionHero
        .value =
          seccion
            ?.idSeccionPagina ||
          "";
    }

    if (
      elementos.idPaginaHero
    ) {
      elementos
        .idPaginaHero
        .value =
          pagina?.idPagina ||
          "";
    }

    if (elementos.tituloHero) {
      elementos
        .tituloHero
        .value =
          seccion?.titulo ||
          "Liceo Hernán Vargas Ramírez";
    }

    if (elementos.subtituloHero) {
      elementos
        .subtituloHero
        .value =
          seccion?.subtitulo ||
          "";
    }

    if (
      elementos.textoAlternativoHero
    ) {
      elementos
        .textoAlternativoHero
        .value =
          seccion
            ?.textoAlternativo ||
          "Escudo del Liceo Hernán Vargas Ramírez";
    }

    if (
      elementos.idArchivoHero
    ) {
      elementos
        .idArchivoHero
        .value =
          seccion?.idArchivo ||
          "";
    }

    comun.llenarSelectEstados(
      elementos.estadoHero,

      seccion
        ?.idEstadoPublicacion ||
      estado
        ?.idEstadoPublicacion
    );

    const urlImagen =
      comun.construirUrlArchivo(
        seccion
      );

    if (
      elementos.vistaPreviaImagenHero
    ) {
      elementos
        .vistaPreviaImagenHero
        .src =
          urlImagen ||
          "../../assets/logos/logo-liceo.jpg";

      elementos
        .vistaPreviaImagenHero
        .alt =
          seccion
            ?.textoAlternativo ||
          "";
    }

    if (
      elementos.nombreImagenHero
    ) {
      elementos
        .nombreImagenHero
        .textContent =
          seccion
            ?.nombreArchivoOriginal ||
          seccion
            ?.nombreArchivoAlmacenado ||
          seccion
            ?.nombreArchivo ||
          seccion
            ?.nombreOriginalArchivo ||
          (
            seccion?.idArchivo
              ? `Archivo #${seccion.idArchivo}`
              : "Imagen institucional actual"
          );
    }

    if (
      elementos.detalleImagenHero
    ) {
      elementos
        .detalleImagenHero
        .textContent =
          seccion?.mimeTypeArchivo ||
          seccion?.extensionArchivo ||
          (
            seccion?.idArchivo
              ? "Imagen vinculada a la sección principal."
              : "No hay un archivo de la biblioteca vinculado."
          );
    }
  }

  /*
   * ==========================================================
   * 4. RENDERIZADO DE BOTONES PRINCIPALES
   * ==========================================================
   */

  function renderizarBoton(datos) {
    const seccion =
      comun.obtenerSeccion(
        datos.clave
      );

    const estado =
      comun.obtenerEstadoPredeterminado();

    if (datos.idSeccion) {
      datos.idSeccion.value =
        seccion
          ?.idSeccionPagina ||
        "";
    }

    if (datos.texto) {
      datos.texto.value =
        seccion?.textoBoton ||
        seccion?.titulo ||
        datos.textoPredeterminado;
    }

    if (datos.url) {
      datos.url.value =
        seccion?.urlBoton ||
        datos.urlPredeterminada;
    }

    if (datos.tipoEnlace) {
      datos.tipoEnlace.value =
        seccion?.tipoEnlace ||
        "INTERNO";
    }

    comun.llenarSelectEstados(
      datos.estado,

      seccion
        ?.idEstadoPublicacion ||
      estado
        ?.idEstadoPublicacion
    );
  }

  function renderizarBotones() {
    const elementos =
      obtenerElementos();

    renderizarBoton({
      clave:
        CLAVES.BOTON_CONOCE,

      idSeccion:
        elementos
          .idSeccionBotonConoce,

      texto:
        elementos
          .textoBotonConoce,

      url:
        elementos
          .urlBotonConoce,

      tipoEnlace:
        elementos
          .tipoEnlaceBotonConoce,

      estado:
        elementos
          .estadoBotonConoce,

      textoPredeterminado:
        "Conoce el liceo",

      urlPredeterminada:
        "pages/nosotros.html"
    });

    renderizarBoton({
      clave:
        CLAVES.BOTON_CONTACTO,

      idSeccion:
        elementos
          .idSeccionBotonContacto,

      texto:
        elementos
          .textoBotonContacto,

      url:
        elementos
          .urlBotonContacto,

      tipoEnlace:
        elementos
          .tipoEnlaceBotonContacto,

      estado:
        elementos
          .estadoBotonContacto,

      textoPredeterminado:
        "Contáctanos",

      urlPredeterminada:
        "pages/contacto-ubicacion.html"
    });
  }

  /*
   * ==========================================================
   * 5. RENDERIZADO DEL ENCABEZADO DE ACCESOS
   * ==========================================================
   */

  function renderizarEncabezadoAccesos() {
    const elementos =
      obtenerElementos();

    const seccion =
      comun.obtenerSeccion(
        CLAVES.ENCABEZADO_ACCESOS
      );

    const estado =
      comun.obtenerEstadoPredeterminado();

    if (
      elementos.idSeccionEncabezadoAccesos
    ) {
      elementos
        .idSeccionEncabezadoAccesos
        .value =
          seccion
            ?.idSeccionPagina ||
          "";
    }

    if (elementos.tituloAccesos) {
      elementos
        .tituloAccesos
        .value =
          seccion?.titulo ||
          "Accesos rápidos";
    }

    if (
      elementos.descripcionAccesos
    ) {
      elementos
        .descripcionAccesos
        .value =
          seccion?.subtitulo ||
          seccion?.contenido ||
          "";
    }

    comun.llenarSelectEstados(
      elementos
        .estadoEncabezadoAccesos,

      seccion
        ?.idEstadoPublicacion ||
      estado
        ?.idEstadoPublicacion
    );
  }

  /*
   * ==========================================================
   * 6. ACCESOS RÁPIDOS
   * ==========================================================
   */

  function obtenerAccesos() {
    return comun
      .obtenerSeccionesActuales()
      .filter(
        (seccion) => {
          const esAccesoRapido =
            comun.normalizarClave(
              seccion.clave
            ).startsWith(
              CLAVES.PREFIJO_ACCESO
            ) ||
            comun.normalizarClave(
              seccion.tipoDiseno
            ) ===
              "ACCESO_RAPIDO";

          return (
            esAccesoRapido &&
            comun.esSeccionVisible(
              seccion
            )
          );
        }
      )
      .sort(
        (a, b) =>
          Number(a.orden || 0) -
          Number(b.orden || 0)
      );
  }

  function crearClaveAcceso() {
    contadorAccesos += 1;

    return (
      `${CLAVES.PREFIJO_ACCESO}` +
      `${Date.now()}_` +
      `${contadorAccesos}`
    );
  }

  function actualizarTarjetasAcceso() {
    const elementos =
      obtenerElementos();

    const tarjetas =
      Array.from(
        elementos
          .listaAccesosRapidos
          ?.querySelectorAll(
            ".pagina-contenido-admin__acceso"
          ) ||
        []
      );

    tarjetas.forEach(
      (
        tarjeta,
        indice
      ) => {
        const numero =
          tarjeta.querySelector(
            ".pagina-contenido-admin__acceso-numero"
          );

        const tituloVisual =
          tarjeta.querySelector(
            ".pagina-contenido-admin__acceso-titulo"
          );

        const titulo =
          comun.texto(
            tarjeta.querySelector(
              ".acceso-rapido__titulo"
            )?.value
          );

        const orden =
          tarjeta.querySelector(
            ".acceso-rapido__orden"
          );

        if (numero) {
          numero.textContent =
            `Acceso rápido ${indice + 1}`;
        }

        if (tituloVisual) {
          tituloVisual.textContent =
            titulo ||
            "Nuevo acceso";
        }

        if (
          orden &&
          comun.texto(
            orden.value
          ) === ""
        ) {
          orden.value =
            String(
              indice + 1
            );
        }
      }
    );

    if (
      elementos.estadoVacioAccesos
    ) {
      elementos
        .estadoVacioAccesos
        .hidden =
          tarjetas.length > 0;
    }
  }

  function crearTarjetaAcceso(
    seccion = null
  ) {
    const elementos =
      obtenerElementos();

    if (
      !elementos.plantillaAccesoRapido ||
      !elementos.listaAccesosRapidos
    ) {
      return null;
    }

    const fragmento =
      elementos
        .plantillaAccesoRapido
        .content
        .cloneNode(true);

    const tarjeta =
      fragmento.querySelector(
        ".pagina-contenido-admin__acceso"
      );

    if (!tarjeta) {
      return null;
    }

    const estado =
      comun.obtenerEstadoPredeterminado();

    const id =
      tarjeta.querySelector(
        ".acceso-rapido__id"
      );

    const clave =
      tarjeta.querySelector(
        ".acceso-rapido__clave"
      );

    const titulo =
      tarjeta.querySelector(
        ".acceso-rapido__titulo"
      );

    const descripcion =
      tarjeta.querySelector(
        ".acceso-rapido__descripcion"
      );

    const icono =
      tarjeta.querySelector(
        ".acceso-rapido__icono"
      );

    const url =
      tarjeta.querySelector(
        ".acceso-rapido__url"
      );

    const tipoEnlace =
      tarjeta.querySelector(
        ".acceso-rapido__tipo-enlace"
      );

    const orden =
      tarjeta.querySelector(
        ".acceso-rapido__orden"
      );

    const selectEstado =
      tarjeta.querySelector(
        ".acceso-rapido__estado"
      );

    const botonQuitar =
      tarjeta.querySelector(
        ".acceso-rapido__quitar"
      );

    if (id) {
      id.value =
        seccion
          ?.idSeccionPagina ||
        "";
    }

    if (clave) {
      clave.value =
        seccion?.clave ||
        crearClaveAcceso();
    }

    if (titulo) {
      titulo.value =
        seccion?.titulo ||
        "";
    }

    if (descripcion) {
      descripcion.value =
        seccion?.subtitulo ||
        "";
    }

    if (icono) {
      icono.value =
        seccion?.contenido ||
        "ACCESO_BOLETINES";
    }

    if (url) {
      url.value =
        seccion?.urlBoton ||
        "";
    }

    if (tipoEnlace) {
      tipoEnlace.value =
        seccion?.tipoEnlace ||
        "INTERNO";
    }

    if (orden) {
      orden.value =
        String(
          Number(
            seccion?.orden ||
            elementos
              .listaAccesosRapidos
              .querySelectorAll(
                ".pagina-contenido-admin__acceso"
              ).length + 1
          )
        );
    }

    comun.llenarSelectEstados(
      selectEstado,

      seccion
        ?.idEstadoPublicacion ||
      estado
        ?.idEstadoPublicacion
    );

    if (seccion) {
      tarjeta.dataset
        .seccionOriginal =
          JSON.stringify(
            seccion
          );
    }

    titulo
      ?.addEventListener(
        "input",
        actualizarTarjetasAcceso
      );

    botonQuitar
      ?.addEventListener(
        "click",
        () =>
          quitarAccesoRapido(
            tarjeta
          )
      );

    elementos
      .listaAccesosRapidos
      .appendChild(
        tarjeta
      );

    actualizarTarjetasAcceso();

    return tarjeta;
  }

  function renderizarAccesos() {
    const elementos =
      obtenerElementos();

    elementos
      .listaAccesosRapidos
      ?.querySelectorAll(
        ".pagina-contenido-admin__acceso"
      )
      .forEach(
        (tarjeta) =>
          tarjeta.remove()
      );

    obtenerAccesos().forEach(
      (seccion) =>
        crearTarjetaAcceso(
          seccion
        )
    );

    actualizarTarjetasAcceso();
  }

  /*
   * ==========================================================
   * 7. RENDERIZADO COMPLETO DE INICIO
   * ==========================================================
   */

  function renderizar() {
    renderizarHero();
    renderizarBotones();
    renderizarEncabezadoAccesos();
    renderizarAccesos();
  }

  /*
   * ==========================================================
   * 8. CONSTRUCCIÓN DE DATOS DEL HERO
   * ==========================================================
   */

  function obtenerDatosHero() {
    const elementos =
      obtenerElementos();

    const titulo =
      comun.texto(
        elementos
          .tituloHero
          ?.value
      );

    const idEstado =
      comun.validarEstado(
        elementos.estadoHero
      );

    comun.marcarInvalido(
      elementos.tituloHero,
      !titulo
    );

    if (
      !titulo ||
      !idEstado
    ) {
      comun.mostrarMensaje(
        "Complete el título principal y seleccione el estado de publicación.",
        "error"
      );

      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        elementos
          .idSeccionHero
          ?.value,

      clave:
        CLAVES.HERO,

      etiqueta:
        "Sección principal del Inicio",

      titulo,

      subtitulo:
        elementos
          .subtituloHero
          ?.value,

      idArchivo:
        elementos
          .idArchivoHero
          ?.value,

      textoAlternativo:
        elementos
          .textoAlternativoHero
          ?.value,

      tipoEnlace:
        "NINGUNO",

      tipoDiseno:
        "HERO",

      posicionImagen:
        "IZQUIERDA",

      orden: 1,

      idEstadoPublicacion:
        idEstado
    });
  }

  /*
   * ==========================================================
   * 9. CONSTRUCCIÓN DE DATOS DE BOTONES
   * ==========================================================
   */

  function obtenerDatosBoton(datos) {
    const textoBoton =
      comun.texto(
        datos.texto?.value
      );

    const urlBoton =
      comun.texto(
        datos.url?.value
      );

    const tipoEnlace =
      comun.normalizarClave(
        datos.tipoEnlace
          ?.value ||
        "INTERNO"
      );

    const idEstado =
      comun.validarEstado(
        datos.estado
      );

    const tieneEnlace =
      tipoEnlace !==
      "NINGUNO";

    comun.marcarInvalido(
      datos.texto,
      tieneEnlace &&
      !textoBoton
    );

    comun.marcarInvalido(
      datos.url,
      tieneEnlace &&
      !urlBoton
    );

    if (
      !idEstado ||
      (
        tieneEnlace &&
        (
          !textoBoton ||
          !urlBoton
        )
      )
    ) {
      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        datos.idSeccion?.value,

      clave:
        datos.clave,

      etiqueta:
        datos.etiqueta,

      textoBoton:
        tieneEnlace
          ? textoBoton
          : null,

      urlBoton:
        tieneEnlace
          ? urlBoton
          : null,

      tipoEnlace,

      tipoDiseno:
        "BOTON_HERO",

      posicionImagen:
        "NINGUNA",

      orden:
        datos.orden,

      idEstadoPublicacion:
        idEstado
    });
  }

  /*
   * ==========================================================
   * 10. CONSTRUCCIÓN DEL ENCABEZADO DE ACCESOS
   * ==========================================================
   */

  function obtenerDatosEncabezadoAccesos() {
    const elementos =
      obtenerElementos();

    const titulo =
      comun.texto(
        elementos
          .tituloAccesos
          ?.value
      );

    const idEstado =
      comun.validarEstado(
        elementos
          .estadoEncabezadoAccesos
      );

    comun.marcarInvalido(
      elementos.tituloAccesos,
      !titulo
    );

    if (
      !titulo ||
      !idEstado
    ) {
      comun.mostrarMensaje(
        "Ingrese el título de accesos rápidos y seleccione un estado.",
        "error"
      );

      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        elementos
          .idSeccionEncabezadoAccesos
          ?.value,

      clave:
        CLAVES.ENCABEZADO_ACCESOS,

      etiqueta:
        "Encabezado de accesos rápidos",

      titulo,

      subtitulo:
        elementos
          .descripcionAccesos
          ?.value,

      tipoEnlace:
        "NINGUNO",

      tipoDiseno:
        "ENCABEZADO_SECCION",

      posicionImagen:
        "NINGUNA",

      orden: 10,

      idEstadoPublicacion:
        idEstado
    });
  }

  /*
   * ==========================================================
   * 11. CONSTRUCCIÓN DE TARJETAS DE ACCESO
   * ==========================================================
   */

  function obtenerDatosTarjeta(
    tarjeta,
    indice
  ) {
    const idSeccion =
      tarjeta.querySelector(
        ".acceso-rapido__id"
      );

    const clave =
      tarjeta.querySelector(
        ".acceso-rapido__clave"
      );

    const titulo =
      tarjeta.querySelector(
        ".acceso-rapido__titulo"
      );

    const descripcion =
      tarjeta.querySelector(
        ".acceso-rapido__descripcion"
      );

    const icono =
      tarjeta.querySelector(
        ".acceso-rapido__icono"
      );

    const url =
      tarjeta.querySelector(
        ".acceso-rapido__url"
      );

    const tipoEnlace =
      tarjeta.querySelector(
        ".acceso-rapido__tipo-enlace"
      );

    const orden =
      tarjeta.querySelector(
        ".acceso-rapido__orden"
      );

    const estado =
      tarjeta.querySelector(
        ".acceso-rapido__estado"
      );

    const valorTitulo =
      comun.texto(
        titulo?.value
      );

    const valorUrl =
      comun.texto(
        url?.value
      );

    const valorTipoEnlace =
      comun.normalizarClave(
        tipoEnlace?.value ||
        "INTERNO"
      );

    const valorOrden =
      comun.numeroOpcional(
        orden?.value
      );

    const idEstado =
      comun.validarEstado(
        estado
      );

    const requiereUrl =
      valorTipoEnlace !==
      "NINGUNO";

    comun.marcarInvalido(
      titulo,
      !valorTitulo
    );

    comun.marcarInvalido(
      url,
      requiereUrl &&
      !valorUrl
    );

    comun.marcarInvalido(
      orden,
      valorOrden === null ||
      !Number.isInteger(
        valorOrden
      ) ||
      valorOrden < 0
    );

    if (
      !valorTitulo ||
      !idEstado ||
      (
        requiereUrl &&
        !valorUrl
      ) ||
      valorOrden === null ||
      !Number.isInteger(
        valorOrden
      ) ||
      valorOrden < 0
    ) {
      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        idSeccion?.value,

      clave:
        clave?.value ||
        crearClaveAcceso(),

      etiqueta:
        `Acceso rápido ${indice + 1}`,

      titulo:
        valorTitulo,

      subtitulo:
        descripcion?.value,

      contenido:
        icono?.value,

      textoBoton:
        requiereUrl
          ? valorTitulo
          : null,

      urlBoton:
        requiereUrl
          ? valorUrl
          : null,

      tipoEnlace:
        valorTipoEnlace,

      tipoDiseno:
        "ACCESO_RAPIDO",

      posicionImagen:
        "NINGUNA",

      orden:
        valorOrden,

      idEstadoPublicacion:
        idEstado
    });
  }

  function obtenerDatosAccesos() {
    const elementos =
      obtenerElementos();

    const tarjetas =
      Array.from(
        elementos
          .listaAccesosRapidos
          ?.querySelectorAll(
            ".pagina-contenido-admin__acceso"
          ) ||
        []
      );

    const datos =
      tarjetas.map(
        obtenerDatosTarjeta
      );

    if (
      datos.some(
        (item) =>
          item === null
      )
    ) {
      comun.mostrarMensaje(
        "Revise los datos de los accesos rápidos marcados en rojo.",
        "error"
      );

      return null;
    }

    const ordenes =
      datos.map(
        (item) =>
          item.orden
      );

    if (
      new Set(ordenes).size !==
      ordenes.length
    ) {
      comun.mostrarMensaje(
        "Cada acceso rápido debe tener un número de orden diferente.",
        "error"
      );

      return null;
    }

    return datos;
  }

  function crearDatosOcultamientoAcceso(
    seccion
  ) {
    return comun.crearDatosOcultamiento(
      seccion,
      "No existe un estado no visible para quitar el acceso rápido."
    );
  }

  /*
   * ==========================================================
   * 12. GUARDAR HERO
   * ==========================================================
   */

  async function guardarHero(evento) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarProcesoGuardado({
      formulario:
        elementos.formularioHero,

      boton:
        elementos.botonGuardarHero,

      cargador:
        elementos.cargadorGuardarHero,

      validar:
        obtenerDatosHero,

      async ejecutar() {
        if (imagenHeroPendiente) {
          const respuestaCarga =
            await comun.subirImagenPagina(
              imagenHeroPendiente,
              elementos
                .textoAlternativoHero
                ?.value
            );

          const idArchivo =
            comun.obtenerIdArchivoRespuesta(
              respuestaCarga
            );

          if (!idArchivo) {
            throw new Error(
              "La API no devolvió el identificador de la imagen cargada."
            );
          }

          if (
            elementos.idArchivoHero
          ) {
            elementos
              .idArchivoHero
              .value =
                String(
                  idArchivo
                );
          }
        }

        const datosHero =
          obtenerDatosHero();

        if (!datosHero) {
          throw new Error(
            "No fue posible preparar los datos de la sección principal."
          );
        }

        await comun.guardarSeccion(
          datosHero
        );

        limpiarSeleccionTemporalImagenHero();
      },

      mensajeExito:
        "La sección principal fue guardada correctamente."
    });
  }

  /*
   * ==========================================================
   * 13. GUARDAR BOTONES PRINCIPALES
   * ==========================================================
   */

  async function guardarBotones(evento) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarGuardado({
      formulario:
        elementos.formularioBotones,

      boton:
        elementos.botonGuardarBotones,

      cargador:
        elementos.cargadorGuardarBotones,

      obtenerDatos() {
        const conoce =
          obtenerDatosBoton({
            clave:
              CLAVES.BOTON_CONOCE,

            etiqueta:
              "Botón Conoce el liceo",

            idSeccion:
              elementos
                .idSeccionBotonConoce,

            texto:
              elementos
                .textoBotonConoce,

            url:
              elementos
                .urlBotonConoce,

            tipoEnlace:
              elementos
                .tipoEnlaceBotonConoce,

            estado:
              elementos
                .estadoBotonConoce,

            orden: 2
          });

        const contacto =
          obtenerDatosBoton({
            clave:
              CLAVES.BOTON_CONTACTO,

            etiqueta:
              "Botón Contáctanos",

            idSeccion:
              elementos
                .idSeccionBotonContacto,

            texto:
              elementos
                .textoBotonContacto,

            url:
              elementos
                .urlBotonContacto,

            tipoEnlace:
              elementos
                .tipoEnlaceBotonContacto,

            estado:
              elementos
                .estadoBotonContacto,

            orden: 3
          });

        if (
          !conoce ||
          !contacto
        ) {
          comun.mostrarMensaje(
            "Complete correctamente los dos botones principales.",
            "error"
          );

          return null;
        }

        return [
          conoce,
          contacto
        ];
      },

      mensajeExito:
        "Los botones principales fueron guardados correctamente."
    });
  }

  /*
   * ==========================================================
   * 14. GUARDAR ENCABEZADO DE ACCESOS
   * ==========================================================
   */

  async function guardarEncabezadoAccesos(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarGuardado({
      formulario:
        elementos
          .formularioEncabezadoAccesos,

      boton:
        elementos
          .botonGuardarEncabezadoAccesos,

      cargador:
        null,

      obtenerDatos:
        obtenerDatosEncabezadoAccesos,

      mensajeExito:
        "El encabezado de accesos rápidos fue guardado correctamente."
    });
  }

  /*
   * ==========================================================
   * 15. GUARDAR ACCESOS RÁPIDOS
   * ==========================================================
   */

  async function guardarAccesosRapidos() {
    const elementos =
      obtenerElementos();

    await comun.ejecutarProcesoGuardado({
      boton:
        elementos.botonGuardarAccesos,

      cargador:
        elementos.cargadorGuardarAccesos,

      validar:
        obtenerDatosAccesos,

      antesBloquear() {
        if (
          elementos.botonAgregarAcceso
        ) {
          elementos
            .botonAgregarAcceso
            .disabled = true;
        }

        elementos
          .listaAccesosRapidos
          ?.classList.add(
            "formulario-admin__bloqueado"
          );
      },

      async ejecutar(datos) {
        await comun.guardarSecciones(
          datos
        );

        for (
          const acceso
          of accesosPendientesOcultar
        ) {
          await comun.guardarSeccion(
            crearDatosOcultamientoAcceso(
              acceso
            )
          );
        }

        accesosPendientesOcultar = [];
      },

      despuesDesbloquear() {
        if (
          elementos.botonAgregarAcceso
        ) {
          elementos
            .botonAgregarAcceso
            .disabled = false;
        }

        elementos
          .listaAccesosRapidos
          ?.classList.remove(
            "formulario-admin__bloqueado"
          );
      },

      mensajeExito:
        "Los accesos rápidos fueron guardados correctamente."
    });
  }

  /*
   * ==========================================================
   * 16. AGREGAR Y QUITAR ACCESOS
   * ==========================================================
   */

  function agregarAccesoRapido() {
    const elementos =
      obtenerElementos();

    const cantidad =
      elementos
        .listaAccesosRapidos
        ?.querySelectorAll(
          ".pagina-contenido-admin__acceso"
        ).length ||
      0;

    if (
      cantidad >=
      MAXIMO_ACCESOS
    ) {
      comun.mostrarMensaje(
        `Puede configurar un máximo de ${MAXIMO_ACCESOS} accesos rápidos.`,
        "error"
      );

      return;
    }

    comun.ocultarMensaje();

    const tarjeta =
      crearTarjetaAcceso();

    tarjeta
      ?.querySelector(
        ".acceso-rapido__titulo"
      )
      ?.focus();
  }

  async function quitarAccesoRapido(
    tarjeta
  ) {
    if (!tarjeta) {
      return;
    }

    const titulo =
      comun.texto(
        tarjeta.querySelector(
          ".acceso-rapido__titulo"
        )?.value
      ) ||
      "este acceso rápido";

    const confirmado =
      await comun.confirmarAccion({
        tipo:
          "peligro",

        titulo:
          "Quitar acceso rápido",

        mensaje:
          "El acceso dejará de mostrarse en el sitio público después de guardar los cambios.",

        detalle:
          titulo,

        textoCancelar:
          "Cancelar",

        textoConfirmar:
          "Quitar acceso"
      });

    if (!confirmado) {
      return;
    }

    const idSeccion =
      comun.numeroOpcional(
        tarjeta.querySelector(
          ".acceso-rapido__id"
        )?.value
      );

    if (idSeccion) {
      let original = null;

      try {
        original =
          JSON.parse(
            tarjeta
              .dataset
              .seccionOriginal ||
            "null"
          );
      } catch (error) {
        original = null;
      }

      if (!original) {
        original =
          comun
            .obtenerSeccionesActuales()
            .find(
              (seccion) =>
                Number(
                  seccion.idSeccionPagina
                ) ===
                idSeccion
            ) ||
          null;
      }

      if (original) {
        const yaAgregado =
          accesosPendientesOcultar
            .some(
              (seccion) =>
                Number(
                  seccion.idSeccionPagina
                ) ===
                idSeccion
            );

        if (!yaAgregado) {
          accesosPendientesOcultar
            .push(
              original
            );
        }
      }
    }

    tarjeta.remove();

    actualizarTarjetasAcceso();

    comun.mostrarMensaje(
      "El acceso fue quitado de la lista. " +
      "Presione Guardar accesos rápidos para confirmar.",
      "informacion"
    );
  }

  /*
   * ==========================================================
   * 17. IMAGEN PRINCIPAL
   * ==========================================================
   */

  function seleccionarImagenHero() {
    obtenerElementos()
      .inputImagenHero
      ?.click();
  }

  function procesarSeleccionImagenHero(
    evento
  ) {
    const elementos =
      obtenerElementos();

    const archivo =
      evento
        ?.target
        ?.files
        ?.[0] ||
      null;

    if (!archivo) {
      return;
    }

    const errorValidacion =
      comun.validarImagen(
        archivo
      );

    if (errorValidacion) {
      if (
        elementos.inputImagenHero
      ) {
        elementos
          .inputImagenHero
          .value = "";
      }

      comun.mostrarMensaje(
        errorValidacion,
        "error"
      );

      return;
    }

    liberarUrlTemporalImagenHero();

    imagenHeroPendiente =
      archivo;

    urlTemporalImagenHero =
      comun.crearUrlTemporal(
        archivo
      );

    if (
      elementos.vistaPreviaImagenHero
    ) {
      elementos
        .vistaPreviaImagenHero
        .src =
          urlTemporalImagenHero;

      elementos
        .vistaPreviaImagenHero
        .alt =
          comun.texto(
            elementos
              .textoAlternativoHero
              ?.value
          );
    }

    if (
      elementos.nombreImagenHero
    ) {
      elementos
        .nombreImagenHero
        .textContent =
          archivo.name;
    }

    if (
      elementos.detalleImagenHero
    ) {
      elementos
        .detalleImagenHero
        .textContent =
          `${archivo.type} · ` +
          `${comun.formatearTamanoArchivo(
            archivo.size
          )}`;
    }

    comun.mostrarMensaje(
      "La imagen fue seleccionada. " +
      "Se cargará cuando guarde la sección principal.",
      "informacion"
    );
  }

  function quitarImagenHero() {
    const elementos =
      obtenerElementos();

    limpiarSeleccionTemporalImagenHero();

    if (
      elementos.idArchivoHero
    ) {
      elementos
        .idArchivoHero
        .value = "";
    }

    if (
      elementos.vistaPreviaImagenHero
    ) {
      elementos
        .vistaPreviaImagenHero
        .src =
          "../../assets/logos/logo-liceo.jpg";

      elementos
        .vistaPreviaImagenHero
        .alt = "";
    }

    if (
      elementos.nombreImagenHero
    ) {
      elementos
        .nombreImagenHero
        .textContent =
          "Sin archivo vinculado";
    }

    if (
      elementos.detalleImagenHero
    ) {
      elementos
        .detalleImagenHero
        .textContent =
          "La imagen se quitará al guardar la sección principal.";
    }

    comun.mostrarMensaje(
      "La imagen fue retirada del formulario. " +
      "Guarde la sección principal para confirmar.",
      "informacion"
    );
  }

  /*
   * ==========================================================
   * 18. EVENTOS DE INICIO
   * ==========================================================
   */

  function configurarEventos() {
    if (eventosConfigurados) {
      return;
    }

    eventosConfigurados = true;

    const elementos =
      obtenerElementos();

    elementos
      .formularioHero
      ?.addEventListener(
        "submit",
        guardarHero
      );

    elementos
      .formularioBotones
      ?.addEventListener(
        "submit",
        guardarBotones
      );

    elementos
      .formularioEncabezadoAccesos
      ?.addEventListener(
        "submit",
        guardarEncabezadoAccesos
      );

    elementos
      .botonAgregarAcceso
      ?.addEventListener(
        "click",
        agregarAccesoRapido
      );

    elementos
      .botonGuardarAccesos
      ?.addEventListener(
        "click",
        guardarAccesosRapidos
      );

    elementos
      .botonSeleccionarImagenHero
      ?.addEventListener(
        "click",
        seleccionarImagenHero
      );

    elementos
      .inputImagenHero
      ?.addEventListener(
        "change",
        procesarSeleccionImagenHero
      );

    elementos
      .botonQuitarImagenHero
      ?.addEventListener(
        "click",
        quitarImagenHero
      );
  }

  /*
   * ==========================================================
   * 19. REINICIO DEL ESTADO LOCAL
   * ==========================================================
   */

  function reiniciarEstado() {
    contadorAccesos = 0;
    accesosPendientesOcultar = [];

    limpiarSeleccionTemporalImagenHero();
  }

  /*
   * ==========================================================
   * 20. REGISTRO DEL EDITOR INICIO
   * ==========================================================
   */

  const editorInicio =
    Object.freeze({
      titulo:
        "Editar Inicio",

      descripcion:
        "Modifique la sección principal, los botones y los accesos rápidos que aparecen en la portada pública.",

      descripcionResumen:
        "Datos generales obtenidos desde el registro de la página Inicio.",

      enlacePublico:
        "../../../frontend-publico/index.html",

      textoPie:
        "Gestión de la página Inicio",

      renderizar,

      configurarEventos,

      reiniciarEstado
    });

  global.PAGINAS_INICIO_ADMIN =
    Object.freeze({
      renderizar,
      configurarEventos,
      reiniciarEstado,
      guardarHero,
      guardarBotones,
      guardarEncabezadoAccesos,
      guardarAccesosRapidos,
      agregarAccesoRapido
    });

  comun.registrarEditor(
    "inicio",
    editorInicio
  );
})(window);