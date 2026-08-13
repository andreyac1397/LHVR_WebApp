/**
 * ============================================================
 * MODAL ADMINISTRATIVO
 * ------------------------------------------------------------
 * Componente reutilizable para mostrar ventanas de confirmación
 * dentro del panel administrativo.
 *
 * Características:
 * - Devuelve una promesa con true o false.
 * - Cierra con Escape.
 * - Cierra al presionar fuera del cuadro.
 * - Mantiene el foco dentro del modal.
 * - Devuelve el foco al elemento anterior.
 * - Evita el desplazamiento de la página mientras está abierto.
 *
 * Tipos disponibles:
 * - informacion
 * - advertencia
 * - peligro
 * - exito
 *
 * Ejemplo:
 *
 * const confirmado = await ModalAdmin.confirmar({
 *   tipo: "peligro",
 *   titulo: "Quitar acceso rápido",
 *   mensaje: "El acceso dejará de mostrarse en el sitio público.",
 *   detalle: "Boletines",
 *   textoConfirmar: "Quitar acceso",
 *   textoCancelar: "Cancelar"
 * });
 *
 * if (confirmado) {
 *   // Continuar con la operación.
 * }
 * ============================================================
 */

(function inicializarModalAdmin(global) {
  "use strict";

  const ID_FONDO =
    "fondoModalAdmin";

  const ID_MODAL =
    "modalAdmin";

  const ID_TITULO =
    "tituloModalAdmin";

  const ID_MENSAJE =
    "mensajeModalAdmin";

  const ID_DETALLE =
    "detalleModalAdmin";

  const ID_BOTON_CERRAR =
    "cerrarModalAdmin";

  const ID_BOTON_CANCELAR =
    "cancelarModalAdmin";

  const ID_BOTON_CONFIRMAR =
    "confirmarModalAdmin";

  const TIPOS_PERMITIDOS =
    new Set([
      "informacion",
      "advertencia",
      "peligro",
      "exito"
    ]);

  const CONFIGURACION_TIPOS =
    Object.freeze({
      informacion: Object.freeze({
        titulo:
          "Confirmar acción",

        textoConfirmar:
          "Aceptar"
      }),

      advertencia: Object.freeze({
        titulo:
          "Confirmar acción",

        textoConfirmar:
          "Continuar"
      }),

      peligro: Object.freeze({
        titulo:
          "Confirmar eliminación",

        textoConfirmar:
          "Eliminar"
      }),

      exito: Object.freeze({
        titulo:
          "Operación completada",

        textoConfirmar:
          "Aceptar"
      })
    });

  const ICONOS =
    Object.freeze({
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
          <path
            d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"
          ></path>
          <path d="M12 9v4"></path>
          <path d="M12 17h.01"></path>
        </svg>
      `,

      peligro: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="M19 6 18 20H6L5 6"></path>
          <path d="M10 11v5"></path>
          <path d="M14 11v5"></path>
        </svg>
      `,

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
      `
    });

  let referenciaElementos =
    null;

  let modalAbierto =
    false;

  let resolucionPendiente =
    null;

  let elementoFocoAnterior =
    null;

  let permitirCierreExterior =
    true;

  let permitirCierreEscape =
    true;

  let botonConfirmarEnProceso =
    false;

  let textoConfirmarOriginal =
    "";

  /**
   * Convierte un valor en texto seguro.
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
   * Normaliza el tipo del modal.
   *
   * @param {*} tipo
   * @returns {string}
   */
  function normalizarTipo(tipo) {
    const valor =
      texto(tipo).toLowerCase();

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
   * Obtiene los elementos que pueden recibir foco.
   *
   * @returns {HTMLElement[]}
   */
  function obtenerElementosEnfocables() {
    if (
      !referenciaElementos?.modal
    ) {
      return [];
    }

    return Array.from(
      referenciaElementos.modal.querySelectorAll(
        [
          "button:not([disabled])",
          "[href]:not([tabindex='-1'])",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          "[tabindex]:not([tabindex='-1'])"
        ].join(",")
      )
    ).filter(
      (elemento) =>
        !elemento.hidden &&
        elemento.offsetParent !== null
    );
  }

  /**
   * Mantiene el foco dentro del modal.
   *
   * @param {KeyboardEvent} evento
   */
  function controlarFoco(evento) {
    if (
      evento.key !== "Tab" ||
      !modalAbierto
    ) {
      return;
    }

    const elementos =
      obtenerElementosEnfocables();

    if (
      elementos.length === 0
    ) {
      evento.preventDefault();
      return;
    }

    const primero =
      elementos[0];

    const ultimo =
      elementos[
        elementos.length - 1
      ];

    if (
      evento.shiftKey &&
      document.activeElement ===
        primero
    ) {
      evento.preventDefault();

      ultimo.focus();
      return;
    }

    if (
      !evento.shiftKey &&
      document.activeElement ===
        ultimo
    ) {
      evento.preventDefault();

      primero.focus();
    }
  }

  /**
   * Controla el cierre mediante Escape.
   *
   * @param {KeyboardEvent} evento
   */
  function controlarTeclado(evento) {
    if (!modalAbierto) {
      return;
    }

    controlarFoco(evento);

    if (
      evento.key === "Escape" &&
      permitirCierreEscape &&
      !botonConfirmarEnProceso
    ) {
      evento.preventDefault();

      cerrar(false);
    }
  }

  /**
   * Crea el icono del modal.
   *
   * @returns {HTMLElement}
   */
  function crearIcono() {
    const icono =
      document.createElement(
        "span"
      );

    icono.className =
      "modal-admin__icono";

    icono.id =
      "iconoModalAdmin";

    icono.setAttribute(
      "aria-hidden",
      "true"
    );

    return icono;
  }

  /**
   * Crea el botón de cierre superior.
   *
   * @returns {HTMLButtonElement}
   */
  function crearBotonCerrar() {
    const boton =
      document.createElement(
        "button"
      );

    boton.type =
      "button";

    boton.id =
      ID_BOTON_CERRAR;

    boton.className =
      "modal-admin__cerrar";

    boton.setAttribute(
      "aria-label",
      "Cerrar ventana"
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
        if (
          !botonConfirmarEnProceso
        ) {
          cerrar(false);
        }
      }
    );

    return boton;
  }

  /**
   * Crea el encabezado del modal.
   *
   * @returns {HTMLElement}
   */
  function crearEncabezado() {
    const encabezado =
      document.createElement(
        "div"
      );

    encabezado.className =
      "modal-admin__encabezado";

    const icono =
      crearIcono();

    const contenidoTitulo =
      document.createElement(
        "div"
      );

    contenidoTitulo.className =
      "modal-admin__encabezado-contenido";

    const titulo =
      document.createElement(
        "h2"
      );

    titulo.id =
      ID_TITULO;

    titulo.className =
      "modal-admin__titulo";

    contenidoTitulo.appendChild(
      titulo
    );

    const botonCerrar =
      crearBotonCerrar();

    encabezado.append(
      icono,
      contenidoTitulo,
      botonCerrar
    );

    return encabezado;
  }

  /**
   * Crea el cuerpo del modal.
   *
   * @returns {HTMLElement}
   */
  function crearCuerpo() {
    const cuerpo =
      document.createElement(
        "div"
      );

    cuerpo.className =
      "modal-admin__cuerpo";

    const mensaje =
      document.createElement(
        "p"
      );

    mensaje.id =
      ID_MENSAJE;

    mensaje.className =
      "modal-admin__mensaje";

    const detalle =
      document.createElement(
        "div"
      );

    detalle.id =
      ID_DETALLE;

    detalle.className =
      "modal-admin__detalle";

    detalle.hidden =
      true;

    cuerpo.append(
      mensaje,
      detalle
    );

    return cuerpo;
  }

  /**
   * Crea el botón de cancelar.
   *
   * @returns {HTMLButtonElement}
   */
  function crearBotonCancelar() {
    const boton =
      document.createElement(
        "button"
      );

    boton.type =
      "button";

    boton.id =
      ID_BOTON_CANCELAR;

    boton.className =
      "boton boton--secundario modal-admin__boton modal-admin__boton--cancelar";

    boton.textContent =
      "Cancelar";

    boton.addEventListener(
      "click",
      () => {
        if (
          !botonConfirmarEnProceso
        ) {
          cerrar(false);
        }
      }
    );

    return boton;
  }

  /**
   * Crea el botón de confirmar.
   *
   * @returns {HTMLButtonElement}
   */
  function crearBotonConfirmar() {
    const boton =
      document.createElement(
        "button"
      );

    boton.type =
      "button";

    boton.id =
      ID_BOTON_CONFIRMAR;

    boton.className =
      "boton boton--primario modal-admin__boton modal-admin__boton--confirmar";

    boton.textContent =
      "Aceptar";

    boton.addEventListener(
      "click",
      () => {
        if (
          !botonConfirmarEnProceso
        ) {
          cerrar(true);
        }
      }
    );

    return boton;
  }

  /**
   * Crea el pie del modal.
   *
   * @returns {HTMLElement}
   */
  function crearPie() {
    const pie =
      document.createElement(
        "div"
      );

    pie.className =
      "modal-admin__acciones";

    const botonCancelar =
      crearBotonCancelar();

    const botonConfirmar =
      crearBotonConfirmar();

    pie.append(
      botonCancelar,
      botonConfirmar
    );

    return pie;
  }

  /**
   * Crea toda la estructura del modal.
   *
   * @returns {object}
   */
  function crearEstructura() {
    const fondo =
      document.createElement(
        "div"
      );

    fondo.id =
      ID_FONDO;

    fondo.className =
      "fondo-modal-admin";

    fondo.hidden =
      true;

    fondo.setAttribute(
      "aria-hidden",
      "true"
    );

    const modal =
      document.createElement(
        "section"
      );

    modal.id =
      ID_MODAL;

    modal.className =
      "modal-admin";

    modal.setAttribute(
      "role",
      "dialog"
    );

    modal.setAttribute(
      "aria-modal",
      "true"
    );

    modal.setAttribute(
      "aria-labelledby",
      ID_TITULO
    );

    modal.setAttribute(
      "aria-describedby",
      ID_MENSAJE
    );

    modal.setAttribute(
      "tabindex",
      "-1"
    );

    const encabezado =
      crearEncabezado();

    const cuerpo =
      crearCuerpo();

    const pie =
      crearPie();

    modal.append(
      encabezado,
      cuerpo,
      pie
    );

    fondo.appendChild(
      modal
    );

    fondo.addEventListener(
      "mousedown",
      (evento) => {
        if (
          evento.target === fondo &&
          permitirCierreExterior &&
          !botonConfirmarEnProceso
        ) {
          cerrar(false);
        }
      }
    );

    document.body.appendChild(
      fondo
    );

    return {
      fondo,
      modal,

      icono:
        document.getElementById(
          "iconoModalAdmin"
        ),

      titulo:
        document.getElementById(
          ID_TITULO
        ),

      mensaje:
        document.getElementById(
          ID_MENSAJE
        ),

      detalle:
        document.getElementById(
          ID_DETALLE
        ),

      botonCerrar:
        document.getElementById(
          ID_BOTON_CERRAR
        ),

      botonCancelar:
        document.getElementById(
          ID_BOTON_CANCELAR
        ),

      botonConfirmar:
        document.getElementById(
          ID_BOTON_CONFIRMAR
        )
    };
  }

  /**
   * Obtiene o crea los elementos del modal.
   *
   * @returns {object}
   */
  function obtenerElementos() {
    if (
      referenciaElementos?.fondo &&
      document.body.contains(
        referenciaElementos.fondo
      )
    ) {
      return referenciaElementos;
    }

    referenciaElementos =
      crearEstructura();

    return referenciaElementos;
  }

  /**
   * Restaura el desplazamiento de la página.
   */
  function desbloquearPagina() {
    document.body.classList.remove(
      "modal-admin-abierto"
    );

    document.documentElement.classList.remove(
      "modal-admin-abierto"
    );
  }

  /**
   * Bloquea el desplazamiento de la página.
   */
  function bloquearPagina() {
    document.body.classList.add(
      "modal-admin-abierto"
    );

    document.documentElement.classList.add(
      "modal-admin-abierto"
    );
  }

  /**
   * Restaura el foco previo.
   */
  function restaurarFoco() {
    if (
      elementoFocoAnterior &&
      typeof elementoFocoAnterior.focus ===
        "function" &&
      document.body.contains(
        elementoFocoAnterior
      )
    ) {
      elementoFocoAnterior.focus();
    }

    elementoFocoAnterior =
      null;
  }

  /**
   * Finaliza una confirmación pendiente.
   *
   * @param {boolean} resultado
   */
  function resolverConfirmacion(
    resultado
  ) {
    const resolver =
      resolucionPendiente;

    resolucionPendiente =
      null;

    if (
      typeof resolver ===
      "function"
    ) {
      resolver(
        Boolean(resultado)
      );
    }
  }

  /**
   * Cierra el modal.
   *
   * @param {boolean} resultado
   */
  function cerrar(
    resultado = false
  ) {
    if (!modalAbierto) {
      resolverConfirmacion(
        resultado
      );

      return;
    }

    const elementos =
      obtenerElementos();

    modalAbierto =
      false;

    document.removeEventListener(
      "keydown",
      controlarTeclado
    );

    elementos.fondo.classList.remove(
      "fondo-modal-admin--visible"
    );

    elementos.modal.classList.remove(
      "modal-admin--visible"
    );

    elementos.fondo.setAttribute(
      "aria-hidden",
      "true"
    );

    global.setTimeout(
      () => {
        if (!modalAbierto) {
          elementos.fondo.hidden =
            true;
        }
      },
      220
    );

    desbloquearPagina();

    establecerProcesando(
      false
    );

    resolverConfirmacion(
      resultado
    );

    restaurarFoco();
  }

  /**
   * Cierra el modal anterior sin dejar una promesa pendiente.
   */
  function cerrarAnterior() {
    if (!modalAbierto) {
      return;
    }

    cerrar(false);
  }

  /**
   * Configura el tipo visual del modal.
   *
   * @param {string} tipo
   */
  function configurarTipo(tipo) {
    const elementos =
      obtenerElementos();

    elementos.modal.classList.remove(
      "modal-admin--informacion",
      "modal-admin--advertencia",
      "modal-admin--peligro",
      "modal-admin--exito"
    );

    elementos.modal.classList.add(
      `modal-admin--${tipo}`
    );

    elementos.modal.dataset.tipo =
      tipo;

    elementos.icono.innerHTML =
      ICONOS[tipo];

    elementos.botonConfirmar.classList.toggle(
      "modal-admin__boton--peligro",
      tipo === "peligro"
    );
  }

  /**
   * Configura el contenido del modal.
   *
   * @param {object} opciones
   */
  function configurarContenido(
    opciones
  ) {
    const elementos =
      obtenerElementos();

    const tipo =
      normalizarTipo(
        opciones.tipo
      );

    const configuracion =
      CONFIGURACION_TIPOS[tipo];

    const titulo =
      texto(
        opciones.titulo
      ) ||
      configuracion.titulo;

    const mensaje =
      texto(
        opciones.mensaje
      );

    const detalle =
      texto(
        opciones.detalle
      );

    const textoCancelar =
      texto(
        opciones.textoCancelar
      ) ||
      "Cancelar";

    const textoConfirmar =
      texto(
        opciones.textoConfirmar
      ) ||
      configuracion.textoConfirmar;

    configurarTipo(tipo);

    elementos.titulo.textContent =
      titulo;

    elementos.mensaje.textContent =
      mensaje;

    elementos.mensaje.hidden =
      !mensaje;

    elementos.detalle.textContent =
      detalle;

    elementos.detalle.hidden =
      !detalle;

    elementos.botonCancelar.textContent =
      textoCancelar;

    elementos.botonConfirmar.textContent =
      textoConfirmar;

    textoConfirmarOriginal =
      textoConfirmar;

    permitirCierreExterior =
      opciones.cerrarAlPresionarFuera !==
      false;

    permitirCierreEscape =
      opciones.cerrarConEscape !==
      false;

    elementos.botonCancelar.hidden =
      opciones.mostrarCancelar ===
      false;

    elementos.botonCerrar.hidden =
      opciones.mostrarCerrar ===
      false;
  }

  /**
   * Abre el modal.
   *
   * @param {object} opciones
   * @returns {Promise<boolean>}
   */
  function confirmar(
    opciones = {}
  ) {
    cerrarAnterior();

    const elementos =
      obtenerElementos();

    configurarContenido(
      opciones
    );

    elementoFocoAnterior =
      document.activeElement instanceof
      HTMLElement
        ? document.activeElement
        : null;

    modalAbierto =
      true;

    elementos.fondo.hidden =
      false;

    elementos.fondo.setAttribute(
      "aria-hidden",
      "false"
    );

    bloquearPagina();

    document.addEventListener(
      "keydown",
      controlarTeclado
    );

    global.requestAnimationFrame(
      () => {
        elementos.fondo.classList.add(
          "fondo-modal-admin--visible"
        );

        elementos.modal.classList.add(
          "modal-admin--visible"
        );

        global.requestAnimationFrame(
          () => {
            if (
              !elementos.botonCancelar.hidden
            ) {
              elementos.botonCancelar.focus();
            } else {
              elementos.botonConfirmar.focus();
            }
          }
        );
      }
    );

    return new Promise(
      (resolve) => {
        resolucionPendiente =
          resolve;
      }
    );
  }

  /**
   * Muestra un modal informativo con un único botón.
   *
   * @param {object} opciones
   * @returns {Promise<boolean>}
   */
  function informar(
    opciones = {}
  ) {
    return confirmar({
      ...opciones,

      mostrarCancelar:
        false,

      textoConfirmar:
        texto(
          opciones.textoConfirmar
        ) ||
        "Entendido"
    });
  }

  /**
   * Activa o desactiva el estado de procesamiento.
   *
   * @param {boolean} procesando
   * @param {string} mensaje
   */
  function establecerProcesando(
    procesando,
    mensaje = "Procesando..."
  ) {
    const elementos =
      obtenerElementos();

    botonConfirmarEnProceso =
      Boolean(procesando);

    elementos.botonConfirmar.disabled =
      botonConfirmarEnProceso;

    elementos.botonCancelar.disabled =
      botonConfirmarEnProceso;

    elementos.botonCerrar.disabled =
      botonConfirmarEnProceso;

    elementos.modal.classList.toggle(
      "modal-admin--procesando",
      botonConfirmarEnProceso
    );

    if (
      botonConfirmarEnProceso
    ) {
      elementos.botonConfirmar.dataset.textoOriginal =
        elementos.botonConfirmar.textContent;

      elementos.botonConfirmar.textContent =
        texto(mensaje) ||
        "Procesando...";
    } else {
      elementos.botonConfirmar.textContent =
        textoConfirmarOriginal ||
        elementos.botonConfirmar.dataset.textoOriginal ||
        "Aceptar";

      delete elementos.botonConfirmar.dataset.textoOriginal;
    }
  }

  /**
   * Indica si el modal está visible.
   *
   * @returns {boolean}
   */
  function estaAbierto() {
    return modalAbierto;
  }

  const apiPublica =
    Object.freeze({
      confirmar,
      informar,
      cerrar,
      establecerProcesando,
      estaAbierto
    });

  global.ModalAdmin =
    apiPublica;

  global.confirmarAccionAdmin =
    confirmar;
})(window);