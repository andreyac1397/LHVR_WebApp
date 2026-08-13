const {
  dashboardService
} = require("../../../container/dependency-container");
const {
  respuestaExitosa
} = require("../../../shared/utils/response.util");

async function obtenerResumen(_req, res, next) {
  try {
    const datos = await dashboardService.obtenerResumen();
    return respuestaExitosa(res, "Resumen administrativo obtenido.", datos);
  } catch (error) {
    return next(error);
  }
}

module.exports = { obtenerResumen };
