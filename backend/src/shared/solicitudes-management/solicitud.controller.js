const {
  respuestaExitosa
} = require("../../shared/utils/response.util");

class SolicitudController {
  constructor(servicio) {
    this.servicio = servicio;

    this.crear = this.crear.bind(this);
    this.listar = this.listar.bind(this);
    this.actualizar = this.actualizar.bind(this);
  }

  contexto(req) {
    return {
      idAdministrador:
        req.sesionAdministrador?.idAdministrador ?? null,
      direccionIp: req.ip || null,
      userAgent: req.get("user-agent") || null
    };
  }

  async crear(req, res, next) {
    try {
      const datos = await this.servicio.crear(req.body);

      return respuestaExitosa(
        res,
        "La solicitud se envió correctamente.",
        datos,
        201
      );
    } catch (error) {
      return next(error);
    }
  }

  async listar(req, res, next) {
    try {
      const solicitudes = await this.servicio.listar(req.query);

      return respuestaExitosa(
        res,
        "Solicitudes obtenidas correctamente.",
        { solicitudes }
      );
    } catch (error) {
      return next(error);
    }
  }

  async actualizar(req, res, next) {
    try {
      const datos = await this.servicio.actualizar(
        req.params.idSolicitud,
        req.body,
        this.contexto(req)
      );

      return respuestaExitosa(
        res,
        "La solicitud se actualizó correctamente.",
        datos
      );
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = SolicitudController;
