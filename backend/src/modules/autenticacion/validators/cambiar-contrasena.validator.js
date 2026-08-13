/*
 * Validaciones para el cambio de contraseña
 * de un administrador autenticado.
 *
 * Este archivo:
 * - No consulta SQL Server.
 * - No compara hashes con bcrypt.
 * - No actualiza la contraseña.
 * - Solo valida los datos recibidos.
 */

const CAMPOS_PERMITIDOS = [
  "contrasenaActual",
  "contrasenaNueva",
  "confirmarContrasenaNueva"
];

const LONGITUD_MINIMA_CONTRASENA = 12;
const LONGITUD_MAXIMA_CONTRASENA = 128;

/**
 * Crea un error compatible con el middleware
 * centralizado de errores.
 *
 * @param {Array<object>} errores
 * @returns {Error}
 */
function crearErrorValidacion(errores) {
  const error = new Error(
    errores.length === 1
      ? errores[0].mensaje
      : "Los datos enviados para cambiar la contraseña no son válidos."
  );

  error.name = "ErrorValidacion";
  error.statusCode = 400;
  error.codigo = "DATOS_CAMBIO_CONTRASENA_INVALIDOS";
  error.errores = errores;

  return error;
}

/**
 * Comprueba que el cuerpo sea un objeto JSON.
 *
 * @param {*} valor
 * @returns {boolean}
 */
function esObjetoValido(valor) {
  return (
    valor !== null &&
    typeof valor === "object" &&
    !Array.isArray(valor)
  );
}

/**
 * Rechaza propiedades que no pertenecen
 * al cambio de contraseña.
 *
 * @param {object} datos
 * @param {Array<object>} errores
 */
function validarCamposPermitidos(datos, errores) {
  const camposDesconocidos = Object.keys(
    datos
  ).filter(
    (campo) =>
      !CAMPOS_PERMITIDOS.includes(campo)
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
 * Valida una contraseña obligatoria.
 *
 * No utiliza trim() para modificar el valor porque
 * los espacios podrían formar parte de la contraseña.
 *
 * @param {*} contrasena
 * @param {string} campo
 * @param {string} nombreVisible
 * @param {Array<object>} errores
 * @returns {string|null}
 */
function validarContrasenaObligatoria(
  contrasena,
  campo,
  nombreVisible,
  errores
) {
  if (
    contrasena === undefined ||
    contrasena === null
  ) {
    errores.push({
      campo,
      codigo: "CONTRASENA_OBLIGATORIA",
      mensaje:
        `${nombreVisible} es obligatoria.`
    });

    return null;
  }

  if (typeof contrasena !== "string") {
    errores.push({
      campo,
      codigo: "CONTRASENA_TIPO_INVALIDO",
      mensaje:
        `${nombreVisible} debe ser un texto.`
    });

    return null;
  }

  if (contrasena.length === 0) {
    errores.push({
      campo,
      codigo: "CONTRASENA_VACIA",
      mensaje:
        `${nombreVisible} no puede estar vacía.`
    });

    return null;
  }

  if (contrasena.trim().length === 0) {
    errores.push({
      campo,
      codigo: "CONTRASENA_SOLO_ESPACIOS",
      mensaje:
        `${nombreVisible} no puede contener únicamente espacios.`
    });

    return null;
  }

  if (
    contrasena.length >
    LONGITUD_MAXIMA_CONTRASENA
  ) {
    errores.push({
      campo,
      codigo: "CONTRASENA_DEMASIADO_LARGA",
      mensaje:
        `${nombreVisible} no puede superar los ` +
        `${LONGITUD_MAXIMA_CONTRASENA} caracteres.`
    });

    return null;
  }

  return contrasena;
}

/**
 * Valida las reglas de seguridad
 * de la contraseña nueva.
 *
 * @param {string|null} contrasena
 * @param {Array<object>} errores
 */
function validarSeguridadContrasenaNueva(
  contrasena,
  errores
) {
  if (contrasena === null) {
    return;
  }

  if (
    contrasena.length <
    LONGITUD_MINIMA_CONTRASENA
  ) {
    errores.push({
      campo: "contrasenaNueva",
      codigo: "CONTRASENA_MUY_CORTA",
      mensaje:
        `La contraseña nueva debe contener al menos ` +
        `${LONGITUD_MINIMA_CONTRASENA} caracteres.`
    });
  }

  if (!/[a-z]/.test(contrasena)) {
    errores.push({
      campo: "contrasenaNueva",
      codigo: "FALTA_MINUSCULA",
      mensaje:
        "La contraseña nueva debe contener al menos una letra minúscula."
    });
  }

  if (!/[A-Z]/.test(contrasena)) {
    errores.push({
      campo: "contrasenaNueva",
      codigo: "FALTA_MAYUSCULA",
      mensaje:
        "La contraseña nueva debe contener al menos una letra mayúscula."
    });
  }

  if (!/[0-9]/.test(contrasena)) {
    errores.push({
      campo: "contrasenaNueva",
      codigo: "FALTA_NUMERO",
      mensaje:
        "La contraseña nueva debe contener al menos un número."
    });
  }

  if (
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(
      contrasena
    )
  ) {
    errores.push({
      campo: "contrasenaNueva",
      codigo: "FALTA_CARACTER_ESPECIAL",
      mensaje:
        "La contraseña nueva debe contener al menos un carácter especial."
    });
  }
}

/**
 * Comprueba que la contraseña nueva sea diferente
 * de la contraseña actual.
 *
 * @param {string|null} contrasenaActual
 * @param {string|null} contrasenaNueva
 * @param {Array<object>} errores
 */
function validarContrasenaDiferente(
  contrasenaActual,
  contrasenaNueva,
  errores
) {
  if (
    contrasenaActual !== null &&
    contrasenaNueva !== null &&
    contrasenaActual === contrasenaNueva
  ) {
    errores.push({
      campo: "contrasenaNueva",
      codigo: "CONTRASENA_NUEVA_IGUAL_ACTUAL",
      mensaje:
        "La contraseña nueva debe ser diferente de la contraseña actual."
    });
  }
}

/**
 * Comprueba que la confirmación coincida.
 *
 * @param {string|null} contrasenaNueva
 * @param {string|null} confirmacion
 * @param {Array<object>} errores
 */
function validarConfirmacion(
  contrasenaNueva,
  confirmacion,
  errores
) {
  if (
    contrasenaNueva !== null &&
    confirmacion !== null &&
    contrasenaNueva !== confirmacion
  ) {
    errores.push({
      campo: "confirmarContrasenaNueva",
      codigo: "CONFIRMACION_NO_COINCIDE",
      mensaje:
        "La confirmación no coincide con la contraseña nueva."
    });
  }
}

/**
 * Valida todos los datos del cambio de contraseña.
 *
 * @param {object} datos
 * @returns {{
 *   contrasenaActual: string,
 *   contrasenaNueva: string,
 *   confirmarContrasenaNueva: string
 * }}
 */
function validarCambioContrasena(datos) {
  if (!esObjetoValido(datos)) {
    throw crearErrorValidacion([
      {
        campo: "general",
        codigo: "CUERPO_INVALIDO",
        mensaje:
          "Los datos deben enviarse como un objeto JSON."
      }
    ]);
  }

  const errores = [];

  validarCamposPermitidos(
    datos,
    errores
  );

  const contrasenaActual =
    validarContrasenaObligatoria(
      datos.contrasenaActual,
      "contrasenaActual",
      "La contraseña actual",
      errores
    );

  const contrasenaNueva =
    validarContrasenaObligatoria(
      datos.contrasenaNueva,
      "contrasenaNueva",
      "La contraseña nueva",
      errores
    );

  const confirmarContrasenaNueva =
    validarContrasenaObligatoria(
      datos.confirmarContrasenaNueva,
      "confirmarContrasenaNueva",
      "La confirmación de la contraseña nueva",
      errores
    );

  validarSeguridadContrasenaNueva(
    contrasenaNueva,
    errores
  );

  validarContrasenaDiferente(
    contrasenaActual,
    contrasenaNueva,
    errores
  );

  validarConfirmacion(
    contrasenaNueva,
    confirmarContrasenaNueva,
    errores
  );

  if (errores.length > 0) {
    throw crearErrorValidacion(errores);
  }

  return {
    contrasenaActual,
    contrasenaNueva,
    confirmarContrasenaNueva
  };
}

module.exports = {
  validarCambioContrasena,
  validarContrasenaObligatoria,
  validarSeguridadContrasenaNueva
};