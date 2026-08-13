/*
 * Validaciones para el inicio de sesión administrativo.
 *
 * Este archivo únicamente valida la estructura y el formato
 * de los datos recibidos. No consulta la base de datos,
 * no compara contraseñas y no genera tokens.
 */

const CAMPOS_PERMITIDOS = [
  "correo",
  "contrasena"
];

const LONGITUD_MAXIMA_CORREO = 254;
const LONGITUD_MAXIMA_CONTRASENA = 128;

/**
 * Crea un error de validación que podrá ser procesado
 * por el middleware general de errores.
 */
function crearErrorValidacion(errores) {
  const error = new Error(
    errores.length === 1
      ? errores[0].mensaje
      : "Los datos enviados para iniciar sesión no son válidos."
  );

  error.name = "ErrorValidacion";
  error.statusCode = 400;
  error.errores = errores;

  return error;
}

/**
 * Comprueba que el cuerpo recibido sea un objeto JSON normal.
 */
function esObjetoValido(valor) {
  return (
    valor !== null &&
    typeof valor === "object" &&
    !Array.isArray(valor)
  );
}

/**
 * Comprueba que no se envíen propiedades que no pertenecen
 * al formulario de inicio de sesión.
 */
function validarCamposPermitidos(datos, errores) {
  const camposRecibidos = Object.keys(datos);

  const camposDesconocidos = camposRecibidos.filter(
    (campo) => !CAMPOS_PERMITIDOS.includes(campo)
  );

  if (camposDesconocidos.length > 0) {
    errores.push({
      campo: "general",
      codigo: "CAMPOS_NO_PERMITIDOS",
      mensaje:
        `No se permiten los siguientes campos: ` +
        `${camposDesconocidos.join(", ")}.`
    });
  }
}

/**
 * Valida y normaliza el correo.
 */
function validarCorreoLogin(correo, errores) {
  if (correo === undefined || correo === null) {
    errores.push({
      campo: "correo",
      codigo: "CORREO_OBLIGATORIO",
      mensaje: "El correo es obligatorio."
    });

    return null;
  }

  if (typeof correo !== "string") {
    errores.push({
      campo: "correo",
      codigo: "CORREO_TIPO_INVALIDO",
      mensaje: "El correo debe ser un texto."
    });

    return null;
  }

  const correoLimpio = correo
    .trim()
    .toLowerCase();

  if (!correoLimpio) {
    errores.push({
      campo: "correo",
      codigo: "CORREO_VACIO",
      mensaje: "El correo no puede estar vacío."
    });

    return null;
  }

  if (correoLimpio.length > LONGITUD_MAXIMA_CORREO) {
    errores.push({
      campo: "correo",
      codigo: "CORREO_DEMASIADO_LARGO",
      mensaje:
        `El correo no puede superar los ` +
        `${LONGITUD_MAXIMA_CORREO} caracteres.`
    });

    return null;
  }

  /*
   * Validación práctica del formato.
   * La validación definitiva de existencia se hará
   * posteriormente en el servicio y repositorio.
   */
  const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formatoCorreo.test(correoLimpio)) {
    errores.push({
      campo: "correo",
      codigo: "CORREO_FORMATO_INVALIDO",
      mensaje: "El correo no tiene un formato válido."
    });

    return null;
  }

  return correoLimpio;
}

/**
 * Valida la contraseña recibida.
 *
 * La contraseña no se recorta ni se convierte a minúsculas,
 * porque debe compararse exactamente como la escribió el usuario.
 */
function validarContrasenaLogin(contrasena, errores) {
  if (contrasena === undefined || contrasena === null) {
    errores.push({
      campo: "contrasena",
      codigo: "CONTRASENA_OBLIGATORIA",
      mensaje: "La contraseña es obligatoria."
    });

    return null;
  }

  if (typeof contrasena !== "string") {
    errores.push({
      campo: "contrasena",
      codigo: "CONTRASENA_TIPO_INVALIDO",
      mensaje: "La contraseña debe ser un texto."
    });

    return null;
  }

  if (contrasena.length === 0) {
    errores.push({
      campo: "contrasena",
      codigo: "CONTRASENA_VACIA",
      mensaje: "La contraseña no puede estar vacía."
    });

    return null;
  }

  if (contrasena.trim().length === 0) {
    errores.push({
      campo: "contrasena",
      codigo: "CONTRASENA_SOLO_ESPACIOS",
      mensaje:
        "La contraseña no puede contener únicamente espacios."
    });

    return null;
  }

  if (
    contrasena.length >
    LONGITUD_MAXIMA_CONTRASENA
  ) {
    errores.push({
      campo: "contrasena",
      codigo: "CONTRASENA_DEMASIADO_LARGA",
      mensaje:
        `La contraseña no puede superar los ` +
        `${LONGITUD_MAXIMA_CONTRASENA} caracteres.`
    });

    return null;
  }

  return contrasena;
}

/**
 * Valida todos los datos del formulario de inicio de sesión.
 *
 * Retorna los datos limpios cuando son válidos.
 * Lanza un error con código HTTP 400 cuando hay problemas.
 */
function validarLogin(datos) {
  if (!esObjetoValido(datos)) {
    throw crearErrorValidacion([
      {
        campo: "general",
        codigo: "CUERPO_INVALIDO",
        mensaje:
          "Los datos del inicio de sesión deben enviarse como un objeto JSON."
      }
    ]);
  }

  const errores = [];

  validarCamposPermitidos(datos, errores);

  const correo = validarCorreoLogin(
    datos.correo,
    errores
  );

  const contrasena = validarContrasenaLogin(
    datos.contrasena,
    errores
  );

  if (errores.length > 0) {
    throw crearErrorValidacion(errores);
  }

  return {
    correo,
    contrasena
  };
}

module.exports = {
  validarLogin,
  validarCorreoLogin,
  validarContrasenaLogin
};