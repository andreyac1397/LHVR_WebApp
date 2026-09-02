const { administradorService } = require("../../../container/dependency-container");
const { respuestaExitosa } = require("../../../shared/utils/response.util");

const contexto = (req) => ({
  idAdministrador: req.sesionAdministrador?.idAdministrador,
  direccionIp: req.ip || req.socket?.remoteAddress || null,
  userAgent: req.get("user-agent") || null
});

class AdministradorController {
  async listar(req, res, next) {
    try {
      const datos = await administradorService.listar(req.query);
      return respuestaExitosa(res, "Administradores obtenidos correctamente.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async crear(req, res, next) {
    try {
      const datos = await administradorService.crear(req.body, contexto(req));
      return respuestaExitosa(res, "Administrador creado correctamente.", datos, 201);
    } catch (error) {
      return next(error);
    }
  }

  async actualizar(req, res, next) {
    try {
      const datos = await administradorService.actualizar(
        req.params.idAdministrador,
        req.body,
        contexto(req)
      );
      return respuestaExitosa(res, "Administrador actualizado correctamente.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async reenviarAcceso(req, res, next) {
    try {
      const datos = await administradorService.reenviarAcceso(
        req.params.idAdministrador,
        contexto(req)
      );
      return respuestaExitosa(
        res,
        datos.correoAccesoEnviado
          ? "Se generó y envió un nuevo acceso temporal."
          : datos.advertencia,
        datos
      );
    } catch (error) {
      return next(error);
    }
  }

  async enviarRecuperacion(req, res, next) {
    try {
      const datos = await administradorService.enviarRecuperacion(
        req.params.idAdministrador,
        contexto(req)
      );
      return respuestaExitosa(res, "El proceso de recuperación fue enviado.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      const datos = await administradorService.cambiarEstado(
        req.params.idAdministrador,
        req.body,
        contexto(req)
      );
      return respuestaExitosa(res, "Estado actualizado correctamente.", datos);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AdministradorController();
