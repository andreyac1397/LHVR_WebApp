/*
 * Protección de rutas del panel administrativo.
 *
 * Responsabilidades:
 * - Comprobar que exista una sesión válida.
 * - Evitar mostrar contenido protegido antes de validar la sesión.
 * - Redirigir al inicio de sesión cuando no exista acceso.
 * - Compartir los datos del administrador con la página actual.
 *
 * La cookie sesion_admin es HttpOnly y el navegador
 * la envía automáticamente mediante api-client.js.
 */

(function configurarProteccionRutas(global) {
  "use strict";

  const autenticacion =
    global.AUTENTICACION_ADMIN;

  const RUTA_INICIAR_SESION =
    "../autenticacion/iniciar-sesion.html";

  const RUTA_CAMBIO_OBLIGATORIO =
    "../autenticacion/cambiar-contrasena.html?obligatorio=1";

  /*
   * Guarda temporalmente en memoria los datos
   * de la sesión confirmada.
   *
   * No utiliza localStorage ni sessionStorage.
   */
  let sesionActual = null;

  /**
   * Obtiene los elementos utilizados mientras
   * se comprueba la sesión.
   *
   * @returns {object}
   */
  function obtenerElementosPagina() {
    return {
      cargador:
        document.getElementById(
          "cargadorProteccion"
        ),

      contenido:
        document.getElementById(
          "contenidoDashboard"
        )
    };
  }

  /**
   * Oculta el contenido protegido.
   *
   * @param {HTMLElement|null} contenido
   */
  function ocultarContenido(contenido) {
    if (!contenido) {
      return;
    }

    contenido.hidden = true;
  }

  /**
   * Muestra el contenido después de confirmar
   * que la sesión es válida.
   *
   * @param {HTMLElement|null} contenido
   */
  function mostrarContenido(contenido) {
    if (!contenido) {
      return;
    }

    contenido.hidden = false;
  }

  /**
   * Oculta el mensaje de comprobación.
   *
   * @param {HTMLElement|null} cargador
   */
  function ocultarCargador(cargador) {
    if (!cargador) {
      return;
    }

    cargador.hidden = true;
  }

  /**
   * Muestra un mensaje mientras se comprueba
   * o cuando ocurre un error.
   *
   * @param {HTMLElement|null} cargador
   * @param {string} mensaje
   * @param {boolean} permitirReintento
   */
  function mostrarMensajeProteccion(
    cargador,
    mensaje,
    permitirReintento = false
  ) {
    if (!cargador) {
      return;
    }

    cargador.hidden = false;
    cargador.replaceChildren();

    const texto =
      document.createElement("p");

    texto.textContent = mensaje;

    cargador.appendChild(texto);

    if (permitirReintento) {
      const boton =
        document.createElement("button");

      boton.type = "button";
      boton.textContent = "Reintentar";
      boton.className =
        "boton-reintentar-sesion";

      boton.addEventListener(
        "click",
        () => {
          protegerRuta();
        }
      );

      cargador.appendChild(boton);
    }
  }

  /**
   * Redirige a la página de inicio de sesión.
   */
  function redirigirInicioSesion() {
    global.location.replace(
      RUTA_INICIAR_SESION
    );
  }

  /**
   * Comprueba que la respuesta de la API
   * contenga una sesión válida.
   *
   * @param {object} respuesta
   * @returns {object}
   */
  function obtenerDatosSesion(respuesta) {
    const datos =
      respuesta?.datos;

    const administrador =
      datos?.administrador;

    if (
      !datos?.autenticado ||
      !administrador ||
      !administrador.idAdministrador
    ) {
      throw new Error(
        "La respuesta no contiene una sesión administrativa válida."
      );
    }

    return {
      autenticado: true,

      administrador: {
        idAdministrador:
          Number(
            administrador.idAdministrador
          ),

        nombreCompleto:
          administrador.nombreCompleto,

        correo:
          administrador.correo,

        idEstadoAdministrador:
          Number(
            administrador.idEstadoAdministrador
          ),

        nombreEstado:
          administrador.nombreEstado,

        requiereCambioContrasena:
          Boolean(administrador.requiereCambioContrasena)
      },

      fechaEmision:
        datos.fechaEmision,

      fechaExpiracion:
        datos.fechaExpiracion
    };
  }

  /**
   * Publica los datos de la sesión para que
   * dashboard.js u otros módulos puedan utilizarlos.
   *
   * @param {object} sesion
   */
  function publicarSesion(sesion) {
    sesionActual =
      Object.freeze({
        ...sesion,

        administrador:
          Object.freeze({
            ...sesion.administrador
          })
      });

    global.SESION_ADMINISTRADOR =
      sesionActual;

    /*
     * El evento permite que otros archivos
     * reciban la sesión cuando la consulta termine.
     */
    document.dispatchEvent(
      new CustomEvent(
        "sesionadministradorlista",
        {
          detail:
            sesionActual
        }
      )
    );
  }

  /**
   * Protege la página actual.
   *
   * Consulta:
   * GET /api/autenticacion/sesion
   *
   * @returns {Promise<object|null>}
   */
  async function protegerRuta() {
    const elementos =
      obtenerElementosPagina();

    ocultarContenido(
      elementos.contenido
    );

    mostrarMensajeProteccion(
      elementos.cargador,
      "Comprobando sesión..."
    );

    if (
      !autenticacion ||
      typeof autenticacion.obtenerSesion !==
        "function"
    ) {
      mostrarMensajeProteccion(
        elementos.cargador,
        "No se pudo cargar el sistema de autenticación.",
        true
      );

      console.error(
        "AUTENTICACION_ADMIN no está disponible."
      );

      return null;
    }

    try {
      const respuesta =
        await autenticacion
          .obtenerSesion();

      const sesion =
        obtenerDatosSesion(
          respuesta
        );

      if (sesion.administrador.requiereCambioContrasena) {
        global.location.replace(RUTA_CAMBIO_OBLIGATORIO);
        return null;
      }

      publicarSesion(
        sesion
      );

      ocultarCargador(
        elementos.cargador
      );

      mostrarContenido(
        elementos.contenido
      );

      document.documentElement
        .setAttribute(
          "data-sesion-verificada",
          "true"
        );

      return sesion;
    } catch (error) {
      sesionActual = null;

      delete global
        .SESION_ADMINISTRADOR;

      document.documentElement
        .removeAttribute(
          "data-sesion-verificada"
        );

      /*
       * Cuando la sesión no existe, venció
       * o el administrador perdió el acceso.
       */
      if (
        error.statusCode === 401 ||
        error.statusCode === 403
      ) {
        autenticacion
          .limpiarDatosVerificacion?.();

        redirigirInicioSesion();

        return null;
      }

      /*
       * El backend está apagado o no se pudo
       * establecer la conexión.
       */
      if (error.statusCode === 0) {
        mostrarMensajeProteccion(
          elementos.cargador,
          "No fue posible conectar con el servidor. Verifique que el backend esté encendido.",
          true
        );

        return null;
      }

      mostrarMensajeProteccion(
        elementos.cargador,
        error.message ||
          "No fue posible comprobar la sesión administrativa.",
        true
      );

      console.error(
        "Error al proteger la ruta:",
        error
      );

      return null;
    }
  }

  /**
   * Devuelve la sesión que ya fue validada.
   *
   * @returns {object|null}
   */
  function obtenerSesionActual() {
    return sesionActual;
  }

  /*
   * Funciones disponibles para otros módulos.
   */
  global.PROTECCION_RUTAS_ADMIN =
    Object.freeze({
      protegerRuta,
      obtenerSesionActual,
      redirigirInicioSesion
    });

  /**
   * Inicialización automática.
   */
  function inicializar() {
    protegerRuta();
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      inicializar
    );
  } else {
    inicializar();
  }
})(window);
