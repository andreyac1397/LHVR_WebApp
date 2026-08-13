/* ============================================================
   FILTROS.JS - Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Utilidades compartidas para las páginas que cargan datos
   desde archivos JSON (boletines, documentos, recursos, docentes):
   1. Helpers: cargar JSON, formatear fecha, ruta base
   2. Filtros por categoría
   3. Render de documentos importantes
   4. Render de recursos digitales
   5. Render del directorio docente
   ============================================================ */

/* ===== 1. HELPERS ===== */

/* Ruta base según la ubicación (raíz o carpeta /pages/) */
function rutaBase() {
  return window.location.pathname.includes("/pages/") ? "../" : "";
}

/* Carga un archivo JSON y devuelve los datos */
async function cargarJSON(rutaRelativa) {
  const respuesta = await fetch(rutaBase() + rutaRelativa);
  if (!respuesta.ok) throw new Error("No se pudo cargar " + rutaRelativa);
  return respuesta.json();
}

/* Convierte "2025-03-18" en "18 de marzo de 2025" */
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatearFecha(iso) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}

/* Devuelve solo el día y el mes corto */
function diaMes(iso) {
  const [, mes, dia] = iso.split("-").map(Number);
  const corto = MESES[mes - 1].slice(0, 3).toUpperCase();
  return { dia: String(dia).padStart(2, "0"), mes: corto };
}

/* ===== 2. FILTROS POR CATEGORÍA ===== */
function activarFiltros(idBotones, idTarjetas) {
  const botones = document.getElementById(idBotones);
  const contenedor = document.getElementById(idTarjetas);

  if (!botones || !contenedor) return;

  botones.addEventListener("click", (e) => {
    const boton = e.target.closest(".filtro");
    if (!boton) return;

    botones.querySelectorAll(".filtro").forEach((b) => b.classList.remove("activo"));
    boton.classList.add("activo");

    const filtro = boton.dataset.filtro;

    contenedor.querySelectorAll("[data-categoria]").forEach((tarjeta) => {
      const categoria = tarjeta.dataset.categoria;
      const mostrar = filtro === "todos" || categoria === filtro;

      tarjeta.style.display = mostrar ? "" : "none";
    });
  });
}

/* ===== 3. DOCUMENTOS IMPORTANTES ===== */
async function renderDocumentos(idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  try {
    const documentos = await cargarJSON("data/documentos.json");

    contenedor.innerHTML = documentos
      .map(
        (doc) => `
        <article class="tarjeta" data-categoria="${doc.categoria}">
          <span class="etiqueta etiqueta--${doc.categoria}">${doc.categoria}</span>
          <h3 class="tarjeta__titulo">${doc.titulo}</h3>
          <p class="tarjeta__texto">${doc.descripcion}</p>
          <div class="tarjeta__pie">
            <a class="boton boton--primario boton--pequeno"
              href="${doc.archivo.startsWith("http") || doc.archivo.startsWith("/") ? doc.archivo : rutaBase() + doc.archivo}"
              target="_blank"
              rel="noopener">
              Ver documento
            </a>
          </div>
        </article>`
      )
      .join("");
  } catch (error) {
    contenedor.innerHTML = `<p class="estado">No se pudieron cargar los documentos.</p>`;
  }
}

/* ===== 4. RECURSOS DIGITALES ===== */
async function renderEnlaces(idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  try {
    const enlaces = await cargarJSON("data/enlaces.json");

    contenedor.innerHTML = enlaces
      .map(
        (enlace) => `
        <article class="tarjeta" data-categoria="${enlace.publico}">
          <span class="etiqueta etiqueta--circular">${enlace.publico}</span>
          <h3 class="tarjeta__titulo">${enlace.titulo}</h3>
          <p class="tarjeta__texto">${enlace.descripcion}</p>
          <div class="tarjeta__pie">
            <a class="boton boton--secundario boton--pequeno"
              href="${enlace.url}"
              target="_blank"
              rel="noopener">
              Abrir recurso
            </a>
          </div>
        </article>`
      )
      .join("");
  } catch (error) {
    contenedor.innerHTML = `<p class="estado">No se pudieron cargar los recursos digitales.</p>`;
  }
}

/* ===== 5. DIRECTORIO DOCENTE ===== */
async function renderDocentes(idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  try {
    const docentes = await cargarJSON("data/docentes.json");

    contenedor.innerHTML = docentes
      .map((d) => {
        const inicial = d.area.charAt(0).toUpperCase();

        return `
        <article class="tarjeta docente">
          <div class="docente__avatar" aria-hidden="true">${inicial}</div>
          <h3 class="docente__nombre">${d.nombre}</h3>
          <p class="docente__area">${d.area}</p>
          <a class="docente__correo" href="mailto:${d.correo}">${d.correo}</a>
        </article>`;
      })
      .join("");
  } catch (error) {
    contenedor.innerHTML = `<p class="estado">No se pudo cargar el directorio.</p>`;
  }
}