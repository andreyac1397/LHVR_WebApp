(function iniciarAuditoria(global) {
  "use strict";
  const api = global.API_ADMIN_CLIENT;
  const cuerpo = document.getElementById("cuerpoAuditoria");
  if (!cuerpo) return;
  const modulo = document.getElementById("filtroModuloAuditoria");
  const accion = document.getElementById("filtroAccionAuditoria");
  const busqueda = document.getElementById("busquedaAuditoria");
  const estado = document.getElementById("estadoAuditoria");

  const escapar = (valor) => String(valor ?? "").replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  function informar(texto, tipo = "informacion") {
    estado.textContent = texto;
    estado.className = `gestion-contenido__mensaje gestion-contenido__mensaje--${tipo}`;
  }

  function llenar(selector, datos, valorActual, etiqueta) {
    selector.innerHTML = `<option value="">${etiqueta}</option>` +
      datos.map((item) => `<option value="${escapar(item.codigo)}">${escapar(item.nombre)}</option>`).join("");
    selector.value = valorActual;
  }

  async function cargar() {
    const parametros = new URLSearchParams();
    if (modulo.value) parametros.set("modulo", modulo.value);
    if (accion.value) parametros.set("accion", accion.value);
    if (busqueda.value.trim()) parametros.set("busqueda", busqueda.value.trim());
    const valores = { modulo: modulo.value, accion: accion.value };
    const respuesta = await api.get(`/auditoria${parametros.size ? `?${parametros}` : ""}`);
    const datos = respuesta?.datos || {};
    llenar(modulo, datos.modulos || [], valores.modulo, "Todos los módulos");
    llenar(accion, datos.acciones || [], valores.accion, "Todas las acciones");
    const registros = datos.registros || [];
    cuerpo.innerHTML = registros.map((item) => `
      <tr>
        <td>${escapar(new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(item.fechaAccion)))}</td>
        <td><strong>${escapar(item.accion)}</strong><br><small>${escapar(item.codigoAccion)}</small></td>
        <td>${escapar(item.modulo)}</td>
        <td><strong>${escapar(item.administrador || "Sistema")}</strong><br><small>${escapar(item.direccionIp)}</small></td>
        <td>${escapar(item.descripcion || "—")}<br><small>${escapar(item.tablaAfectada || "")}${item.idRegistroAfectado ? ` #${escapar(item.idRegistroAfectado)}` : ""}</small></td>
      </tr>
    `).join("");
    informar(registros.length ? `${registros.length} registro(s) encontrados.` : "No hay registros con esos filtros.");
  }

  document.addEventListener("DOMContentLoaded", () => {
    let temporizador;
    [modulo, accion].forEach((selector) => selector.addEventListener("change", () => cargar().catch((error) => informar(error.message, "error"))));
    busqueda.addEventListener("input", () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => cargar().catch((error) => informar(error.message, "error")), 350);
    });
    cargar().catch((error) => informar(error.message, "error"));
  });
})(window);
