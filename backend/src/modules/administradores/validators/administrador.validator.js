function validarNombreAdministrador(nombre) {
  const nombreLimpio = String(nombre || "").trim();

  if (!nombreLimpio) {
    throw new Error("El nombre del administrador es obligatorio.");
  }

  if (nombreLimpio.length < 3 || nombreLimpio.length > 150) {
    throw new Error(
      "El nombre debe tener entre 3 y 150 caracteres."
    );
  }

  return nombreLimpio;
}

function validarCorreoAdministrador(correo) {
  const correoLimpio = String(correo || "")
    .trim()
    .toLowerCase();

  if (!correoLimpio) {
    throw new Error("El correo del administrador es obligatorio.");
  }

  if (correoLimpio.length > 254) {
    throw new Error(
      "El correo no puede superar los 254 caracteres."
    );
  }

  const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formatoCorreo.test(correoLimpio)) {
    throw new Error(
      "El correo del administrador no tiene un formato válido."
    );
  }

  return correoLimpio;
}

function validarContrasenaAdministrador(contrasena) {
  const contrasenaTexto = String(contrasena || "");

  if (contrasenaTexto.length < 12) {
    throw new Error(
      "La contraseña debe tener al menos 12 caracteres."
    );
  }

  if (contrasenaTexto.length > 128) {
    throw new Error(
      "La contraseña no puede superar los 128 caracteres."
    );
  }

  if (!/[a-z]/.test(contrasenaTexto)) {
    throw new Error(
      "La contraseña debe incluir al menos una letra minúscula."
    );
  }

  if (!/[A-Z]/.test(contrasenaTexto)) {
    throw new Error(
      "La contraseña debe incluir al menos una letra mayúscula."
    );
  }

  if (!/[0-9]/.test(contrasenaTexto)) {
    throw new Error(
      "La contraseña debe incluir al menos un número."
    );
  }

  if (!/[^a-zA-Z0-9]/.test(contrasenaTexto)) {
    throw new Error(
      "La contraseña debe incluir al menos un carácter especial."
    );
  }

  return contrasenaTexto;
}

function validarDatosAdministrador({
  nombre,
  correo,
  contrasena
}) {
  return {
    nombre: validarNombreAdministrador(nombre),
    correo: validarCorreoAdministrador(correo),
    contrasena: validarContrasenaAdministrador(contrasena)
  };
}

module.exports = {
  validarNombreAdministrador,
  validarCorreoAdministrador,
  validarContrasenaAdministrador,
  validarDatosAdministrador
};