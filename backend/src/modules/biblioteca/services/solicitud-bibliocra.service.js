const TIPOS = new Set(["ESTUDIANTE", "DOCENTE", "FUNCIONARIO", "ENCARGADO", "OTRO"]);

class SolicitudBibliocraService {
  constructor(repositorio, auditoriaService = null) {
    this.repositorio = repositorio;
    this.auditoriaService = auditoriaService;
  }

  error(mensaje, codigo, statusCode = 400) {
    const error = new Error(mensaje);
    error.codigo = codigo;
    error.statusCode = statusCode;
    return error;
  }

  texto(valor, maximo) {
    const texto = String(valor ?? "").trim();
    return texto ? texto.slice(0, maximo) : null;
  }

  async crear(datos, contexto = {}) {
    if (this.texto(datos.sitioWeb, 300)) return { recibido: true };

    const nombreSolicitante = this.texto(datos.nombreSolicitante ?? datos.nombreCompleto, 180);
    const identificacionSolicitante = this.texto(datos.identificacionSolicitante ?? datos.cedula, 30);
    const tipoSolicitante = String(datos.tipoSolicitante ?? datos.tipoUsuario ?? "OTRO")
      .trim().toUpperCase().replace("ADMINISTRATIVO", "FUNCIONARIO");
    const correo = this.texto(datos.correo, 254)?.toLowerCase();
    const telefono = this.texto(datos.telefono, 30);
    const nivelSeccion = this.texto(datos.nivelSeccion ?? datos.seccion, 50);
    const nombreMaterial = this.texto(datos.nombreMaterial ?? datos.titulo, 250);

    if (!nombreSolicitante || !identificacionSolicitante || !telefono) {
      throw this.error("Complete los datos obligatorios de la persona solicitante.", "SOLICITANTE_BIBLIOCRA_INCOMPLETO");
    }
    if (!TIPOS.has(tipoSolicitante)) {
      throw this.error("El tipo de usuario no es válido.", "TIPO_SOLICITANTE_INVALIDO");
    }
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      throw this.error("El correo electrónico no es válido.", "CORREO_BIBLIOCRA_INVALIDO");
    }
    if (!nombreMaterial) {
      throw this.error("Indique el material solicitado.", "MATERIAL_BIBLIOCRA_REQUERIDO");
    }

    const detalles = [
      datos.autor && `Autor: ${this.texto(datos.autor, 250)}`,
      datos.signatura && `Signatura: ${this.texto(datos.signatura, 120)}`,
      datos.fechaSolicitud && `Fecha solicitada: ${this.texto(datos.fechaSolicitud, 20)}`,
      datos.fechaDevolucion && `Devolución prevista: ${this.texto(datos.fechaDevolucion, 20)}`
    ].filter(Boolean).join(" · ");

    return this.repositorio.crear({
      nombreSolicitante,
      identificacionSolicitante,
      tipoSolicitante,
      correo,
      telefono,
      nivelSeccion,
      observacionesSolicitante: this.texto(datos.observacionesSolicitante, 1500),
      nombreMaterial,
      tipoMaterial: this.texto(datos.tipoPrestamo, 120),
      observacionesMaterial: detalles.slice(0, 800) || null,
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
    const idSolicitudBibliocra = Number(id);
    const idEstadoSolicitud = Number(datos.idEstadoSolicitud);

    if (!Number.isInteger(idSolicitudBibliocra) || idSolicitudBibliocra <= 0 ||
        !Number.isInteger(idEstadoSolicitud) || idEstadoSolicitud <= 0) {
      throw this.error("La solicitud o el estado no son válidos.", "SOLICITUD_BIBLIOCRA_INVALIDA");
    }

    const actualizado = await this.repositorio.actualizar({
      idSolicitudBibliocra,
      idEstadoSolicitud,
      observacionesInternas: this.texto(datos.observacionesInternas, 1500),
      idAdministrador: contexto.idAdministrador
    });

    if (!actualizado) throw this.error("No se encontró la solicitud.", "BIBLIOCRA_NO_ENCONTRADA", 404);

    await this.auditoriaService?.registrarSinInterrumpir({
      idAdministrador: contexto.idAdministrador,
      codigoAccion: "CAMBIAR_ESTADO",
      codigoModulo: "BIBLIOTECA",
      tablaAfectada: "solicitudes_bibliocra",
      idRegistroAfectado: String(idSolicitudBibliocra),
      datosNuevos: { idEstadoSolicitud },
      descripcion: "Se actualizó la atención de una solicitud BiblioCRA.",
      direccionIp: contexto.direccionIp,
      userAgent: contexto.userAgent
    });

    return { idSolicitudBibliocra, actualizado: true };
  }
}

module.exports = SolicitudBibliocraService;
