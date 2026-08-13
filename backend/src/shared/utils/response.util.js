/**
 * Envía una respuesta exitosa con un formato estándar.
 *
 * @param {object} res
 * @param {string} mensaje
 * @param {*} datos
 * @param {number} codigoEstado
 * @returns {object}
 */
function respuestaExitosa(
  res,
  mensaje,
  datos = null,
  codigoEstado = 200
) {
  const respuesta = {
    exito: true,
    mensaje
  };

  if (datos !== null) {
    respuesta.datos = datos;
  }

  return res
    .status(codigoEstado)
    .json(respuesta);
}

/**
 * Envía una respuesta de error con un formato estándar.
 *
 * El cuarto parámetro admite:
 * - Un código de error como cadena.
 * - Un objeto o arreglo de errores para mantener
 *   compatibilidad con las llamadas existentes.
 *
 * El quinto parámetro permite enviar errores detallados
 * junto con el código de error.
 *
 * @param {object} res
 * @param {string} mensaje
 * @param {number} codigoEstado
 * @param {string|object|Array|null} codigoOErrores
 * @param {object|Array|null} errores
 * @returns {object}
 */
function respuestaError(
  res,
  mensaje,
  codigoEstado = 500,
  codigoOErrores = null,
  errores = null
) {
  const respuesta = {
    exito: false,
    mensaje
  };

  /*
   * Cuando el cuarto parámetro es una cadena,
   * corresponde al código controlado del error.
   */
  if (
    typeof codigoOErrores === "string" &&
    codigoOErrores.trim() !== ""
  ) {
    respuesta.codigo =
      codigoOErrores.trim();
  }

  /*
   * Mantiene compatibilidad con llamadas anteriores
   * que enviaban directamente los errores detallados
   * como cuarto parámetro.
   */
  if (
    codigoOErrores !== null &&
    typeof codigoOErrores !== "string"
  ) {
    respuesta.errores =
      codigoOErrores;
  }

  /*
   * Permite enviar simultáneamente:
   * - Código del error.
   * - Detalles adicionales.
   */
  if (errores !== null) {
    respuesta.errores = errores;
  }

  return res
    .status(codigoEstado)
    .json(respuesta);
}

module.exports = {
  respuestaExitosa,
  respuestaError
};