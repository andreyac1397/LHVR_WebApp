(function iniciarSolicitudesBibliocra(global) {
  "use strict";

  const api = global.API_ADMIN_CLIENT;
  const cuerpo = document.getElementById("cuerpoSolicitudesBibliocra");
  if (!cuerpo) return;

  const filtro = document.getElementById("filtroEstadoBibliocra");
  const busqueda = document.getElementById("busquedaBibliocra");
  const mensaje = document.getElementById("estadoSolicitudesBibliocra");
  let estados = [];
  let solicitudes = [];

  const escapar = (valor) => String(valor ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function informar(texto, tipo = "informacion") {
    mensaje.textContent = texto;
    mensaje.className = `gestion-contenido__mensaje gestion-contenido__mensaje--${tipo}`;
  }

  function opciones(id) {
    return estados.map((estado) => `<option value="${estado.idEstadoSolicitud}" ${Number(id) === Number(estado.idEstadoSolicitud) ? "selected" : ""}>${escapar(estado.nombre)}</option>`).join("");
  }

  function renderizar() {
    const filtroActual = filtro.value;
    filtro.innerHTML = '<option value="">Todos los estados</option>' +
      estados.map((estado) => `<option value="${estado.idEstadoSolicitud}">${escapar(estado.nombre)}</option>`).join("");
    filtro.value = filtroActual;

    cuerpo.innerHTML = solicitudes.map((item) => `
      <tr data-id="${item.idSolicitudBibliocra}">
        <td><strong>${escapar(item.nombreMaterial || "Material sin nombre")}</strong><br><small>${escapar(item.tipoMaterial)} · ${escapar(item.observacionesMaterial)}</small></td>
        <td><strong>${escapar(item.nombreSolicitante)}</strong><br><small>${escapar(item.tipoSolicitante)} · ${escapar(item.identificacionSolicitante)} · ${escapar(item.nivelSeccion)}</small><details><summary>Datos y observaciones</summary><p>${escapar(item.telefono)} ${item.correo ? `· ${escapar(item.correo)}` : ""}</p><p>${escapar(item.observacionesSolicitante)}</p><textarea data-observacion class="gestion-contenido__control" maxlength="1500" placeholder="Observación interna">${escapar(item.observacionesInternas)}</textarea></details></td>
        <td>${escapar(new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.fechaSolicitud)))}</td>
        <td><select data-estado class="gestion-contenido__control">${opciones(item.idEstadoSolicitud)}</select></td>
        <td><button data-guardar class="admin-boton admin-boton--primario admin-boton--pequeno" type="button">Guardar</button></td>
      </tr>
    `).join("");
    informar(solicitudes.length ? `${solicitudes.length} solicitud(es) cargadas.` : "No hay solicitudes con esos filtros.");
  }

  async function cargar() {
    const parametros = new URLSearchParams();
    if (filtro.value) parametros.set("idEstado", filtro.value);
    if (busqueda.value.trim()) parametros.set("busqueda", busqueda.value.trim());
    const respuesta = await api.get(`/solicitudes-bibliocra/administracion${parametros.size ? `?${parametros}` : ""}`);
    solicitudes = respuesta?.datos?.solicitudes || [];
    estados = respuesta?.datos?.estados || [];
    renderizar();
  }

  document.addEventListener("DOMContentLoaded", () => {
    let temporizador;
    filtro.addEventListener("change", () => cargar().catch((error) => informar(error.message, "error")));
    busqueda.addEventListener("input", () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => cargar().catch((error) => informar(error.message, "error")), 350);
    });
    cuerpo.addEventListener("click", async (evento) => {
      const boton = evento.target.closest("[data-guardar]");
      if (!boton) return;
      const fila = boton.closest("tr");
      boton.disabled = true;
      try {
        await api.patch(`/solicitudes-bibliocra/administracion/${fila.dataset.id}`, {
          idEstadoSolicitud: Number(fila.querySelector("[data-estado]").value),
          observacionesInternas: fila.querySelector("[data-observacion]").value.trim() || null
        });
        await cargar();
        informar("Solicitud actualizada correctamente.", "exito");
      } catch (error) {
        informar(error.message, "error");
      } finally {
        boton.disabled = false;
      }
    });
    cargar().catch((error) => informar(error.message, "error"));
  });
})(window);
