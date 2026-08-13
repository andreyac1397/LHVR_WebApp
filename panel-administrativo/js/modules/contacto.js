(function iniciarMensajesContacto(global) {
  "use strict";

  const api = global.API_ADMIN_CLIENT;
  const cuerpo = document.getElementById("cuerpoMensajesContacto");
  const filtroEstado = document.getElementById("filtroEstadoContacto");
  const busqueda = document.getElementById("busquedaContacto");
  const estadoVista = document.getElementById("estadoMensajesContacto");
  let estados = [];
  let solicitudes = [];

  const escapar = (valor) => String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function fecha(valor) {
    if (!valor) return "—";
    return new Intl.DateTimeFormat("es-CR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(valor));
  }

  function mostrar(mensaje, tipo = "informacion") {
    estadoVista.textContent = mensaje;
    estadoVista.className = `gestion-contenido__mensaje gestion-contenido__mensaje--${tipo}`;
  }

  function renderizarEstados() {
    const actual = filtroEstado.value;
    filtroEstado.innerHTML = '<option value="">Todos los estados</option>' +
      estados.map((item) => `<option value="${item.idEstadoSolicitudContacto}">${escapar(item.nombre)}</option>`).join("");
    filtroEstado.value = actual;
  }

  function opcionesEstado(idActual) {
    return estados.map((item) => `
      <option value="${item.idEstadoSolicitudContacto}" ${Number(item.idEstadoSolicitudContacto) === Number(idActual) ? "selected" : ""}>
        ${escapar(item.nombre)}
      </option>
    `).join("");
  }

  function renderizar() {
    cuerpo.innerHTML = solicitudes.map((item) => `
      <tr data-id="${item.idSolicitudContacto}">
        <td>
          <strong>${escapar(item.asunto)}</strong><br>
          <small>${escapar(item.nombreCompleto)} · <a href="mailto:${escapar(item.correo)}">${escapar(item.correo)}</a></small>
          <details>
            <summary>Ver mensaje completo</summary>
            <p class="gestion-contenido__texto-preformateado">${escapar(item.mensaje)}</p>
            <label class="gestion-contenido__campo">
              <span>Nota interna</span>
              <textarea class="gestion-contenido__control" data-observacion maxlength="1500">${escapar(item.observacionInterna)}</textarea>
            </label>
            <label><input type="checkbox" data-spam ${item.esSpam ? "checked" : ""}> Marcar como spam</label>
          </details>
        </td>
        <td>${escapar(fecha(item.fechaEnvio))}</td>
        <td><select class="gestion-contenido__control" data-estado>${opcionesEstado(item.idEstadoSolicitudContacto)}</select></td>
        <td><button class="admin-boton admin-boton--primario admin-boton--pequeno" type="button" data-guardar>Guardar</button></td>
      </tr>
    `).join("");

    mostrar(
      solicitudes.length
        ? `${solicitudes.length} mensaje(s) cargados.`
        : "No se encontraron mensajes con los filtros seleccionados."
    );
  }

  async function cargar() {
    const parametros = new URLSearchParams();
    if (filtroEstado.value) parametros.set("idEstado", filtroEstado.value);
    if (busqueda.value.trim()) parametros.set("busqueda", busqueda.value.trim());
    mostrar("Cargando mensajes...");

    const respuesta = await api.get(
      `/contacto/administracion${parametros.size ? `?${parametros}` : ""}`
    );
    solicitudes = respuesta?.datos?.solicitudes || [];
    estados = respuesta?.datos?.estados || [];
    renderizarEstados();
    renderizar();
  }

  async function guardar(fila, boton) {
    boton.disabled = true;
    try {
      await api.patch(`/contacto/administracion/${fila.dataset.id}`, {
        idEstadoSolicitudContacto: Number(fila.querySelector("[data-estado]").value),
        observacionInterna: fila.querySelector("[data-observacion]")?.value.trim() || null,
        esSpam: Boolean(fila.querySelector("[data-spam]")?.checked)
      });
      mostrar("El mensaje se actualizó correctamente.", "exito");
      await cargar();
    } catch (error) {
      mostrar(error.message || "No fue posible actualizar el mensaje.", "error");
    } finally {
      boton.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    let temporizador;
    filtroEstado.addEventListener("change", () => cargar().catch((error) => mostrar(error.message, "error")));
    busqueda.addEventListener("input", () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => cargar().catch((error) => mostrar(error.message, "error")), 350);
    });
    cuerpo.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-guardar]");
      if (boton) guardar(boton.closest("tr"), boton);
    });
    cargar().catch((error) => mostrar(error.message, "error"));
  });
})(window);
