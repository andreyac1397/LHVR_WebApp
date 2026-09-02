const crypto = require("node:crypto");

const BYTES_TOKEN = 32;
const MAXIMO_NOMBRE = 180;
const MAXIMO_CEDULA = 30;
const MAXIMO_MENSAJE = 4000;
const FORMATO_TOKEN = /^[A-Za-z0-9_-]{43}$/;

class ChatService {
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

  normalizarTexto(valor, maximo) {
    const texto = String(valor ?? "")
      .replace(/\u0000/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!texto) {
      return null;
    }
    if (texto.length > maximo) {
      throw this.crearError(
        `El texto no puede superar ${maximo} caracteres.`,
        "TEXTO_CHAT_DEMASIADO_LARGO"
      );
    }
    return texto;
  }

  recortarTexto(valor, maximo) {
    const texto = String(valor ?? "")
      .replace(/\u0000/g, "")
      .trim();
    return texto ? texto.slice(0, maximo) : null;
  }

  validarIdentidad(datos = {}) {
    const nombreCompleto = this.normalizarTexto(
      datos.nombreCompleto ?? datos.nombre,
      MAXIMO_NOMBRE
    );
    const cedula = this.normalizarTexto(datos.cedula, MAXIMO_CEDULA);

    if (!nombreCompleto || nombreCompleto.length < 3) {
      throw this.crearError(
        "Indique su nombre completo.",
        "NOMBRE_CHAT_INVALIDO"
      );
    }
    if (!cedula || cedula.length < 3) {
      throw this.crearError(
        "Indique una cédula o identificación válida.",
        "CEDULA_CHAT_INVALIDA"
      );
    }

    return { nombreCompleto, cedula };
  }

  validarMensaje(valor) {
    const mensaje = this.normalizarTexto(valor, MAXIMO_MENSAJE);
    if (!mensaje) {
      throw this.crearError(
        "Escriba un mensaje antes de enviarlo.",
        "MENSAJE_CHAT_VACIO"
      );
    }
    return mensaje;
  }

  generarToken() {
    return crypto.randomBytes(BYTES_TOKEN).toString("base64url");
  }

  obtenerHashToken(token) {
    const normalizado = String(token ?? "").trim();
    if (!FORMATO_TOKEN.test(normalizado)) {
      throw this.crearError(
        "El acceso a la conversación no es válido.",
        "TOKEN_CHAT_INVALIDO",
        401
      );
    }

    return crypto
      .createHash("sha256")
      .update(normalizado, "utf8")
      .digest("hex");
  }

  validarIdConversacion(id) {
    const idConversacion = Number(id);
    if (!Number.isSafeInteger(idConversacion) || idConversacion <= 0) {
      throw this.crearError(
        "La conversación indicada no es válida.",
        "ID_CONVERSACION_CHAT_INVALIDO"
      );
    }
    return idConversacion;
  }

  limpiarConversacionPublica(conversacion) {
    return {
      idConversacion: conversacion.idConversacion,
      nombreCompleto: conversacion.nombreCompleto,
      cedula: conversacion.cedula,
      idEstadoChat: conversacion.idEstadoChat,
      estado: conversacion.estado,
      fechaCreacion: conversacion.fechaCreacion,
      fechaUltimaActividad: conversacion.fechaUltimaActividad,
      fechaAtencion: conversacion.fechaAtencion,
      fechaCierre: conversacion.fechaCierre
    };
  }

  limpiarMensajePublico(mensaje) {
    return {
      idMensaje: mensaje.idMensaje,
      idConversacion: mensaje.idConversacion,
      tipoRemitente: mensaje.tipoRemitente,
      mensaje: mensaje.mensaje,
      fechaEnvio: mensaje.fechaEnvio,
      fechaLectura: mensaje.fechaLectura
    };
  }

  async obtenerConversacionPublicaPorHash(tokenAccesoHash) {
    const conversacion = await this.repositorio
      .buscarConversacionPublica(tokenAccesoHash);
    if (!conversacion) {
      throw this.crearError(
        "El acceso a la conversación no es válido o ya no existe.",
        "TOKEN_CHAT_INVALIDO",
        401
      );
    }
    return this.limpiarConversacionPublica(conversacion);
  }

  async crearConversacion(datos, contexto = {}) {
    datos = datos && typeof datos === "object" ? datos : {};
    const identidad = this.validarIdentidad(datos);
    const token = this.generarToken();
    const tokenAccesoHash = this.obtenerHashToken(token);
    const conversacion = await this.repositorio.crearConversacion({
      ...identidad,
      tokenAccesoHash,
      direccionIp: this.recortarTexto(contexto.direccionIp, 45),
      userAgent: this.recortarTexto(contexto.userAgent, 500)
    });

    return {
      token,
      conversacion: this.limpiarConversacionPublica(conversacion)
    };
  }

  async obtenerConversacionPublica(token) {
    const tokenAccesoHash = this.obtenerHashToken(token);
    return this.obtenerConversacionPublicaPorHash(tokenAccesoHash);
  }

  async listarMensajesPublicos(token) {
    const tokenAccesoHash = this.obtenerHashToken(token);
    const conversacion = await this.obtenerConversacionPublicaPorHash(
      tokenAccesoHash
    );
    const mensajes = await this.repositorio
      .listarMensajesPublicos(tokenAccesoHash);

    return {
      conversacion,
      mensajes: mensajes.map((mensaje) => this.limpiarMensajePublico(mensaje))
    };
  }

  async crearMensajeExterno(token, datos) {
    const tokenAccesoHash = this.obtenerHashToken(token);
    const mensaje = this.validarMensaje(datos?.mensaje);
    const creado = await this.repositorio.crearMensajeExterno({
      tokenAccesoHash,
      mensaje
    });
    return this.limpiarMensajePublico(creado);
  }

  async marcarMensajesAdministradorLeidos(token) {
    const tokenAccesoHash = this.obtenerHashToken(token);
    await this.obtenerConversacionPublicaPorHash(tokenAccesoHash);
    const actualizados = await this.repositorio
      .marcarMensajesAdministradorLeidos(tokenAccesoHash);
    return { actualizados };
  }

  listarConversaciones(filtros = {}) {
    const idEstadoChat = Number(filtros.idEstadoChat ?? filtros.idEstado);
    return this.repositorio.listarConversaciones({
      idEstadoChat:
        Number.isInteger(idEstadoChat) && idEstadoChat > 0
          ? idEstadoChat
          : null,
      busqueda: this.normalizarTexto(filtros.busqueda, 180)
    });
  }

  async obtenerConversacionAdministrativa(id) {
    const idConversacion = this.validarIdConversacion(id);
    const conversacion = await this.repositorio
      .obtenerConversacionAdministrativa(idConversacion);
    if (!conversacion) {
      throw this.crearError(
        "No se encontró la conversación.",
        "CONVERSACION_CHAT_NO_ENCONTRADA",
        404
      );
    }
    return conversacion;
  }

  async listarMensajesAdministrativos(id) {
    const conversacion = await this.obtenerConversacionAdministrativa(id);
    const mensajes = await this.repositorio
      .listarMensajesAdministrativos(conversacion.idConversacion);
    return { conversacion, mensajes };
  }

  async marcarMensajesExternosLeidos(id) {
    const conversacion = await this.obtenerConversacionAdministrativa(id);
    const actualizados = await this.repositorio
      .marcarMensajesExternosLeidos(conversacion.idConversacion);
    return {
      idConversacion: conversacion.idConversacion,
      actualizados
    };
  }

  async crearMensajeAdministrador(id, datos, contexto = {}) {
    const idConversacion = this.validarIdConversacion(id);
    const idAdministrador = Number(contexto.idAdministrador);
    if (!Number.isInteger(idAdministrador) || idAdministrador <= 0) {
      throw this.crearError(
        "La sesión administrativa no es válida.",
        "SESION_ADMIN_CHAT_INVALIDA",
        401
      );
    }
    const mensaje = this.validarMensaje(datos?.mensaje);
    const creado = await this.repositorio.crearMensajeAdministrador({
      idConversacion,
      idAdministrador,
      mensaje
    });

    await this.auditoriaService?.registrarSinInterrumpir({
      idAdministrador,
      codigoAccion: "CREAR",
      codigoModulo: "CHAT",
      tablaAfectada: "chat_mensajes",
      idRegistroAfectado: String(creado.idMensaje),
      descripcion: `Se respondió la conversación de chat #${idConversacion}.`,
      direccionIp: contexto.direccionIp,
      userAgent: contexto.userAgent
    });

    return creado;
  }

  async actualizarEstado(id, datos, contexto = {}) {
    const idConversacion = this.validarIdConversacion(id);
    const idAdministrador = Number(contexto.idAdministrador);
    if (!Number.isInteger(idAdministrador) || idAdministrador <= 0) {
      throw this.crearError(
        "La sesión administrativa no es válida.",
        "SESION_ADMIN_CHAT_INVALIDA",
        401
      );
    }

    const clave = String(datos?.estado ?? "")
      .trim()
      .toUpperCase()
      .replaceAll(" ", "_");
    const estadoDestino = {
      EN_ATENCION: "En atención",
      CERRADO: "Cerrado"
    }[clave];
    if (!estadoDestino) {
      throw this.crearError(
        "El estado solicitado no es válido.",
        "ESTADO_CHAT_INVALIDO"
      );
    }

    const actualizado = await this.repositorio.actualizarEstado({
      idConversacion,
      idAdministrador,
      estadoDestino
    });
    if (!actualizado) {
      throw this.crearError(
        "No se encontró la conversación.",
        "CONVERSACION_CHAT_NO_ENCONTRADA",
        404
      );
    }

    await this.auditoriaService?.registrarSinInterrumpir({
      idAdministrador,
      codigoAccion: "CAMBIAR_ESTADO",
      codigoModulo: "CHAT",
      tablaAfectada: "chat_conversaciones",
      idRegistroAfectado: String(idConversacion),
      datosNuevos: { estado: estadoDestino },
      descripcion: `Se cambió el estado del chat a ${estadoDestino}.`,
      direccionIp: contexto.direccionIp,
      userAgent: contexto.userAgent
    });

    return {
      idConversacion,
      estado: estadoDestino,
      actualizado: true
    };
  }

  async archivarConversacion(id, contexto = {}) {
    const idConversacion = this.validarIdConversacion(id);
    const idAdministrador = Number(contexto.idAdministrador);
    if (!Number.isInteger(idAdministrador) || idAdministrador <= 0) {
      throw this.crearError(
        "La sesión administrativa no es válida.",
        "SESION_ADMIN_CHAT_INVALIDA",
        401
      );
    }

    const actualizado = await this.repositorio.archivarConversacion({
      idConversacion,
      idAdministrador
    });
    if (!actualizado) {
      throw this.crearError(
        "No se encontró la conversación.",
        "CONVERSACION_CHAT_NO_ENCONTRADA",
        404
      );
    }

    await this.auditoriaService?.registrarSinInterrumpir({
      idAdministrador,
      codigoAccion: "CAMBIAR_ESTADO",
      codigoModulo: "CHAT",
      tablaAfectada: "chat_conversaciones",
      idRegistroAfectado: String(idConversacion),
      datosNuevos: { estado: "Archivado" },
      descripcion: `Se archivó la conversación de chat #${idConversacion}.`,
      direccionIp: contexto.direccionIp,
      userAgent: contexto.userAgent
    });

    return {
      idConversacion,
      estado: "Archivado",
      archivada: true
    };
  }

  async eliminarConversacion(id, contexto = {}) {
    const idConversacion = this.validarIdConversacion(id);
    const idAdministrador = Number(contexto.idAdministrador);
    if (!Number.isInteger(idAdministrador) || idAdministrador <= 0) {
      throw this.crearError(
        "La sesión administrativa no es válida.",
        "SESION_ADMIN_CHAT_INVALIDA",
        401
      );
    }

    const resultado = await this.repositorio.eliminarConversacion(
      idConversacion
    );
    if (!resultado?.eliminada) {
      throw this.crearError(
        "No se encontró la conversación.",
        "CONVERSACION_CHAT_NO_ENCONTRADA",
        404
      );
    }

    await this.auditoriaService?.registrarSinInterrumpir({
      idAdministrador,
      codigoAccion: "ELIMINAR",
      codigoModulo: "CHAT",
      tablaAfectada: "chat_conversaciones",
      idRegistroAfectado: String(idConversacion),
      descripcion: `Se eliminó la conversación de chat #${idConversacion} y sus mensajes.`,
      direccionIp: contexto.direccionIp,
      userAgent: contexto.userAgent
    });

    return {
      idConversacion,
      eliminada: true,
      mensajesEliminados: resultado.mensajesEliminados
    };
  }
}

ChatService.BYTES_TOKEN = BYTES_TOKEN;

module.exports = ChatService;
