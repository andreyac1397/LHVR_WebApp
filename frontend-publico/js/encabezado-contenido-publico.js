(function cargarEncabezadoContenidoPublico(global) {
  "use strict";

  const slugs = {
    boletines: "boletines",
    docentes: "docentes",
    enlaces: "recursos-apoyo",
    galeria: "galeria"
  };

  document.addEventListener("DOMContentLoaded", async () => {
    const slug = slugs[document.body.dataset.pagina];
    const banda = document.querySelector("main .banda");
    if (!slug || !banda) return;
    banda.hidden = true;

    const api = String(global.API_PUBLICA_URL || "http://127.0.0.1:3001/api")
      .replace(/\/+$/, "");
    try {
      const respuesta = await fetch(`${api}/paginas/publicas/${slug}`, {
        headers: { Accept: "application/json" }
      });
      if (!respuesta.ok) {
        banda.hidden = true;
        return;
      }
      const contenido = await respuesta.json();
      const pagina = contenido?.datos?.pagina || contenido?.datos;
      const titulo = banda.querySelector("h1");
      const descripcion = titulo?.nextElementSibling;
      if (!pagina || pagina.estadoVisible === false) {
        banda.hidden = true;
        return;
      }
      banda.hidden = false;
      if (titulo) titulo.textContent = pagina.titulo || "";
      if (descripcion) descripcion.textContent = pagina.descripcion || "";
    } catch (error) {
      banda.hidden = true;
      console.warn(`No fue posible obtener el encabezado de ${slug}.`, error);
    }
  });
})(window);
