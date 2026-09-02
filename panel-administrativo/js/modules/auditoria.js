(function iniciarAuditoria(global) {
  "use strict";
  const api = global.API_ADMIN_CLIENT;
  const cuerpo = document.getElementById("cuerpoAuditoria");
  if (!cuerpo) return;
  const modulo = document.getElementById("filtroModuloAuditoria");
  const accion = document.getElementById("filtroAccionAuditoria");
  const busqueda = document.getElementById("busquedaAuditoria");
  const estado = document.getElementById("estadoAuditoria");
  const resumenPaginacion = document.getElementById("resumenPaginacionAuditoria");
  const limite = document.getElementById("limiteAuditoria");
  const anterior = document.getElementById("anteriorAuditoria");
  const pagina = document.getElementById("paginaAuditoria");
  const siguiente = document.getElementById("siguienteAuditoria");
  const paginacion = {
    paginaActual: 1,
    limite: 20,
    totalRegistros: 0,
    totalPaginas: 1,
    tieneAnterior: false,
    tieneSiguiente: false
  };

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

  function actualizarPaginacion(datos) {
    paginacion.paginaActual = Number(datos.paginaActual) || 1;
    paginacion.limite = Number(datos.limite) || 20;
    paginacion.totalRegistros = Number(datos.totalRegistros) || 0;
    paginacion.totalPaginas = Number(datos.totalPaginas) || 1;
    paginacion.tieneAnterior = Boolean(datos.tieneAnterior);
    paginacion.tieneSiguiente = Boolean(datos.tieneSiguiente);

    const inicio = paginacion.totalRegistros
      ? ((paginacion.paginaActual - 1) * paginacion.limite) + 1
      : 0;
    const fin = Math.min(
      paginacion.paginaActual * paginacion.limite,
      paginacion.totalRegistros
    );
    resumenPaginacion.textContent = paginacion.totalRegistros
      ? `Mostrando ${inicio}–${fin} de ${paginacion.totalRegistros} registros`
      : "Mostrando 0 de 0 registros";
    pagina.textContent = `Página ${paginacion.paginaActual} de ${paginacion.totalPaginas}`;
    limite.value = String(paginacion.limite);
    anterior.disabled = !paginacion.tieneAnterior;
    siguiente.disabled = !paginacion.tieneSiguiente;
  }

  async function cargar({ reiniciarPagina = false } = {}) {
    if (reiniciarPagina) {
      paginacion.paginaActual = 1;
    }
    const parametros = new URLSearchParams();
    parametros.set("pagina", paginacion.paginaActual);
    parametros.set("limite", paginacion.limite);
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
    actualizarPaginacion(datos);
    informar(registros.length ? `${registros.length} registro(s) encontrados.` : "No hay registros con esos filtros.");
  }

  document.addEventListener("DOMContentLoaded", () => {
    let temporizador;
    [modulo, accion].forEach((selector) => selector.addEventListener("change", () => cargar({ reiniciarPagina: true }).catch((error) => informar(error.message, "error"))));
    busqueda.addEventListener("input", () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => cargar({ reiniciarPagina: true }).catch((error) => informar(error.message, "error")), 350);
    });
    limite.addEventListener("change", () => {
      paginacion.limite = Number(limite.value) || 20;
      cargar({ reiniciarPagina: true }).catch((error) => informar(error.message, "error"));
    });
    anterior.addEventListener("click", () => {
      if (!paginacion.tieneAnterior) return;
      paginacion.paginaActual -= 1;
      cargar().catch((error) => informar(error.message, "error"));
    });
    siguiente.addEventListener("click", () => {
      if (!paginacion.tieneSiguiente) return;
      paginacion.paginaActual += 1;
      cargar().catch((error) => informar(error.message, "error"));
    });
    cargar().catch((error) => informar(error.message, "error"));
  });
})(window);
