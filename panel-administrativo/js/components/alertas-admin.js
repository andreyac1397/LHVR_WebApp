/**
 * ============================================================
 * ALERTAS ADMINISTRATIVAS
 * ------------------------------------------------------------
 * Componente reutilizable para mostrar notificaciones flotantes
 * dentro del panel administrativo.
 *
 * Tipos disponibles:
 * - exito
 * - error
 * - advertencia
 * - informacion
 *
 * Ejemplos:
 *
 * AlertasAdmin.exito(
 *   "Cambios guardados",
 *   "La información se actualizó correctamente."
 * );
 *
 * AlertasAdmin.error(
 *   "No fue posible guardar",
 *   "Revisa los datos e inténtalo nuevamente."
 * );
 *
 * AlertasAdmin.mostrar({
 *   tipo: "advertencia",
 *   titulo: "Atención",
 *   mensaje: "Debes completar todos los campos.",
 *   duracionMs: 8000
 * });
 * ============================================================
 */

(function inicializarAlertasAdmin(global) {
  "use strict";

  const ID_CONTENEDOR =
    "contenedorAlertasAdmin";

  const CANTIDAD_MAXIMA_ALERTAS =
    5;

  const DURACION_SALIDA_MS =
    250;

  const TIPOS_PERMITIDOS =
    new Set([
      "exito",
      "error",
      "advertencia",
      "informacion"
    ]);

  const CONFIGURACION_TIPOS =
    Object.freeze({
      exito: Object.freeze({
        titulo:
          "Operación completada",

        duracionMs:
          5000
      }),

      error: Object.freeze({
        titulo:
          "Ocurrió un problema",

        duracionMs:
          0
      }),

      advertencia: Object.freeze({
        titulo:
          "Atención",

        duracionMs:
          8000
      }),

      informacion: Object.freeze({
        titulo:
          "Información",

        duracionMs:
          6000
      })
    });

  const ICONOS =
    Object.freeze({
      exito: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m8 12 2.5 2.5L16 9"></path>
        </svg>
      `,

      error: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m9 9 6 6"></path>
          <path d="m15 9-6 6"></path>
        </svg>
      `,

      advertencia: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"></path>
          <path d="M12 9v4"></path>
          <path d="M12 17h.01"></path>
        </svg>
      `,

      informacion: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 11v5"></path>
          <path d="M12 8h.01"></path>
        </svg>
      `
    });

  let contadorAlertas =
    0;

  const temporizadores =
    new Map();

  /**
   * Convierte cualquier valor en texto seguro.
   *
   * @param {*} valor
   * @returns {string}
   */
  function convertirTexto(valor) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return "";
    }

    return String(valor).trim();
  }

  /**
   * Normaliza el tipo de alerta recibido.
   *
   * @param {*} tipo
   * @returns {string}
   */
  function normalizarTipo(tipo) {
    const valor =
      convertirTexto(tipo)
        .toLowerCase();

    if (
      TIPOS_PERMITIDOS.has(
        valor
      )
    ) {
      return valor;
    }

    return "informacion";
  }

  /**
   * Genera un identificador único.
   *
   * @returns {string}
   */
  function generarIdAlerta() {
    contadorAlertas += 1;

    if (
      global.crypto &&
      typeof global.crypto.randomUUID ===
        "function"
    ) {
      return `alerta-admin-${global.crypto.randomUUID()}`;
    }

    return [
      "alerta-admin",
      Date.now(),
      contadorAlertas
    ].join("-");
  }

  /**
   * Obtiene o crea el contenedor global de alertas.
   *
   * @returns {HTMLElement}
   */
  function obtenerContenedor() {
    let contenedor =
      document.getElementById(
        ID_CONTENEDOR
      );

    if (contenedor) {
      return contenedor;
    }

    contenedor =
      document.createElement(
        "section"
      );

    contenedor.id =
      ID_CONTENEDOR;

    contenedor.className =
      "contenedor-alertas-admin";

    contenedor.setAttribute(
      "aria-label",
      "Notificaciones del sistema"
    );

    contenedor.setAttribute(
      "aria-live",
      "polite"
    );

    contenedor.setAttribute(
      "aria-relevant",
      "additions removals"
    );

    document.body.appendChild(
      contenedor
    );

    return contenedor;
  }

  /**
   * Crea el icono correspondiente a la alerta.
   *
   * @param {string} tipo
   * @returns {HTMLElement}
   */
  function crearIcono(tipo) {
    const icono =
      document.createElement(
        "span"
      );

    icono.className =
      "alerta-admin__icono";

    icono.setAttribute(
      "aria-hidden",
      "true"
    );

    icono.innerHTML =
      ICONOS[tipo];

    return icono;
  }

  /**
   * Crea el botón para cerrar una alerta.
   *
   * @param {string} idAlerta
   * @returns {HTMLButtonElement}
   */
  function crearBotonCerrar(
    idAlerta
  ) {
    const boton =
      document.createElement(
        "button"
      );

    boton.type =
      "button";

    boton.className =
      "alerta-admin__cerrar";

    boton.setAttribute(
      "aria-label",
      "Cerrar notificación"
    );

    boton.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 6 12 12"></path>
        <path d="m18 6-12 12"></path>
      </svg>
    `;

    boton.addEventListener(
      "click",
      () => {
        cerrarAlerta(
          idAlerta
        );
      }
    );

    return boton;
  }

  /**
   * Crea el contenido textual de la alerta.
   *
   * @param {string} titulo
   * @param {string} mensaje
   * @returns {HTMLElement}
   */
  function crearContenido(
    titulo,
    mensaje
  ) {
    const contenido =
      document.createElement(
        "div"
      );

    contenido.className =
      "alerta-admin__contenido";

    const tituloElemento =
      document.createElement(
        "strong"
      );

    tituloElemento.className =
      "alerta-admin__titulo";

    tituloElemento.textContent =
      titulo;

    contenido.appendChild(
      tituloElemento
    );

    if (mensaje) {
      const mensajeElemento =
        document.createElement(
          "p"
        );

      mensajeElemento.className =
        "alerta-admin__mensaje";

      mensajeElemento.textContent =
        mensaje;

      contenido.appendChild(
        mensajeElemento
      );
    }

    return contenido;
  }

  /**
   * Detiene el temporizador actual de una alerta.
   *
   * @param {string} idAlerta
   */
  function detenerTemporizador(
    idAlerta
  ) {
    const datos =
      temporizadores.get(
        idAlerta
      );

    if (!datos) {
      return;
    }

    if (datos.idTemporizador) {
      global.clearTimeout(
        datos.idTemporizador
      );
    }

    const tiempoTranscurrido =
      Date.now() -
      datos.fechaInicio;

    datos.tiempoRestanteMs =
      Math.max(
        0,
        datos.tiempoRestanteMs -
          tiempoTranscurrido
      );

    datos.idTemporizador =
      null;

    temporizadores.set(
      idAlerta,
      datos
    );
  }

  /**
   * Inicia o reanuda el temporizador de una alerta.
   *
   * @param {string} idAlerta
   */
  function iniciarTemporizador(
    idAlerta
  ) {
    const datos =
      temporizadores.get(
        idAlerta
      );

    if (
      !datos ||
      datos.tiempoRestanteMs <= 0 ||
      datos.idTemporizador
    ) {
      return;
    }

    datos.fechaInicio =
      Date.now();

    datos.idTemporizador =
      global.setTimeout(
        () => {
          cerrarAlerta(
            idAlerta
          );
        },
        datos.tiempoRestanteMs
      );

    temporizadores.set(
      idAlerta,
      datos
    );
  }

  /**
   * Configura la pausa automática al pasar el mouse
   * o utilizar el teclado dentro de la alerta.
   *
   * @param {HTMLElement} alerta
   * @param {string} idAlerta
   */
  function configurarPausa(
    alerta,
    idAlerta
  ) {
    alerta.addEventListener(
      "mouseenter",
      () => {
        detenerTemporizador(
          idAlerta
        );
      }
    );

    alerta.addEventListener(
      "mouseleave",
      () => {
        iniciarTemporizador(
          idAlerta
        );
      }
    );

    alerta.addEventListener(
      "focusin",
      () => {
        detenerTemporizador(
          idAlerta
        );
      }
    );

    alerta.addEventListener(
      "focusout",
      () => {
        iniciarTemporizador(
          idAlerta
        );
      }
    );
  }

  /**
   * Elimina alertas antiguas cuando se supera el máximo.
   */
  function limitarCantidadAlertas() {
    const contenedor =
      obtenerContenedor();

    const alertas =
      Array.from(
        contenedor.querySelectorAll(
          ".alerta-admin"
        )
      );

    while (
      alertas.length >=
      CANTIDAD_MAXIMA_ALERTAS
    ) {
      const alertaAntigua =
        alertas.shift();

      if (!alertaAntigua) {
        break;
      }

      cerrarAlerta(
        alertaAntigua.id,
        true
      );
    }
  }

  /**
   * Cierra una alerta.
   *
   * @param {string|HTMLElement} referencia
   * @param {boolean} inmediata
   */
  function cerrarAlerta(
    referencia,
    inmediata = false
  ) {
    const alerta =
      referencia instanceof
      HTMLElement
        ? referencia
        : document.getElementById(
            convertirTexto(
              referencia
            )
          );

    if (!alerta) {
      return;
    }

    detenerTemporizador(
      alerta.id
    );

    temporizadores.delete(
      alerta.id
    );

    if (inmediata) {
      alerta.remove();
      return;
    }

    if (
      alerta.classList.contains(
        "alerta-admin--saliendo"
      )
    ) {
      return;
    }

    alerta.classList.add(
      "alerta-admin--saliendo"
    );

    global.setTimeout(
      () => {
        alerta.remove();
      },
      DURACION_SALIDA_MS
    );
  }

  /**
   * Cierra todas las alertas visibles.
   */
  function cerrarTodas() {
    const contenedor =
      document.getElementById(
        ID_CONTENEDOR
      );

    if (!contenedor) {
      return;
    }

    contenedor
      .querySelectorAll(
        ".alerta-admin"
      )
      .forEach(
        (alerta) => {
          cerrarAlerta(
            alerta,
            true
          );
        }
      );

    temporizadores.clear();
  }

  /**
   * Muestra una alerta flotante.
   *
   * @param {object} opciones
   * @param {string} opciones.tipo
   * @param {string} opciones.titulo
   * @param {string} opciones.mensaje
   * @param {number} opciones.duracionMs
   * @param {boolean} opciones.persistente
   * @returns {string}
   */
  function mostrar(opciones = {}) {
    const tipo =
      normalizarTipo(
        opciones.tipo
      );

    const configuracion =
      CONFIGURACION_TIPOS[tipo];

    const titulo =
      convertirTexto(
        opciones.titulo
      ) ||
      configuracion.titulo;

    const mensaje =
      convertirTexto(
        opciones.mensaje
      );

    const persistente =
      Boolean(
        opciones.persistente
      );

    let duracionMs =
      Number(
        opciones.duracionMs
      );

    if (
      !Number.isFinite(
        duracionMs
      ) ||
      duracionMs < 0
    ) {
      duracionMs =
        configuracion.duracionMs;
    }

    if (persistente) {
      duracionMs = 0;
    }

    limitarCantidadAlertas();

    const idAlerta =
      generarIdAlerta();

    const alerta =
      document.createElement(
        "article"
      );

    alerta.id =
      idAlerta;

    alerta.className = [
      "alerta-admin",
      `alerta-admin--${tipo}`
    ].join(" ");

    alerta.dataset.tipo =
      tipo;

    alerta.setAttribute(
      "role",
      tipo === "error" ||
      tipo === "advertencia"
        ? "alert"
        : "status"
    );

    alerta.setAttribute(
      "aria-atomic",
      "true"
    );

    alerta.append(
      crearIcono(tipo),

      crearContenido(
        titulo,
        mensaje
      ),

      crearBotonCerrar(
        idAlerta
      )
    );

    const contenedor =
      obtenerContenedor();

    contenedor.appendChild(
      alerta
    );

    global.requestAnimationFrame(
      () => {
        alerta.classList.add(
          "alerta-admin--visible"
        );
      }
    );

    if (duracionMs > 0) {
      temporizadores.set(
        idAlerta,
        {
          idTemporizador:
            null,

          fechaInicio:
            Date.now(),

          tiempoRestanteMs:
            duracionMs
        }
      );

      configurarPausa(
        alerta,
        idAlerta
      );

      iniciarTemporizador(
        idAlerta
      );
    }

    return idAlerta;
  }

  /**
   * Permite utilizar:
   *
   * AlertasAdmin.exito("Título", "Mensaje")
   * AlertasAdmin.exito("Mensaje")
   *
   * @param {string} tipo
   * @param {string} titulo
   * @param {string} mensaje
   * @param {object} opciones
   * @returns {string}
   */
  function mostrarPorTipo(
    tipo,
    titulo,
    mensaje,
    opciones = {}
  ) {
    let tituloFinal =
      titulo;

    let mensajeFinal =
      mensaje;

    if (
      mensaje === undefined
    ) {
      mensajeFinal =
        titulo;

      tituloFinal =
        "";
    }

    return mostrar({
      ...opciones,

      tipo,

      titulo:
        tituloFinal,

      mensaje:
        mensajeFinal
    });
  }

  const apiPublica =
    Object.freeze({
      mostrar,

      exito(
        titulo,
        mensaje,
        opciones
      ) {
        return mostrarPorTipo(
          "exito",
          titulo,
          mensaje,
          opciones
        );
      },

      error(
        titulo,
        mensaje,
        opciones
      ) {
        return mostrarPorTipo(
          "error",
          titulo,
          mensaje,
          opciones
        );
      },

      advertencia(
        titulo,
        mensaje,
        opciones
      ) {
        return mostrarPorTipo(
          "advertencia",
          titulo,
          mensaje,
          opciones
        );
      },

      informacion(
        titulo,
        mensaje,
        opciones
      ) {
        return mostrarPorTipo(
          "informacion",
          titulo,
          mensaje,
          opciones
        );
      },

      cerrar:
        cerrarAlerta,

      cerrarTodas
    });

  global.AlertasAdmin =
    apiPublica;

  global.mostrarAlertaAdmin =
    mostrar;
})(window);