/*
 * Validaciones para la recuperación de contraseña.
 *
 * Este archivo valida tres etapas:
 * 1. Solicitar un código mediante correo.
 * 2. Verificar el código recibido.
 * 3. Establecer una contraseña nueva.
 *
 * No consulta SQL Server.
 * No envía correos.
 * No genera códigos ni tokens.
 * No modifica contraseñas.
 */

const LONGITUD_MAXIMA_CORREO = 254;
const LONGITUD_MINIMA_CONTRASENA = 12;
const LONGITUD_MAXIMA_CONTRASENA = 128;
const LONGITUD_MAXIMA_TOKEN = 200;

const CAMPOS_SOLICITUD = [
  "correo"
];

const CAMPOS_VERIFICACION = [
  "tokenRecuperacion",
  "codigo"
];

const CAMPOS_RESTABLECIMIENTO = [
  "tokenRestablecimiento",
  "contrasenaNueva",
  "confirmarContrasenaNueva"
];

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
      : "Los datos enviados para recuperar la contraseña no son válidos."
  );

  error.name = "ErrorValidacion";
  error.statusCode = 400;
  error.codigo =
    "DATOS_RECUPERACION_INVALIDOS";
  error.errores = errores;

  return error;
}

/**
 * Comprueba que el cuerpo recibido sea
 * un objeto JSON normal.
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
 * Rechaza campos que no pertenecen
 * al formulario correspondiente.
 *
 * @param {object} datos
 * @param {Array<string>} camposPermitidos
 * @param {Array<object>} errores
 */
function validarCamposPermitidos(
  datos,
  camposPermitidos,
  errores
) {
  const camposDesconocidos =
    Object.keys(datos).filter(
      (campo) =>
        !camposPermitidos.includes(campo)
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
 *
 * @param {*} correo
 * @param {Array<object>} errores
 * @returns {string|null}
 */
function validarCorreoRecuperacion(
  correo,
  errores
) {
  if (
    correo === undefined ||
    correo === null
  ) {
    errores.push({
      campo: "correo",
      codigo: "CORREO_OBLIGATORIO",
      mensaje:
        "El correo electrónico es obligatorio."
    });

    return null;
  }

  if (typeof correo !== "string") {
    errores.push({
      campo: "correo",
      codigo: "CORREO_TIPO_INVALIDO",
      mensaje:
        "El correo electrónico debe ser un texto."
    });

    return null;
  }

  const correoNormalizado =
    correo.trim().toLowerCase();

  if (!correoNormalizado) {
    errores.push({
      campo: "correo",
      codigo: "CORREO_VACIO",
      mensaje:
        "El correo electrónico no puede estar vacío."
    });

    return null;
  }

  if (
    correoNormalizado.length >
    LONGITUD_MAXIMA_CORREO
  ) {
    errores.push({
      campo: "correo",
      codigo: "CORREO_DEMASIADO_LARGO",
      mensaje:
        `El correo no puede superar los ` +
        `${LONGITUD_MAXIMA_CORREO} caracteres.`
    });

    return null;
  }

  const formatoCorreo =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !formatoCorreo.test(
      correoNormalizado
    )
  ) {
    errores.push({
      campo: "correo",
      codigo: "CORREO_FORMATO_INVALIDO",
      mensaje:
        "El correo electrónico no tiene un formato válido."
    });

    return null;
  }

  return correoNormalizado;
}

/**
 * Valida un token temporal.
 *
 * @param {*} token
 * @param {string} campo
 * @param {Array<object>} errores
 * @returns {string|null}
 */
function validarToken(
  token,
  campo,
  errores
) {
  if (
    token === undefined ||
    token === null
  ) {
    errores.push({
      campo,
      codigo: "TOKEN_OBLIGATORIO",
      mensaje:
        "La autorización temporal es obligatoria."
    });

    return null;
  }

  if (typeof token !== "string") {
    errores.push({
      campo,
      codigo: "TOKEN_TIPO_INVALIDO",
      mensaje:
        "La autorización temporal no es válida."
    });

    return null;
  }

  const tokenLimpio =
    token.trim();

  if (!tokenLimpio) {
    errores.push({
      campo,
      codigo: "TOKEN_VACIO",
      mensaje:
        "La autorización temporal no puede estar vacía."
    });

    return null;
  }

  if (
    tokenLimpio.length >
    LONGITUD_MAXIMA_TOKEN
  ) {
    errores.push({
      campo,
      codigo: "TOKEN_DEMASIADO_LARGO",
      mensaje:
        "La autorización temporal no es válida."
    });

    return null;
  }

  return tokenLimpio;
}

/**
 * Valida el código numérico de seis dígitos.
 *
 * @param {*} codigo
 * @param {Array<object>} errores
 * @returns {string|null}
 */
function validarCodigoRecuperacion(
  codigo,
  errores
) {
  if (
    codigo === undefined ||
    codigo === null
  ) {
    errores.push({
      campo: "codigo",
      codigo: "CODIGO_OBLIGATORIO",
      mensaje:
        "El código de recuperación es obligatorio."
    });

    return null;
  }

  if (
    typeof codigo !== "string" &&
    typeof codigo !== "number"
  ) {
    errores.push({
      campo: "codigo",
      codigo: "CODIGO_TIPO_INVALIDO",
      mensaje:
        "El código de recuperación no es válido."
    });

    return null;
  }

  const codigoLimpio =
    String(codigo).trim();

  if (!/^\d{6}$/.test(codigoLimpio)) {
    errores.push({
      campo: "codigo",
      codigo: "CODIGO_FORMATO_INVALIDO",
      mensaje:
        "El código debe contener exactamente seis números."
    });

    return null;
  }

  return codigoLimpio;
}

/**
 * Valida una contraseña nueva.
 *
 * No se utiliza trim() para modificarla,
 * porque los espacios pueden formar parte
 * de una contraseña.
 *
 * @param {*} contrasena
 * @param {Array<object>} errores
 * @returns {string|null}
 */
function validarContrasenaNueva(
  contrasena,
  errores
) {
  if (
    contrasena === undefined ||
    contrasena === null
  ) {
    errores.push({
      campo: "contrasenaNueva",
      codigo:
        "CONTRASENA_NUEVA_OBLIGATORIA",
      mensaje:
        "La contraseña nueva es obligatoria."
    });

    return null;
  }

  if (typeof contrasena !== "string") {
    errores.push({
      campo: "contrasenaNueva",
      codigo:
        "CONTRASENA_NUEVA_TIPO_INVALIDO",
      mensaje:
        "La contraseña nueva debe ser un texto."
    });

    return null;
  }

  if (contrasena.length === 0) {
    errores.push({
      campo: "contrasenaNueva",
      codigo: "CONTRASENA_NUEVA_VACIA",
      mensaje:
        "La contraseña nueva no puede estar vacía."
    });

    return null;
  }

  if (contrasena.trim().length === 0) {
    errores.push({
      campo: "contrasenaNueva",
      codigo:
        "CONTRASENA_NUEVA_SOLO_ESPACIOS",
      mensaje:
        "La contraseña nueva no puede contener únicamente espacios."
    });

    return null;
  }

  if (
    contrasena.length <
    LONGITUD_MINIMA_CONTRASENA
  ) {
    errores.push({
      campo: "contrasenaNueva",
      codigo: "CONTRASENA_MUY_CORTA",
      mensaje:
        `La contraseña debe contener al menos ` +
        `${LONGITUD_MINIMA_CONTRASENA} caracteres.`
    });
  }

  if (
    contrasena.length >
    LONGITUD_MAXIMA_CONTRASENA
  ) {
    errores.push({
      campo: "contrasenaNueva",
      codigo:
        "CONTRASENA_DEMASIADO_LARGA",
      mensaje:
        `La contraseña no puede superar los ` +
        `${LONGITUD_MAXIMA_CONTRASENA} caracteres.`
    });
  }

  if (!/[a-z]/.test(contrasena)) {
    errores.push({
      campo: "contrasenaNueva",
      codigo: "CONTRASENA_SIN_MINUSCULA",
      mensaje:
        "La contraseña debe contener al menos una letra minúscula."
    });
  }

  if (!/[A-Z]/.test(contrasena)) {
    errores.push({
      campo: "contrasenaNueva",
      codigo: "CONTRASENA_SIN_MAYUSCULA",
      mensaje:
        "La contraseña debe contener al menos una letra mayúscula."
    });
  }

  if (!/[0-9]/.test(contrasena)) {
    errores.push({
      campo: "contrasenaNueva",
      codigo: "CONTRASENA_SIN_NUMERO",
      mensaje:
        "La contraseña debe contener al menos un número."
    });
  }

  if (
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(
      contrasena
    )
  ) {
    errores.push({
      campo: "contrasenaNueva",
      codigo:
        "CONTRASENA_SIN_CARACTER_ESPECIAL",
      mensaje:
        "La contraseña debe contener al menos un carácter especial."
    });
  }

  return contrasena;
}

/**
 * Valida la confirmación de la contraseña.
 *
 * @param {*} confirmacion
 * @param {string|null} contrasenaNueva
 * @param {Array<object>} errores
 * @returns {string|null}
 */
function validarConfirmacionContrasena(
  confirmacion,
  contrasenaNueva,
  errores
) {
  if (
    confirmacion === undefined ||
    confirmacion === null
  ) {
    errores.push({
      campo:
        "confirmarContrasenaNueva",
      codigo:
        "CONFIRMACION_OBLIGATORIA",
      mensaje:
        "Debe confirmar la contraseña nueva."
    });

    return null;
  }

  if (typeof confirmacion !== "string") {
    errores.push({
      campo:
        "confirmarContrasenaNueva",
      codigo:
        "CONFIRMACION_TIPO_INVALIDO",
      mensaje:
        "La confirmación debe ser un texto."
    });

    return null;
  }

  if (
    contrasenaNueva !== null &&
    confirmacion !== contrasenaNueva
  ) {
    errores.push({
      campo:
        "confirmarContrasenaNueva",
      codigo:
        "CONFIRMACION_NO_COINCIDE",
      mensaje:
        "La confirmación no coincide con la contraseña nueva."
    });

    return null;
  }

  return confirmacion;
}

/**
 * Valida la solicitud inicial
 * de recuperación.
 *
 * @param {object} datos
 * @returns {{correo: string}}
 */
function validarSolicitudRecuperacion(
  datos
) {
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
    CAMPOS_SOLICITUD,
    errores
  );

  const correo =
    validarCorreoRecuperacion(
      datos.correo,
      errores
    );

  if (errores.length > 0) {
    throw crearErrorValidacion(
      errores
    );
  }

  return {
    correo
  };
}

/**
 * Valida la comprobación del código.
 *
 * @param {object} datos
 * @returns {{
 *   tokenRecuperacion: string,
 *   codigo: string
 * }}
 */
function validarVerificacionRecuperacion(
  datos
) {
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
    CAMPOS_VERIFICACION,
    errores
  );

  const tokenRecuperacion =
    validarToken(
      datos.tokenRecuperacion,
      "tokenRecuperacion",
      errores
    );

  const codigo =
    validarCodigoRecuperacion(
      datos.codigo,
      errores
    );

  if (errores.length > 0) {
    throw crearErrorValidacion(
      errores
    );
  }

  return {
    tokenRecuperacion,
    codigo
  };
}

/**
 * Valida el restablecimiento final.
 *
 * @param {object} datos
 * @returns {{
 *   tokenRestablecimiento: string,
 *   contrasenaNueva: string,
 *   confirmarContrasenaNueva: string
 * }}
 */
function validarRestablecimientoContrasena(
  datos
) {
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
    CAMPOS_RESTABLECIMIENTO,
    errores
  );

  const tokenRestablecimiento =
    validarToken(
      datos.tokenRestablecimiento,
      "tokenRestablecimiento",
      errores
    );

  const contrasenaNueva =
    validarContrasenaNueva(
      datos.contrasenaNueva,
      errores
    );

  const confirmarContrasenaNueva =
    validarConfirmacionContrasena(
      datos.confirmarContrasenaNueva,
      contrasenaNueva,
      errores
    );

  if (errores.length > 0) {
    throw crearErrorValidacion(
      errores
    );
  }

  return {
    tokenRestablecimiento,
    contrasenaNueva,
    confirmarContrasenaNueva
  };
}

module.exports = {
  validarSolicitudRecuperacion,
  validarVerificacionRecuperacion,
  validarRestablecimientoContrasena,
  validarCorreoRecuperacion,
  validarCodigoRecuperacion,
  validarContrasenaNueva
};