/**
 * ============================================================
 * BARRA LATERAL DEL PANEL ADMINISTRATIVO
 * Liceo Hernán Vargas Ramírez
 * ------------------------------------------------------------
 * Genera el menú estático compartido para todas las páginas
 * privadas del panel administrativo.
 *
 * Este componente es cargado por:
 * js/components/layout-admin.js
 * ============================================================
 */

(function () {
  "use strict";

  /**
   * Menú principal del panel.
   *
   * Las rutas corresponden con la estructura real de:
   * panel-administrativo/pages
   */
  const opcionesMenu = [
    {
      id: "dashboard",
      texto: "Dashboard",
      icono: "dashboard",
      ruta: "pages/dashboard/dashboard.html"
    },

    {
      id: "paginas",
      texto: "Gestión de páginas",
      icono: "paginas",
      carpetaActiva:
        "pages/paginas-contenido/",

      subopciones: [
        {
          id: "pagina-inicio",
          texto: "Inicio",
          ruta:
            "pages/paginas-contenido/editar-secciones.html?pagina=inicio"
        },
        {
          id: "pagina-nosotros",
          texto: "Nosotros",
          ruta:
            "pages/paginas-contenido/editar-secciones.html?pagina=nosotros"
        },
        {
          id: "pagina-oferta-academica",
          texto: "Oferta académica",
          ruta:
            "pages/oferta-academica/lista-materias.html",
          rutasActivas: [
            "pages/oferta-academica/lista-materias.html",
            "pages/oferta-academica/formulario-materia.html",
            "pages/oferta-academica/ciclos-educativos.html"
          ]
        },
        {
          id: "pagina-comunidad",
          texto: "Comunidad",
          ruta:
            "pages/comunidad/comunidad.html"
        },
        {
          id: "pagina-contacto",
          texto: "Contacto",
          ruta:
             "pages/paginas-contenido/editar-secciones.html?pagina=contacto"
        },
        {
          id: "mensajes-contacto",
          texto: "Mensajes de contacto",
          ruta:
             "pages/contacto/lista-mensajes.html"
        }
      ]
    },

    {
      id: "boletines",
      texto: "Gestión de boletines",
      icono: "boletines",
      ruta:
        "pages/gestion-contenido/gestionar.html?modulo=boletines"
    },

    {
      id: "calendario",
      texto: "Gestión de calendario",
      icono: "calendario",
      ruta:
        "pages/gestion-contenido/gestionar.html?modulo=calendario"
    },

    {
      id: "biblioteca",
      texto: "Biblioteca BiblioCRA",
      icono: "biblioteca",
      carpetaActiva:
        "pages/biblioteca/",
      subopciones: [
        {
          id: "biblioteca-contenido",
          texto: "Gestión de biblioteca",
          ruta:
            "pages/gestion-contenido/gestionar.html?modulo=biblioteca",
          rutasActivas: [
            "pages/gestion-contenido/gestionar.html?modulo=biblioteca"
          ]
        },
        {
          id: "biblioteca-solicitudes",
          texto: "Solicitudes BiblioCRA",
          ruta:
            "pages/biblioteca/solicitudes-bibliocra.html",
          rutasActivas: [
            "pages/biblioteca/solicitudes-bibliocra.html"
          ]
        }
      ]
    },

    {
      id: "docentes",
      texto: "Gestión de docentes",
      icono: "docentes",
      ruta:
        "pages/gestion-contenido/gestionar.html?modulo=docentes"
    },

    {
      id: "horarios-tramites",
      texto: "Gestión de horarios y trámites",
      icono: "horarios",
      subopciones: [
        {
          id: "horarios",
          texto: "Horarios",
          ruta:
            "pages/gestion-contenido/gestionar.html?modulo=horarios"
        },
        {
          id: "tramites",
          texto: "Trámites",
          ruta:
            "pages/gestion-contenido/gestionar.html?modulo=tramites"
        }
      ]
    },

    {
      id: "recursos-apoyo",
      texto: "Gestión de recursos de apoyo",
      icono: "recursos",
      ruta:
        "pages/gestion-contenido/gestionar.html?modulo=recursos-apoyo"
    },

    {
      id: "galeria",
      texto: "Gestión de galería",
      icono: "galeria",
      ruta:
        "pages/gestion-contenido/gestionar.html?modulo=galeria"
    },

    {
      id: "administradores",
      texto: "Gestión de administradores",
      icono: "administradores",
      ruta:
        "pages/administradores/lista-administradores.html",
      carpetaActiva:
        "pages/administradores/"
    },

    {
      id: "auditoria",
      texto: "Auditoría de cambios",
      icono: "auditoria",
      ruta:
        "pages/auditoria/historial-auditoria.html",
      carpetaActiva:
        "pages/auditoria/"
    },

    {
      id: "configuracion",
      texto: "Configuración general",
      icono: "configuracion",
      ruta:
        "pages/configuracion-sitio/configuracion-sitio.html",
      carpetaActiva:
        "pages/configuracion-sitio/"
    }
  ];

  /**
   * Iconos SVG del menú.
   */
  const iconos = {
    dashboard: `
      <rect x="3" y="3" width="7" height="7" rx="1"></rect>
      <rect x="14" y="3" width="7" height="7" rx="1"></rect>
      <rect x="3" y="14" width="7" height="7" rx="1"></rect>
      <rect x="14" y="14" width="7" height="7" rx="1"></rect>
    `,

    paginas: `
      <path d="M4 4h16v16H4z"></path>
      <path d="M4 9h16"></path>
      <path d="M9 9v11"></path>
    `,

    boletines: `
      <path d="M4 5h16v14H4z"></path>
      <path d="M8 9h8"></path>
      <path d="M8 13h8"></path>
      <path d="M8 17h5"></path>
    `,

    calendario: `
      <rect x="3" y="5" width="18" height="16" rx="2"></rect>
      <path d="M16 3v4"></path>
      <path d="M8 3v4"></path>
      <path d="M3 10h18"></path>
    `,

    biblioteca: `
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    `,

    docentes: `
      <circle cx="12" cy="7" r="4"></circle>
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path>
    `,

    horarios: `
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 7v5l3 2"></path>
    `,

    recursos: `
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"></path>
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"></path>
    `,

    galeria: `
      <rect x="3" y="4" width="18" height="16" rx="2"></rect>
      <circle cx="8.5" cy="9" r="1.5"></circle>
      <path d="M21 15l-5-5L5 20"></path>
    `,

    consulta: `
      <circle cx="11" cy="11" r="7"></circle>
      <path d="M20 20l-4-4"></path>
      <path d="M8 11h6"></path>
      <path d="M11 8v6"></path>
    `,

    calificaciones: `
      <path d="M4 19h16"></path>
      <path d="M7 16V9"></path>
      <path d="M12 16V5"></path>
      <path d="M17 16v-4"></path>
    `,

    administradores: `
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M19 8v6"></path>
      <path d="M22 11h-6"></path>
    `,

    auditoria: `
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="M9 12l2 2 4-4"></path>
    `,

    configuracion: `
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1z"></path>
    `,

    salir: `
      <path d="M10 17l5-5-5-5"></path>
      <path d="M15 12H3"></path>
      <path d="M15 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5"></path>
    `,

    flecha: `
      <path d="M9 18l6-6-6-6"></path>
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
    clase = "menu-admin__icono"
  ) {
    const contenido =
      iconos[nombre] ||
      iconos.paginas;

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
   * Construye una ruta absoluta desde la raíz
   * del panel administrativo.
   *
   * @param {string} rutaRelativa
   * @returns {string}
   */
  function obtenerRuta(rutaRelativa) {
    if (
      window.AdminLayout &&
      typeof window.AdminLayout
        .obtenerRutaPanel === "function"
    ) {
      return window.AdminLayout
        .obtenerRutaPanel(
          rutaRelativa
        );
    }

    return rutaRelativa;
  }

  /**
   * Convierte una ruta en un objeto URL.
   *
   * @param {string} ruta
   * @returns {URL|null}
   */
  function obtenerUrl(ruta) {
    try {
      return new URL(
        obtenerRuta(ruta),
        window.location.href
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Normaliza el pathname de una URL.
   *
   * @param {string} pathname
   * @returns {string}
   */
  function normalizarPathname(
    pathname
  ) {
    try {
      return decodeURIComponent(
        pathname
      )
        .replace(/\\/g, "/")
        .replace(/\/+/g, "/")
        .toLowerCase();
    } catch (error) {
      return String(pathname)
        .replace(/\\/g, "/")
        .replace(/\/+/g, "/")
        .toLowerCase();
    }
  }

  /**
   * Comprueba si una ruta concreta corresponde
   * con la página actual.
   *
   * Cuando la ruta contiene parámetros de consulta,
   * también se comparan esos parámetros.
   *
   * @param {string} rutaRelativa
   * @returns {boolean}
   */
  function rutaEstaActiva(
    rutaRelativa
  ) {
    const urlActual =
      new URL(
        window.location.href
      );

    const urlOpcion =
      obtenerUrl(rutaRelativa);

    if (!urlOpcion) {
      return false;
    }

    const mismaPagina =
      normalizarPathname(
        urlActual.pathname
      ) ===
      normalizarPathname(
        urlOpcion.pathname
      );

    if (!mismaPagina) {
      return false;
    }

    if (
      rutaRelativa.includes("?")
    ) {
      return (
        urlActual.searchParams
          .toString() ===
        urlOpcion.searchParams
          .toString()
      );
    }

    return true;
  }

  /**
   * Comprueba si la página actual pertenece
   * a una carpeta concreta.
   *
   * @param {string} carpetaRelativa
   * @returns {boolean}
   */
  function carpetaEstaActiva(
    carpetaRelativa
  ) {
    const urlActual =
      new URL(
        window.location.href
      );

    const urlCarpeta =
      obtenerUrl(
        carpetaRelativa
      );

    if (!urlCarpeta) {
      return false;
    }

    const rutaActual =
      normalizarPathname(
        urlActual.pathname
      );

    let rutaCarpeta =
      normalizarPathname(
        urlCarpeta.pathname
      );

    if (
      !rutaCarpeta.endsWith("/")
    ) {
      rutaCarpeta += "/";
    }

    return rutaActual.startsWith(
      rutaCarpeta
    );
  }

  /**
   * Comprueba si una opción del menú
   * corresponde con la página actual.
   *
   * @param {object} opcion
   * @returns {boolean}
   */
  function opcionEstaActiva(
    opcion
  ) {
    if (
      Array.isArray(
        opcion.rutasActivas
      ) &&
      opcion.rutasActivas.some(
        rutaEstaActiva
      )
    ) {
      return true;
    }

    if (
      opcion.carpetaActiva &&
      carpetaEstaActiva(
        opcion.carpetaActiva
      )
    ) {
      return true;
    }

    if (opcion.ruta) {
      return rutaEstaActiva(
        opcion.ruta
      );
    }

    return false;
  }

  /**
   * Comprueba si un menú desplegable
   * debe aparecer abierto.
   *
   * @param {object} opcion
   * @returns {boolean}
   */
  function submenuEstaActivo(
    opcion
  ) {
    if (
      opcionEstaActiva(opcion)
    ) {
      return true;
    }

    return opcion.subopciones
      .some(opcionEstaActiva);
  }

  /**
   * Crea una opción sencilla.
   *
   * @param {object} opcion
   * @returns {HTMLLIElement}
   */
  function crearOpcionSimple(
    opcion
  ) {
    const elemento =
      document.createElement("li");

    elemento.className =
      "menu-admin__elemento";

    const enlace =
      document.createElement("a");

    enlace.className =
      "menu-admin__enlace";

    enlace.href =
      obtenerRuta(opcion.ruta);

    enlace.dataset.menuId =
      opcion.id;

    enlace.innerHTML = `
      ${obtenerIcono(opcion.icono)}

      <span class="menu-admin__texto">
        ${opcion.texto}
      </span>
    `;

    if (
      opcionEstaActiva(opcion)
    ) {
      enlace.classList.add(
        "menu-admin__enlace--activo"
      );

      enlace.setAttribute(
        "aria-current",
        "page"
      );
    }

    elemento.appendChild(
      enlace
    );

    return elemento;
  }

  /**
   * Crea una subopción.
   *
   * @param {object} subopcion
   * @returns {HTMLLIElement}
   */
  function crearSubopcion(
    subopcion
  ) {
    const elemento =
      document.createElement("li");

    elemento.className =
      "submenu-admin__elemento";

    const enlace =
      document.createElement("a");

    enlace.className =
      "submenu-admin__enlace";

    enlace.href =
      obtenerRuta(
        subopcion.ruta
      );

    enlace.dataset.menuId =
      subopcion.id;

    enlace.innerHTML = `
      <span
        class="submenu-admin__indicador"
        aria-hidden="true"
      ></span>

      <span class="submenu-admin__texto">
        ${subopcion.texto}
      </span>
    `;

    if (
      opcionEstaActiva(
        subopcion
      )
    ) {
      enlace.classList.add(
        "submenu-admin__enlace--activo"
      );

      enlace.setAttribute(
        "aria-current",
        "page"
      );
    }

    elemento.appendChild(
      enlace
    );

    return elemento;
  }

  /**
   * Cierra los submenús distintos
   * al que se está abriendo.
   *
   * @param {HTMLElement} submenuActual
   */
  function cerrarOtrosSubmenus(
    submenuActual
  ) {
    document
      .querySelectorAll(
        ".submenu-admin"
      )
      .forEach((submenu) => {
        if (
          submenu ===
            submenuActual ||
          submenu.hidden
        ) {
          return;
        }

        submenu.hidden = true;

        const boton =
          document.querySelector(
            `[aria-controls="${submenu.id}"]`
          );

        if (!boton) {
          return;
        }

        boton.setAttribute(
          "aria-expanded",
          "false"
        );

        boton.classList.remove(
          "menu-admin__boton--abierto"
        );
      });
  }

  /**
   * Crea una opción con submenú.
   *
   * @param {object} opcion
   * @returns {HTMLLIElement}
   */
  function crearOpcionConSubmenu(
    opcion
  ) {
    const elemento =
      document.createElement("li");

    elemento.className =
      "menu-admin__elemento menu-admin__elemento--submenu";

    const submenuActivo =
      submenuEstaActivo(
        opcion
      );

    const idSubmenu =
      `submenuAdmin-${opcion.id}`;

    const boton =
      document.createElement("button");

    boton.type = "button";

    boton.className =
      "menu-admin__boton";

    boton.dataset.menuId =
      opcion.id;

    boton.setAttribute(
      "aria-controls",
      idSubmenu
    );

    boton.setAttribute(
      "aria-expanded",
      String(submenuActivo)
    );

    boton.innerHTML = `
      ${obtenerIcono(opcion.icono)}

      <span class="menu-admin__texto">
        ${opcion.texto}
      </span>

      ${obtenerIcono(
        "flecha",
        "menu-admin__flecha"
      )}
    `;

    const submenu =
      document.createElement("ul");

    submenu.className =
      "submenu-admin";

    submenu.id =
      idSubmenu;

    submenu.hidden =
      !submenuActivo;

    opcion.subopciones.forEach(
      (subopcion) => {
        submenu.appendChild(
          crearSubopcion(
            subopcion
          )
        );
      }
    );

    if (submenuActivo) {
      boton.classList.add(
        "menu-admin__boton--abierto",
        "menu-admin__boton--activo"
      );
    }

    boton.addEventListener(
      "click",
      () => {
        const seAbrira =
          submenu.hidden;

        if (seAbrira) {
          cerrarOtrosSubmenus(
            submenu
          );
        }

        submenu.hidden =
          !seAbrira;

        boton.setAttribute(
          "aria-expanded",
          String(seAbrira)
        );

        boton.classList.toggle(
          "menu-admin__boton--abierto",
          seAbrira
        );
      }
    );

    elemento.append(
      boton,
      submenu
    );

    return elemento;
  }

  /**
   * Crea la identidad institucional.
   *
   * @returns {HTMLElement}
   */
  function crearMarcaInstitucional() {
    const contenedor =
      document.createElement("div");

    contenedor.className =
      "barra-lateral-admin__marca";

    const enlace =
      document.createElement("a");

    enlace.className =
      "barra-lateral-admin__marca-enlace";

    enlace.href =
      obtenerRuta(
        "pages/dashboard/dashboard.html"
      );

    enlace.setAttribute(
      "aria-label",
      "Ir al dashboard"
    );

    const logo =
      obtenerRuta(
        "assets/logos/logo-liceo.jpg"
      );

    enlace.innerHTML = `
      <img
        class="barra-lateral-admin__logo"
        src="${logo}"
        alt="Logo del Liceo Hernán Vargas Ramírez"
      >

      <div class="barra-lateral-admin__identidad">
        <span class="barra-lateral-admin__siglas">
          LHVR
        </span>

        <span class="barra-lateral-admin__nombre">
          Panel administrativo
        </span>
      </div>
    `;

    contenedor.appendChild(
      enlace
    );

    return contenedor;
  }

  /**
   * Crea la navegación principal.
   *
   * @returns {HTMLElement}
   */
  function crearNavegacion() {
    const navegacion =
      document.createElement("nav");

    navegacion.className =
      "barra-lateral-admin__navegacion";

    navegacion.setAttribute(
      "aria-label",
      "Navegación del panel administrativo"
    );

    const titulo =
      document.createElement("p");

    titulo.className =
      "barra-lateral-admin__titulo-menu";

    titulo.textContent =
      "Menú principal";

    const lista =
      document.createElement("ul");

    lista.className =
      "menu-admin";

    opcionesMenu.forEach(
      (opcion) => {
        const elemento =
          Array.isArray(
            opcion.subopciones
          )
            ? crearOpcionConSubmenu(
                opcion
              )
            : crearOpcionSimple(
                opcion
              );

        lista.appendChild(
          elemento
        );
      }
    );

    navegacion.append(
      titulo,
      lista
    );

    return navegacion;
  }

  /**
   * Crea el pie de la barra lateral.
   *
   * @returns {HTMLElement}
   */
  function crearPieBarraLateral() {
    const pie =
      document.createElement("footer");

    pie.className =
      "barra-lateral-admin__pie";

    const botonCerrarSesion =
      document.createElement("button");

    botonCerrarSesion.type =
      "button";

    botonCerrarSesion.id =
      "btnCerrarSesionAdmin";

    botonCerrarSesion.className =
      "barra-lateral-admin__cerrar-sesion";

    botonCerrarSesion.innerHTML = `
      ${obtenerIcono(
        "salir",
        "barra-lateral-admin__cerrar-icono"
      )}

      <span>
        Cerrar sesión
      </span>
    `;

    botonCerrarSesion.addEventListener(
      "click",
      () => {
        document.dispatchEvent(
          new CustomEvent(
            "cerrarSesionAdminSolicitada"
          )
        );
      }
    );

    const institucion =
      document.createElement("p");

    institucion.className =
      "barra-lateral-admin__institucion";

    institucion.textContent =
      "Liceo Hernán Vargas Ramírez";

    pie.append(
      botonCerrarSesion,
      institucion
    );

    return pie;
  }

  /**
   * Renderiza la barra lateral.
   *
   * @param {HTMLElement} contenedor
   * @returns {Promise<void>}
   */
  async function renderizarBarraLateralAdmin(
    contenedor
  ) {
    if (
      !(
        contenedor instanceof
        HTMLElement
      )
    ) {
      throw new Error(
        "El contenedor de la barra lateral no es válido."
      );
    }

    contenedor.innerHTML = "";

    contenedor.classList.add(
      "barra-lateral-admin"
    );

    const contenido =
      document.createElement("div");

    contenido.className =
      "barra-lateral-admin__contenido";

    contenido.append(
      crearMarcaInstitucional(),
      crearNavegacion()
    );

    contenedor.append(
      contenido,
      crearPieBarraLateral()
    );
  }

  window.renderizarBarraLateralAdmin =
    renderizarBarraLateralAdmin;
})();
