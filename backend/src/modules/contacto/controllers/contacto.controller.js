const {
  contactoService
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

class ContactoController {
  async crear(req, res, next) {
    try {
      const datos = await contactoService.crear(req.body, contexto(req));
      return respuestaExitosa(
        res,
        "Su mensaje fue recibido correctamente.",
        datos,
        201
      );
    } catch (error) {
      return next(error);
    }
  }

  async listar(req, res, next) {
    try {
      const datos = await contactoService.listar(req.query);
      return respuestaExitosa(res, "Mensajes obtenidos correctamente.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async actualizar(req, res, next) {
    try {
      const datos = await contactoService.actualizar(
        req.params.idSolicitud,
        req.body,
        contexto(req)
      );
      return respuestaExitosa(res, "Mensaje actualizado correctamente.", datos);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ContactoController();
