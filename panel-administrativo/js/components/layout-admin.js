/**
 * ============================================================
 * LAYOUT COMPARTIDO DEL PANEL ADMINISTRATIVO
 * Liceo Hernán Vargas Ramírez
 * ------------------------------------------------------------
 * Responsabilidades:
 *
 * - Cargar los estilos compartidos del panel.
 * - Cargar la configuración de la API.
 * - Cargar el cliente HTTP administrativo.
 * - Cargar la autenticación compartida.
 * - Cargar el control de sesión administrativo.
 * - Cargar la protección de rutas privadas.
 * - Cargar las alertas administrativas.
 * - Cargar los modales administrativos.
 * - Crear la estructura general del panel.
 * - Colocar la barra lateral a la izquierda.
 * - Colocar el encabezado superior.
 * - Insertar el contenido particular de cada página.
 * - Crear el fondo para el menú móvil.
 *
 * Cada página privada debe contener:
 *
 * <main id="contenidoPagina">
 *   Contenido propio de la página
 * </main>
 *
 * Y cargar:
 *
 * <script
 *   src="../../js/components/layout-admin.js"
 *   defer
 * ></script>
 * ============================================================
 */

(function configurarLayoutAdmin(global) {
  "use strict";

  /*
   * Evita construir el layout más de una vez.
   */
  let layoutInicializado = false;

  /*
   * Conserva la referencia al script actual para calcular
   * correctamente las rutas desde cualquier página.
   */
  const scriptLayout =
    document.currentScript;

  if (!scriptLayout?.src) {
    console.error(
      "No fue posible determinar la ubicación de layout-admin.js."
    );

    return;
  }

  /*
   * Ruta del archivo actual:
   *
   * panel-administrativo/js/components/layout-admin.js
   */
  const urlLayout =
    new URL(scriptLayout.src);

  /*
   * Ruta de la carpeta:
   *
   * panel-administrativo/js/components/
   */
  const rutaComponentes =
    new URL("./", urlLayout);

  /*
   * Ruta raíz:
   *
   * panel-administrativo/
   */
  const rutaPanel =
    new URL("../../", urlLayout);

  /*
   * Estilos compartidos por todas las páginas privadas.
   */
  const hojasEstiloCompartidas = [
    "css/variables-admin.css",
    "css/estilos-admin.css",
    "css/barra-lateral.css",
    "css/alertas-admin.css",
    "css/modales-admin.css",
    "css/responsive-admin.css"
  ];

  /*
   * Módulos compartidos.
   *
   * Se cargan en este orden porque algunos dependen
   * de los anteriores.
   */
  const modulosCompartidos = [
    {
      archivo:
        "js/config/api-admin.config.js",

      nombre:
        "Configuración de la API"
    },

    {
      archivo:
        "js/core/api-client.js",

      nombre:
        "Cliente de la API"
    },

    {
      archivo:
        "js/modules/autenticacion.js",

      nombre:
        "Autenticación administrativa",

      comprobar() {
        return Boolean(
          global.AUTENTICACION_ADMIN
        );
      }
    },

    {
      archivo:
        "js/core/sesion-administrador.js",

      nombre:
        "Sesión administrativa",

      comprobar() {
        return Boolean(
          global.SesionAdministrador
        );
      }
    },

    {
      archivo:
        "js/core/proteccion-rutas.js",

      nombre:
        "Protección de rutas",

      comprobar() {
        return Boolean(
          global.PROTECCION_RUTAS_ADMIN
        );
      }
    }
  ];

  /*
   * Componentes visuales compartidos.
   *
   * Se cargan en orden para que las alertas y los modales
   * estén disponibles antes que los demás componentes.
   */
  const componentesCompartidos = [
    {
      archivo:
        "alertas-admin.js",

      nombre:
        "Alertas administrativas",

      comprobar() {
        return Boolean(
          global.AlertasAdmin
        );
      }
    },

    {
      archivo:
        "modal-admin.js",

      nombre:
        "Modal administrativo",

      comprobar() {
        return Boolean(
          global.ModalAdmin
        );
      }
    },

    {
      archivo:
        "barra-lateral.js",

      nombre:
        "Barra lateral",

      comprobar() {
        return (
          typeof global
            .renderizarBarraLateralAdmin ===
          "function"
        );
      }
    },

    {
      archivo:
        "encabezado-admin.js",

      nombre:
        "Encabezado administrativo",

      comprobar() {
        return (
          typeof global
            .renderizarEncabezadoAdmin ===
          "function"
        );
      }
    }
  ];

  /**
   * API pública del layout.
   */
  const AdminLayout = {
    rutaPanel:
      rutaPanel.href,

    rutaComponentes:
      rutaComponentes.href,

    /**
     * Construye una ruta absoluta desde:
     * panel-administrativo/
     *
     * @param {string} rutaRelativa
     * @returns {string}
     */
    obtenerRutaPanel(
      rutaRelativa = ""
    ) {
      return new URL(
        rutaRelativa,
        rutaPanel
      ).href;
    },

    /**
     * Indica si el layout ya fue construido.
     *
     * @returns {boolean}
     */
    estaInicializado() {
      return layoutInicializado;
    }
  };

  global.AdminLayout =
    Object.freeze(
      AdminLayout
    );

  /**
   * Normaliza una URL para compararla.
   *
   * @param {string} ruta
   * @returns {string}
   */
  function normalizarUrl(ruta) {
    try {
      return new URL(
        ruta,
        document.baseURI
      ).href;
    } catch (error) {
      return String(
        ruta || ""
      );
    }
  }

  /**
   * Comprueba si una hoja de estilos
   * ya está incluida.
   *
   * @param {string} ruta
   * @returns {boolean}
   */
  function hojaEstiloExiste(ruta) {
    const rutaNormalizada =
      normalizarUrl(ruta);

    return Array.from(
      document.querySelectorAll(
        'link[rel="stylesheet"]'
      )
    ).some((enlace) => {
      return (
        normalizarUrl(
          enlace.href
        ) === rutaNormalizada
      );
    });
  }

  /**
   * Carga una hoja de estilos si todavía
   * no se encuentra en la página.
   *
   * @param {string} archivo
   */
  function cargarHojaEstilo(
    archivo
  ) {
    const ruta =
      AdminLayout.obtenerRutaPanel(
        archivo
      );

    if (
      hojaEstiloExiste(ruta)
    ) {
      return;
    }

    const enlace =
      document.createElement(
        "link"
      );

    enlace.rel =
      "stylesheet";

    enlace.href =
      ruta;

    enlace.dataset.layoutAdmin =
      "true";

    document.head.appendChild(
      enlace
    );
  }

  /**
   * Carga todos los estilos compartidos.
   */
  function cargarEstilosCompartidos() {
    hojasEstiloCompartidas.forEach(
      cargarHojaEstilo
    );
  }

  /**
   * Busca un script existente mediante
   * su dirección completa.
   *
   * @param {string} ruta
   * @returns {HTMLScriptElement|null}
   */
  function buscarScriptExistente(
    ruta
  ) {
    const rutaNormalizada =
      normalizarUrl(ruta);

    return (
      Array.from(
        document.scripts
      ).find((script) => {
        return (
          script.src &&
          normalizarUrl(
            script.src
          ) === rutaNormalizada
        );
      }) || null
    );
  }

  /**
   * Comprueba si un módulo o componente
   * ya está disponible.
   *
   * @param {object} recurso
   * @returns {boolean}
   */
  function recursoDisponible(
    recurso
  ) {
    if (
      typeof recurso.comprobar !==
      "function"
    ) {
      return false;
    }

    try {
      return Boolean(
        recurso.comprobar()
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Espera a que un script existente termine
   * de cargar.
   *
   * @param {HTMLScriptElement} script
   * @param {object} recurso
   * @returns {Promise<void>}
   */
  function esperarScriptExistente(
    script,
    recurso
  ) {
    return new Promise(
      (resolve, reject) => {
        if (
          recursoDisponible(
            recurso
          )
        ) {
          resolve();
          return;
        }

        /*
         * Los archivos sin comprobación global,
         * como la configuración de API, se consideran
         * listos cuando ya existen en el documento.
         */
        if (
          typeof recurso.comprobar !==
          "function"
        ) {
          resolve();
          return;
        }

        let finalizado =
          false;

        const completar = () => {
          if (finalizado) {
            return;
          }

          finalizado = true;

          if (
            recursoDisponible(
              recurso
            )
          ) {
            resolve();
            return;
          }

          reject(
            new Error(
              `${recurso.nombre} se cargó, pero no creó su interfaz pública.`
            )
          );
        };

        const fallar = () => {
          if (finalizado) {
            return;
          }

          finalizado = true;

          reject(
            new Error(
              `No fue posible cargar ${recurso.nombre}.`
            )
          );
        };

        script.addEventListener(
          "load",
          completar,
          {
            once: true
          }
        );

        script.addEventListener(
          "error",
          fallar,
          {
            once: true
          }
        );

        /*
         * Cuando el script ya había terminado antes
         * de registrar los eventos, se comprueba
         * nuevamente en el siguiente ciclo.
         */
        global.setTimeout(
          () => {
            if (
              finalizado ||
              !recursoDisponible(
                recurso
              )
            ) {
              return;
            }

            finalizado = true;
            resolve();
          },
          0
        );
      }
    );
  }

  /**
   * Carga un archivo JavaScript.
   *
   * @param {object} recurso
   * @param {URL} rutaBase
   * @returns {Promise<void>}
   */
  function cargarRecursoJavaScript(
    recurso,
    rutaBase
  ) {
    return new Promise(
      (resolve, reject) => {
        const ruta =
          new URL(
            recurso.archivo,
            rutaBase
          ).href;

        if (
          recursoDisponible(
            recurso
          )
        ) {
          resolve();
          return;
        }

        const scriptExistente =
          buscarScriptExistente(
            ruta
          );

        if (scriptExistente) {
          esperarScriptExistente(
            scriptExistente,
            recurso
          )
            .then(resolve)
            .catch(reject);

          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.src =
          ruta;

        script.async =
          false;

        script.dataset.layoutAdmin =
          "true";

        script.addEventListener(
          "load",
          () => {
            if (
              typeof recurso.comprobar ===
              "function" &&
              !recursoDisponible(
                recurso
              )
            ) {
              reject(
                new Error(
                  `${recurso.nombre} no creó su interfaz pública.`
                )
              );

              return;
            }

            resolve();
          },
          {
            once: true
          }
        );

        script.addEventListener(
          "error",
          () => {
            reject(
              new Error(
                `No fue posible cargar ${recurso.nombre}.`
              )
            );
          },
          {
            once: true
          }
        );

        document.body.appendChild(
          script
        );
      }
    );
  }

  /**
   * Carga los módulos compartidos en orden.
   *
   * 1. Configuración de la API.
   * 2. Cliente HTTP.
   * 3. Autenticación.
   * 4. Sesión administrativa.
   * 5. Protección de rutas.
   *
   * @returns {Promise<void>}
   */
  async function cargarModulosCompartidos() {
    for (
      const modulo
      of modulosCompartidos
    ) {
      await cargarRecursoJavaScript(
        modulo,
        rutaPanel
      );
    }
  }

  /**
   * Carga los componentes compartidos en orden.
   *
   * 1. Alertas administrativas.
   * 2. Modal administrativo.
   * 3. Barra lateral.
   * 4. Encabezado.
   *
   * @returns {Promise<void>}
   */
  async function cargarComponentes() {
    for (
      const componente
      of componentesCompartidos
    ) {
      await cargarRecursoJavaScript(
        componente,
        rutaComponentes
      );
    }
  }

  /**
   * Crea el contenedor principal.
   *
   * @returns {HTMLDivElement}
   */
  function crearContenedorLayout() {
    const layout =
      document.createElement(
        "div"
      );

    layout.id =
      "adminLayout";

    layout.className =
      "admin-layout";

    return layout;
  }

  /**
   * Crea la barra lateral vacía.
   *
   * @returns {HTMLElement}
   */
  function crearBarraLateral() {
    const barraLateral =
      document.createElement(
        "aside"
      );

    barraLateral.id =
      "barraLateralAdmin";

    barraLateral.className =
      "admin-barra-lateral barra-lateral-admin";

    barraLateral.setAttribute(
      "aria-label",
      "Menú administrativo"
    );

    return barraLateral;
  }

  /**
   * Crea el contenedor derecho del panel.
   *
   * @returns {HTMLDivElement}
   */
  function crearContenedorPrincipal() {
    const contenedor =
      document.createElement(
        "div"
      );

    contenedor.className =
      "admin-contenedor-principal";

    return contenedor;
  }

  /**
   * Crea el encabezado vacío.
   *
   * @returns {HTMLElement}
   */
  function crearEncabezado() {
    const encabezado =
      document.createElement(
        "header"
      );

    encabezado.id =
      "encabezadoAdmin";

    encabezado.className =
      "admin-encabezado encabezado-admin";

    return encabezado;
  }

  /**
   * Crea el área que contiene el contenido
   * particular de cada página.
   *
   * @param {HTMLElement} contenidoPagina
   * @returns {HTMLDivElement}
   */
  function crearAreaContenido(
    contenidoPagina
  ) {
    const areaContenido =
      document.createElement(
        "div"
      );

    areaContenido.id =
      "contenidoPrincipalAdmin";

    areaContenido.className =
      "admin-contenido-principal";

    areaContenido.appendChild(
      contenidoPagina
    );

    return areaContenido;
  }

  /**
   * Crea el fondo oscuro del menú móvil.
   *
   * @returns {HTMLButtonElement}
   */
  function crearFondoMenuMovil() {
    const fondo =
      document.createElement(
        "button"
      );

    fondo.type =
      "button";

    fondo.id =
      "fondoMenuMovil";

    fondo.className =
      "admin-fondo-menu-movil";

    fondo.setAttribute(
      "aria-label",
      "Cerrar menú administrativo"
    );

    fondo.setAttribute(
      "aria-controls",
      "barraLateralAdmin"
    );

    fondo.hidden =
      true;

    return fondo;
  }

  /**
   * Construye la estructura completa.
   *
   * @param {HTMLElement} contenidoPagina
   * @returns {object}
   */
  function construirEstructura(
    contenidoPagina
  ) {
    const layout =
      crearContenedorLayout();

    const barraLateral =
      crearBarraLateral();

    const contenedorPrincipal =
      crearContenedorPrincipal();

    const encabezado =
      crearEncabezado();

    const areaContenido =
      crearAreaContenido(
        contenidoPagina
      );

    const fondoMenuMovil =
      crearFondoMenuMovil();

    contenedorPrincipal.append(
      encabezado,
      areaContenido
    );

    layout.append(
      barraLateral,
      contenedorPrincipal,
      fondoMenuMovil
    );

    return {
      layout,
      barraLateral,
      contenedorPrincipal,
      encabezado,
      areaContenido,
      fondoMenuMovil
    };
  }

  /**
   * Renderiza la barra lateral y el encabezado.
   *
   * @param {object} elementos
   * @returns {Promise<void>}
   */
  async function renderizarComponentes(
    elementos
  ) {
    if (
      typeof global
        .renderizarBarraLateralAdmin !==
      "function"
    ) {
      throw new Error(
        "No está disponible renderizarBarraLateralAdmin()."
      );
    }

    if (
      typeof global
        .renderizarEncabezadoAdmin !==
      "function"
    ) {
      throw new Error(
        "No está disponible renderizarEncabezadoAdmin()."
      );
    }

    await global
      .renderizarBarraLateralAdmin(
        elementos.barraLateral
      );

    await global
      .renderizarEncabezadoAdmin(
        elementos.encabezado
      );
  }

  /**
   * Inserta el layout dentro del body.
   *
   * @param {HTMLElement} layout
   */
  function insertarLayout(layout) {
    document.body.prepend(
      layout
    );
  }

  /**
   * Emite el evento que informa que
   * el layout está listo.
   *
   * @param {object} elementos
   */
  function emitirEventoLayoutListo(
    elementos
  ) {
    document.dispatchEvent(
      new CustomEvent(
        "layoutAdminListo",
        {
          detail: {
            layout:
              elementos.layout,

            barraLateral:
              elementos.barraLateral,

            encabezado:
              elementos.encabezado,

            contenidoPrincipal:
              elementos.areaContenido,

            fondoMenuMovil:
              elementos.fondoMenuMovil
          }
        }
      )
    );
  }

  /**
   * Muestra un error cuando el layout
   * no puede construirse.
   *
   * @param {Error} error
   */
  function mostrarErrorLayout(error) {
    console.error(
      "No fue posible cargar el layout administrativo:",
      error
    );

    const contenidoPagina =
      document.getElementById(
        "contenidoPagina"
      );

    contenidoPagina?.removeAttribute(
      "hidden"
    );
  }

  /**
   * Inicializa el layout.
   *
   * @returns {Promise<void>}
   */
  async function inicializarLayoutAdmin() {
    if (layoutInicializado) {
      return;
    }

    const layoutExistente =
      document.getElementById(
        "adminLayout"
      );

    if (layoutExistente) {
      layoutInicializado = true;
      return;
    }

    const contenidoPagina =
      document.getElementById(
        "contenidoPagina"
      );

    if (!contenidoPagina) {
      console.error(
        'La página debe contener un elemento con id="contenidoPagina".'
      );

      return;
    }

    layoutInicializado =
      true;

    try {
      cargarEstilosCompartidos();

      await cargarModulosCompartidos();

      await cargarComponentes();

      const elementos =
        construirEstructura(
          contenidoPagina
        );

      insertarLayout(
        elementos.layout
      );

      await renderizarComponentes(
        elementos
      );

      document.body.classList.add(
        "admin-layout-cargado"
      );

      emitirEventoLayoutListo(
        elementos
      );
    } catch (error) {
      layoutInicializado =
        false;

      mostrarErrorLayout(
        error
      );
    }
  }

  /*
   * Se expone para depuración
   * y reutilización.
   */
  global.inicializarLayoutAdmin =
    inicializarLayoutAdmin;

  /*
   * Compatible con defer y con cargas
   * posteriores a DOMContentLoaded.
   */
  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      inicializarLayoutAdmin,
      {
        once: true
      }
    );
  } else {
    inicializarLayoutAdmin();
  }
})(window);