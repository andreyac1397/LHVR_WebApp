/*
 * ============================================================
 * SESIÓN COMPARTIDA DEL PANEL ADMINISTRATIVO
 * Liceo Hernán Vargas Ramírez
 * ------------------------------------------------------------
 * Responsabilidades:
 *
 * - Mantener disponible la sesión validada.
 * - Compartir los datos del administrador con el layout.
 * - Escuchar la solicitud global para cerrar sesión.
 * - Solicitar confirmación al administrador.
 * - Ejecutar el cierre mediante autenticacion.js.
 * - Bloquear cierres duplicados.
 * - Limpiar los datos temporales del frontend.
 * - Redirigir al login desde cualquier página privada.
 *
 * Este archivo debe cargarse en todas las páginas privadas
 * antes de layout-admin.js.
 * ============================================================
 */

(function configurarSesionAdministrador(global) {
  "use strict";

  /*
   * Referencia al archivo actual para calcular la ruta
   * raíz del panel administrativo.
   */
  const scriptActual =
    document.currentScript;

  /*
   * Ruta:
   * panel-administrativo/js/core/sesion-administrador.js
   */
  const urlScript =
    scriptActual?.src
      ? new URL(scriptActual.src)
      : null;

  /*
   * Ruta raíz:
   * panel-administrativo/
   */
  const rutaPanel =
    urlScript
      ? new URL("../../", urlScript)
      : null;

  const RUTA_LOGIN =
    "pages/autenticacion/iniciar-sesion.html";

  /*
   * Sesión recibida desde proteccion-rutas.js.
   */
  let sesionActual = null;

  /*
   * Evita ejecutar varios cierres simultáneos.
   */
  let cierreSesionEnProceso = false;

  /*
   * Evita registrar los eventos más de una vez.
   */
  let moduloInicializado = false;

  /**
   * Obtiene el módulo de autenticación cuando
   * realmente se necesita.
   *
   * No se guarda al inicio porque autenticacion.js
   * puede cargarse después de este archivo.
   *
   * @returns {object|null}
   */
  function obtenerServicioAutenticacion() {
    return (
      global.AUTENTICACION_ADMIN ||
      null
    );
  }

  /**
   * Obtiene un código HTTP desde diferentes
   * formatos posibles de error.
   *
   * @param {object|null} error
   * @returns {number|null}
   */
  function obtenerEstadoError(error) {
    const valor =
      error?.statusCode ??
      error?.status ??
      error?.codigoEstado ??
      null;

    const estado =
      Number(valor);

    return Number.isFinite(estado)
      ? estado
      : null;
  }

  /**
   * Comprueba si un objeto contiene una
   * sesión administrativa válida.
   *
   * @param {object|null} sesion
   * @returns {boolean}
   */
  function esSesionValida(sesion) {
    return Boolean(
      sesion &&
      sesion.autenticado === true &&
      sesion.administrador &&
      sesion.administrador
        .idAdministrador
    );
  }

  /**
   * Guarda la sesión validada y comparte los
   * datos del administrador con los componentes.
   *
   * @param {object|null} sesion
   */
  function guardarSesion(sesion) {
    if (!esSesionValida(sesion)) {
      return;
    }

    sesionActual =
      sesion;

    global.administradorActual =
      sesion.administrador;

    document.dispatchEvent(
      new CustomEvent(
        "sesionAdministradorCargada",
        {
          detail: sesion
        }
      )
    );
  }

  /**
   * Obtiene la sesión administrativa actual.
   *
   * @returns {object|null}
   */
  function obtenerSesionActual() {
    if (
      esSesionValida(sesionActual)
    ) {
      return sesionActual;
    }

    if (
      esSesionValida(
        global.SESION_ADMINISTRADOR
      )
    ) {
      return global
        .SESION_ADMINISTRADOR;
    }

    return null;
  }

  /**
   * Alias utilizado por otros componentes.
   *
   * @returns {object|null}
   */
  function obtenerSesion() {
    return obtenerSesionActual();
  }

  /**
   * Obtiene los datos del administrador actual.
   *
   * @returns {object|null}
   */
  function obtenerAdministradorActual() {
    return (
      obtenerSesionActual()
        ?.administrador ||
      global.administradorActual ||
      null
    );
  }

  /**
   * Alias utilizado por encabezado-admin.js.
   *
   * @returns {object|null}
   */
  function obtenerAdministrador() {
    return obtenerAdministradorActual();
  }

  /**
   * Construye la URL absoluta del login.
   *
   * @returns {string}
   */
  function obtenerRutaLogin() {
    if (
      global.AdminLayout &&
      typeof global.AdminLayout
        .obtenerRutaPanel === "function"
    ) {
      return global.AdminLayout
        .obtenerRutaPanel(
          RUTA_LOGIN
        );
    }

    if (rutaPanel) {
      return new URL(
        RUTA_LOGIN,
        rutaPanel
      ).href;
    }

    return (
      "../autenticacion/iniciar-sesion.html"
    );
  }

  /**
   * Redirige al inicio de sesión.
   */
  function redirigirAlLogin() {
    global.location.replace(
      obtenerRutaLogin()
    );
  }

  /**
   * Obtiene el botón compartido de cierre.
   *
   * @returns {HTMLButtonElement|null}
   */
  function obtenerBotonCerrarSesion() {
    return document.getElementById(
      "btnCerrarSesionAdmin"
    );
  }

  /**
   * Cambia el estado visual del botón.
   *
   * Conserva el icono SVG y modifica únicamente
   * el texto contenido dentro del span.
   *
   * @param {boolean} cargando
   */
  function establecerEstadoBoton(
    cargando
  ) {
    const boton =
      obtenerBotonCerrarSesion();

    if (!boton) {
      return;
    }

    boton.disabled =
      cargando;

    boton.setAttribute(
      "aria-busy",
      String(cargando)
    );

    const texto =
      boton.querySelector("span");

    if (texto) {
      texto.textContent =
        cargando
          ? "Cerrando sesión..."
          : "Cerrar sesión";
    }
  }

  /**
   * Limpia los datos temporales y las
   * referencias locales de sesión.
   */
  function limpiarDatosLocales() {
    const autenticacion =
      obtenerServicioAutenticacion();

    autenticacion
      ?.limpiarDatosVerificacion
      ?.();

    sesionActual = null;

    try {
      global.administradorActual =
        null;
    } catch (error) {
      /*
       * La limpieza de esta referencia no debe
       * impedir completar el cierre de sesión.
       */
    }

    try {
      global.SESION_ADMINISTRADOR =
        null;
    } catch (error) {
      /*
       * La variable puede haber sido declarada
       * como solo lectura por otro módulo.
       */
    }
  }

  /**
   * Muestra un error general del cierre.
   *
   * También emite un evento para que una página
   * pueda presentar su propio mensaje visual.
   *
   * @param {string} mensaje
   */
  function mostrarErrorCierre(mensaje) {
    document.dispatchEvent(
      new CustomEvent(
        "errorCierreSesionAdmin",
        {
          detail: {
            mensaje
          }
        }
      )
    );

    global.alert(mensaje);
  }

  /**
   * Ejecuta el cierre de sesión en el backend.
   *
   * @returns {Promise<void>}
   */
  async function ejecutarCierreSesion() {
    if (cierreSesionEnProceso) {
      return;
    }

    cierreSesionEnProceso = true;

    establecerEstadoBoton(true);

    try {
      const autenticacion =
        obtenerServicioAutenticacion();

      if (
        !autenticacion ||
        typeof autenticacion
          .cerrarSesion !== "function"
      ) {
        throw new Error(
          "El servicio para cerrar sesión no está disponible."
        );
      }

      /*
       * El backend revoca la sesión y elimina
       * la cookie administrativa.
       */
      await autenticacion
        .cerrarSesion();

      limpiarDatosLocales();

      document.dispatchEvent(
        new CustomEvent(
          "sesionAdministradorCerrada"
        )
      );

      redirigirAlLogin();
    } catch (error) {
      const estadoError =
        obtenerEstadoError(error);

      /*
       * Si la sesión ya venció o fue revocada,
       * se limpia el frontend y se vuelve al login.
       */
      if (
        estadoError === 401 ||
        estadoError === 403
      ) {
        limpiarDatosLocales();
        redirigirAlLogin();

        return;
      }

      let mensaje =
        error?.message ||
        "No fue posible cerrar la sesión.";

      if (estadoError === 0) {
        mensaje =
          "No fue posible conectar con el servidor. Verifique que el backend esté encendido.";
      }

      mostrarErrorCierre(
        mensaje
      );
    } finally {
      cierreSesionEnProceso = false;

      establecerEstadoBoton(false);
    }
  }

  /**
   * Solicita confirmación antes de cerrar
   * la sesión administrativa.
   *
   * @returns {Promise<void>}
   */
  async function solicitarCierreSesion() {
    if (cierreSesionEnProceso) {
      return;
    }

    const confirmado =
      global.confirm(
        "¿Desea cerrar la sesión administrativa?"
      );

    if (!confirmado) {
      return;
    }

    await ejecutarCierreSesion();
  }

  /**
   * Procesa la sesión emitida por
   * proteccion-rutas.js.
   *
   * @param {CustomEvent} evento
   */
  function procesarSesionValidada(
    evento
  ) {
    guardarSesion(
      evento?.detail
    );
  }

  /**
   * Procesa la solicitud emitida por
   * barra-lateral.js.
   *
   * Se detiene la propagación inmediata para
   * evitar que la lógica antigua de dashboard.js
   * ejecute un segundo cierre mientras se elimina.
   *
   * @param {CustomEvent} evento
   */
  function procesarSolicitudCierre(
    evento
  ) {
    evento.stopImmediatePropagation();

    solicitarCierreSesion();
  }

  /**
   * Intenta recuperar una sesión que ya estaba
   * disponible antes de inicializar el módulo.
   */
  function recuperarSesionDisponible() {
    const sesion =
      obtenerSesionActual();

    if (sesion) {
      guardarSesion(sesion);
    }
  }

  /**
   * Inicializa el módulo compartido.
   */
  function inicializar() {
    if (moduloInicializado) {
      return;
    }

    moduloInicializado = true;

    document.addEventListener(
      "sesionadministradorlista",
      procesarSesionValidada
    );

    document.addEventListener(
      "cerrarSesionAdminSolicitada",
      procesarSolicitudCierre
    );

    recuperarSesionDisponible();
  }

  /*
   * API pública utilizada por el encabezado,
   * el layout y otros módulos privados.
   */
  global.SesionAdministrador =
    Object.freeze({
      obtenerSesion,
      obtenerSesionActual,
      obtenerAdministrador,
      obtenerAdministradorActual,
      guardarSesion,
      solicitarCierreSesion,
      cerrarSesion:
        ejecutarCierreSesion,
      redirigirAlLogin
    });

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      inicializar,
      {
        once: true
      }
    );
  } else {
    inicializar();
  }
})(window);
