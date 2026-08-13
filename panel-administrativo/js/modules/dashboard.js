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
 * Los indicadores y actividades provienen del resumen
 * protegido que entrega la API.
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
  let resumenCargado = false;

  function escapar(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatearFecha(valor) {
    return new Intl.DateTimeFormat("es-CR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(valor));
  }

  async function cargarResumen() {
    if (resumenCargado || !global.API_ADMIN_CLIENT) return;
    resumenCargado = true;

    [
      "indicadorBoletines",
      "indicadorEventos",
      "indicadorBibliocra",
      "indicadorDocentes"
    ].forEach((id) => {
      const elemento = document.getElementById(id);
      if (elemento) elemento.textContent = "—";
    });

    const actividadInicial = document.getElementById("listaActividadDashboard");
    const eventosIniciales = document.getElementById("listaEventosDashboard");
    if (actividadInicial) {
      actividadInicial.innerHTML = '<li class="dashboard__actividad">Cargando actividad registrada...</li>';
    }
    if (eventosIniciales) {
      eventosIniciales.innerHTML = "<p>Cargando eventos publicados...</p>";
    }

    try {
      const respuesta = await global.API_ADMIN_CLIENT.get("/dashboard/resumen");
      const datos = respuesta?.datos || {};
      const indicadores = datos.indicadores || {};
      const valores = {
        indicadorBoletines: indicadores.boletinesPublicados,
        indicadorEventos: indicadores.eventosProximos,
        indicadorBibliocra: indicadores.solicitudesBibliocraPendientes,
        indicadorDocentes: indicadores.docentesPublicados
      };

      Object.entries(valores).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = String(valor ?? 0);
      });

      const actividad = document.getElementById("listaActividadDashboard");
      if (actividad) {
        actividad.innerHTML = (datos.actividadReciente || []).length
          ? datos.actividadReciente.map((item) => `
            <li class="dashboard__actividad">
              <span class="dashboard__actividad-indicador dashboard__actividad-indicador--verde" aria-hidden="true"></span>
              <div class="dashboard__actividad-contenido">
                <strong>${escapar(item.accion)} · ${escapar(item.modulo)}</strong>
                <span>${escapar(item.descripcion || "Cambio registrado")}</span>
                <time>${escapar(formatearFecha(item.fechaAccion))}${item.administrador ? ` · ${escapar(item.administrador)}` : ""}</time>
              </div>
            </li>
          `).join("")
          : '<li class="dashboard__actividad">No hay cambios registrados todavía.</li>';
      }

      const eventos = document.getElementById("listaEventosDashboard");
      if (eventos) {
        eventos.innerHTML = (datos.proximosEventos || []).length
          ? datos.proximosEventos.map((item) => {
            const fecha = new Date(item.fechaInicio);
            return `
              <article class="dashboard__evento">
                <div class="dashboard__evento-fecha"><strong>${String(fecha.getDate()).padStart(2, "0")}</strong><span>${fecha.toLocaleDateString("es-CR", { month: "short" }).toUpperCase()}</span></div>
                <div class="dashboard__evento-informacion"><h3>${escapar(item.titulo)}</h3><p>${escapar(item.descripcion || "Actividad institucional")}</p></div>
                <span class="admin-etiqueta admin-etiqueta--informacion">${escapar(item.categoria)}</span>
              </article>
            `;
          }).join("")
          : '<p>No hay eventos próximos en el calendario publicado.</p>';
      }
    } catch (error) {
      resumenCargado = false;
      if (actividadInicial) {
        actividadInicial.innerHTML = '<li class="dashboard__actividad">No fue posible consultar la actividad.</li>';
      }
      if (eventosIniciales) {
        eventosIniciales.innerHTML = "<p>No fue posible consultar los eventos.</p>";
      }
      const mensaje = document.getElementById("mensajeDashboard");
      if (mensaje) {
        mensaje.hidden = false;
        mensaje.textContent = error.message || "No fue posible cargar el resumen.";
      }
    }
  }

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

    cargarResumen();

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
