/**
 * ============================================================
 * ENCABEZADO DEL PANEL ADMINISTRATIVO
 * ------------------------------------------------------------
 * Genera el encabezado superior compartido para todas las
 * páginas privadas del panel.
 *
 * Funciones principales:
 *
 * - Mostrar el título de la página actual.
 * - Mostrar el nombre del administrador.
 * - Abrir y cerrar el menú lateral en dispositivos móviles.
 * - Contraer el menú lateral en pantallas grandes.
 *
 * Este componente es cargado por:
 * js/components/layout-admin.js
 * ============================================================
 */

(function () {
  "use strict";

  const ANCHO_MENU_MOVIL = 900;

  /**
   * Iconos SVG utilizados por el encabezado.
   */
  const iconos = {
    menu: `
      <path d="M4 6h16"></path>
      <path d="M4 12h16"></path>
      <path d="M4 18h16"></path>
    `,

    contraer: `
      <path d="M15 18l-6-6 6-6"></path>
    `,

    usuario: `
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M4 21a8 8 0 0 1 16 0"></path>
    `,

    flecha: `
      <path d="M6 9l6 6 6-6"></path>
    `
  };

  /**
   * Devuelve un icono SVG.
   *
   * @param {string} nombre
   * @param {string} clase
   * @returns {string}
   */
  function obtenerIcono(
    nombre,
    clase = "encabezado-admin__icono"
  ) {
    const contenido =
      iconos[nombre] || iconos.menu;

    return `
      <svg
        class="${clase}"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        ${contenido}
      </svg>
    `;
  }

  /**
   * Obtiene el título correspondiente a la página actual.
   *
   * Orden de búsqueda:
   *
   * 1. data-titulo-pagina del body.
   * 2. data-titulo del contenido.
   * 3. Primer h1 de la página.
   * 4. Título del documento.
   *
   * @returns {string}
   */
  function obtenerTituloPagina() {
    const tituloBody =
      document.body.dataset
        .tituloPagina;

    if (
      typeof tituloBody === "string" &&
      tituloBody.trim() !== ""
    ) {
      return tituloBody.trim();
    }

    const contenidoPagina =
      document.getElementById(
        "contenidoPagina"
      );

    const tituloContenido =
      contenidoPagina?.dataset
        ?.titulo;

    if (
      typeof tituloContenido ===
        "string" &&
      tituloContenido.trim() !== ""
    ) {
      return tituloContenido.trim();
    }

    const tituloPrincipal =
      contenidoPagina?.querySelector(
        "h1"
      );

    if (
      tituloPrincipal &&
      tituloPrincipal.textContent
        .trim() !== ""
    ) {
      return tituloPrincipal
        .textContent
        .trim();
    }

    const tituloDocumento =
      document.title
        .split("|")[0]
        .trim();

    return (
      tituloDocumento ||
      "Panel administrativo"
    );
  }

  /**
   * Obtiene la primera letra de cada parte del nombre.
   *
   * @param {string} nombre
   * @returns {string}
   */
  function obtenerIniciales(nombre) {
    if (
      typeof nombre !== "string" ||
      nombre.trim() === ""
    ) {
      return "AD";
    }

    const partes =
      nombre
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (partes.length === 1) {
      return partes[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      partes[0][0] +
      partes[partes.length - 1][0]
    ).toUpperCase();
  }

  /**
   * Normaliza los posibles formatos del administrador.
   *
   * @param {object|null} datos
   * @returns {object}
   */
  function normalizarAdministrador(
    datos
  ) {
    const administrador =
      datos?.administrador ??
      datos?.usuario ??
      datos?.datos?.administrador ??
      datos?.datos?.usuario ??
      datos ??
      {};

    const nombreCompleto =
      administrador.nombreCompleto ??
      administrador.nombre_completo ??
      administrador.nombre ??
      administrador.correo ??
      "Administrador";

    const correo =
      administrador.correo ??
      "";

    return {
      nombreCompleto:
        String(nombreCompleto).trim() ||
        "Administrador",

      correo:
        String(correo).trim()
    };
  }

  /**
   * Intenta obtener el administrador desde los módulos
   * de sesión ya cargados por el panel.
   *
   * @returns {Promise<object>}
   */
  async function obtenerAdministrador() {
    const valoresPosibles = [];

    /*
     * Posibles interfaces del módulo de sesión.
     * Se comprueban sin obligar a que exista una específica.
     */
    if (
      window.SesionAdministrador
    ) {
      const sesion =
        window.SesionAdministrador;

      const metodos = [
        "obtenerAdministrador",
        "obtenerAdministradorActual",
        "obtenerSesion",
        "obtenerSesionActual"
      ];

      for (const nombreMetodo of metodos) {
        if (
          typeof sesion[nombreMetodo] ===
          "function"
        ) {
          try {
            const resultado =
              await sesion[nombreMetodo]();

            valoresPosibles.push(
              resultado
            );
          } catch (error) {
            /*
             * El encabezado no debe impedir que cargue
             * el resto del panel.
             */
          }
        }
      }
    }

    if (
      window.sesionAdministrador
    ) {
      valoresPosibles.push(
        window.sesionAdministrador
      );
    }

    if (
      window.administradorActual
    ) {
      valoresPosibles.push(
        window.administradorActual
      );
    }

    const administradorValido =
      valoresPosibles.find(
        (valor) =>
          valor &&
          typeof valor === "object"
      );

    return normalizarAdministrador(
      administradorValido
    );
  }

  /**
   * Comprueba si la página está en resolución móvil.
   *
   * @returns {boolean}
   */
  function esVistaMovil() {
    return (
      window.innerWidth <=
      ANCHO_MENU_MOVIL
    );
  }

  /**
   * Obtiene los elementos relacionados con el menú.
   *
   * @returns {object}
   */
  function obtenerElementosMenu() {
    return {
      barraLateral:
        document.getElementById(
          "barraLateralAdmin"
        ),

      fondoMovil:
        document.getElementById(
          "fondoMenuMovil"
        )
    };
  }

  /**
   * Abre el menú lateral en dispositivos móviles.
   */
  function abrirMenuMovil() {
    const {
      barraLateral,
      fondoMovil
    } = obtenerElementosMenu();

    if (!barraLateral) {
      return;
    }

    barraLateral.classList.add(
      "barra-lateral-admin--abierta"
    );

    document.body.classList.add(
      "admin-menu-movil-abierto"
    );

    if (fondoMovil) {
      fondoMovil.hidden = false;

      fondoMovil.classList.add(
        "admin-fondo-menu-movil--visible"
      );
    }
  }

  /**
   * Cierra el menú lateral móvil.
   */
  function cerrarMenuMovil() {
    const {
      barraLateral,
      fondoMovil
    } = obtenerElementosMenu();

    barraLateral?.classList.remove(
      "barra-lateral-admin--abierta"
    );

    document.body.classList.remove(
      "admin-menu-movil-abierto"
    );

    if (fondoMovil) {
      fondoMovil.classList.remove(
        "admin-fondo-menu-movil--visible"
      );

      fondoMovil.hidden = true;
    }
  }

  /**
   * Abre o cierra el menú según el tamaño de pantalla.
   */
  function alternarMenu() {
    if (esVistaMovil()) {
      const barraLateral =
        document.getElementById(
          "barraLateralAdmin"
        );

      const estaAbierto =
        barraLateral?.classList.contains(
          "barra-lateral-admin--abierta"
        );

      if (estaAbierto) {
        cerrarMenuMovil();
      } else {
        abrirMenuMovil();
      }

      return;
    }

    /*
     * En pantallas grandes el botón contrae
     * o expande la barra lateral.
     */
    document.body.classList.toggle(
      "admin-menu-contraido"
    );

    const estaContraido =
      document.body.classList.contains(
        "admin-menu-contraido"
      );

    localStorage.setItem(
      "adminMenuContraido",
      String(estaContraido)
    );

    document.dispatchEvent(
      new CustomEvent(
        "estadoMenuAdminCambiado",
        {
          detail: {
            contraido:
              estaContraido
          }
        }
      )
    );
  }

  /**
   * Restaura el estado del menú guardado.
   */
  function restaurarEstadoMenu() {
    if (esVistaMovil()) {
      document.body.classList.remove(
        "admin-menu-contraido"
      );

      return;
    }

    const menuContraido =
      localStorage.getItem(
        "adminMenuContraido"
      ) === "true";

    document.body.classList.toggle(
      "admin-menu-contraido",
      menuContraido
    );
  }

  /**
   * Crea la parte izquierda del encabezado.
   *
   * @returns {HTMLElement}
   */
  function crearZonaIzquierda() {
    const zona =
      document.createElement("div");

    zona.className =
      "encabezado-admin__zona-izquierda";

    const botonMenu =
      document.createElement("button");

    botonMenu.type = "button";

    botonMenu.id =
      "btnAlternarMenuAdmin";

    botonMenu.className =
      "encabezado-admin__boton-menu";

    botonMenu.setAttribute(
      "aria-label",
      "Abrir o contraer el menú"
    );

    botonMenu.setAttribute(
      "aria-controls",
      "barraLateralAdmin"
    );

    botonMenu.innerHTML = `
      <span
        class="encabezado-admin__icono-menu encabezado-admin__icono-menu--movil"
      >
        ${obtenerIcono("menu")}
      </span>

      <span
        class="encabezado-admin__icono-menu encabezado-admin__icono-menu--escritorio"
      >
        ${obtenerIcono("contraer")}
      </span>
    `;

    botonMenu.addEventListener(
      "click",
      alternarMenu
    );

    const bloqueTitulo =
      document.createElement("div");

    bloqueTitulo.className =
      "encabezado-admin__bloque-titulo";

    const etiqueta =
      document.createElement("span");

    etiqueta.className =
      "encabezado-admin__etiqueta";

    etiqueta.textContent =
      "Panel administrativo";

    const titulo =
      document.createElement("h1");

    titulo.className =
      "encabezado-admin__titulo";

    titulo.id =
      "tituloPaginaAdmin";

    titulo.textContent =
      obtenerTituloPagina();

    bloqueTitulo.append(
      etiqueta,
      titulo
    );

    zona.append(
      botonMenu,
      bloqueTitulo
    );

    return zona;
  }

  /**
   * Crea el bloque visual del administrador.
   *
   * @returns {object}
   */
  function crearZonaAdministrador() {
    const zona =
      document.createElement("div");

    zona.className =
      "encabezado-admin__zona-usuario";

    const avatar =
      document.createElement("span");

    avatar.className =
      "encabezado-admin__avatar";

    avatar.id =
      "avatarAdministrador";

    avatar.textContent = "AD";

    avatar.setAttribute(
      "aria-hidden",
      "true"
    );

    const informacion =
      document.createElement("div");

    informacion.className =
      "encabezado-admin__informacion-usuario";

    const nombre =
      document.createElement("span");

    nombre.className =
      "encabezado-admin__nombre-usuario";

    nombre.id =
      "nombreAdministradorEncabezado";

    nombre.textContent =
      "Administrador";

    const rol =
      document.createElement("span");

    rol.className =
      "encabezado-admin__rol-usuario";

    rol.textContent =
      "Administrador del sistema";

    informacion.append(
      nombre,
      rol
    );

    const iconoUsuario =
      document.createElement("span");

    iconoUsuario.className =
      "encabezado-admin__usuario-icono";

    iconoUsuario.innerHTML =
      obtenerIcono(
        "usuario",
        "encabezado-admin__icono-usuario"
      );

    zona.append(
      avatar,
      informacion,
      iconoUsuario
    );

    return {
      zona,
      avatar,
      nombre
    };
  }

  /**
   * Actualiza los datos visibles del administrador.
   *
   * @param {object} elementosUsuario
   * @param {object} administrador
   */
  function actualizarAdministrador(
    elementosUsuario,
    administrador
  ) {
    const datos =
      normalizarAdministrador(
        administrador
      );

    elementosUsuario.nombre.textContent =
      datos.nombreCompleto;

    elementosUsuario.avatar.textContent =
      obtenerIniciales(
        datos.nombreCompleto
      );

    elementosUsuario.zona.title =
      datos.correo
        ? `${datos.nombreCompleto}\n${datos.correo}`
        : datos.nombreCompleto;
  }

  /**
   * Configura los eventos generales del encabezado.
   */
  function configurarEventosGenerales() {
    const fondoMovil =
      document.getElementById(
        "fondoMenuMovil"
      );

    fondoMovil?.addEventListener(
      "click",
      cerrarMenuMovil
    );

    document.addEventListener(
      "keydown",
      (evento) => {
        if (
          evento.key === "Escape"
        ) {
          cerrarMenuMovil();
        }
      }
    );

    /*
     * Al entrar a una opción se cierra el menú móvil.
     */
    document
      .getElementById(
        "barraLateralAdmin"
      )
      ?.addEventListener(
        "click",
        (evento) => {
          const enlace =
            evento.target.closest(
              "a"
            );

          if (
            enlace &&
            esVistaMovil()
          ) {
            cerrarMenuMovil();
          }
        }
      );

    window.addEventListener(
      "resize",
      () => {
        if (!esVistaMovil()) {
          cerrarMenuMovil();
          restaurarEstadoMenu();
        } else {
          document.body.classList.remove(
            "admin-menu-contraido"
          );
        }
      }
    );
  }

  /**
   * Renderiza el encabezado administrativo.
   *
   * @param {HTMLElement} contenedor
   * @returns {Promise<void>}
   */
  async function renderizarEncabezadoAdmin(
    contenedor
  ) {
    if (
      !(contenedor instanceof HTMLElement)
    ) {
      throw new Error(
        "El contenedor del encabezado no es válido."
      );
    }

    contenedor.innerHTML = "";

    contenedor.classList.add(
      "encabezado-admin"
    );

    const zonaIzquierda =
      crearZonaIzquierda();

    const elementosUsuario =
      crearZonaAdministrador();

    contenedor.append(
      zonaIzquierda,
      elementosUsuario.zona
    );

    restaurarEstadoMenu();
    configurarEventosGenerales();

    const administrador =
      await obtenerAdministrador();

    actualizarAdministrador(
      elementosUsuario,
      administrador
    );

    /*
     * Permite actualizar el encabezado cuando el módulo
     * de sesión cargue los datos del administrador.
     */
    document.addEventListener(
      "sesionAdministradorCargada",
      (evento) => {
        actualizarAdministrador(
          elementosUsuario,
          evento.detail
        );
      }
    );

    document.addEventListener(
      "administradorActualizado",
      (evento) => {
        actualizarAdministrador(
          elementosUsuario,
          evento.detail
        );
      }
    );
  }

  window.renderizarEncabezadoAdmin =
    renderizarEncabezadoAdmin;
})();