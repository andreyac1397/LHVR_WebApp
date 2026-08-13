/*
 * ============================================================
 * DASHBOARD ADMINISTRATIVO
 * Liceo Hernán Vargas Ramírez
 * ------------------------------------------------------------
 * Responsabilidades:
 *
 * - Recibir la sesión validada por proteccion-rutas.js.
 * - Mostrar los datos del administrador autenticado.
 * - Recuperar una sesión que ya esté disponible.
 *
 * Este archivo ya no controla el cierre de sesión.
 * Esa responsabilidad pertenece a:
 *
 * js/core/sesion-administrador.js
 *
 * Los indicadores y actividades mostrados actualmente
 * en el dashboard son únicamente datos de demostración.
 * ============================================================
 */

(function configurarDashboard(global) {
  "use strict";

  /*
   * Protección de rutas compartida.
   */
  const proteccionRutas =
    global.PROTECCION_RUTAS_ADMIN;

  /*
   * Evita configurar varias veces
   * los eventos del dashboard.
   */
  let dashboardInicializado = false;

  /**
   * Obtiene los elementos que muestran
   * los datos de la sesión.
   *
   * @returns {object}
   */
  function obtenerElementos() {
    return {
      nombreAdministrador:
        document.getElementById(
          "nombreAdministrador"
        ),

      correoAdministrador:
        document.getElementById(
          "correoAdministrador"
        ),

      estadoAdministrador:
        document.getElementById(
          "estadoAdministrador"
        )
    };
  }

  /**
   * Comprueba si un objeto contiene
   * una sesión administrativa válida.
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
   * Obtiene el nombre completo del
   * administrador.
   *
   * @param {object} administrador
   * @returns {string}
   */
  function obtenerNombreAdministrador(
    administrador
  ) {
    return (
      administrador.nombreCompleto ||
      administrador.nombre ||
      "Administrador"
    );
  }

  /**
   * Obtiene el correo del administrador.
   *
   * @param {object} administrador
   * @returns {string}
   */
  function obtenerCorreoAdministrador(
    administrador
  ) {
    return (
      administrador.correo ||
      "No disponible"
    );
  }

  /**
   * Obtiene el estado visible del
   * administrador.
   *
   * @param {object} administrador
   * @returns {string}
   */
  function obtenerEstadoAdministrador(
    administrador
  ) {
    return (
      administrador.nombreEstado ||
      administrador.estado ||
      administrador.descripcionEstado ||
      "Activo"
    );
  }

  /**
   * Coloca los datos de la sesión
   * dentro del dashboard.
   *
   * @param {object|null} sesion
   */
  function mostrarDatosSesion(sesion) {
    if (!esSesionValida(sesion)) {
      return;
    }

    const elementos =
      obtenerElementos();

    const administrador =
      sesion.administrador;

    if (
      elementos.nombreAdministrador
    ) {
      elementos
        .nombreAdministrador
        .textContent =
          obtenerNombreAdministrador(
            administrador
          );
    }

    if (
      elementos.correoAdministrador
    ) {
      elementos
        .correoAdministrador
        .textContent =
          obtenerCorreoAdministrador(
            administrador
          );
    }

    if (
      elementos.estadoAdministrador
    ) {
      elementos
        .estadoAdministrador
        .textContent =
          obtenerEstadoAdministrador(
            administrador
          );
    }
  }

  /**
   * Intenta obtener una sesión que
   * ya haya sido validada.
   *
   * Orden de búsqueda:
   *
   * 1. sesion-administrador.js
   * 2. proteccion-rutas.js
   * 3. Variable global de compatibilidad
   *
   * @returns {object|null}
   */
  function obtenerSesionDisponible() {
    const sesionCompartida =
      global.SesionAdministrador
        ?.obtenerSesionActual
        ?.();

    if (
      esSesionValida(
        sesionCompartida
      )
    ) {
      return sesionCompartida;
    }

    const sesionProtegida =
      proteccionRutas
        ?.obtenerSesionActual
        ?.();

    if (
      esSesionValida(
        sesionProtegida
      )
    ) {
      return sesionProtegida;
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
   * Procesa una sesión recibida
   * mediante un evento.
   *
   * @param {CustomEvent} evento
   */
  function procesarSesionValidada(
    evento
  ) {
    mostrarDatosSesion(
      evento?.detail
    );
  }

  /**
   * Inicializa el dashboard.
   */
  function inicializar() {
    if (dashboardInicializado) {
      return;
    }

    dashboardInicializado = true;

    /*
     * La sesión podría estar disponible
     * antes de ejecutar este archivo.
     */
    const sesionDisponible =
      obtenerSesionDisponible();

    if (sesionDisponible) {
      mostrarDatosSesion(
        sesionDisponible
      );
    }

    /*
     * Evento original emitido por
     * proteccion-rutas.js.
     */
    document.addEventListener(
      "sesionadministradorlista",
      procesarSesionValidada
    );

    /*
     * Evento compartido emitido por
     * sesion-administrador.js.
     */
    document.addEventListener(
      "sesionAdministradorCargada",
      procesarSesionValidada
    );
  }

  /*
   * API pública exclusiva del dashboard.
   */
  global.DASHBOARD_ADMIN =
    Object.freeze({
      mostrarDatosSesion
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