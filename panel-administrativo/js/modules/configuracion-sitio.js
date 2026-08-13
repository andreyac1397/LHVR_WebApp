(function iniciarConfiguracionSitio(global) {
  "use strict";

  const api = global.API_ADMIN_CLIENT;
  const formulario = document.getElementById("formularioConfiguracionSitio");
  const estado = document.getElementById("estadoConfiguracionSitio");
  const boton = formulario?.querySelector('button[type="submit"]');
  const valoresOriginales = new Map();

  function mostrar(mensaje, tipo = "informacion") {
    if (!estado) return;
    estado.textContent = mensaje;
    estado.className = `gestion-contenido__mensaje gestion-contenido__mensaje--${tipo}`;
  }

  async function cargar() {
    const respuesta = await api.get("/configuracion-sitio/administracion");
    const configuraciones = Array.isArray(respuesta?.datos) ? respuesta.datos : [];

    configuraciones.forEach((item) => {
      const control = formulario?.elements.namedItem(item.clave);
      if (!control) return;
      control.value = item.valor ?? "";
      valoresOriginales.set(item.clave, item.valor ?? "");
    });

    mostrar("Datos cargados desde configuracion_sitio. Los cambios se reflejan en todo el sitio.");
  }

  async function guardar(evento) {
    evento.preventDefault();
    const cambios = Array.from(formulario.elements)
      .filter((control) => control.name && valoresOriginales.has(control.name))
      .filter((control) => control.value.trim() !== valoresOriginales.get(control.name))
      .map((control) => ({ clave: control.name, valor: control.value.trim() || null }));

    if (cambios.length === 0) {
      mostrar("No hay cambios pendientes.");
      return;
    }

    boton.disabled = true;
    mostrar(`Guardando ${cambios.length} cambio(s)...`);

    try {
      for (const cambio of cambios) {
        await api.put("/configuracion-sitio/administracion", cambio);
        valoresOriginales.set(cambio.clave, cambio.valor ?? "");
      }
      mostrar("La configuración institucional se guardó correctamente.", "exito");
    } catch (error) {
      mostrar(error.message || "No fue posible guardar la configuración.", "error");
    } finally {
      boton.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    formulario?.addEventListener("submit", guardar);
    cargar().catch((error) => mostrar(error.message, "error"));
  });
})(window);
