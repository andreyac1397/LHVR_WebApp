/* ============================================================
   SOLICITUD BIBLIOCRA
   Registra la boleta pública mediante la API del backend.
   ============================================================ */
(function iniciarSolicitudBibliocra(global) {
  "use strict";

  const API_BASE = String(
    global.API_PUBLICA_URL || "http://localhost:3001/api"
  ).replace(/\/+$/, "");

  function mostrarEstado(elemento, mensaje, tipo) {
    elemento.textContent = mensaje;
    elemento.className =
      `formulario-bibliocra__nota formulario-bibliocra__nota--${tipo}`;
  }

  function fechaLocalActual() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById(
      "formularioSolicitudBibliocra"
    );
    const estado = document.getElementById(
      "estadoSolicitudBibliocra"
    );

    if (!formulario || !estado) {
      return;
    }

    const fecha = formulario.querySelector('[name="fecha"]');
    const fechaDevolucion = formulario.querySelector(
      '[name="fechaDevolucion"]'
    );
    if (fecha && !fecha.value) {
      fecha.value = fechaLocalActual();
    }
    if (fecha && fechaDevolucion) {
      fechaDevolucion.min = fecha.value;
      fecha.addEventListener("change", () => {
        fechaDevolucion.min = fecha.value;
      });
    }

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
      }

      const datosFormulario = new FormData(formulario);
      const nombre = String(datosFormulario.get("nombreUsuario") || "").trim();
      const titulo = String(datosFormulario.get("titulo") || "").trim();
      const boton = formulario.querySelector('button[type="submit"]');

      if (
        fecha?.value &&
        fechaDevolucion?.value &&
        fechaDevolucion.value < fecha.value
      ) {
        mostrarEstado(
          estado,
          "La fecha de devolución no puede ser anterior a la solicitud.",
          "error"
        );
        fechaDevolucion.focus();
        return;
      }

      const datos = {
        nombreSolicitante: nombre,
        correo: String(datosFormulario.get("correo") || "").trim(),
        telefono: String(datosFormulario.get("telefono") || "").trim(),
        identificacionSolicitante: datosFormulario.get("cedula"),
        tipoSolicitante: datosFormulario.get("tipoUsuario"),
        nivelSeccion: datosFormulario.get("seccion"),
        nombreMaterial: titulo,
        signatura: datosFormulario.get("signatura"),
        fechaSolicitud: datosFormulario.get("fecha"),
        autor: datosFormulario.get("autor"),
        fechaDevolucion: datosFormulario.get("fechaDevolucion"),
        tipoPrestamo: datosFormulario.get("tipoPrestamo"),
        confirmacion: datosFormulario.get("confirmacion") === "on",
        sitioWeb: datosFormulario.get("sitioWeb")
      };

      boton.disabled = true;

      try {
        const respuesta = await fetch(
          `${API_BASE}/solicitudes-bibliocra/publico`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
          }
        );

        const contenido = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
          throw new Error(
            contenido.mensaje ||
            "No fue posible registrar la solicitud."
          );
        }

        mostrarEstado(
          estado,
          `La solicitud de ${nombre} se registró correctamente.`,
          "exito"
        );
        formulario.reset();
        if (fecha) {
          fecha.value = fechaLocalActual();
        }
        if (fechaDevolucion) {
          fechaDevolucion.min = fecha?.value || "";
        }
      } catch (error) {
        mostrarEstado(
          estado,
          error.message || "No fue posible enviar la solicitud.",
          "error"
        );
      } finally {
        boton.disabled = false;
      }
    });
  });
})(window);
