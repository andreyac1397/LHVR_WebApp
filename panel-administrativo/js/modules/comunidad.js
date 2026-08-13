/* ============================================================
   COMUNIDAD - PANEL ADMINISTRATIVO LHVR
   ------------------------------------------------------------
   Gestiona la página Comunidad.

   Estructura:
   - Introducción: formulario fijo.
   - Contenido: tarjetas administrables.
   - Cierre: formulario fijo.

   Permite:
   - Cargar las secciones desde /api/comunidad/administracion.
   - Editar la introducción.
   - Mostrar las secciones centrales como tarjetas visuales.
   - Editar título, subtítulo y contenido.
   - Asociar, reemplazar o quitar imágenes.
   - Editar texto alternativo.
   - Configurar enlaces.
   - Cambiar orden.
   - Cambiar estado de publicación.
   - Crear nuevas tarjetas.
   - Retirar lógicamente tarjetas existentes.
   - Editar el cierre.
   - Guardar utilizando el módulo compartido paginas-contenido.

   Requiere:
   - api-admin.config.js
   - api-client.js
   - paginas-contenido.js
   - alertas-admin.js
   - modal-admin.js
   ============================================================ */

(function configurarComunidad(global) {
  "use strict";

  const comun =
    global.PAGINAS_CONTENIDO_ADMIN;

  const apiClient =
    global.API_ADMIN_CLIENT;

  const configuracion =
    global.API_ADMIN_CONFIG;

  if (
    !comun ||
    !apiClient ||
    !configuracion
  ) {
    throw new Error(
      "No se pudo cargar comunidad.js. " +
      "Verifique paginas-contenido.js, api-admin.config.js " +
      "y api-client.js."
    );
  }


  /*
   * ==========================================================
   * 1. CONSTANTES
   * ==========================================================
   */

  const TIPOS_ENLACE =
    Object.freeze([
      "NINGUNO",
      "INTERNO",
      "EXTERNO",
      "ARCHIVO"
    ]);

  const TIPO_DISENO =
    "COMUNIDAD";

  const CLAVE_INTRO =
    "INTRO_COMUNIDAD";

  const CLAVE_CIERRE =
    "CIERRE_COMUNIDAD";

  const LIMITE_SECCIONES =
    10;

  let eventosConfigurados =
    false;

  let seccionesComunidad =
    [];

  const urlsTemporales =
    new Set();

  const estadosImagen =
    new WeakMap();


  /*
   * ==========================================================
   * 2. ELEMENTOS
   * ==========================================================
   */

  function obtenerElementos() {
    return {
      /* ======================================================
         TARJETAS
         ====================================================== */

      lista:
        comun.porId(
          "listaSeccionesComunidad"
        ),

      estadoVacio:
        comun.porId(
          "estadoVacioComunidad"
        ),

      plantilla:
        comun.porId(
          "plantillaSeccionComunidad"
        ),

      botonAgregar:
        comun.porId(
          "botonAgregarSeccionComunidad"
        ),

      contador:
        comun.porId(
          "contadorSeccionesComunidad"
        ),


      /* ======================================================
         MODAL NUEVA TARJETA
         ====================================================== */

      modalNuevaSeccion:
        comun.porId(
          "modalNuevaSeccionComunidad"
        ),

      contenidoModalNuevaSeccion:
        comun.porId(
          "contenidoModalNuevaSeccionComunidad"
        ),

      botonCerrarModal:
        comun.porId(
          "botonCerrarModalComunidad"
        ),


      /* ======================================================
         INTRODUCCIÓN
         ====================================================== */

      formularioIntro:
        comun.porId(
          "formularioIntroComunidad"
        ),

      introId:
        comun.porId(
          "introComunidadId"
        ),

      introClave:
        comun.porId(
          "introComunidadClave"
        ),

      introTitulo:
        comun.porId(
          "introComunidadTitulo"
        ),

      introSubtitulo:
        comun.porId(
          "introComunidadSubtitulo"
        ),

      introContenido:
        comun.porId(
          "introComunidadContenido"
        ),

      introEstado:
        comun.porId(
          "introComunidadEstado"
        ),

      botonGuardarIntro:
        comun.porId(
          "botonGuardarIntroComunidad"
        ),

      cargadorIntro:
        comun.porId(
          "cargadorIntroComunidad"
        ),


      /* ======================================================
         CIERRE
         ====================================================== */

      formularioCierre:
        comun.porId(
          "formularioCierreComunidad"
        ),

      cierreId:
        comun.porId(
          "cierreComunidadId"
        ),

      cierreClave:
        comun.porId(
          "cierreComunidadClave"
        ),

      cierreTitulo:
        comun.porId(
          "cierreComunidadTitulo"
        ),

      cierreContenido:
        comun.porId(
          "cierreComunidadContenido"
        ),

      cierreEstado:
        comun.porId(
          "cierreComunidadEstado"
        ),

      cierreTipoEnlace:
        comun.porId(
          "cierreComunidadTipoEnlace"
        ),

      cierreTextoBoton:
        comun.porId(
          "cierreComunidadTextoBoton"
        ),

      cierreUrlBoton:
        comun.porId(
          "cierreComunidadUrlBoton"
        ),

      botonGuardarCierre:
        comun.porId(
          "botonGuardarCierreComunidad"
        ),

      cargadorCierre:
        comun.porId(
          "cargadorCierreComunidad"
        )
    };
  }


  /*
   * ==========================================================
   * 3. ENDPOINTS
   * ==========================================================
   */

  function obtenerEndpoints() {
    return (
      configuracion
        .endpoints
        ?.comunidad ||
      {}
    );
  }


  function obtenerEndpoint(
    nombre
  ) {
    const endpoints =
      obtenerEndpoints();

    const endpoint =
      endpoints[nombre];

    if (
      typeof endpoint ===
        "string" &&
      endpoint.trim() !==
        ""
    ) {
      return endpoint;
    }

    const predeterminados = {
      publica:
        "/comunidad/publica",

      administracion:
        "/comunidad/administracion"
    };

    return predeterminados[nombre];
  }


  function obtenerEndpointRetiro(
    idSeccionPagina
  ) {
    const id =
      comun.numeroOpcional(
        idSeccionPagina
      );

    if (!id) {
      return "";
    }

    const endpointConfigurado =
      configuracion
        .endpoints
        ?.paginas
        ?.retirarSeccion;

    if (
      typeof endpointConfigurado ===
      "function"
    ) {
      return endpointConfigurado(
        id
      );
    }

    if (
      typeof endpointConfigurado ===
        "string" &&
      endpointConfigurado.trim() !==
        ""
    ) {
      return endpointConfigurado
        .replace(
          ":idSeccionPagina",
          encodeURIComponent(id)
        )
        .replace(
          ":id",
          encodeURIComponent(id)
        );
    }

    return (
      "/paginas/secciones/" +
      `${encodeURIComponent(id)}/retirar`
    );
  }


  /*
   * ==========================================================
   * 4. UTILIDADES
   * ==========================================================
   */

  function normalizarTipoEnlace(
    valor
  ) {
    const tipo =
      comun.normalizarClave(
        valor ||
        "NINGUNO"
      );

    return TIPOS_ENLACE.includes(
      tipo
    )
      ? tipo
      : "NINGUNO";
  }


  function esSeccionArchivada(
    seccion
  ) {
    const nombreEstado =
      comun.normalizarClave(
        seccion
          ?.estadoPublicacion ||
        seccion
          ?.nombreEstado ||
        seccion
          ?.estado ||
        ""
      );

    return nombreEstado ===
      "ARCHIVADO";
  }


  function ordenarSecciones(
    secciones
  ) {
    return [
      ...secciones
    ].sort(
      (a, b) => {
        const ordenA =
          Number(
            a?.orden ||
            0
          );

        const ordenB =
          Number(
            b?.orden ||
            0
          );

        if (
          ordenA !==
          ordenB
        ) {
          return (
            ordenA -
            ordenB
          );
        }

        return (
          Number(
            a?.idSeccionPagina ||
            0
          ) -
          Number(
            b?.idSeccionPagina ||
            0
          )
        );
      }
    );
  }


  function obtenerSeccionPorClave(
    clave
  ) {
    const claveNormalizada =
      comun.normalizarClave(
        clave
      );

    return (
      seccionesComunidad.find(
        (seccion) =>
          comun.normalizarClave(
            seccion?.clave
          ) ===
          claveNormalizada
      ) ||
      null
    );
  }


  function obtenerSeccionesTarjetas() {
    return seccionesComunidad.filter(
      (seccion) => {
        const clave =
          comun.normalizarClave(
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
  }


  function obtenerSiguienteOrdenTarjeta() {
    const tarjetas =
      obtenerSeccionesTarjetas();

    if (
      tarjetas.length ===
      0
    ) {
      return 1;
    }

    const ordenMayor =
      Math.max(
        ...tarjetas.map(
          (seccion) =>
            Number(
              seccion?.orden ||
              0
            )
        )
      );

    return Math.min(
      ordenMayor + 1,
      LIMITE_SECCIONES
    );
  }


  function obtenerEstadoImagen(
    tarjeta
  ) {
    let estado =
      estadosImagen.get(
        tarjeta
      );

    if (!estado) {
      estado = {
        archivoPendiente:
          null,

        urlTemporal:
          "",

        quitarImagen:
          false
      };

      estadosImagen.set(
        tarjeta,
        estado
      );
    }

    return estado;
  }


  function liberarUrlTemporal(
    url
  ) {
    if (!url) {
      return;
    }

    comun.liberarUrlTemporal(
      url
    );

    urlsTemporales.delete(
      url
    );
  }


  function liberarTodasLasUrls() {
    urlsTemporales.forEach(
      (url) => {
        comun.liberarUrlTemporal(
          url
        );
      }
    );

    urlsTemporales.clear();
  }


  /*
   * ==========================================================
   * 5. CARGA DE COMUNIDAD
   * ==========================================================
   */

  async function cargarDatosComunidad() {
    const endpointBase =
      obtenerEndpoint(
        "administracion"
      );

    const separador =
      endpointBase.includes("?")
        ? "&"
        : "?";

    const endpoint =
      `${endpointBase}${separador}` +
      `_actualizacion=${Date.now()}`;

    const respuesta =
      await apiClient.get(
        endpoint
      );

    const datos =
      comun.extraerDatos(
        respuesta
      );

    if (
      !datos ||
      typeof datos !==
        "object"
    ) {
      throw new Error(
        "La API no devolvió datos válidos de Comunidad."
      );
    }

    seccionesComunidad =
      Array.isArray(
        datos.secciones
      )
        ? ordenarSecciones(
          datos.secciones.filter(
            (seccion) =>
              !esSeccionArchivada(
                seccion
              )
          )
        )
        : [];

    return datos;
  }


  /*
   * ==========================================================
   * 6. INTRODUCCIÓN
   * ==========================================================
   */

  function renderizarIntroduccion() {
    const elementos =
      obtenerElementos();

    const seccion =
      obtenerSeccionPorClave(
        CLAVE_INTRO
      );

    if (!seccion) {
      return;
    }

    if (
      elementos.introId
    ) {
      elementos
        .introId
        .value =
          seccion
            ?.idSeccionPagina ||
          "";
    }

    if (
      elementos.introClave
    ) {
      elementos
        .introClave
        .value =
          seccion?.clave ||
          CLAVE_INTRO;
    }

    if (
      elementos.introTitulo
    ) {
      elementos
        .introTitulo
        .value =
          seccion?.titulo ||
          "";
    }

    if (
      elementos.introSubtitulo
    ) {
      elementos
        .introSubtitulo
        .value =
          seccion?.subtitulo ||
          "";
    }

    if (
      elementos.introContenido
    ) {
      elementos
        .introContenido
        .value =
          seccion?.contenido ||
          "";
    }

    comun.llenarSelectEstados(
      elementos.introEstado,

      seccion
        ?.idEstadoPublicacion ||
      comun
        .obtenerEstadoPredeterminado()
        ?.idEstadoPublicacion
    );
  }


  function obtenerDatosIntroduccion() {
    const elementos =
      obtenerElementos();

    const seccionOriginal =
      obtenerSeccionPorClave(
        CLAVE_INTRO
      );

    if (!seccionOriginal) {
      comun.mostrarMensaje(
        "No se encontró la sección de introducción de Comunidad.",
        "error"
      );

      return null;
    }

    const idSeccionPagina =
      comun.numeroOpcional(
        elementos
          .introId
          ?.value
      );

    const titulo =
      comun.texto(
        elementos
          .introTitulo
          ?.value
      );

    const subtitulo =
      comun.texto(
        elementos
          .introSubtitulo
          ?.value
      );

    const contenido =
      comun.texto(
        elementos
          .introContenido
          ?.value
      );

    const idEstadoPublicacion =
      comun.validarEstado(
        elementos.introEstado
      );

    comun.marcarInvalido(
      elementos.introTitulo,
      !titulo
    );

    comun.marcarInvalido(
      elementos.introContenido,
      !contenido
    );

    if (!idSeccionPagina) {
      comun.mostrarMensaje(
        "La introducción no tiene un identificador válido.",
        "error"
      );

      return null;
    }

    if (!titulo) {
      comun.mostrarMensaje(
        "Debe indicar el título de la introducción.",
        "error"
      );

      return null;
    }

    if (!contenido) {
      comun.mostrarMensaje(
        "Debe indicar el contenido de la introducción.",
        "error"
      );

      return null;
    }

    if (!idEstadoPublicacion) {
      comun.mostrarMensaje(
        "Seleccione el estado de publicación de la introducción.",
        "error"
      );

      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina,

      clave:
        CLAVE_INTRO,

      etiqueta:
        seccionOriginal
          ?.etiqueta ||
        subtitulo ||
        titulo,

      titulo,

      subtitulo:
        subtitulo ||
        null,

      contenido,

      idArchivo:
        comun.numeroOpcional(
          seccionOriginal
            ?.idArchivo
        ),

      textoAlternativo:
        seccionOriginal
          ?.textoAlternativo ||
        null,

      textoBoton:
        seccionOriginal
          ?.textoBoton ||
        null,

      urlBoton:
        seccionOriginal
          ?.urlBoton ||
        null,

      tipoEnlace:
        normalizarTipoEnlace(
          seccionOriginal
            ?.tipoEnlace
        ),

      tipoDiseno:
        seccionOriginal
          ?.tipoDiseno ||
        TIPO_DISENO,

      posicionImagen:
        seccionOriginal
          ?.posicionImagen ||
        null,

      orden:
        Number(
          seccionOriginal
            ?.orden ||
          1
        ),

      idEstadoPublicacion
    });
  }


  async function guardarIntroduccion() {
    const elementos =
      obtenerElementos();

    await comun.ejecutarProcesoGuardado({
      formulario:
        elementos.formularioIntro,

      boton:
        elementos.botonGuardarIntro,

      cargador:
        elementos.cargadorIntro,

      validar() {
        return obtenerDatosIntroduccion();
      },

      async ejecutar(datos) {
        await comun.guardarSeccion(
          datos
        );
      },

      recargar:
        true,

      mensajeExito:
        "La introducción de Comunidad fue guardada correctamente."
    });
  }


  /*
   * ==========================================================
   * 7. CIERRE
   * ==========================================================
   */

  function actualizarCamposEnlaceCierre() {
    const elementos =
      obtenerElementos();

    const tipoEnlace =
      normalizarTipoEnlace(
        elementos
          .cierreTipoEnlace
          ?.value
      );

    const requiereEnlace =
      tipoEnlace !==
      "NINGUNO";

    if (
      elementos.cierreTextoBoton
    ) {
      elementos
        .cierreTextoBoton
        .disabled =
          !requiereEnlace;

      elementos
        .cierreTextoBoton
        .required =
          requiereEnlace;

      if (!requiereEnlace) {
        comun.marcarInvalido(
          elementos.cierreTextoBoton,
          false
        );
      }
    }

    if (
      elementos.cierreUrlBoton
    ) {
      elementos
        .cierreUrlBoton
        .disabled =
          !requiereEnlace;

      elementos
        .cierreUrlBoton
        .required =
          requiereEnlace;

      if (!requiereEnlace) {
        comun.marcarInvalido(
          elementos.cierreUrlBoton,
          false
        );
      }
    }
  }


  function renderizarCierre() {
    const elementos =
      obtenerElementos();

    const seccion =
      obtenerSeccionPorClave(
        CLAVE_CIERRE
      );

    if (!seccion) {
      return;
    }

    if (
      elementos.cierreId
    ) {
      elementos
        .cierreId
        .value =
          seccion
            ?.idSeccionPagina ||
          "";
    }

    if (
      elementos.cierreClave
    ) {
      elementos
        .cierreClave
        .value =
          seccion?.clave ||
          CLAVE_CIERRE;
    }

    if (
      elementos.cierreTitulo
    ) {
      elementos
        .cierreTitulo
        .value =
          seccion?.titulo ||
          "";
    }

    if (
      elementos.cierreContenido
    ) {
      elementos
        .cierreContenido
        .value =
          seccion?.contenido ||
          "";
    }

    if (
      elementos.cierreTipoEnlace
    ) {
      elementos
        .cierreTipoEnlace
        .value =
          normalizarTipoEnlace(
            seccion
              ?.tipoEnlace
          );
    }

    if (
      elementos.cierreTextoBoton
    ) {
      elementos
        .cierreTextoBoton
        .value =
          seccion
            ?.textoBoton ||
          "";
    }

    if (
      elementos.cierreUrlBoton
    ) {
      elementos
        .cierreUrlBoton
        .value =
          seccion
            ?.urlBoton ||
          "";
    }

    comun.llenarSelectEstados(
      elementos.cierreEstado,

      seccion
        ?.idEstadoPublicacion ||
      comun
        .obtenerEstadoPredeterminado()
        ?.idEstadoPublicacion
    );

    actualizarCamposEnlaceCierre();
  }


  function obtenerDatosCierre() {
    const elementos =
      obtenerElementos();

    const seccionOriginal =
      obtenerSeccionPorClave(
        CLAVE_CIERRE
      );

    if (!seccionOriginal) {
      comun.mostrarMensaje(
        "No se encontró la sección de cierre de Comunidad.",
        "error"
      );

      return null;
    }

    const idSeccionPagina =
      comun.numeroOpcional(
        elementos
          .cierreId
          ?.value
      );

    const titulo =
      comun.texto(
        elementos
          .cierreTitulo
          ?.value
      );

    const contenido =
      comun.texto(
        elementos
          .cierreContenido
          ?.value
      );

    const tipoEnlace =
      normalizarTipoEnlace(
        elementos
          .cierreTipoEnlace
          ?.value
      );

    const textoBoton =
      comun.texto(
        elementos
          .cierreTextoBoton
          ?.value
      );

    const urlBoton =
      comun.texto(
        elementos
          .cierreUrlBoton
          ?.value
      );

    const idEstadoPublicacion =
      comun.validarEstado(
        elementos.cierreEstado
      );

    const requiereEnlace =
      tipoEnlace !==
      "NINGUNO";

    comun.marcarInvalido(
      elementos.cierreTitulo,
      !titulo
    );

    comun.marcarInvalido(
      elementos.cierreContenido,
      !contenido
    );

    comun.marcarInvalido(
      elementos.cierreTextoBoton,
      requiereEnlace &&
      !textoBoton
    );

    comun.marcarInvalido(
      elementos.cierreUrlBoton,
      requiereEnlace &&
      !urlBoton
    );

    if (!idSeccionPagina) {
      comun.mostrarMensaje(
        "El cierre no tiene un identificador válido.",
        "error"
      );

      return null;
    }

    if (!titulo) {
      comun.mostrarMensaje(
        "Debe indicar el título del cierre.",
        "error"
      );

      return null;
    }

    if (!contenido) {
      comun.mostrarMensaje(
        "Debe indicar el contenido del cierre.",
        "error"
      );

      return null;
    }

    if (
      !TIPOS_ENLACE.includes(
        tipoEnlace
      )
    ) {
      comun.mostrarMensaje(
        "Seleccione un tipo de enlace válido.",
        "error"
      );

      return null;
    }

    if (
      requiereEnlace &&
      !textoBoton
    ) {
      comun.mostrarMensaje(
        "Debe indicar el texto del botón o seleccionar Sin enlace.",
        "error"
      );

      return null;
    }

    if (
      requiereEnlace &&
      !urlBoton
    ) {
      comun.mostrarMensaje(
        "Debe indicar la dirección del botón o seleccionar Sin enlace.",
        "error"
      );

      return null;
    }

    if (!idEstadoPublicacion) {
      comun.mostrarMensaje(
        "Seleccione el estado de publicación del cierre.",
        "error"
      );

      return null;
    }

    return comun.crearDatosBase({
      idSeccionPagina,

      clave:
        CLAVE_CIERRE,

      etiqueta:
        seccionOriginal
          ?.etiqueta ||
        titulo,

      titulo,

      subtitulo:
        seccionOriginal
          ?.subtitulo ||
        null,

      contenido,

      idArchivo:
        comun.numeroOpcional(
          seccionOriginal
            ?.idArchivo
        ),

      textoAlternativo:
        seccionOriginal
          ?.textoAlternativo ||
        null,

      textoBoton:
        requiereEnlace
          ? textoBoton
          : null,

      urlBoton:
        requiereEnlace
          ? urlBoton
          : null,

      tipoEnlace,

      tipoDiseno:
        seccionOriginal
          ?.tipoDiseno ||
        TIPO_DISENO,

      posicionImagen:
        seccionOriginal
          ?.posicionImagen ||
        null,

      orden:
        Number(
          seccionOriginal
            ?.orden ||
          1
        ),

      idEstadoPublicacion
    });
  }


  async function guardarCierre() {
    const elementos =
      obtenerElementos();

    await comun.ejecutarProcesoGuardado({
      formulario:
        elementos.formularioCierre,

      boton:
        elementos.botonGuardarCierre,

      cargador:
        elementos.cargadorCierre,

      validar() {
        return obtenerDatosCierre();
      },

      async ejecutar(datos) {
        await comun.guardarSeccion(
          datos
        );
      },

      recargar:
        true,

      mensajeExito:
        "El cierre de Comunidad fue guardado correctamente."
    });
  }


  /*
   * ==========================================================
   * 8. ELEMENTOS DE UNA TARJETA
   * ==========================================================
   */

  function obtenerControlesTarjeta(
    tarjeta
  ) {
    return {
      id:
        tarjeta.querySelector(
          ".comunidad-seccion__id"
        ),

      clave:
        tarjeta.querySelector(
          ".comunidad-seccion__clave"
        ),

      idArchivo:
        tarjeta.querySelector(
          ".comunidad-seccion__id-archivo"
        ),

      etiquetaVisual:
        tarjeta.querySelector(
          ".comunidad-seccion__etiqueta"
        ),

      tituloVisual:
        tarjeta.querySelector(
          ".comunidad-seccion__titulo-visual"
        ),

      subtituloVisual:
        tarjeta.querySelector(
          ".comunidad-seccion__subtitulo-visual"
        ),

      contenidoVisual:
        tarjeta.querySelector(
          ".comunidad-seccion__contenido-visual"
        ),

      estadoVisual:
        tarjeta.querySelector(
          ".comunidad-seccion__estado-visual"
        ),

      imagenVisual:
        tarjeta.querySelector(
          ".comunidad-seccion__imagen-visual"
        ),

      imagenPrevia:
        tarjeta.querySelector(
          ".comunidad-seccion__imagen-previa"
        ),

      nombreImagen:
        tarjeta.querySelector(
          ".comunidad-seccion__nombre-imagen"
        ),

      detalleImagen:
        tarjeta.querySelector(
          ".comunidad-seccion__detalle-imagen"
        ),

      inputImagen:
        tarjeta.querySelector(
          ".comunidad-seccion__input-imagen"
        ),

      seleccionarImagen:
        tarjeta.querySelector(
          ".comunidad-seccion__seleccionar-imagen"
        ),

      quitarImagen:
        tarjeta.querySelector(
          ".comunidad-seccion__quitar-imagen"
        ),

      titulo:
        tarjeta.querySelector(
          ".comunidad-seccion__titulo"
        ),

      subtitulo:
        tarjeta.querySelector(
          ".comunidad-seccion__subtitulo"
        ),

      contenido:
        tarjeta.querySelector(
          ".comunidad-seccion__contenido"
        ),

      textoAlternativo:
        tarjeta.querySelector(
          ".comunidad-seccion__texto-alternativo"
        ),

      tipoEnlace:
        tarjeta.querySelector(
          ".comunidad-seccion__tipo-enlace"
        ),

      textoBoton:
        tarjeta.querySelector(
          ".comunidad-seccion__texto-boton"
        ),

      urlBoton:
        tarjeta.querySelector(
          ".comunidad-seccion__url-boton"
        ),

      orden:
        tarjeta.querySelector(
          ".comunidad-seccion__orden"
        ),

      estado:
        tarjeta.querySelector(
          ".comunidad-seccion__estado"
        ),

      cerrar:
        tarjeta.querySelector(
          ".comunidad-seccion__cerrar"
        ),

      retirar:
        tarjeta.querySelector(
          ".comunidad-seccion__retirar"
        ),

      guardar:
        tarjeta.querySelector(
          ".comunidad-seccion__guardar"
        ),

      cargador:
        tarjeta.querySelector(
          ".comunidad-seccion__cargador"
        ),

      desplegable:
        tarjeta.querySelector(
          ".comunidad-admin__desplegable"
        )
    };
  }


  /*
   * ==========================================================
   * 9. IMÁGENES DE TARJETAS
   * ==========================================================
   */

  function establecerImagen(
    imagen,
    url,
    textoAlternativo = ""
  ) {
    if (!imagen) {
      return;
    }

    if (!url) {
      imagen.removeAttribute(
        "src"
      );

      imagen.alt =
        "";

      imagen.hidden =
        true;

      return;
    }

    imagen.src =
      url;

    imagen.alt =
      comun.texto(
        textoAlternativo
      );

    imagen.hidden =
      false;
  }


  function actualizarImagenesTarjeta(
    tarjeta,
    url,
    textoAlternativo = ""
  ) {
    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    establecerImagen(
      controles.imagenVisual,
      url,
      textoAlternativo
    );

    establecerImagen(
      controles.imagenPrevia,
      url,
      textoAlternativo
    );
  }


  function cargarImagenActual(
    tarjeta,
    seccion
  ) {
    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    const url =
      comun.construirUrlArchivo(
        seccion
      );

    const textoAlternativo =
      comun.texto(
        seccion
          ?.textoAlternativo
      );

    actualizarImagenesTarjeta(
      tarjeta,
      url,
      textoAlternativo
    );

    if (
      controles.nombreImagen
    ) {
      controles
        .nombreImagen
        .textContent =
          seccion
            ?.nombreArchivo ||
          (
            url
              ? "Imagen vinculada"
              : "Sin archivo vinculado"
          );
    }

    if (
      controles.detalleImagen
    ) {
      controles
        .detalleImagen
        .textContent =
          url
            ? "Imagen actualmente vinculada a esta sección."
            : "Puede seleccionar una imagen JPG, PNG o WEBP de máximo 5 MB.";
    }

    if (
      controles.quitarImagen
    ) {
      controles
        .quitarImagen
        .disabled =
          !url &&
          !seccion?.idArchivo;
    }
  }


  function seleccionarImagen(
    tarjeta
  ) {
    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    controles
      .inputImagen
      ?.click();
  }


  function cambiarImagen(
    tarjeta,
    evento
  ) {
    const archivo =
      evento
        .target
        ?.files
        ?.[0] ||
      null;

    if (!archivo) {
      return;
    }

    const errorImagen =
      comun.validarImagen(
        archivo
      );

    if (errorImagen) {
      comun.mostrarMensaje(
        errorImagen,
        "error"
      );

      evento.target.value =
        "";

      return;
    }

    comun.ocultarMensaje();

    const estadoImagen =
      obtenerEstadoImagen(
        tarjeta
      );

    if (
      estadoImagen
        .urlTemporal
    ) {
      liberarUrlTemporal(
        estadoImagen
          .urlTemporal
      );
    }

    const urlTemporal =
      comun.crearUrlTemporal(
        archivo
      );

    estadoImagen
      .archivoPendiente =
        archivo;

    estadoImagen
      .urlTemporal =
        urlTemporal;

    estadoImagen
      .quitarImagen =
        false;

    if (urlTemporal) {
      urlsTemporales.add(
        urlTemporal
      );
    }

    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    const textoAlternativo =
      comun.texto(
        controles
          .textoAlternativo
          ?.value
      );

    actualizarImagenesTarjeta(
      tarjeta,
      urlTemporal,
      textoAlternativo
    );

    if (
      controles.nombreImagen
    ) {
      controles
        .nombreImagen
        .textContent =
          archivo.name;
    }

    if (
      controles.detalleImagen
    ) {
      controles
        .detalleImagen
        .textContent =
          `${comun.formatearTamanoArchivo(
            archivo.size
          )} · Se cargará al guardar los cambios.`;
    }

    if (
      controles.quitarImagen
    ) {
      controles
        .quitarImagen
        .disabled =
          false;
    }
  }


  function quitarImagen(
    tarjeta
  ) {
    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    const estadoImagen =
      obtenerEstadoImagen(
        tarjeta
      );

    if (
      estadoImagen
        .urlTemporal
    ) {
      liberarUrlTemporal(
        estadoImagen
          .urlTemporal
      );
    }

    estadoImagen
      .archivoPendiente =
        null;

    estadoImagen
      .urlTemporal =
        "";

    estadoImagen
      .quitarImagen =
        true;

    if (
      controles.idArchivo
    ) {
      controles
        .idArchivo
        .value =
          "";
    }

    if (
      controles.inputImagen
    ) {
      controles
        .inputImagen
        .value =
          "";
    }

    actualizarImagenesTarjeta(
      tarjeta,
      "",
      ""
    );

    if (
      controles.nombreImagen
    ) {
      controles
        .nombreImagen
        .textContent =
          "Sin archivo vinculado";
    }

    if (
      controles.detalleImagen
    ) {
      controles
        .detalleImagen
        .textContent =
          "La imagen se quitará cuando guarde los cambios.";
    }

    if (
      controles.quitarImagen
    ) {
      controles
        .quitarImagen
        .disabled =
          true;
    }
  }


  /*
   * ==========================================================
   * 10. ENLACES DE TARJETAS
   * ==========================================================
   */

  function actualizarCamposEnlace(
    tarjeta
  ) {
    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    const tipoEnlace =
      normalizarTipoEnlace(
        controles
          .tipoEnlace
          ?.value
      );

    const requiereEnlace =
      tipoEnlace !==
      "NINGUNO";

    if (
      controles.textoBoton
    ) {
      controles
        .textoBoton
        .disabled =
          !requiereEnlace;

      controles
        .textoBoton
        .required =
          requiereEnlace;

      if (!requiereEnlace) {
        comun.marcarInvalido(
          controles.textoBoton,
          false
        );
      }
    }

    if (
      controles.urlBoton
    ) {
      controles
        .urlBoton
        .disabled =
          !requiereEnlace;

      controles
        .urlBoton
        .required =
          requiereEnlace;

      if (!requiereEnlace) {
        comun.marcarInvalido(
          controles.urlBoton,
          false
        );
      }
    }
  }


  /*
   * ==========================================================
   * 11. ESTADO VISUAL
   * ==========================================================
   */

  function actualizarEstadoVisual(
    tarjeta,
    seccion = null
  ) {
    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    if (
      !controles.estadoVisual
    ) {
      return;
    }

    const idEstado =
      comun.numeroOpcional(
        controles
          .estado
          ?.value
      ) ||
      comun.numeroOpcional(
        seccion
          ?.idEstadoPublicacion
      );

    const estado =
      comun.obtenerEstadoPorId(
        idEstado
      );

    controles
      .estadoVisual
      .textContent =
        estado?.nombre ||
        seccion
          ?.estadoPublicacion ||
        "Sin estado";

    controles
      .estadoVisual
      .className =
        "comunidad-seccion__estado-visual admin-etiqueta";

    const visible =
      estado
        ? (
          estado.esVisible ===
            true ||
          estado.esVisible ===
            1
        )
        : comun.esSeccionVisible(
          seccion
        );

    controles
      .estadoVisual
      .classList
      .add(
        visible
          ? "admin-etiqueta--exito"
          : "admin-etiqueta--advertencia"
      );
  }


  /*
   * ==========================================================
   * 12. VISTA COMPACTA
   * ==========================================================
   */

  function actualizarVistaTarjeta(
    tarjeta
  ) {
    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    const titulo =
      comun.texto(
        controles
          .titulo
          ?.value
      );

    const subtitulo =
      comun.texto(
        controles
          .subtitulo
          ?.value
      );

    const contenido =
      comun.texto(
        controles
          .contenido
          ?.value
      );

    const textoAlternativo =
      comun.texto(
        controles
          .textoAlternativo
          ?.value
      );

    if (
      controles.tituloVisual
    ) {
      controles
        .tituloVisual
        .textContent =
          titulo ||
          "Sin título";
    }

    if (
      controles.subtituloVisual
    ) {
      controles
        .subtituloVisual
        .textContent =
          subtitulo;

      controles
        .subtituloVisual
        .hidden =
          !subtitulo;
    }

    if (
      controles.contenidoVisual
    ) {
      controles
        .contenidoVisual
        .textContent =
          contenido;
    }

    if (
      controles.imagenVisual &&
      !controles
        .imagenVisual
        .hidden
    ) {
      controles
        .imagenVisual
        .alt =
          textoAlternativo;
    }

    if (
      controles.imagenPrevia &&
      !controles
        .imagenPrevia
        .hidden
    ) {
      controles
        .imagenPrevia
        .alt =
          textoAlternativo;
    }

    actualizarEstadoVisual(
      tarjeta
    );
  }


  /*
   * ==========================================================
   * 13. CREAR TARJETA
   * ==========================================================
   */

  function crearTarjeta(
    seccion,
    opciones = {}
  ) {
    const elementos =
      obtenerElementos();

    const destino =
      opciones.destino ||
      elementos.lista;

    const modoNuevo =
      opciones.modoNuevo ===
      true;

    if (
      !elementos.plantilla ||
      !destino
    ) {
      return null;
    }

    const fragmento =
      elementos
        .plantilla
        .content
        .cloneNode(
          true
        );

    const tarjeta =
      fragmento.querySelector(
        ".comunidad-admin__tarjeta"
      );

    if (!tarjeta) {
      return null;
    }

    /*
     * Solamente las tarjetas reales llegan a esta función.
     * Introducción y cierre se administran por separado.
     */

    if (modoNuevo) {
      tarjeta.classList.add(
        "comunidad-admin__tarjeta--nueva"
      );
    }

    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    if (
      modoNuevo &&
      controles.desplegable
    ) {
      controles
        .desplegable
        .open =
          true;
    }

    tarjeta.dataset
      .seccionOriginal =
        JSON.stringify(
          seccion
        );

    if (
      controles.id
    ) {
      controles.id.value =
        seccion
          ?.idSeccionPagina ||
        "";
    }

    const botonesRetirar =
      tarjeta.querySelectorAll(
        ".comunidad-seccion__retirar"
      );

    botonesRetirar.forEach(
      (botonRetirar) => {
        botonRetirar.hidden =
          modoNuevo ||
          !comun.numeroOpcional(
            seccion
              ?.idSeccionPagina
          );
      }
    );

    if (
      controles.clave
    ) {
      controles.clave.value =
        seccion
          ?.clave ||
        "";
    }

    if (
      controles.idArchivo
    ) {
      controles
        .idArchivo
        .value =
          seccion
            ?.idArchivo ||
          "";
    }

    if (
      controles.etiquetaVisual
    ) {
      controles
        .etiquetaVisual
        .textContent =
          seccion
            ?.etiqueta ||
          seccion
            ?.subtitulo ||
          "Sección";
    }

    if (
      controles.titulo
    ) {
      controles.titulo.value =
        seccion
          ?.titulo ||
        "";
    }

    if (
      controles.subtitulo
    ) {
      controles
        .subtitulo
        .value =
          seccion
            ?.subtitulo ||
        "";
    }

    if (
      controles.contenido
    ) {
      controles
        .contenido
        .value =
          seccion
            ?.contenido ||
        "";
    }

    if (
      controles.textoAlternativo
    ) {
      controles
        .textoAlternativo
        .value =
          seccion
            ?.textoAlternativo ||
        "";
    }

    if (
      controles.tipoEnlace
    ) {
      controles
        .tipoEnlace
        .value =
          normalizarTipoEnlace(
            seccion
              ?.tipoEnlace
          );
    }

    if (
      controles.textoBoton
    ) {
      controles
        .textoBoton
        .value =
          seccion
            ?.textoBoton ||
          "";
    }

    if (
      controles.urlBoton
    ) {
      controles
        .urlBoton
        .value =
          seccion
            ?.urlBoton ||
          "";
    }

    if (
      controles.orden
    ) {
      controles
        .orden
        .value =
          String(
            Number(
              seccion
                ?.orden ||
              1
            )
          );
    }

    comun.llenarSelectEstados(
      controles.estado,

      seccion
        ?.idEstadoPublicacion ||
      comun
        .obtenerEstadoPredeterminado()
        ?.idEstadoPublicacion
    );

    cargarImagenActual(
      tarjeta,
      seccion
    );

    actualizarCamposEnlace(
      tarjeta
    );

    actualizarVistaTarjeta(
      tarjeta
    );

    actualizarEstadoVisual(
      tarjeta,
      seccion
    );

    estadosImagen.set(
      tarjeta,
      {
        archivoPendiente:
          null,

        urlTemporal:
          "",

        quitarImagen:
          false
      }
    );

    controles
      .titulo
      ?.addEventListener(
        "input",
        () =>
          actualizarVistaTarjeta(
            tarjeta
          )
      );

    controles
      .subtitulo
      ?.addEventListener(
        "input",
        () =>
          actualizarVistaTarjeta(
            tarjeta
          )
      );

    controles
      .contenido
      ?.addEventListener(
        "input",
        () =>
          actualizarVistaTarjeta(
            tarjeta
          )
      );

    controles
      .textoAlternativo
      ?.addEventListener(
        "input",
        () =>
          actualizarVistaTarjeta(
            tarjeta
          )
      );

    controles
      .estado
      ?.addEventListener(
        "change",
        () =>
          actualizarEstadoVisual(
            tarjeta
          )
      );

    controles
      .tipoEnlace
      ?.addEventListener(
        "change",
        () =>
          actualizarCamposEnlace(
            tarjeta
          )
      );

    controles
      .seleccionarImagen
      ?.addEventListener(
        "click",
        () =>
          seleccionarImagen(
            tarjeta
          )
      );

    controles
      .inputImagen
      ?.addEventListener(
        "change",
        (evento) =>
          cambiarImagen(
            tarjeta,
            evento
          )
      );

    controles
      .quitarImagen
      ?.addEventListener(
        "click",
        () =>
          quitarImagen(
            tarjeta
          )
      );

    /*
     * Tarjeta existente:
     * contrae el editor.
     *
     * Tarjeta nueva:
     * cierra el modal.
     */

    tarjeta
      .querySelectorAll(
        ".comunidad-seccion__cerrar"
      )
      .forEach(
        (botonCerrar) => {
          botonCerrar.addEventListener(
            "click",
            () => {
              if (modoNuevo) {
                cerrarModalNuevaSeccion();
                return;
              }

              cerrarEdicion(
                tarjeta
              );
            }
          );
        }
      );

    /*
     * Se mantienen los dos botones de retiro:
     * - Retirar compacto.
     * - Retirar tarjeta dentro del editor.
     */

    botonesRetirar.forEach(
      (botonRetirar) => {
        botonRetirar.addEventListener(
          "click",
          () =>
            retirarTarjeta(
              tarjeta
            )
        );
      }
    );

    controles
      .guardar
      ?.addEventListener(
        "click",
        () =>
          guardarTarjeta(
            tarjeta
          )
      );

    destino.appendChild(
      tarjeta
    );

    return tarjeta;
  }


  function obtenerCantidadTarjetas() {
    const elementos =
      obtenerElementos();

    return (
      elementos.lista
        ?.querySelectorAll(
          ".comunidad-admin__tarjeta"
        )
        .length ||
      0
    );
  }


  function actualizarContadorSecciones() {
    const elementos =
      obtenerElementos();

    const cantidad =
      obtenerCantidadTarjetas();

    if (
      elementos.contador
    ) {
      elementos
        .contador
        .textContent =
          `${cantidad} de ${LIMITE_SECCIONES}`;
    }

    if (
      elementos.botonAgregar
    ) {
      elementos
        .botonAgregar
        .disabled =
          cantidad >=
          LIMITE_SECCIONES;
    }
  }


  function generarClaveNuevaSeccion() {
    return (
      "SECCION_COMUNIDAD_" +
      Date.now()
    );
  }


  function cerrarEdicion(
    tarjeta
  ) {
    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    if (
      controles.desplegable
    ) {
      controles
        .desplegable
        .open =
          false;
    }
  }


  /*
   * ==========================================================
   * 14. RETIRAR TARJETA
   * ==========================================================
   */

  async function confirmarRetiroTarjeta(
    titulo
  ) {
    return comun.confirmarAccion({
      tipo:
        "peligro",

      titulo:
        "Retirar tarjeta",

      mensaje:
        "La tarjeta dejará de mostrarse en Comunidad y quedará archivada.",

      detalle:
        titulo,

      textoCancelar:
        "Cancelar",

      textoConfirmar:
        "Retirar tarjeta"
    });
  }


  async function retirarTarjeta(
    tarjeta
  ) {
    if (!tarjeta) {
      return;
    }

    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    const idSeccionPagina =
      comun.numeroOpcional(
        controles
          .id
          ?.value
      );

    if (!idSeccionPagina) {
      comun.mostrarMensaje(
        "La tarjeta todavía no existe en la base de datos.",
        "advertencia"
      );

      return;
    }

    const titulo =
      comun.texto(
        controles
          .titulo
          ?.value
      ) ||
      comun.texto(
        controles
          .tituloVisual
          ?.textContent
      ) ||
      "Esta tarjeta";

    const confirmado =
      await confirmarRetiroTarjeta(
        titulo
      );

    if (!confirmado) {
      return;
    }

    const endpoint =
      obtenerEndpointRetiro(
        idSeccionPagina
      );

    if (!endpoint) {
      comun.mostrarMensaje(
        "No fue posible construir la dirección para retirar la tarjeta.",
        "error"
      );

      return;
    }

    const textoOriginal =
      controles
        .retirar
        ?.textContent ||
      "Retirar tarjeta";

    comun.ocultarMensaje();

    if (
      controles.retirar
    ) {
      controles.retirar.disabled =
        true;

      controles.retirar.textContent =
        "Retirando...";
    }

    try {
      await apiClient.post(
        endpoint,
        {}
      );

      /*
       * Recarga todo el editor para que:
       * - La sección archivada desaparezca.
       * - Se actualice el contador.
       * - Se refresquen los datos de página.
       */

      await comun
        .cargarContenidoPagina();

      comun.mostrarMensaje(
        "La tarjeta de Comunidad fue retirada correctamente.",
        "exito"
      );
    } catch (error) {
      if (
        !comun.manejarSesionVencida(
          error
        )
      ) {
        comun.mostrarMensaje(
          comun.obtenerMensajeError(
            error
          ),
          "error"
        );
      }
    } finally {
      if (
        controles.retirar &&
        controles.retirar.isConnected
      ) {
        controles.retirar.disabled =
          false;

        controles.retirar.textContent =
          textoOriginal;
      }
    }
  }


  /*
   * ==========================================================
   * 15. MODAL NUEVA TARJETA
   * ==========================================================
   */

  function cerrarModalNuevaSeccion() {
    const elementos =
      obtenerElementos();

    const tarjeta =
      elementos
        .contenidoModalNuevaSeccion
        ?.querySelector(
          ".comunidad-admin__tarjeta"
        );

    if (tarjeta) {
      const estadoImagen =
        obtenerEstadoImagen(
          tarjeta
        );

      if (
        estadoImagen
          .urlTemporal
      ) {
        liberarUrlTemporal(
          estadoImagen
            .urlTemporal
        );
      }
    }

    if (
      elementos
        .contenidoModalNuevaSeccion
    ) {
      elementos
        .contenidoModalNuevaSeccion
        .innerHTML =
          "";
    }

    if (
      elementos
        .modalNuevaSeccion
        ?.open
    ) {
      elementos
        .modalNuevaSeccion
        .close();
    }
  }


  function agregarNuevaSeccion() {
    const cantidad =
      obtenerCantidadTarjetas();

    if (
      cantidad >=
      LIMITE_SECCIONES
    ) {
      comun.mostrarMensaje(
        `Comunidad permite un máximo de ${LIMITE_SECCIONES} tarjetas.`,
        "advertencia"
      );

      return;
    }

    comun.ocultarMensaje();

    const elementos =
      obtenerElementos();

    if (
      !elementos
        .modalNuevaSeccion ||
      !elementos
        .contenidoModalNuevaSeccion
    ) {
      comun.mostrarMensaje(
        "No fue posible abrir el formulario para crear una nueva tarjeta.",
        "error"
      );

      return;
    }

    cerrarModalNuevaSeccion();

    const estadoPredeterminado =
      comun
        .obtenerEstadoPredeterminado();

    const nuevaSeccion = {
      idSeccionPagina:
        null,

      clave:
        generarClaveNuevaSeccion(),

      etiqueta:
        "Nueva sección",

      titulo:
        "",

      subtitulo:
        "",

      contenido:
        "",

      idArchivo:
        null,

      nombreArchivo:
        null,

      rutaArchivo:
        null,

      textoAlternativo:
        null,

      textoBoton:
        null,

      urlBoton:
        null,

      tipoEnlace:
        "NINGUNO",

      tipoDiseno:
        TIPO_DISENO,

      posicionImagen:
        null,

      orden:
        obtenerSiguienteOrdenTarjeta(),

      idEstadoPublicacion:
        estadoPredeterminado
          ?.idEstadoPublicacion ||
        null,

      estadoPublicacion:
        estadoPredeterminado
          ?.nombre ||
        ""
    };

    const tarjeta =
      crearTarjeta(
        nuevaSeccion,
        {
          destino:
            elementos
              .contenidoModalNuevaSeccion,

          modoNuevo:
            true
        }
      );

    if (!tarjeta) {
      comun.mostrarMensaje(
        "No fue posible preparar el formulario de la nueva tarjeta.",
        "error"
      );

      return;
    }

    elementos
      .modalNuevaSeccion
      .showModal();

    tarjeta
      .querySelector(
        ".comunidad-seccion__titulo"
      )
      ?.focus();
  }


  /*
   * ==========================================================
   * 16. RENDERIZAR TARJETAS
   * ==========================================================
   */

  function renderizarTarjetas() {
    const elementos =
      obtenerElementos();

    if (
      !elementos.lista
    ) {
      return;
    }

    elementos
      .lista
      .querySelectorAll(
        ".comunidad-admin__tarjeta"
      )
      .forEach(
        (tarjeta) =>
          tarjeta.remove()
      );

    /*
     * Solamente se renderizan las tarjetas reales.
     *
     * INTRO_COMUNIDAD y CIERRE_COMUNIDAD
     * ya tienen sus propios formularios.
     */

    const tarjetas =
      obtenerSeccionesTarjetas();

    tarjetas.forEach(
      (seccion) => {
        crearTarjeta(
          seccion
        );
      }
    );

    if (
      elementos.estadoVacio
    ) {
      elementos
        .estadoVacio
        .hidden =
          tarjetas.length >
          0;

      if (
        tarjetas.length ===
        0
      ) {
        elementos
          .estadoVacio
          .innerHTML =
            "<h3>No hay tarjetas</h3>" +
            "<p>No se encontraron tarjetas configuradas para Comunidad.</p>";
      }
    }

    actualizarContadorSecciones();
  }


  /*
   * ==========================================================
   * 17. VALIDAR Y OBTENER DATOS DE TARJETA
   * ==========================================================
   */

  function obtenerDatosTarjeta(
    tarjeta
  ) {
    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    let seccionOriginal = {};

    try {
      seccionOriginal =
        JSON.parse(
          tarjeta.dataset
            .seccionOriginal ||
          "{}"
        );
    } catch (_error) {
      seccionOriginal = {};
    }

    const idSeccionPagina =
      comun.numeroOpcional(
        controles
          .id
          ?.value
      );

    const clave =
      comun.normalizarClave(
        controles
          .clave
          ?.value
      );

    const titulo =
      comun.texto(
        controles
          .titulo
          ?.value
      );

    const subtitulo =
      comun.texto(
        controles
          .subtitulo
          ?.value
      );

    const contenido =
      comun.texto(
        controles
          .contenido
          ?.value
      );

    const textoAlternativo =
      comun.texto(
        controles
          .textoAlternativo
          ?.value
      );

    const tipoEnlace =
      normalizarTipoEnlace(
        controles
          .tipoEnlace
          ?.value
      );

    const textoBoton =
      comun.texto(
        controles
          .textoBoton
          ?.value
      );

    const urlBoton =
      comun.texto(
        controles
          .urlBoton
          ?.value
      );

    const orden =
      comun.numeroOpcional(
        controles
          .orden
          ?.value
      );

    const idEstadoPublicacion =
      comun.validarEstado(
        controles.estado
      );

    const estadoImagen =
      obtenerEstadoImagen(
        tarjeta
      );

    const idArchivo =
      estadoImagen
        .quitarImagen
        ? null
        : comun.numeroOpcional(
          controles
            .idArchivo
            ?.value
        );

    const tieneImagen =
      Boolean(
        idArchivo ||
        estadoImagen
          .archivoPendiente
      );

    const requiereEnlace =
      tipoEnlace !==
      "NINGUNO";


    /* Validación visual */

    comun.marcarInvalido(
      controles.titulo,
      !titulo
    );

    comun.marcarInvalido(
      controles.contenido,
      !contenido
    );

    comun.marcarInvalido(
      controles.tipoEnlace,
      !TIPOS_ENLACE.includes(
        tipoEnlace
      )
    );

    comun.marcarInvalido(
      controles.textoBoton,
      requiereEnlace &&
      !textoBoton
    );

    comun.marcarInvalido(
      controles.urlBoton,
      requiereEnlace &&
      !urlBoton
    );

    comun.marcarInvalido(
      controles.textoAlternativo,
      tieneImagen &&
      !textoAlternativo
    );

    comun.marcarInvalido(
      controles.orden,
      orden === null ||
      !Number.isInteger(
        orden
      ) ||
      orden < 1 ||
      orden > LIMITE_SECCIONES
    );


    /* Validaciones */

    if (!clave) {
      comun.mostrarMensaje(
        "La sección no tiene una clave válida.",
        "error"
      );

      return null;
    }

    if (!titulo) {
      comun.mostrarMensaje(
        "Debe indicar el título de la sección.",
        "error"
      );

      return null;
    }

    if (!contenido) {
      comun.mostrarMensaje(
        "Debe indicar el contenido de la sección.",
        "error"
      );

      return null;
    }

    if (
      !TIPOS_ENLACE.includes(
        tipoEnlace
      )
    ) {
      comun.mostrarMensaje(
        "Seleccione un tipo de enlace válido.",
        "error"
      );

      return null;
    }

    if (
      requiereEnlace &&
      !textoBoton
    ) {
      comun.mostrarMensaje(
        "Debe indicar el texto del botón o seleccionar Sin enlace.",
        "error"
      );

      return null;
    }

    if (
      requiereEnlace &&
      !urlBoton
    ) {
      comun.mostrarMensaje(
        "Debe indicar la dirección del enlace o seleccionar Sin enlace.",
        "error"
      );

      return null;
    }

    if (
      tieneImagen &&
      !textoAlternativo
    ) {
      comun.mostrarMensaje(
        "Cuando una sección tiene imagen debe indicar su texto alternativo.",
        "error"
      );

      return null;
    }

    if (
      orden === null ||
      !Number.isInteger(
        orden
      ) ||
      orden < 1 ||
      orden > LIMITE_SECCIONES
    ) {
      comun.mostrarMensaje(
        `El orden debe ser un número entero entre 1 y ${LIMITE_SECCIONES}.`,
        "error"
      );

      return null;
    }

    if (
      !idEstadoPublicacion
    ) {
      comun.mostrarMensaje(
        "Seleccione el estado de publicación.",
        "error"
      );

      return null;
    }


    return comun.crearDatosBase({
      idSeccionPagina,

      clave,

      etiqueta:
        seccionOriginal
          ?.etiqueta ||
        subtitulo ||
        titulo,

      titulo,

      subtitulo:
        subtitulo ||
        null,

      contenido,

      idArchivo,

      textoAlternativo:
        tieneImagen
          ? textoAlternativo
          : null,

      textoBoton:
        requiereEnlace
          ? textoBoton
          : null,

      urlBoton:
        requiereEnlace
          ? urlBoton
          : null,

      tipoEnlace,

      tipoDiseno:
        seccionOriginal
          ?.tipoDiseno ||
        TIPO_DISENO,

      posicionImagen:
        seccionOriginal
          ?.posicionImagen ||
        null,

      orden,

      idEstadoPublicacion
    });
  }


  /*
   * ==========================================================
   * 18. GUARDAR TARJETA
   * ==========================================================
   */

  async function guardarTarjeta(
    tarjeta
  ) {
    if (!tarjeta) {
      return;
    }

    const controles =
      obtenerControlesTarjeta(
        tarjeta
      );

    await comun.ejecutarProcesoGuardado({
      formulario:
        tarjeta,

      boton:
        controles.guardar,

      cargador:
        controles.cargador,

      validar() {
        return obtenerDatosTarjeta(
          tarjeta
        );
      },

      async ejecutar(datos) {
        const estadoImagen =
          obtenerEstadoImagen(
            tarjeta
          );

        if (
          estadoImagen
            .archivoPendiente
        ) {
          const respuestaImagen =
            await comun.subirImagenPagina(
              estadoImagen
                .archivoPendiente,

              controles
                .textoAlternativo
                ?.value ||
              ""
            );

          const idArchivo =
            comun.obtenerIdArchivoRespuesta(
              respuestaImagen
            );

          if (!idArchivo) {
            throw new Error(
              "La imagen fue cargada, pero no se recibió un identificador de archivo válido."
            );
          }

          datos.idArchivo =
            idArchivo;

          if (
            controles.idArchivo
          ) {
            controles
              .idArchivo
              .value =
                String(
                  idArchivo
                );
          }
        }

        if (
          estadoImagen
            .quitarImagen
        ) {
          datos.idArchivo =
            null;

          datos.textoAlternativo =
            null;
        }

        await comun.guardarSeccion(
          datos
        );
      },

      recargar:
        true,

      mensajeExito:
        "La sección de Comunidad fue guardada correctamente."
    });
  }


  /*
   * ==========================================================
   * 19. COMPROBAR ÓRDENES DUPLICADOS
   * ==========================================================
   */

  function comprobarOrdenesDuplicados() {
    const elementos =
      obtenerElementos();

    const tarjetas =
      Array.from(
        elementos
          .lista
          ?.querySelectorAll(
            ".comunidad-admin__tarjeta"
          ) ||
        []
      );

    const ordenes =
      tarjetas
        .map(
          (tarjeta) =>
            comun.numeroOpcional(
              tarjeta.querySelector(
                ".comunidad-seccion__orden"
              )?.value
            )
        )
        .filter(
          (orden) =>
            orden !== null
        );

    return (
      new Set(
        ordenes
      ).size !==
      ordenes.length
    );
  }


  /*
   * ==========================================================
   * 20. EVENTOS GENERALES
   * ==========================================================
   */

  function configurarEventos() {
    if (
      eventosConfigurados
    ) {
      return;
    }

    eventosConfigurados =
      true;

    const elementos =
      obtenerElementos();


    /* ========================================================
       INTRODUCCIÓN
       ======================================================== */

    elementos
      .botonGuardarIntro
      ?.addEventListener(
        "click",
        guardarIntroduccion
      );


    /* ========================================================
       CIERRE
       ======================================================== */

    elementos
      .botonGuardarCierre
      ?.addEventListener(
        "click",
        guardarCierre
      );

    elementos
      .cierreTipoEnlace
      ?.addEventListener(
        "change",
        actualizarCamposEnlaceCierre
      );


    /* ========================================================
       NUEVA TARJETA
       ======================================================== */

    elementos
      .botonAgregar
      ?.addEventListener(
        "click",
        agregarNuevaSeccion
      );


    /* ========================================================
       MODAL
       ======================================================== */

    elementos
      .botonCerrarModal
      ?.addEventListener(
        "click",
        cerrarModalNuevaSeccion
      );

    elementos
      .modalNuevaSeccion
      ?.addEventListener(
        "cancel",
        (evento) => {
          evento.preventDefault();

          cerrarModalNuevaSeccion();
        }
      );

    elementos
      .modalNuevaSeccion
      ?.addEventListener(
        "click",
        (evento) => {
          if (
            evento.target ===
            elementos.modalNuevaSeccion
          ) {
            cerrarModalNuevaSeccion();
          }
        }
      );


    /* ========================================================
       ÓRDENES
       ======================================================== */

    elementos
      .lista
      ?.addEventListener(
        "change",
        (evento) => {
          if (
            !evento.target
              ?.matches(
                ".comunidad-seccion__orden"
              )
          ) {
            return;
          }

          if (
            comprobarOrdenesDuplicados()
          ) {
            comun.mostrarMensaje(
              "Hay dos o más tarjetas con el mismo número de orden.",
              "advertencia"
            );
          }
        }
      );
  }


  /*
   * ==========================================================
   * 21. RENDERIZADO
   * ==========================================================
   */

  async function renderizar() {
    await cargarDatosComunidad();

    /*
     * Cada parte se renderiza en su propio bloque.
     */

    renderizarIntroduccion();

    renderizarTarjetas();

    renderizarCierre();
  }


  /*
   * ==========================================================
   * 22. REINICIO
   * ==========================================================
   */

  function reiniciarEstado() {
    liberarTodasLasUrls();

    seccionesComunidad =
      [];

    const elementos =
      obtenerElementos();

    if (
      elementos
        .contenidoModalNuevaSeccion
    ) {
      elementos
        .contenidoModalNuevaSeccion
        .innerHTML =
          "";
    }

    if (
      elementos
        .modalNuevaSeccion
        ?.open
    ) {
      elementos
        .modalNuevaSeccion
        .close();
    }
  }


  /*
   * ==========================================================
   * 23. CONFIGURACIÓN DEL EDITOR
   * ==========================================================
   */

  const editorComunidad =
    Object.freeze({
      titulo:
        "Editar Comunidad",

      descripcion:
        "Administre la introducción, las tarjetas y el cierre de la página Comunidad.",

      descripcionResumen:
        "Datos generales obtenidos desde el registro de la página Comunidad.",

      enlacePublico:
        "../../../frontend-publico/pages/comunidad.html",

      textoPie:
        "Gestión de la página Comunidad",

      renderizar,

      configurarEventos,

      reiniciarEstado
    });


  /*
   * ==========================================================
   * 24. API DEL MÓDULO
   * ==========================================================
   */

  global.COMUNIDAD_ADMIN =
    Object.freeze({
      renderizar,
      configurarEventos,
      reiniciarEstado,
      cargarDatosComunidad,
      renderizarIntroduccion,
      renderizarTarjetas,
      renderizarCierre,
      guardarIntroduccion,
      guardarTarjeta,
      guardarCierre,
      retirarTarjeta
    });


  /*
   * ==========================================================
   * 25. REGISTRO
   * ==========================================================
   */

  comun.registrarEditor(
    "comunidad",
    editorComunidad
  );

})(window);