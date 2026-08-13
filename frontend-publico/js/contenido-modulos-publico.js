/* ============================================================
   CONTENIDO DE MÓDULOS PÚBLICOS
   ------------------------------------------------------------
   Conecta Biblioteca y Galería con la API y conserva el HTML
   original como respaldo cuando no existe contenido publicado.
   ============================================================ */
(function iniciarContenidoModulos(global) {
  "use strict";

  const API_BASE = String(
    global.API_PUBLICA_URL || "http://localhost:3001/api"
  ).replace(/\/+$/, "");

  function texto(valor) {
    return valor === null || valor === undefined
      ? ""
      : String(valor).trim();
  }

  function escapar(valor) {
    return texto(valor)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function resolverUrl(valor) {
    const url = texto(valor);

    if (!url) {
      return "";
    }

    if (/^(javascript|data|vbscript):/i.test(url)) {
      return "";
    }

    if (/^https?:/i.test(url)) {
      return url;
    }

    if (url.startsWith("/")) {
      return `${API_BASE.replace(/\/api$/, "")}${url}`;
    }

    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//")) {
      return "";
    }

    return url;
  }

  async function obtenerElementos(modulo) {
    const respuesta = await fetch(`${API_BASE}/${modulo}/publico`, {
      headers: { Accept: "application/json" }
    });

    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }

    const contenido = await respuesta.json();
    return contenido?.datos?.elementos || [];
  }

  async function renderizarGaleria() {
    const contenedor = document.querySelector(
      'body[data-pagina="galeria"] main .galeria'
    );

    if (!contenedor) {
      return;
    }

    try {
      const elementos = await obtenerElementos("galeria");
      const imagenes = elementos
        .map((item) => ({
          ...item,
          urlResuelta: resolverUrl(item.url)
        }))
        .filter((item) => item.urlResuelta);

      if (imagenes.length === 0) {
        return;
      }

      contenedor.innerHTML = imagenes.map((item) => `
        <figure class="galeria__item">
          <img
            src="${escapar(item.urlResuelta)}"
            alt="${escapar(item.descripcion || item.titulo)}"
            loading="lazy"
          >
          <figcaption class="galeria__pie">
            ${escapar(item.titulo)}
          </figcaption>
        </figure>
      `).join("");

      if (typeof global.activarLightboxGaleria === "function") {
        global.activarLightboxGaleria();
      }
    } catch (error) {
      console.warn(
        "Se conserva la galería estática porque la API no está disponible.",
        error
      );
    }
  }

  async function renderizarBiblioteca() {
    const main = document.querySelector(
      'body[data-pagina="biblioteca"] main'
    );

    if (!main) {
      return;
    }

    try {
      const elementos = await obtenerElementos("biblioteca");

      if (elementos.length === 0) {
        return;
      }

      let seccion = document.getElementById(
        "contenidoBibliotecaAdministrable"
      );

      if (!seccion) {
        seccion = document.createElement("section");
        seccion.id = "contenidoBibliotecaAdministrable";
        seccion.className = "seccion seccion--suave";
        main.insertBefore(seccion, main.children[1] || null);
      }

      seccion.innerHTML = `
        <div class="contenedor">
          <div class="encabezado-seccion">
            <h2 class="titulo-seccion">Contenido actualizado de BiblioCRA</h2>
            <p class="subtitulo-seccion">
              Servicios y recursos publicados desde el panel administrativo.
            </p>
          </div>
          <div class="cuadricula cuadricula--3">
            ${elementos.map((item) => {
              const urlResuelta = resolverUrl(item.url);

              return `
              <article class="tarjeta">
                <span class="etiqueta etiqueta--circular">
                  ${escapar(item.datos?.tipo || "BiblioCRA")}
                </span>
                <h3 class="tarjeta__titulo">${escapar(item.titulo)}</h3>
                <p class="tarjeta__texto">${escapar(item.descripcion)}</p>
                ${urlResuelta ? `
                  <div class="tarjeta__pie">
                    <a
                      class="boton boton--secundario boton--pequeno"
                      href="${escapar(urlResuelta)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >Abrir recurso</a>
                  </div>
                ` : ""}
              </article>`;
            }).join("")}
          </div>
        </div>
      `;
    } catch (error) {
      console.warn(
        "Se conserva la biblioteca estática porque la API no está disponible.",
        error
      );
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderizarGaleria();
    renderizarBiblioteca();
  });
})(window);
