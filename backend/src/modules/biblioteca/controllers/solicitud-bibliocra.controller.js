const {
  solicitudBibliocraService
} = require("../../../container/dependency-container");
const {
  respuestaExitosa
} = require("../../../shared/utils/response.util");

function contexto(req) {
  return {
    idAdministrador: req.sesionAdministrador?.idAdministrador ?? null,
    direccionIp: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get("user-agent") || null
  };
}

class SolicitudBibliocraController {
  async crear(req, res, next) {
    try {
      const datos = await solicitudBibliocraService.crear(req.body, contexto(req));
      return respuestaExitosa(res, "La solicitud BiblioCRA fue recibida.", datos, 201);
    } catch (error) {
      return next(error);
    }
  }

  async listar(req, res, next) {
    try {
      const datos = await solicitudBibliocraService.listar(req.query);
      return respuestaExitosa(res, "Solicitudes BiblioCRA obtenidas.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async actualizar(req, res, next) {
    try {
      const datos = await solicitudBibliocraService.actualizar(
        req.params.idSolicitud,
        req.body,
        contexto(req)
      );
      return respuestaExitosa(res, "Solicitud BiblioCRA actualizada.", datos);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new SolicitudBibliocraController();
