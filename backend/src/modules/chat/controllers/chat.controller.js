const {
  chatService
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

function obtenerToken(req) {
  const autorizacion = String(req.get("authorization") || "").trim();
  const coincidencia = autorizacion.match(/^Bearer\s+(.+)$/i);
  return coincidencia ? coincidencia[1].trim() : null;
}

class ChatController {
  async crearConversacionPublica(req, res, next) {
    try {
      const datos = await chatService.crearConversacion(
        req.body,
        contexto(req)
      );
      return respuestaExitosa(
        res,
        "La conversación fue iniciada.",
        datos,
        201
      );
    } catch (error) {
      return next(error);
    }
  }

  async obtenerConversacionPublica(req, res, next) {
    try {
      const datos = await chatService.obtenerConversacionPublica(
        obtenerToken(req)
      );
      return respuestaExitosa(res, "Conversación obtenida.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async listarMensajesPublicos(req, res, next) {
    try {
      const datos = await chatService.listarMensajesPublicos(
        obtenerToken(req)
      );
      return respuestaExitosa(res, "Mensajes obtenidos.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async crearMensajePublico(req, res, next) {
    try {
      const datos = await chatService.crearMensajeExterno(
        obtenerToken(req),
        req.body
      );
      return respuestaExitosa(res, "Mensaje enviado.", datos, 201);
    } catch (error) {
      return next(error);
    }
  }

  async marcarMensajesPublicosLeidos(req, res, next) {
    try {
      const datos = await chatService.marcarMensajesAdministradorLeidos(
        obtenerToken(req)
      );
      return respuestaExitosa(res, "Mensajes marcados como leídos.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async listarConversaciones(req, res, next) {
    try {
      const datos = await chatService.listarConversaciones(req.query);
      return respuestaExitosa(res, "Conversaciones obtenidas.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async obtenerConversacion(req, res, next) {
    try {
      const datos = await chatService.obtenerConversacionAdministrativa(
        req.params.idConversacion
      );
      return respuestaExitosa(res, "Conversación obtenida.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async listarMensajes(req, res, next) {
    try {
      const datos = await chatService.listarMensajesAdministrativos(
        req.params.idConversacion
      );
      return respuestaExitosa(res, "Mensajes obtenidos.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async crearMensaje(req, res, next) {
    try {
      const datos = await chatService.crearMensajeAdministrador(
        req.params.idConversacion,
        req.body,
        contexto(req)
      );
      return respuestaExitosa(res, "Respuesta enviada.", datos, 201);
    } catch (error) {
      return next(error);
    }
  }

  async actualizarEstado(req, res, next) {
    try {
      const datos = await chatService.actualizarEstado(
        req.params.idConversacion,
        req.body,
        contexto(req)
      );
      return respuestaExitosa(res, "Estado actualizado.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async archivarConversacion(req, res, next) {
    try {
      const datos = await chatService.archivarConversacion(
        req.params.idConversacion,
        contexto(req)
      );
      return respuestaExitosa(res, "Conversación archivada.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async eliminarConversacion(req, res, next) {
    try {
      const datos = await chatService.eliminarConversacion(
        req.params.idConversacion,
        contexto(req)
      );
      return respuestaExitosa(res, "Conversación eliminada.", datos);
    } catch (error) {
      return next(error);
    }
  }

  async marcarMensajesLeidos(req, res, next) {
    try {
      const datos = await chatService.marcarMensajesExternosLeidos(
        req.params.idConversacion
      );
      return respuestaExitosa(res, "Mensajes marcados como leídos.", datos);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ChatController();
