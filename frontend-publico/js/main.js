/* ============================================================
   MAIN.JS - LICEO HERNÁN VARGAS RAMÍREZ
   ------------------------------------------------------------
   Funciones generales del sitio:

   1. Datos estáticos de respaldo del colegio.
   2. Inserción del encabezado compartido.
   3. Inserción del pie de página compartido.
   4. Menú móvil tipo hamburguesa.
   5. Datos básicos de respaldo.
   6. Lightbox de galería.
   7. Carga de configuración pública desde la API.

   IMPORTANTE:
   Los datos administrados desde el panel tienen prioridad.

   Si la API no está disponible, se conservan los datos
   estáticos definidos aquí y en los HTML.
   ============================================================ */


/* ============================================================
   1. DATOS ESTÁTICOS DE RESPALDO
   ============================================================ */

/*
 * Punto unico de configuracion para todos los modulos publicos.
 * En produccion puede definirse window.API_PUBLICA_URL antes de
 * cargar main.js; en desarrollo se conserva la API local.
 */
window.API_PUBLICA_URL = String(
  window.API_PUBLICA_URL || "http://127.0.0.1:3001/api"
).replace(/\/+$/, "");

const DATOS_COLEGIO = {
  nombre:
    "Liceo Hernán Vargas Ramírez",

  siglas:
    "LHVR",

  lema:
    "Formación integral con valores, conocimiento y comunidad.",

  direccion:
    "Calle 3, Juan Viñas, Jiménez, Cartago, Costa Rica. 120 metros este de la Parroquia de Juan Viñas, frente al supermercado La Canasta.",

  telefono:
    "2532-2274 / 8644-6240",

  correo:
    "lic.hernanvargasramirez@mep.go.cr",

  maps:
    "https://maps.app.goo.gl/haUwDr5NaYrQTdSYA",

  facebook:
    "https://www.facebook.com/liceohernanvargasramirez/?locale=es_LA",

  horario:
    "Lunes a viernes, 7:00 a.m. - 4:10 p.m."
};


/* ============================================================
   MENÚ PRINCIPAL
   ============================================================ */

const MENU = [
  {
    etiqueta: "Inicio",
    ruta: "index.html",
    id: "inicio"
  },
  {
    etiqueta: "Nosotros",
    ruta: "pages/nosotros.html",
    id: "nosotros"
  },
  {
    etiqueta: "Oferta académica",
    ruta: "pages/oferta-academica.html",
    id: "oferta"
  },
  {
    etiqueta: "Boletines",
    ruta: "pages/boletines.html",
    id: "boletines"
  },
  {
    etiqueta: "Calendario",
    ruta: "pages/calendario.html",
    id: "calendario"
  },
  {
    etiqueta: "Biblioteca",
    ruta: "pages/biblioteca-recursos.html",
    id: "biblioteca"
  },
  {
    etiqueta: "Docentes",
    ruta: "pages/directorio-docente.html",
    id: "docentes"
  },
  {
    etiqueta: "Horarios y tramites",
    ruta: "pages/documentos-importantes.html",
    id: "documentos"
  },
  {
    etiqueta: "Recursos de apoyo",
    ruta: "pages/enlaces-interes.html",
    id: "enlaces"
  },
  {
    etiqueta: "Comunidad",
    ruta: "pages/comunidad.html",
    id: "comunidad"
  },
  {
    etiqueta: "Galería",
    ruta: "pages/galeria.html",
    id: "galeria"
  },
  {
    etiqueta: "Contacto",
    ruta: "pages/contacto-ubicacion.html",
    id: "contacto"
  }
];


/* ============================================================
   RUTAS
   ============================================================ */

function obtenerBase() {
  return window.location.pathname.includes(
    "/pages/"
  )
    ? "../"
    : "";
}


/* ============================================================
   2. ENCABEZADO / MENÚ
   ============================================================ */

function construirEncabezado() {
  const base =
    obtenerBase();

  const paginaActual =
    document.body.dataset.pagina ||
    "inicio";

  const enlaces =
    MENU
      .map(
        (item) => {
          const activo =
            item.id === paginaActual
              ? " activo"
              : "";

          return `
            <li>
              <a
                class="menu__enlace${activo}"
                href="${base}${item.ruta}"
              >
                ${item.etiqueta}
              </a>
            </li>
          `;
        }
      )
      .join("");

  const html = `
    <header class="encabezado">
      <div class="barra">

        <a
          class="marca"
          href="${base}index.html"
          aria-label="Ir al inicio"
        >
          <img
            class="marca__logo"
            src="${base}assets/logos/logo-liceo.jpg"
            alt="Logo del ${DATOS_COLEGIO.nombre}"
          >

          <span class="marca__texto">
            <span class="marca__nombre">
              ${DATOS_COLEGIO.siglas}
            </span>

            <span class="marca__lema">
              ${DATOS_COLEGIO.nombre}
            </span>
          </span>
        </a>

        <button
          class="boton-menu"
          id="botonMenu"
          aria-label="Abrir menú"
          aria-expanded="false"
          aria-controls="menuPrincipal"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav aria-label="Menú principal">
          <ul
          class="menu"
          id="menuPrincipal"
      >
        ${enlaces}

        <li class="menu__item-admin">
          <a
            class="menu__enlace menu__enlace--admin"
            href="${base}../panel-administrativo/pages/autenticacion/iniciar-sesion.html"
            aria-label="Acceder al panel administrativo"
          >
            <svg
              class="menu__icono-admin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect
                x="5"
                y="11"
                width="14"
                height="10"
                rx="2"
              ></rect>

              <path
                d="M8 11V7a4 4 0 0 1 8 0v4"
              ></path>
            </svg>

            <span>Admin</span>
          </a>
        </li>
      </ul>
        </nav>

      </div>
    </header>
  `;

  const contenedor =
    document.getElementById(
      "encabezado"
    );

  if (contenedor) {
    contenedor.innerHTML =
      html;
  }
}


/* ============================================================
   3. PIE DE PÁGINA
   ============================================================ */

function construirPie() {
  const base =
    obtenerBase();

  const anio =
    new Date().getFullYear();

  const enlacesRapidos =
    MENU
      .slice(
        0,
        6
      )
      .map(
        (item) => `
          <li>
            <a href="${base}${item.ruta}">
              ${item.etiqueta}
            </a>
          </li>
        `
      )
      .join("");

  const html = `
    <footer class="pie">
      <div class="contenedor">

        <div class="pie__grid">

          <div class="pie__marca">
            <img
              class="pie__logo"
              src="${base}assets/logos/logo-liceo.jpg"
              alt="Logo del ${DATOS_COLEGIO.nombre}"
            >

            <div>
              <h3 class="pie__nombre">
                ${DATOS_COLEGIO.nombre}
              </h3>

              <p class="pie__texto">
                ${DATOS_COLEGIO.lema}
              </p>
            </div>
          </div>

          <div>
            <h4>
              Enlaces rápidos
            </h4>

            <ul class="pie__lista">
              ${enlacesRapidos}
            </ul>
          </div>

          <div>
            <h4>
              Contacto
            </h4>

            <ul class="pie__lista">

              <li>
                ${DATOS_COLEGIO.direccion}
              </li>

              <li>
                Tel: ${DATOS_COLEGIO.telefono}
              </li>

              <li>
                Correo:
                <a
                  class="pie__enlace-contacto"
                  href="mailto:${DATOS_COLEGIO.correo}"
                >
                  ${DATOS_COLEGIO.correo}
                </a>
              </li>

              <li>
                ${DATOS_COLEGIO.horario}
              </li>

              <li>
                Visite nuestro
                <a
                  class="pie__link-social"
                  href="${DATOS_COLEGIO.facebook}"
                  target="_blank"
                  rel="noopener"
                >
                  Facebook oficial aquí
                </a>.
              </li>

            </ul>
          </div>

        </div>

        <div class="pie__base">
          <p>
            &copy; ${anio} ${DATOS_COLEGIO.nombre}.
            Todos los derechos reservados.
          </p>
        </div>

      </div>
    </footer>
  `;

  const contenedor =
    document.getElementById(
      "pie"
    );

  if (contenedor) {
    contenedor.innerHTML =
      html;
  }
}


/* ============================================================
   4. MENÚ MÓVIL
   ============================================================ */

function activarMenuMovil() {
  const boton =
    document.getElementById(
      "botonMenu"
    );

  const menu =
    document.getElementById(
      "menuPrincipal"
    );

  if (
    !boton ||
    !menu
  ) {
    return;
  }

  boton.addEventListener(
    "click",
    () => {
      const abierto =
        menu.classList.toggle(
          "abierto"
        );

      boton.classList.toggle(
        "activo",
        abierto
      );

      boton.setAttribute(
        "aria-expanded",
        abierto
          ? "true"
          : "false"
      );

      boton.setAttribute(
        "aria-label",
        abierto
          ? "Cerrar menú"
          : "Abrir menú"
      );
    }
  );

  /*
   * Cerrar el menú cuando se selecciona
   * una opción en dispositivos móviles.
   */
  menu
    .querySelectorAll(
      "a"
    )
    .forEach(
      (enlace) => {
        enlace.addEventListener(
          "click",
          () => {
            menu.classList.remove(
              "abierto"
            );

            boton.classList.remove(
              "activo"
            );

            boton.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        );
      }
    );
}


/* ============================================================
   5. DATOS ESTÁTICOS DE RESPALDO
   ============================================================ */

function rellenarDatos() {
  document
    .querySelectorAll(
      "[data-dato]"
    )
    .forEach(
      (elemento) => {
        const clave =
          elemento.dataset.dato;

        if (
          DATOS_COLEGIO[clave]
        ) {
          elemento.textContent =
            DATOS_COLEGIO[clave];
        }
      }
    );
}


function rellenarLinks() {
  document
    .querySelectorAll(
      "[data-dato-link]"
    )
    .forEach(
      (elemento) => {
        const clave =
          elemento.dataset
            .datoLink;

        if (
          DATOS_COLEGIO[clave]
        ) {
          elemento.href =
            DATOS_COLEGIO[clave];
        }
      }
    );
}


/* ============================================================
   6. LIGHTBOX DE GALERÍA
   ============================================================ */

function activarLightboxGaleria() {
  const lightbox =
    document.getElementById(
      "lightboxGaleria"
    );

  const imagenGrande =
    document.getElementById(
      "lightboxImagen"
    );

  const tituloImagen =
    document.getElementById(
      "lightboxTitulo"
    );

  const botonCerrar =
    document.getElementById(
      "cerrarLightbox"
    );

  const imagenesGaleria =
    document.querySelectorAll(
      ".galeria__item img"
    );

  if (
    !lightbox ||
    !imagenGrande ||
    !tituloImagen ||
    !botonCerrar ||
    imagenesGaleria.length === 0
  ) {
    return;
  }

  function abrirLightbox(
    imagen
  ) {
    const item =
      imagen.closest(
        ".galeria__item"
      );

    const pie =
      item
        ? item.querySelector(
            ".galeria__pie"
          )
        : null;

    imagenGrande.src =
      imagen.src;

    imagenGrande.alt =
      imagen.alt ||
      "Imagen de la galería";

    tituloImagen.textContent =
      pie
        ? pie.textContent.trim()
        : imagen.alt;

    lightbox.classList.add(
      "lightbox--activo"
    );

    lightbox.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "sin-scroll"
    );

    botonCerrar.focus();
  }


  function cerrarLightbox() {
    lightbox.classList.remove(
      "lightbox--activo"
    );

    lightbox.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "sin-scroll"
    );

    imagenGrande.src =
      "";

    imagenGrande.alt =
      "";

    tituloImagen.textContent =
      "";
  }


  imagenesGaleria.forEach(
    (imagen) => {
      const item =
        imagen.closest(
          ".galeria__item"
        );

      if (!item) {
        return;
      }

      if (item.dataset.lightboxActivo === "true") {
        return;
      }

      item.dataset.lightboxActivo = "true";

      item.setAttribute(
        "tabindex",
        "0"
      );

      item.setAttribute(
        "role",
        "button"
      );

      item.setAttribute(
        "aria-label",
        "Abrir imagen de galería"
      );

      item.addEventListener(
        "click",
        () => {
          abrirLightbox(
            imagen
          );
        }
      );

      item.addEventListener(
        "keydown",
        (evento) => {
          if (
            evento.key ===
              "Enter" ||
            evento.key ===
              " "
          ) {
            evento.preventDefault();

            abrirLightbox(
              imagen
            );
          }
        }
      );
    }
  );


  if (lightbox.dataset.eventosActivos !== "true") {
    lightbox.dataset.eventosActivos = "true";

    botonCerrar.addEventListener(
      "click",
      cerrarLightbox
    );


    lightbox.addEventListener(
      "click",
      (evento) => {
        if (
          evento.target ===
          lightbox
        ) {
          cerrarLightbox();
        }
      }
    );


    document.addEventListener(
      "keydown",
      (evento) => {
        if (
          evento.key ===
            "Escape" &&
          lightbox.classList.contains(
            "lightbox--activo"
          )
        ) {
          cerrarLightbox();
        }
      }
    );
  }
}


/* ============================================================
   7. CONFIGURACIÓN PÚBLICA DESDE LA API
   ============================================================ */

function cargarConfiguracionPublica() {
  /*
   * Si ya fue cargado por otro archivo,
   * simplemente vuelve a solicitar la configuración.
   */
  if (
    window.CONFIGURACION_PUBLICA_API &&
    typeof window
      .CONFIGURACION_PUBLICA_API
      .cargar === "function"
  ) {
    window
      .CONFIGURACION_PUBLICA_API
      .cargar();

    return;
  }

  /*
   * Evita insertar el mismo script más de una vez.
   */
  if (
    document.getElementById(
      "scriptConfiguracionPublica"
    )
  ) {
    return;
  }

  const base =
    obtenerBase();

  const script =
    document.createElement(
      "script"
    );

  script.id =
    "scriptConfiguracionPublica";

  script.src =
    `${base}js/configuracion-publica.js`;

  /*
   * main.js se ejecuta cuando el DOM ya está listo.
   * Por eso, después de cargar el archivo,
   * llamamos directamente a cargar().
   */
  script.addEventListener(
    "load",
    () => {
      if (
        window.CONFIGURACION_PUBLICA_API &&
        typeof window
          .CONFIGURACION_PUBLICA_API
          .cargar === "function"
      ) {
        window
          .CONFIGURACION_PUBLICA_API
          .cargar();
      }
    }
  );

  /*
   * Si el archivo no puede cargarse,
   * simplemente se mantienen los datos estáticos.
   */
  script.addEventListener(
    "error",
    () => {
      console.warn(
        "No fue posible cargar configuracion-publica.js. " +
        "Se utilizarán los datos estáticos del sitio."
      );
    }
  );

  document.head.appendChild(
    script
  );
}


/* ============================================================
   8. CHAT PÚBLICO REUTILIZABLE
   ============================================================ */

function cargarChatPublico() {
  const base = obtenerBase();

  if (!document.getElementById("estilosChatPublico")) {
    const estilos = document.createElement("link");
    estilos.id = "estilosChatPublico";
    estilos.rel = "stylesheet";
    estilos.href = `${base}css/chat-publico.css?v=20260820-1`;
    document.head.appendChild(estilos);
  }

  if (window.CHAT_PUBLICO_LHVR?.iniciar) {
    window.CHAT_PUBLICO_LHVR.iniciar();
    return;
  }

  if (document.getElementById("scriptChatPublico")) {
    return;
  }

  const script = document.createElement("script");
  script.id = "scriptChatPublico";
  script.src = `${base}js/chat-publico.js?v=20260820-2`;
  script.addEventListener("load", () => {
    window.CHAT_PUBLICO_LHVR?.iniciar?.();
  });
  document.body.appendChild(script);
}


/* ============================================================
   INICIO
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    /*
     * Primero se construyen los componentes visuales
     * utilizando los datos estáticos de respaldo.
     */
    construirEncabezado();

    construirPie();

    activarMenuMovil();

    rellenarDatos();

    rellenarLinks();

    activarLightboxGaleria();

    /*
     * Al final se consulta la configuración administrada.
     *
     * Si responde correctamente, reemplaza los datos
     * estáticos por los valores de configuracion_sitio.
     */
    cargarConfiguracionPublica();

    cargarChatPublico();
  }
);
