const ESTADOS_SOLICITUD = new Set([
  "PENDIENTE",
  "EN_PROCESO",
  "ATENDIDA",
  "RECHAZADA",
  "ARCHIVADA"
]);

class SolicitudService {
  constructor(modulo, repositorio, auditoriaService = null) {
    this.modulo = String(modulo || "").trim().toUpperCase();
    this.repositorio = repositorio;
    this.auditoriaService = auditoriaService;
  }

  crearError(mensaje, codigo, statusCode = 400) {
    const error = new Error(mensaje);

    error.codigo = codigo;
    error.statusCode = statusCode;

    return error;
  }

  texto(valor, maximo = null) {
    const contenido = String(valor || "").trim();

    if (!contenido) {
      return null;
    }

    return maximo
      ? contenido.slice(0, maximo)
      : contenido;
  }

  validarCorreo(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  }

  async crear(datos) {
    const nombreCompleto = this.texto(
      datos.nombreCompleto ?? datos.nombre,
      180
    );
    const correo = this.texto(datos.correo, 254)?.toLowerCase();
    const mensaje = this.texto(
      datos.mensaje ?? datos.descripcion
    );

    if (!nombreCompleto) {
      throw this.crearError(
        "Debe indicar el nombre completo.",
        "NOMBRE_SOLICITUD_REQUERIDO"
      );
    }

    if (!correo || !this.validarCorreo(correo)) {
      throw this.crearError(
        "Debe indicar un correo electrónico válido.",
        "CORREO_SOLICITUD_INVALIDO"
      );
    }

    if (!mensaje) {
      throw this.crearError(
        "Debe indicar el detalle de la solicitud.",
        "MENSAJE_SOLICITUD_REQUERIDO"
      );
    }

    return this.repositorio.crear({
      modulo: this.modulo,
      nombreCompleto,
      correo,
      telefono: this.texto(datos.telefono, 40),
      asunto: this.texto(datos.asunto, 250),
      mensaje,
      datos:
        datos.datos && typeof datos.datos === "object"
          ? datos.datos
          : {}
    });
  }

  async listar(filtros = {}) {
    return this.repositorio.listar(this.modulo, {
      estado: this.texto(filtros.estado, 30)?.toUpperCase(),
      busqueda: this.texto(filtros.busqueda, 250)
    });
  }

  async actualizar(idSolicitud, datos, contexto = {}) {
    const id = Number(idSolicitud);
    const estado = String(datos.estado || "")
      .trim()
      .toUpperCase();

    if (!Number.isInteger(id) || id <= 0) {
      throw this.crearError(
        "El identificador de la solicitud no es válido.",
        "ID_SOLICITUD_INVALIDO"
      );
    }

    if (!ESTADOS_SOLICITUD.has(estado)) {
      throw this.crearError(
        "El estado de la solicitud no es válido.",
        "ESTADO_SOLICITUD_INVALIDO"
      );
    }

    const resultado = await this.repositorio.actualizar({
      idSolicitud: id,
      modulo: this.modulo,
      estado,
      respuesta: this.texto(datos.respuesta),
      idAdministrador: contexto.idAdministrador
    });

    if (this.auditoriaService) {
      await this.auditoriaService.registrarSinInterrumpir({
        idAdministrador: contexto.idAdministrador ?? null,
        codigoAccion: "ACTUALIZAR_SOLICITUD",
        codigoModulo: this.modulo,
        tablaAfectada: "cms_solicitudes",
        idRegistroAfectado: String(id),
        datosAnteriores: null,
        datosNuevos: {
          estado,
          respuesta: resultado.respuesta
        },
        descripcion:
          `Se actualizó una solicitud del módulo ${this.modulo}.`,
        direccionIp: contexto.direccionIp ?? null,
        userAgent: contexto.userAgent ?? null
      });
    }

    return resultado;
  }
}

module.exports = SolicitudService;
