/* ============================================================
   FILTROS.JS - Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Utilidades compartidas para las páginas públicas. Docentes y
   recursos consumen la API; el JSON se conserva solo para módulos
   ajenos a esta integración que todavía lo requieren.
   1. Helpers de API, fecha y rutas
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

async function cargarModuloPublico(modulo) {
  const apiBase = String(
    window.API_PUBLICA_URL || "http://127.0.0.1:3001/api"
  ).replace(/\/+$/, "");
  const respuesta = await fetch(`${apiBase}/${modulo}/publico`, {
    headers: { Accept: "application/json" }
  });

  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  const contenido = await respuesta.json();
  const elementos = contenido?.datos?.elementos;
  if (!Array.isArray(elementos)) throw new Error("La API devolvió datos inválidos.");
  return elementos;
}

function escaparDato(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function urlPublicaSegura(valor) {
  const url = String(valor ?? "").trim();
  return /^(https?:\/\/|\/|\.\.\/|\.\/|#)/i.test(url) ? url : "#";
}

function resolverArchivoPublico(valor) {
  const url = urlPublicaSegura(valor);
  if (!url || url === "#") return "";
  if (url.startsWith("/")) {
    const origenApi = String(
      window.API_PUBLICA_URL || "http://127.0.0.1:3001/api"
    ).replace(/\/api\/?$/, "");
    return `${origenApi}${url}`;
  }
  return url;
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

function crearFiltrosAutomaticos(contenedor, categorias, id) {
  const valores = [...new Set(categorias.filter(Boolean))];
  contenedor.parentElement?.querySelector(`#${id}`)?.remove();
  if (valores.length < 2 || !contenedor.parentElement) return;
  if (!contenedor.id) contenedor.id = `${id}Contenido`;
  const filtros = document.createElement("div");
  filtros.id = id;
  filtros.className = "filtros";
  filtros.innerHTML = `<button class="filtro activo" data-filtro="todos" type="button">Todos</button>${valores.map((valor) => `<button class="filtro" data-filtro="${escaparDato(valor)}" type="button">${escaparDato(valor)}</button>`).join("")}`;
  contenedor.before(filtros);
  activarFiltros(id, contenedor.id);
}

/* ===== 3. DOCUMENTOS IMPORTANTES ===== */
async function renderDocumentos(idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  try {
    let documentos;

    try {
      const elementos = await cargarModuloPublico("tramites");
      documentos = elementos.map((item) => ({
        categoria: item.datos?.categoria || "tramite",
        titulo: item.titulo,
        descripcion: item.descripcion || item.subtitulo || "",
        archivo: item.url || "#"
      }));
    } catch (errorApi) {
      console.warn("Se usarán los documentos locales de respaldo.", errorApi);
      documentos = await cargarJSON("data/documentos.json");
    }

    contenedor.innerHTML = documentos
      .map(
        (doc) => `
        <article class="tarjeta" data-categoria="${escaparDato(doc.categoria)}">
          <span class="etiqueta">${escaparDato(doc.categoria)}</span>
          <h3 class="tarjeta__titulo">${escaparDato(doc.titulo)}</h3>
          <p class="tarjeta__texto">${escaparDato(doc.descripcion)}</p>
          <div class="tarjeta__pie">
            <a class="boton boton--primario boton--pequeno"
              href="${escaparDato(urlPublicaSegura(doc.archivo).startsWith("http") || urlPublicaSegura(doc.archivo).startsWith("/") ? urlPublicaSegura(doc.archivo) : rutaBase() + urlPublicaSegura(doc.archivo))}"
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
    let enlaces;

    const elementos = await cargarModuloPublico("recursos-apoyo");
      enlaces = elementos.map((item) => ({
        publico: item.datos?.publico || item.datos?.categoria || "Comunidad",
        titulo: item.titulo,
        descripcion: item.descripcion || item.subtitulo || "",
        url: item.url || "#"
      }));

    if (!enlaces.length) {
      contenedor.innerHTML = `<p class="estado">No hay recursos publicados.</p>`;
      return;
    }

    contenedor.innerHTML = enlaces
      .map(
        (enlace) => `
        <article class="tarjeta" data-categoria="${escaparDato(enlace.publico)}">
          <span class="etiqueta etiqueta--circular">${escaparDato(enlace.publico)}</span>
          <h3 class="tarjeta__titulo">${escaparDato(enlace.titulo)}</h3>
          <p class="tarjeta__texto">${escaparDato(enlace.descripcion)}</p>
          <div class="tarjeta__pie">
            <a class="boton boton--secundario boton--pequeno"
              href="${escaparDato(urlPublicaSegura(enlace.url))}"
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
    let docentes;

    const elementos = await cargarModuloPublico("docentes");
      docentes = elementos.map((item) => ({
        nombre: item.titulo,
        area: item.subtitulo || item.datos?.departamento || "Docente",
        correo: item.datos?.correo || "",
        descripcion: item.descripcion || "",
        foto: item.url || ""
      }));

    if (!docentes.length) {
      contenedor.innerHTML = `<p class="estado">No hay docentes publicados.</p>`;
      return;
    }

    contenedor.innerHTML = docentes
      .map((d) => {
        const inicial = d.area.charAt(0).toUpperCase();

        return `
        <article class="tarjeta docente" data-categoria="${escaparDato(d.area)}">
          <div class="docente__avatar" aria-hidden="true">${d.foto ? `<img src="${escaparDato(resolverArchivoPublico(d.foto))}" alt="">` : escaparDato(inicial)}</div>
          <h3 class="docente__nombre">${escaparDato(d.nombre)}</h3>
          <p class="docente__area">${escaparDato(d.area)}</p>
          ${d.descripcion ? `<p class="tarjeta__texto">${escaparDato(d.descripcion)}</p>` : ""}
          ${d.correo ? `<a class="docente__correo" href="mailto:${escaparDato(d.correo)}">${escaparDato(d.correo)}</a>` : '<span class="docente__correo">Por definir</span>'}
        </article>`;
      })
      .join("");
    crearFiltrosAutomaticos(contenedor, docentes.map((docente) => docente.area), "filtrosDocentes");
  } catch (error) {
    contenedor.innerHTML = `<p class="estado">No se pudo cargar el directorio.</p>`;
  }
}
