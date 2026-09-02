(function configurarCambioContrasena(global) {
  "use strict";

  const autenticacion = global.AUTENTICACION_ADMIN;
  const formulario = document.getElementById("formularioCambioContrasena");
  const mensaje = document.getElementById("mensajeCambioContrasena");
  const boton = document.getElementById("botonCambiarContrasena");
  const enlaceVolver = document.getElementById("enlaceVolverDashboard");
  const botonCerrarSesion = document.getElementById("botonCerrarSesionCambio");
  let cambioObligatorio = false;

  function mostrarMensaje(texto, tipo = "error") {
    mensaje.textContent = texto;
    mensaje.className = `autenticacion__mensaje autenticacion__mensaje--${tipo}`;
    mensaje.hidden = false;
  }

  function establecerCarga(cargando) {
    boton.disabled = cargando;
    formulario.querySelectorAll("input").forEach((campo) => { campo.disabled = cargando; });
    boton.querySelector(".boton-autenticacion__texto").textContent = cargando
      ? "Guardando..."
      : "Guardar contraseña";
    boton.querySelector(".boton-autenticacion__cargador").hidden = !cargando;
  }

  async function cargarSesion() {
    try {
      const respuesta = await autenticacion.obtenerSesion();
      cambioObligatorio = Boolean(
        respuesta?.datos?.administrador?.requiereCambioContrasena
      );
      if (cambioObligatorio) {
        document.getElementById("etiquetaCambioContrasena").textContent = "Primer ingreso";
        document.getElementById("tituloCambioContrasena").textContent = "Debes cambiar tu contraseña";
        document.getElementById("descripcionCambioContrasena").textContent =
          "Por seguridad, reemplaza la contraseña temporal antes de continuar al panel.";
        enlaceVolver.hidden = true;
      }
      formulario.hidden = false;
    } catch (error) {
      if (error.statusCode === 401 || error.statusCode === 403) {
        global.location.replace("iniciar-sesion.html");
        return;
      }
      mostrarMensaje(error.message || "No fue posible comprobar la sesión.");
    }
  }

  formulario?.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensaje.hidden = true;
    const datos = {
      contrasenaActual: document.getElementById("contrasenaActual").value,
      contrasenaNueva: document.getElementById("contrasenaNueva").value,
      confirmarContrasenaNueva: document.getElementById("confirmarContrasenaNueva").value
    };
    if (datos.contrasenaNueva !== datos.confirmarContrasenaNueva) {
      mostrarMensaje("La confirmación no coincide con la contraseña nueva.");
      return;
    }
    establecerCarga(true);
    try {
      const respuesta = cambioObligatorio
        ? await autenticacion.cambiarContrasenaObligatoria(datos)
        : await autenticacion.cambiarContrasena(datos);
      formulario.reset();
      await global.ModalAdmin.informar({
        tipo: "exito",
        titulo: "Contraseña actualizada",
        mensaje: respuesta.mensaje || "La contraseña fue actualizada correctamente.",
        textoConfirmar: "Continuar",
        cerrarConEscape: false,
        mostrarCerrar: false
      });
      global.location.replace(
        cambioObligatorio
          ? "../dashboard/dashboard.html"
          : "iniciar-sesion.html"
      );
    } catch (error) {
      mostrarMensaje(error.message || "No fue posible cambiar la contraseña.");
    } finally {
      establecerCarga(false);
    }
  });

  botonCerrarSesion?.addEventListener("click", async () => {
    try {
      await autenticacion.cerrarSesion();
    } catch (_error) {
      // La redirección también limpia el contexto visible aunque el servidor no responda.
    }
    global.location.replace("iniciar-sesion.html");
  });

  cargarSesion();
})(window);
