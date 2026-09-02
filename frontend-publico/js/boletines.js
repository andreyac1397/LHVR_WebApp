/* ============================================================
   BOLETINES.JS - Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Carga los boletines, comunicados y avisos exclusivamente
   desde la API pública y los muestra en tarjetas.
   Requiere las utilidades de filtros.js para fecha y filtros.
   ------------------------------------------------------------
   Uso:  renderBoletines("listaBoletines", { limite: 3 })
         limite (opcional): cantidad máxima de tarjetas a mostrar.
   ============================================================ */

async function renderBoletines(idContenedor, opciones = {}) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  try {
    let boletines;

      const apiBase = String(
        window.API_PUBLICA_URL || "http://127.0.0.1:3001/api"
      ).replace(/\/+$/, "");
      const respuesta = await fetch(`${apiBase}/boletines/publico`, {
        headers: { Accept: "application/json" }
      });

      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const contenido = await respuesta.json();
      const elementos = contenido?.datos?.elementos;
      if (!Array.isArray(elementos)) throw new Error("Respuesta inválida");

      boletines = elementos.map((elemento) => ({
        fecha: String(elemento.fechaInicio || elemento.fechaCreacion || "").slice(0, 10),
        categoria: elemento.datos?.categoria || elemento.datos?.edicion || "boletin",
        titulo: elemento.titulo,
        resumen: elemento.descripcion || elemento.subtitulo || "",
        enlace: elemento.url || "#"
      }));
    /* Limitar la cantidad si se indicó (ej. en la página de inicio) */
    if (opciones.limite) boletines = boletines.slice(0, opciones.limite);

    if (boletines.length === 0) {
      contenedor.innerHTML = `<p class="estado">No hay publicaciones por ahora.</p>`;
      return;
    }

    contenedor.innerHTML = boletines
      .map(
        (b) => {
          const escapar = (valor) => String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
          const categoriaClase = String(b.categoria || "boletin")
            .toLowerCase().replace(/[^a-z0-9_-]/g, "-");
          const enlace = /^(https?:\/\/|\/|\.\.\/|\.\/|#)/i.test(b.enlace || "")
            ? b.enlace
            : "#";

          return `
        <article class="tarjeta" data-categoria="${escapar(b.categoria)}">
          <span class="etiqueta etiqueta--${categoriaClase}">${escapar(b.categoria)}</span>
          <p class="tarjeta__fecha">${escapar(formatearFecha(b.fecha))}</p>
          <h3 class="tarjeta__titulo">${escapar(b.titulo)}</h3>
          <p class="tarjeta__texto">${escapar(b.resumen)}</p>
          <div class="tarjeta__pie">
          <a class="boton boton--secundario boton--pequeno" href="${escapar(enlace)}" target="_blank" rel="noopener noreferrer">
            Leer más
          </a>
        </div>
        </article>`;
        }
      )
      .join("");
  } catch (error) {
    contenedor.innerHTML = `<p class="estado">No se pudieron cargar los boletines.</p>`;
  }
}
