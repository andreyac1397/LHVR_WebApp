/* ============================================================
   CONTACTO - GESTIÓN DE PÁGINAS - PANEL ADMINISTRATIVO LHVR
   ------------------------------------------------------------
   Contiene la lógica específica del editor de la página
   Contacto y ubicación.

   Gestiona:
   - Información institucional compartida.
   - Datos institucionales compartidos de contacto.
   - Enlace de Google Maps.
   - Títulos y estados de las secciones de Contacto.
   - Texto introductorio del formulario público.

   Los datos institucionales se guardan en configuracion_sitio.
   Las secciones propias de la página se guardan mediante el
   módulo compartido paginas-contenido.js.

   Requiere:
   - api-admin.config.js
   - api-client.js
   - paginas-contenido.js
   - alertas-admin.js
   ============================================================ */

(function configurarPaginaContacto(global) {
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
      "No se pudo cargar paginas-contacto.js. " +
      "Verifique paginas-contenido.js, api-admin.config.js " +
      "y api-client.js."
    );
  }

  /*
   * ==========================================================
   * 1. CONSTANTES
   * ==========================================================
   */

  const CLAVES_CONFIGURACION =
    Object.freeze({
      NOMBRE:
        "nombre_institucion",

      SIGLA:
        "sigla_institucion",

      LEMA:
        "lema_institucional",

      MODALIDAD:
        "modalidad_institucional",

      JORNADA:
        "jornada_institucional",

      NIVELES:
        "niveles_institucionales",

      DIRECCION:
        "direccion_institucional",

      TELEFONOS:
        "telefonos_institucionales",

      CORREO:
        "correo_institucional",

      HORARIO:
        "horario_atencion",

      FACEBOOK:
        "facebook_url",

      GOOGLE_MAPS:
        "google_maps_url"
    });

  const CLAVES_SECCIONES =
    Object.freeze({
      DATOS:
        "DATOS_CONTACTO",

      UBICACION:
        "UBICACION_CONTACTO",

      FORMULARIO:
        "FORMULARIO_CONTACTO"
    });

  let eventosConfigurados =
    false;

  let configuracionesContacto =
    Object.create(null);

  /*
   * ==========================================================
   * 2. ELEMENTOS DEL DOCUMENTO
   * ==========================================================
   */

  function obtenerElementos() {
    const porId =
      comun.porId;

    return {
      /* Encabezado y estado general. */
      formularioEncabezado:
        porId(
          "formularioEncabezadoContacto"
        ),

      tituloEncabezado:
        porId(
          "tituloEncabezadoContactoAdmin"
        ),

      descripcionEncabezado:
        porId(
          "descripcionEncabezadoContactoAdmin"
        ),

      estadoEncabezado:
        porId(
          "estadoEncabezadoContactoAdmin"
        ),

      botonGuardarEncabezado:
        porId(
          "botonGuardarEncabezadoContacto"
        ),

      cargadorGuardarEncabezado:
        porId(
          "cargadorGuardarEncabezadoContacto"
        ),

      /*
       * Información institucional.
       */
      formularioInformacionInstitucional:
        porId(
          "formularioInformacionInstitucionalContacto"
        ),

      nombreInstitucion:
        porId(
          "nombreInstitucionContacto"
        ),

      siglaInstitucion:
        porId(
          "siglaInstitucionContacto"
        ),

      lemaInstitucional:
        porId(
          "lemaInstitucionalContacto"
        ),

      modalidadInstitucional:
        porId(
          "modalidadInstitucionalContacto"
        ),

      jornadaInstitucional:
        porId(
          "jornadaInstitucionalContacto"
        ),

      nivelesInstitucionales:
        porId(
          "nivelesInstitucionalesContacto"
        ),

      botonGuardarInformacionInstitucional:
        porId(
          "botonGuardarInformacionInstitucional"
        ),

      cargadorGuardarInformacionInstitucional:
        porId(
          "cargadorGuardarInformacionInstitucional"
        ),

      /*
       * Datos de contacto compartidos.
       */
      formularioDatos:
        porId(
          "formularioDatosContacto"
        ),

      direccion:
        porId(
          "direccionInstitucionalContacto"
        ),

      telefonos:
        porId(
          "telefonosInstitucionalesContacto"
        ),

      correo:
        porId(
          "correoInstitucionalContacto"
        ),

      horario:
        porId(
          "horarioAtencionContacto"
        ),

      facebook:
        porId(
          "facebookContacto"
        ),

      botonGuardarDatos:
        porId(
          "botonGuardarDatosContacto"
        ),

      cargadorGuardarDatos:
        porId(
          "cargadorGuardarDatosContacto"
        ),

      /*
       * Ubicación.
       */
      formularioUbicacion:
        porId(
          "formularioUbicacionContacto"
        ),

      googleMaps:
        porId(
          "googleMapsUrlContacto"
        ),

      textoVistaMapa:
        porId(
          "textoVistaMapaContacto"
        ),

      enlaceAbrirMapa:
        porId(
          "enlaceAbrirMapaContacto"
        ),

      botonGuardarUbicacion:
        porId(
          "botonGuardarUbicacionContacto"
        ),

      cargadorGuardarUbicacion:
        porId(
          "cargadorGuardarUbicacionContacto"
        ),

      /*
       * Contenido propio de la página.
       */
      formularioContenido:
        porId(
          "formularioContenidoContacto"
        ),

      idSeccionDatos:
        porId(
          "idSeccionDatosContacto"
        ),

      tituloSeccionDatos:
        porId(
          "tituloSeccionDatosContacto"
        ),

      estadoSeccionDatos:
        porId(
          "estadoSeccionDatosContacto"
        ),

      idSeccionUbicacion:
        porId(
          "idSeccionUbicacionContacto"
        ),

      tituloSeccionUbicacion:
        porId(
          "tituloSeccionUbicacionContacto"
        ),

      estadoSeccionUbicacion:
        porId(
          "estadoSeccionUbicacionContacto"
        ),

      idSeccionFormulario:
        porId(
          "idSeccionFormularioContacto"
        ),

      tituloSeccionFormulario:
        porId(
          "tituloSeccionFormularioContacto"
        ),

      descripcionSeccionFormulario:
        porId(
          "descripcionSeccionFormularioContacto"
        ),

      estadoSeccionFormulario:
        porId(
          "estadoSeccionFormularioContacto"
        ),

      botonGuardarContenido:
        porId(
          "botonGuardarContenidoContacto"
        ),

      cargadorGuardarContenido:
        porId(
          "cargadorGuardarContenidoContacto"
        )
    };
  }

  function renderizarEncabezado() {
    const elementos =
      obtenerElementos();

    const pagina =
      comun.obtenerPaginaActual();

    if (!pagina) {
      return;
    }

    if (elementos.tituloEncabezado) {
      elementos.tituloEncabezado.value =
        pagina.titulo || "";
    }

    if (elementos.descripcionEncabezado) {
      elementos.descripcionEncabezado.value =
        pagina.descripcion || "";
    }

    comun.llenarSelectEstados(
      elementos.estadoEncabezado,
      pagina.idEstadoPublicacion
    );
  }

  function obtenerDatosEncabezado() {
    const elementos =
      obtenerElementos();

    const pagina =
      comun.obtenerPaginaActual();

    const titulo =
      comun.texto(
        elementos.tituloEncabezado
          ?.value
      );

    const descripcion =
      comun.texto(
        elementos.descripcionEncabezado
          ?.value
      );

    const idEstadoPublicacion =
      comun.validarEstado(
        elementos.estadoEncabezado
      );

    comun.marcarInvalido(
      elementos.tituloEncabezado,
      !titulo
    );

    if (!pagina?.idPagina) {
      comun.mostrarMensaje(
        "No se encontró la página Contacto.",
        "error"
      );

      return null;
    }

    if (!titulo) {
      comun.mostrarMensaje(
        "Debe indicar el título de Contacto.",
        "error"
      );

      return null;
    }

    if (!idEstadoPublicacion) {
      comun.mostrarMensaje(
        "Seleccione el estado del encabezado de Contacto.",
        "error"
      );

      return null;
    }

    return {
      idPagina: pagina.idPagina,
      titulo,
      descripcion: descripcion || null,
      idEstadoPublicacion
    };
  }

  async function guardarEncabezado(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarProcesoGuardado({
      formulario:
        elementos.formularioEncabezado,
      boton:
        elementos.botonGuardarEncabezado,
      cargador:
        elementos.cargadorGuardarEncabezado,
      validar:
        obtenerDatosEncabezado,
      async ejecutar(datos) {
        await comun.guardarPagina(datos);
      },
      recargar: true,
      mensajeExito:
        "El encabezado de Contacto fue guardado correctamente."
    });
  }

  /*
   * ==========================================================
   * 3. ENDPOINTS DE CONFIGURACIÓN DEL SITIO
   * ==========================================================
   */

  function obtenerEndpointsConfiguracion() {
    return (
      configuracion
        .endpoints
        ?.configuracionSitio ||
      {}
    );
  }

  function obtenerEndpointConfiguracion(
    nombre
  ) {
    const endpoints =
      obtenerEndpointsConfiguracion();

    const configurado =
      comun.texto(
        endpoints[nombre]
      );

    if (configurado) {
      return configurado;
    }

    const predeterminados = {
      administracion:
        "/configuracion-sitio/administracion",

      guardar:
        "/configuracion-sitio/administracion"
    };

    return predeterminados[nombre];
  }

  function construirUrlCompleta(
    endpoint
  ) {
    const ruta =
      comun.texto(
        endpoint
      );

    if (!ruta) {
      throw new Error(
        "No se configuró la dirección del endpoint solicitado."
      );
    }

    if (
      /^https?:\/\//i.test(
        ruta
      )
    ) {
      return ruta;
    }

    const base =
      comun.texto(
        configuracion.urlBase ||
        configuracion.baseUrl ||
        configuracion.apiUrl
      ).replace(
        /\/+$/,
        ""
      );

    if (!base) {
      return ruta;
    }

    return (
      `${base}/` +
      ruta.replace(
        /^\/+/,
        ""
      )
    );
  }

  /*
   * api-client.js normalmente expone put().
   *
   * Se mantiene este respaldo para no romper el editor si
   * una versión anterior del cliente todavía no tiene
   * ese método.
   */
  async function solicitudFetch(
    metodo,
    endpoint,
    datos = null
  ) {
    const controlador =
      new AbortController();

    const tiempo =
      Number(
        configuracion
          .tiempoEsperaMs
      ) ||
      15000;

    const temporizador =
      global.setTimeout(
        () =>
          controlador.abort(),
        tiempo
      );

    try {
      const opciones = {
        method:
          metodo,

        credentials:
          configuracion
            .credenciales ||
          "include",

        headers: {
          Accept:
            "application/json"
        },

        signal:
          controlador.signal
      };

      if (
        datos !== null &&
        metodo !== "GET" &&
        metodo !== "DELETE"
      ) {
        opciones.headers[
          "Content-Type"
        ] =
          "application/json";

        opciones.body =
          JSON.stringify(
            datos
          );
      }

      const respuesta =
        await fetch(
          construirUrlCompleta(
            endpoint
          ),
          opciones
        );

      const textoRespuesta =
        await respuesta.text();

      let contenido = {};

      if (textoRespuesta) {
        try {
          contenido =
            JSON.parse(
              textoRespuesta
            );
        } catch (error) {
          contenido = {
            mensaje:
              textoRespuesta
          };
        }
      }

      if (!respuesta.ok) {
        const error =
          new Error(
            contenido?.mensaje ||
            contenido?.message ||
            "La solicitud no pudo completarse."
          );

        error.statusCode =
          respuesta.status;

        error.status =
          respuesta.status;

        error.codigo =
          contenido?.codigo ||
          contenido?.code ||
          null;

        throw error;
      }

      return contenido;
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        const errorTiempo =
          new Error(
            "La solicitud tardó demasiado tiempo."
          );

        errorTiempo.statusCode =
          0;

        throw errorTiempo;
      }

      throw error;
    } finally {
      global.clearTimeout(
        temporizador
      );
    }
  }

  async function ejecutarPut(
    endpoint,
    datos
  ) {
    if (
      typeof apiClient.put ===
      "function"
    ) {
      return apiClient.put(
        endpoint,
        datos
      );
    }

    return solicitudFetch(
      "PUT",
      endpoint,
      datos
    );
  }

  /*
   * ==========================================================
   * 4. CONFIGURACIÓN CENTRALIZADA
   * ==========================================================
   */

  async function solicitarConfiguracionAdministrativa() {
    return apiClient.get(
      obtenerEndpointConfiguracion(
        "administracion"
      )
    );
  }

  function normalizarConfiguraciones(
    respuesta
  ) {
    const datos =
      comun.extraerDatos(
        respuesta
      );

    let lista = [];

    if (
      Array.isArray(
        datos
      )
    ) {
      lista =
        datos;
    } else if (
      Array.isArray(
        datos?.configuraciones
      )
    ) {
      lista =
        datos.configuraciones;
    } else if (
      Array.isArray(
        datos?.items
      )
    ) {
      lista =
        datos.items;
    }

    const normalizadas =
      Object.create(null);

    lista.forEach(
      (item) => {
        const clave =
          comun.texto(
            item?.clave
          ).toLowerCase();

        if (!clave) {
          return;
        }

        normalizadas[clave] =
          item;
      }
    );

    configuracionesContacto =
      normalizadas;
  }

  async function cargarConfiguracionContacto() {
    const respuesta =
      await solicitarConfiguracionAdministrativa();

    normalizarConfiguraciones(
      respuesta
    );
  }

  function obtenerValorConfiguracion(
    clave
  ) {
    const item =
      configuracionesContacto[
        comun.texto(
          clave
        ).toLowerCase()
      ];

    return comun.texto(
      item?.valor
    );
  }

  async function guardarConfiguraciones(
    configuraciones
  ) {
    const lista =
      Array.isArray(
        configuraciones
      )
        ? configuraciones
        : [configuraciones];

    const endpoint =
      obtenerEndpointConfiguracion(
        "guardar"
      );

    for (
      const item
      of lista
    ) {
      await ejecutarPut(
        endpoint,
        {
          clave:
            item.clave,

          valor:
            item.valor
        }
      );
    }
  }

  /*
   * ==========================================================
   * 5. VALIDACIONES
   * ==========================================================
   */

  function validarTextoRequerido(
    control
  ) {
    const valor =
      comun.texto(
        control?.value
      );

    comun.marcarInvalido(
      control,
      !valor
    );

    return valor;
  }

  function correoValido(
    valor
  ) {
    return (
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
          valor
        )
    );
  }

  function validarCorreo(
    control
  ) {
    const valor =
      comun.texto(
        control?.value
      );

    const valido =
      Boolean(
        valor &&
        correoValido(
          valor
        )
      );

    comun.marcarInvalido(
      control,
      !valido
    );

    return valido
      ? valor
      : "";
  }

  function urlValida(
    valor
  ) {
    try {
      const url =
        new URL(
          valor
        );

      return (
        url.protocol ===
          "http:" ||
        url.protocol ===
          "https:"
      );
    } catch (error) {
      return false;
    }
  }

  function validarUrl(
    control,
    requerida = false
  ) {
    const valor =
      comun.texto(
        control?.value
      );

    if (
      !valor &&
      !requerida
    ) {
      comun.marcarInvalido(
        control,
        false
      );

      return "";
    }

    const valido =
      Boolean(
        valor &&
        urlValida(
          valor
        )
      );

    comun.marcarInvalido(
      control,
      !valido
    );

    return valido
      ? valor
      : "";
  }

  /*
   * ==========================================================
   * 6. RENDERIZADO DE INFORMACIÓN INSTITUCIONAL
   * ==========================================================
   */

  function renderizarInformacionInstitucional() {
    const elementos =
      obtenerElementos();

    if (
      elementos.nombreInstitucion
    ) {
      elementos
        .nombreInstitucion
        .value =
          obtenerValorConfiguracion(
            CLAVES_CONFIGURACION
              .NOMBRE
          );
    }

    if (
      elementos.siglaInstitucion
    ) {
      elementos
        .siglaInstitucion
        .value =
          obtenerValorConfiguracion(
            CLAVES_CONFIGURACION
              .SIGLA
          );
    }

    if (
      elementos.lemaInstitucional
    ) {
      elementos
        .lemaInstitucional
        .value =
          obtenerValorConfiguracion(
            CLAVES_CONFIGURACION
              .LEMA
          );
    }

    if (
      elementos.modalidadInstitucional
    ) {
      elementos
        .modalidadInstitucional
        .value =
          obtenerValorConfiguracion(
            CLAVES_CONFIGURACION
              .MODALIDAD
          );
    }

    if (
      elementos.jornadaInstitucional
    ) {
      elementos
        .jornadaInstitucional
        .value =
          obtenerValorConfiguracion(
            CLAVES_CONFIGURACION
              .JORNADA
          );
    }

    if (
      elementos.nivelesInstitucionales
    ) {
      elementos
        .nivelesInstitucionales
        .value =
          obtenerValorConfiguracion(
            CLAVES_CONFIGURACION
              .NIVELES
          );
    }
  }

  /*
   * ==========================================================
   * 7. RENDERIZADO DE DATOS DE CONTACTO
   * ==========================================================
   */

  function renderizarDatosContacto() {
    const elementos =
      obtenerElementos();

    if (elementos.direccion) {
      elementos.direccion.value =
        obtenerValorConfiguracion(
          CLAVES_CONFIGURACION
            .DIRECCION
        );
    }

    if (elementos.telefonos) {
      elementos.telefonos.value =
        obtenerValorConfiguracion(
          CLAVES_CONFIGURACION
            .TELEFONOS
        );
    }

    if (elementos.correo) {
      elementos.correo.value =
        obtenerValorConfiguracion(
          CLAVES_CONFIGURACION
            .CORREO
        );
    }

    if (elementos.horario) {
      elementos.horario.value =
        obtenerValorConfiguracion(
          CLAVES_CONFIGURACION
            .HORARIO
        );
    }

    if (elementos.facebook) {
      elementos.facebook.value =
        obtenerValorConfiguracion(
          CLAVES_CONFIGURACION
            .FACEBOOK
        );
    }

    if (elementos.googleMaps) {
      elementos.googleMaps.value =
        obtenerValorConfiguracion(
          CLAVES_CONFIGURACION
            .GOOGLE_MAPS
        );
    }
  }

  /*
   * ==========================================================
   * 8. VISTA DE UBICACIÓN
   * ==========================================================
   */

  function actualizarVistaMapa() {
    const elementos =
      obtenerElementos();

    const direccion =
      comun.texto(
        elementos
          .direccion
          ?.value
      );

    const url =
      comun.texto(
        elementos
          .googleMaps
          ?.value
      );

    if (
      elementos
        .textoVistaMapa
    ) {
      elementos
        .textoVistaMapa
        .textContent =
          direccion ||
          "No hay una dirección institucional registrada.";
    }

    if (
      elementos
        .enlaceAbrirMapa
    ) {
      if (
        url &&
        urlValida(
          url
        )
      ) {
        elementos
          .enlaceAbrirMapa
          .href =
            url;

        elementos
          .enlaceAbrirMapa
          .removeAttribute(
            "aria-disabled"
          );
      } else {
        elementos
          .enlaceAbrirMapa
          .removeAttribute(
            "href"
          );

        elementos
          .enlaceAbrirMapa
          .setAttribute(
            "aria-disabled",
            "true"
          );
      }
    }
  }

  /*
   * ==========================================================
   * 9. RENDERIZADO DE SECCIONES DE CONTACTO
   * ==========================================================
   */

  function obtenerEstadoInicial(
    seccion
  ) {
    return (
      seccion
        ?.idEstadoPublicacion ||
      comun
        .obtenerEstadoPredeterminado()
        ?.idEstadoPublicacion ||
      ""
    );
  }

  function renderizarSeccionSimple(
    opciones
  ) {
    const seccion =
      comun.obtenerSeccion(
        opciones.clave
      );

    if (opciones.controlId) {
      opciones.controlId.value =
        seccion
          ?.idSeccionPagina ||
        "";
    }

    if (opciones.controlTitulo) {
      opciones.controlTitulo.value =
        comun.texto(
          seccion?.titulo
        ) ||
        opciones.tituloPredeterminado;
    }

    comun.llenarSelectEstados(
      opciones.controlEstado,
      obtenerEstadoInicial(
        seccion
      )
    );

    return seccion;
  }

  function renderizarSeccionesContacto() {
    const elementos =
      obtenerElementos();

    renderizarSeccionSimple({
      clave:
        CLAVES_SECCIONES
          .DATOS,

      controlId:
        elementos.idSeccionDatos,

      controlTitulo:
        elementos.tituloSeccionDatos,

      controlEstado:
        elementos.estadoSeccionDatos,

      tituloPredeterminado:
        "Datos de contacto"
    });

    renderizarSeccionSimple({
      clave:
        CLAVES_SECCIONES
          .UBICACION,

      controlId:
        elementos.idSeccionUbicacion,

      controlTitulo:
        elementos.tituloSeccionUbicacion,

      controlEstado:
        elementos.estadoSeccionUbicacion,

      tituloPredeterminado:
        "Ubicación"
    });

    const seccionFormulario =
      renderizarSeccionSimple({
        clave:
          CLAVES_SECCIONES
            .FORMULARIO,

        controlId:
          elementos.idSeccionFormulario,

        controlTitulo:
          elementos.tituloSeccionFormulario,

        controlEstado:
          elementos.estadoSeccionFormulario,

        tituloPredeterminado:
          "Escríbenos"
      });

    if (
      elementos
        .descripcionSeccionFormulario
    ) {
      elementos
        .descripcionSeccionFormulario
        .value =
          comun.texto(
            seccionFormulario
              ?.contenido
          ) ||
          comun.texto(
            seccionFormulario
              ?.subtitulo
          );
    }
  }

  /*
   * ==========================================================
   * 10. GUARDAR INFORMACIÓN INSTITUCIONAL
   * ==========================================================
   */

  function obtenerInformacionInstitucional() {
    const elementos =
      obtenerElementos();

    const nombre =
      validarTextoRequerido(
        elementos.nombreInstitucion
      );

    const sigla =
      validarTextoRequerido(
        elementos.siglaInstitucion
      );

    const lema =
      validarTextoRequerido(
        elementos.lemaInstitucional
      );

    const modalidad =
      validarTextoRequerido(
        elementos.modalidadInstitucional
      );

    const jornada =
      validarTextoRequerido(
        elementos.jornadaInstitucional
      );

    const niveles =
      validarTextoRequerido(
        elementos.nivelesInstitucionales
      );

    if (
      !nombre ||
      !sigla ||
      !lema ||
      !modalidad ||
      !jornada ||
      !niveles
    ) {
      comun.mostrarMensaje(
        "Complete todos los campos de información institucional.",
        "error"
      );

      return null;
    }

    return [
      {
        clave:
          CLAVES_CONFIGURACION
            .NOMBRE,

        valor:
          nombre
      },
      {
        clave:
          CLAVES_CONFIGURACION
            .SIGLA,

        valor:
          sigla
      },
      {
        clave:
          CLAVES_CONFIGURACION
            .LEMA,

        valor:
          lema
      },
      {
        clave:
          CLAVES_CONFIGURACION
            .MODALIDAD,

        valor:
          modalidad
      },
      {
        clave:
          CLAVES_CONFIGURACION
            .JORNADA,

        valor:
          jornada
      },
      {
        clave:
          CLAVES_CONFIGURACION
            .NIVELES,

        valor:
          niveles
      }
    ];
  }

  async function guardarInformacionInstitucional(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarProcesoGuardado({
      formulario:
        elementos
          .formularioInformacionInstitucional,

      boton:
        elementos
          .botonGuardarInformacionInstitucional,

      cargador:
        elementos
          .cargadorGuardarInformacionInstitucional,

      validar:
        obtenerInformacionInstitucional,

      async ejecutar(datos) {
        await guardarConfiguraciones(
          datos
        );
      },

      mensajeExito:
        "La información institucional fue guardada correctamente."
    });
  }

  /*
   * ==========================================================
   * 11. GUARDAR DATOS DE CONTACTO
   * ==========================================================
   */

  function obtenerDatosContacto() {
    const elementos =
      obtenerElementos();

    const direccion =
      validarTextoRequerido(
        elementos.direccion
      );

    const telefonos =
      validarTextoRequerido(
        elementos.telefonos
      );

    const correo =
      validarCorreo(
        elementos.correo
      );

    const horario =
      validarTextoRequerido(
        elementos.horario
      );

    const facebook =
      validarUrl(
        elementos.facebook,
        false
      );

    const facebookIngresado =
      comun.texto(
        elementos
          .facebook
          ?.value
      );

    if (
      !direccion ||
      !telefonos ||
      !correo ||
      !horario ||
      (
        facebookIngresado &&
        !facebook
      )
    ) {
      comun.mostrarMensaje(
        "Revise los datos de contacto marcados en rojo.",
        "error"
      );

      return null;
    }

    return [
      {
        clave:
          CLAVES_CONFIGURACION
            .DIRECCION,

        valor:
          direccion
      },
      {
        clave:
          CLAVES_CONFIGURACION
            .TELEFONOS,

        valor:
          telefonos
      },
      {
        clave:
          CLAVES_CONFIGURACION
            .CORREO,

        valor:
          correo
      },
      {
        clave:
          CLAVES_CONFIGURACION
            .HORARIO,

        valor:
          horario
      },
      {
        clave:
          CLAVES_CONFIGURACION
            .FACEBOOK,

        valor:
          facebook ||
          null
      }
    ];
  }

  async function guardarDatosContacto(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarProcesoGuardado({
      formulario:
        elementos.formularioDatos,

      boton:
        elementos.botonGuardarDatos,

      cargador:
        elementos.cargadorGuardarDatos,

      validar:
        obtenerDatosContacto,

      async ejecutar(datos) {
        await guardarConfiguraciones(
          datos
        );
      },

      mensajeExito:
        "Los datos de contacto fueron guardados correctamente."
    });
  }

  /*
   * ==========================================================
   * 12. GUARDAR UBICACIÓN
   * ==========================================================
   */

  function obtenerDatosUbicacion() {
    const elementos =
      obtenerElementos();

    const googleMaps =
      validarUrl(
        elementos.googleMaps,
        true
      );

    if (!googleMaps) {
      comun.mostrarMensaje(
        "Ingrese un enlace válido de Google Maps.",
        "error"
      );

      return null;
    }

    return {
      clave:
        CLAVES_CONFIGURACION
          .GOOGLE_MAPS,

      valor:
        googleMaps
    };
  }

  async function guardarUbicacion(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarProcesoGuardado({
      formulario:
        elementos.formularioUbicacion,

      boton:
        elementos.botonGuardarUbicacion,

      cargador:
        elementos.cargadorGuardarUbicacion,

      validar:
        obtenerDatosUbicacion,

      async ejecutar(datos) {
        await guardarConfiguraciones(
          datos
        );
      },

      mensajeExito:
        "La ubicación fue guardada correctamente."
    });
  }

  /*
   * ==========================================================
   * 13. CONSTRUCCIÓN DE SECCIONES SIN BORRAR DATOS EXISTENTES
   * ==========================================================
   */

  function crearSeccionPreservando(
    opciones
  ) {
    const seccionActual =
      comun.obtenerSeccion(
        opciones.clave
      );

    const titulo =
      validarTextoRequerido(
        opciones.controlTitulo
      );

    const idEstado =
      comun.validarEstado(
        opciones.controlEstado
      );

    if (
      !titulo ||
      !idEstado
    ) {
      return null;
    }

    let subtitulo =
      seccionActual
        ?.subtitulo ??
      null;

    let contenido =
      seccionActual
        ?.contenido ??
      null;

    /*
    * El texto introductorio del formulario se almacena
    * en contenido para permitir textos más extensos.
    */
    if (
      opciones
        .controlDescripcion
    ) {
      const descripcion =
        comun.texto(
          opciones
            .controlDescripcion
            .value
        );

      contenido =
        descripcion ||
        null;
    }

    return comun.crearDatosBase({
      idSeccionPagina:
        seccionActual
          ?.idSeccionPagina ||
        opciones
          .controlId
          ?.value ||
        null,

      clave:
        opciones.clave,

      etiqueta:
        seccionActual
          ?.etiqueta ||
        opciones.etiqueta,

      titulo,

      subtitulo,

      contenido,

      idArchivo:
        seccionActual
          ?.idArchivo ||
        null,

      textoAlternativo:
        seccionActual
          ?.textoAlternativo ||
        null,

      /*
      * Las secciones de Contacto no utilizan botones.
      *
      * El enlace de Google Maps se administra ahora
      * mediante configuracion_sitio -> google_maps_url.
      *
      * No se conservan los antiguos textoBoton/urlBoton
      * porque provocarían la validación:
      * "El texto y el enlace del botón deben completarse juntos".
      */
      textoBoton:
        null,

      urlBoton:
        null,

      tipoEnlace:
        "NINGUNO",

      tipoDiseno:
        seccionActual
          ?.tipoDiseno ||
        opciones.tipoDiseno ||
        null,

      posicionImagen:
        seccionActual
          ?.posicionImagen ||
        null,

      orden:
        seccionActual
          ?.orden ??
        opciones.orden ??
        0,

      idEstadoPublicacion:
        idEstado
    });
  }

  function obtenerContenidoPagina() {
    const elementos =
      obtenerElementos();

    const datos =
      crearSeccionPreservando({
        clave:
          CLAVES_SECCIONES
            .DATOS,

        controlId:
          elementos.idSeccionDatos,

        controlTitulo:
          elementos.tituloSeccionDatos,

        controlEstado:
          elementos.estadoSeccionDatos,

        etiqueta:
          "Datos de contacto",

        tipoDiseno:
          "CONTACTO_DATOS",

        orden:
          1
      });

    const ubicacion =
      crearSeccionPreservando({
        clave:
          CLAVES_SECCIONES
            .UBICACION,

        controlId:
          elementos.idSeccionUbicacion,

        controlTitulo:
          elementos.tituloSeccionUbicacion,

        controlEstado:
          elementos.estadoSeccionUbicacion,

        etiqueta:
          "Ubicación",

        tipoDiseno:
          "CONTACTO_UBICACION",

        orden:
          2
      });

    const formulario =
      crearSeccionPreservando({
        clave:
          CLAVES_SECCIONES
            .FORMULARIO,

        controlId:
          elementos.idSeccionFormulario,

        controlTitulo:
          elementos.tituloSeccionFormulario,

        controlDescripcion:
          elementos
            .descripcionSeccionFormulario,

        controlEstado:
          elementos.estadoSeccionFormulario,

        etiqueta:
          "Formulario de contacto",

        tipoDiseno:
          "CONTACTO_FORMULARIO",

        orden:
          3
      });

    if (
      !datos ||
      !ubicacion ||
      !formulario
    ) {
      comun.mostrarMensaje(
        "Complete los títulos y estados de las secciones de Contacto.",
        "error"
      );

      return null;
    }

    return [
      datos,
      ubicacion,
      formulario
    ];
  }

  async function guardarContenidoPagina(
    evento
  ) {
    evento.preventDefault();

    const elementos =
      obtenerElementos();

    await comun.ejecutarGuardado({
      formulario:
        elementos.formularioContenido,

      boton:
        elementos.botonGuardarContenido,

      cargador:
        elementos.cargadorGuardarContenido,

      obtenerDatos:
        obtenerContenidoPagina,

      mensajeExito:
        "El contenido de la página Contacto fue guardado correctamente."
    });
  }

  /*
   * ==========================================================
   * 14. EVENTOS
   * ==========================================================
   */

  function quitarMarcaInvalida(
    evento
  ) {
    const control =
      evento?.target;

    if (!control) {
      return;
    }

    comun.marcarInvalido(
      control,
      false
    );
  }

  function configurarEventos() {
    if (eventosConfigurados) {
      return;
    }

    eventosConfigurados =
      true;

    const elementos =
      obtenerElementos();

    elementos
      .formularioEncabezado
      ?.addEventListener(
        "submit",
        guardarEncabezado
      );

    /*
     * Información institucional.
     */
    elementos
      .formularioInformacionInstitucional
      ?.addEventListener(
        "submit",
        guardarInformacionInstitucional
      );

    /*
     * Datos de contacto.
     */
    elementos
      .formularioDatos
      ?.addEventListener(
        "submit",
        guardarDatosContacto
      );

    /*
     * Ubicación.
     */
    elementos
      .formularioUbicacion
      ?.addEventListener(
        "submit",
        guardarUbicacion
      );

    /*
     * Contenido propio.
     */
    elementos
      .formularioContenido
      ?.addEventListener(
        "submit",
        guardarContenidoPagina
      );

    elementos
      .direccion
      ?.addEventListener(
        "input",
        actualizarVistaMapa
      );

    elementos
      .googleMaps
      ?.addEventListener(
        "input",
        actualizarVistaMapa
      );

    /*
     * Quitar las marcas de error al volver a escribir.
     */
    [
      elementos.nombreInstitucion,
      elementos.siglaInstitucion,
      elementos.lemaInstitucional,
      elementos.modalidadInstitucional,
      elementos.jornadaInstitucional,
      elementos.nivelesInstitucionales,

      elementos.direccion,
      elementos.telefonos,
      elementos.correo,
      elementos.horario,
      elementos.facebook,
      elementos.googleMaps,

      elementos.tituloEncabezado,
      elementos.descripcionEncabezado,
      elementos.estadoEncabezado,

      elementos.tituloSeccionDatos,
      elementos.estadoSeccionDatos,
      elementos.tituloSeccionUbicacion,
      elementos.estadoSeccionUbicacion,
      elementos.tituloSeccionFormulario,
      elementos.descripcionSeccionFormulario,
      elementos.estadoSeccionFormulario
    ]
      .filter(Boolean)
      .forEach(
        (control) => {
          control.addEventListener(
            "input",
            quitarMarcaInvalida
          );

          control.addEventListener(
            "change",
            quitarMarcaInvalida
          );
        }
      );

    elementos
      .enlaceAbrirMapa
      ?.addEventListener(
        "click",
        (evento) => {
          if (
            !elementos
              .enlaceAbrirMapa
              .getAttribute(
                "href"
              )
          ) {
            evento.preventDefault();
          }
        }
      );
  }

  /*
   * ==========================================================
   * 15. ESTADO Y RENDERIZADO DEL EDITOR
   * ==========================================================
   */

  function reiniciarEstado() {
    configuracionesContacto =
      Object.create(null);
  }

  async function renderizar() {
    /*
     * paginas-contenido.js ya obtuvo:
     *
     * - página Contacto
     * - secciones
     * - estados de publicación
     *
     * Aquí se agrega la configuración institucional
     * centralizada.
     */
    await cargarConfiguracionContacto();

    renderizarEncabezado();

    /*
     * Nombre, sigla, lema, modalidad, jornada y niveles.
     */
    renderizarInformacionInstitucional();

    /*
     * Dirección, teléfonos, correo, horario,
     * Facebook y Google Maps.
     */
    renderizarDatosContacto();

    /*
     * Secciones DATOS_CONTACTO, UBICACION_CONTACTO
     * y FORMULARIO_CONTACTO.
     */
    renderizarSeccionesContacto();

    actualizarVistaMapa();
  }

  /*
   * ==========================================================
   * 16. REGISTRO DEL EDITOR
   * ==========================================================
   */

  comun.registrarEditor(
    "contacto",
    {
      titulo:
        "Contacto y ubicación",

      descripcion:
        "Administre el encabezado, la información institucional, los datos de contacto, la ubicación y el contenido mostrado en la página pública.",

      descripcionResumen:
        "Datos generales de la página Contacto y ubicación.",

      enlacePublico:
        "../../../frontend-publico/pages/contacto-ubicacion.html",

      textoPie:
        "Gestión de la página Contacto",

      reiniciarEstado,

      configurarEventos,

      renderizar
    }
  );

  global.PAGINAS_CONTACTO_ADMIN =
    Object.freeze({
      actualizarVistaMapa,
      cargarConfiguracionContacto
    });

})(window);
