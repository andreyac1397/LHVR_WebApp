class ContactoService {
  constructor(repositorio, auditoriaService = null) {
    this.repositorio = repositorio;
    this.auditoriaService = auditoriaService;
  }

  crearError(mensaje, codigo, statusCode = 400) {
    const error = new Error(mensaje);
    error.codigo = codigo;
    error.statusCode = statusCode;
    return error;
  }

  texto(valor, maximo) {
    const contenido = String(valor ?? "").trim();
    return contenido ? contenido.slice(0, maximo) : null;
  }

  async crear(datos, contexto = {}) {
    const nombreCompleto = this.texto(datos.nombreCompleto ?? datos.nombre, 180);
    const correo = this.texto(datos.correo ?? datos.email, 254)?.toLowerCase();
    const asunto = this.texto(datos.asunto, 250);
    const mensaje = this.texto(datos.mensaje, 4000);

    if (this.texto(datos.sitioWeb ?? datos.website, 300)) {
      return { recibido: true };
    }

    if (!nombreCompleto || nombreCompleto.length < 3) {
      throw this.crearError(
        "Indique su nombre completo (mínimo 3 caracteres).",
        "NOMBRE_CONTACTO_INVALIDO"
      );
    }

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      throw this.crearError(
        "Indique un correo electrónico válido.",
        "CORREO_CONTACTO_INVALIDO"
      );
    }

    if (!asunto || asunto.length < 3) {
      throw this.crearError(
        "Indique el asunto del mensaje.",
        "ASUNTO_CONTACTO_INVALIDO"
      );
    }

    if (!mensaje || mensaje.length < 10) {
      throw this.crearError(
        "El mensaje debe contener al menos 10 caracteres.",
        "MENSAJE_CONTACTO_INVALIDO"
      );
    }

    return this.repositorio.crear({
      nombreCompleto,
      correo,
      asunto,
      mensaje,
      direccionIp: this.texto(contexto.direccionIp, 45),
      userAgent: this.texto(contexto.userAgent, 500)
    });
  }

  listar(filtros = {}) {
    const idEstado = Number(filtros.idEstado);
    return this.repositorio.listar({
      idEstado: Number.isInteger(idEstado) && idEstado > 0 ? idEstado : null,
      busqueda: this.texto(filtros.busqueda, 250)
    });
  }

  async actualizar(id, datos, contexto = {}) {
    const idSolicitudContacto = Number(id);
    const idEstadoSolicitudContacto = Number(datos.idEstadoSolicitudContacto);

    if (!Number.isInteger(idSolicitudContacto) || idSolicitudContacto <= 0) {
      throw this.crearError("El mensaje indicado no es válido.", "ID_CONTACTO_INVALIDO");
    }

    if (!Number.isInteger(idEstadoSolicitudContacto) || idEstadoSolicitudContacto <= 0) {
      throw this.crearError("Seleccione un estado válido.", "ESTADO_CONTACTO_INVALIDO");
    }

    const actualizado = await this.repositorio.actualizar({
      idSolicitudContacto,
      idEstadoSolicitudContacto,
      observacionInterna: this.texto(datos.observacionInterna, 1500),
      esSpam: Boolean(datos.esSpam),
      idAdministrador: contexto.idAdministrador
    });

    if (!actualizado) {
      throw this.crearError("No se encontró el mensaje.", "CONTACTO_NO_ENCONTRADO", 404);
    }

    await this.auditoriaService?.registrarSinInterrumpir({
      idAdministrador: contexto.idAdministrador,
      codigoAccion: "CAMBIAR_ESTADO",
      codigoModulo: "CONTACTO",
      tablaAfectada: "solicitudes_contacto",
      idRegistroAfectado: String(idSolicitudContacto),
      datosAnteriores: null,
      datosNuevos: {
        idEstadoSolicitudContacto,
        esSpam: Boolean(datos.esSpam)
      },
      descripcion: "Se actualizó la atención de un mensaje de contacto.",
      direccionIp: contexto.direccionIp,
      userAgent: contexto.userAgent
    });

    return { idSolicitudContacto, actualizado: true };
  }
}

module.exports = ContactoService;
