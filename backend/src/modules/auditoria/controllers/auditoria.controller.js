const {
  auditoriaService
} = require("../../../container/dependency-container");
const {
  respuestaExitosa
} = require("../../../shared/utils/response.util");

async function listar(req, res, next) {
  try {
    const datos = await auditoriaService.listarAuditoria(req.query);
    return respuestaExitosa(res, "Auditoría obtenida correctamente.", datos);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listar };
