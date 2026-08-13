/* ============================================================
   BOLETINES.JS - Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Carga los boletines, comunicados y avisos desde
   data/boletines.json y los muestra en tarjetas.
   Requiere las utilidades de filtros.js (cargarJSON, formatearFecha).
   ------------------------------------------------------------
   Uso:  renderBoletines("listaBoletines", { limite: 3 })
         limite (opcional): cantidad máxima de tarjetas a mostrar.
   ============================================================ */

async function renderBoletines(idContenedor, opciones = {}) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  try {
    let boletines =
    await cargarJSON(
      "data/boletines.json"
    );

    /* Ordenar del más reciente al más antiguo */
    boletines.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    /* Limitar la cantidad si se indicó (ej. en la página de inicio) */
    if (opciones.limite) boletines = boletines.slice(0, opciones.limite);

    if (boletines.length === 0) {
      contenedor.innerHTML = `<p class="estado">No hay publicaciones por ahora.</p>`;
      return;
    }

    contenedor.innerHTML = boletines
      .map(
        (b) => `
        <article class="tarjeta" data-categoria="${b.categoria}">
          <span class="etiqueta etiqueta--${b.categoria}">${b.categoria}</span>
          <p class="tarjeta__fecha">${formatearFecha(b.fecha)}</p>
          <h3 class="tarjeta__titulo">${b.titulo}</h3>
          <p class="tarjeta__texto">${b.resumen}</p>
          <div class="tarjeta__pie">
          <a class="boton boton--secundario boton--pequeno" href="${b.enlace}" target="_blank" rel="noopener noreferrer">
            Leer más
          </a>
        </div>
        </article>`
      )
      .join("");
  } catch (error) {
    contenedor.innerHTML = `<p class="estado">No se pudieron cargar los boletines.</p>`;
  }
}
