const {
  respuestaError
} = require("../shared/utils/response.util");

function rutaNoEncontrada(req, res) {
  return respuestaError(
    res,
    `La ruta ${req.method} ${req.originalUrl} no existe`,
    404
  );
}

module.exports = rutaNoEncontrada;