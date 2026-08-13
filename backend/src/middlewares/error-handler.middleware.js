const {
  respuestaError
} = require("../shared/utils/response.util");

/**
 * Maneja todos los errores enviados mediante next(error).
 *
 * Los errores controlados pueden incluir:
 * - status o statusCode.
 * - codigo.
 * - message.
 *
 * Los errores internos no exponen información sensible
 * de Node.js, SQL Server ni de la aplicación.
 *
 * @param {Error} error
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
function manejadorErrores(
  error,
  req,
  res,
  next
) {
  /*
   * Si Express ya comenzó a enviar la respuesta,
   * delegar el error al manejador predeterminado.
   */
  if (res.headersSent) {
    return next(error);
  }

  console.error(
    "Error del servidor:",
    {
      mensaje:
        error?.message,

      codigo:
        error?.codigo ?? null,

      statusCode:
        error?.statusCode ??
        error?.status ??
        null,

      metodo:
        req.method,

      ruta:
        req.originalUrl,

      stack:
        process.env.NODE_ENV === "production"
          ? undefined
          : error?.stack
    }
  );

  const codigoEstadoRecibido =
    Number(
      error?.statusCode ??
      error?.status ??
      500
    );

  const codigoEstado =
    Number.isInteger(
      codigoEstadoRecibido
    ) &&
    codigoEstadoRecibido >= 400 &&
    codigoEstadoRecibido <= 599
      ? codigoEstadoRecibido
      : 500;

  const esErrorInterno =
    codigoEstado >= 500;

  const mensaje =
    esErrorInterno
      ? "Ocurrió un error interno en el servidor"
      : String(
          error?.message ||
          "La solicitud no pudo ser procesada."
        );

  const codigoError =
    esErrorInterno
      ? "ERROR_INTERNO_SERVIDOR"
      : String(
          error?.codigo ||
          "ERROR_SOLICITUD"
        );

  return respuestaError(
    res,
    mensaje,
    codigoEstado,
    codigoError
  );
}

module.exports = manejadorErrores;