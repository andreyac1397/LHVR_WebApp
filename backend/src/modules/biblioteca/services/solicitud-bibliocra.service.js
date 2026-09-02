const TIPOS = new Set([
  "ESTUDIANTE",
  "DOCENTE",
  "FUNCIONARIO",
  "ENCARGADO",
  "OTRO"
]);
const TIPOS_PRESTAMO = new Set(["SALA", "AULA", "HOGAR"]);
const TIPOS_DESTINATARIO = new Set([
  "DOCENTE",
  "ADMINISTRADOR",
  "PADRE_MADRE",
  "ESTUDIANTE",
  "SECRETARIA"
]);
const MAXIMO_DESTINATARIOS = 3;
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class SolicitudBibliocraService {
  constructor(
    repositorio,
    auditoriaService = null,
    correoService = null
  ) {
    this.repositorio = repositorio;
    this.auditoriaService = auditoriaService;
    this.correoService = correoService;
  }

  error(mensaje, codigo, statusCode = 400) {
    const error = new Error(mensaje);
    error.codigo = codigo;
    error.statusCode = statusCode;
    return error;
  }

  texto(valor, maximo = Number.MAX_SAFE_INTEGER) {
    const texto = String(valor ?? "").trim();
    return texto ? texto.slice(0, maximo) : null;
  }

  validarTexto(
    valor,
    { campo, maximo, requerido = true }
  ) {
    const normalizado = String(valor ?? "").trim();

    if (!normalizado) {
      if (requerido) {
        throw this.error(
          `El campo ${campo} es obligatorio.`,
          "CAMPO_BIBLIOCRA_REQUERIDO"
        );
      }
      return null;
    }

    if (normalizado.length > maximo) {
      throw this.error(
        `El campo ${campo} no puede superar ${maximo} caracteres.`,
        "CAMPO_BIBLIOCRA_DEMASIADO_LARGO"
      );
    }

    return normalizado;
  }

  validarFecha(valor, campo) {
    const fecha = this.validarTexto(valor, {
      campo,
      maximo: 10
    });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw this.error(
        `La ${campo} no tiene un formato válido.`,
        "FECHA_BIBLIOCRA_INVALIDA"
      );
    }

    const [anio, mes, dia] = fecha.split("-").map(Number);
    const comprobacion = new Date(Date.UTC(anio, mes - 1, dia));
    if (
      comprobacion.getUTCFullYear() !== anio ||
      comprobacion.getUTCMonth() !== mes - 1 ||
      comprobacion.getUTCDate() !== dia
    ) {
      throw this.error(
        `La ${campo} no es una fecha válida.`,
        "FECHA_BIBLIOCRA_INVALIDA"
      );
    }

    return fecha;
  }

  validarCorreo(valor, requerido = false) {
    const correo = this.validarTexto(valor, {
      campo: "correo electrónico",
      maximo: 254,
      requerido
    })?.toLowerCase() || null;

    if (correo && !FORMATO_CORREO.test(correo)) {
      throw this.error(
        "El correo electrónico no es válido.",
        "CORREO_BIBLIOCRA_INVALIDO"
      );
    }

    return correo;
  }

  escaparHtml(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  crearCorreoSolicitud(solicitud) {
    const filas = [
      ["Solicitud", `#${solicitud.idSolicitudBibliocra}`],
      ["Material", solicitud.nombreMaterial],
      ["Autor", solicitud.autor],
      ["Signatura", solicitud.signatura],
      ["Tipo de préstamo", solicitud.tipoPrestamo],
      ["Fecha de solicitud", solicitud.fechaSolicitud],
      ["Fecha de devolución", solicitud.fechaDevolucion],
      ["Solicitante", solicitud.nombreSolicitante],
      ["Identificación", solicitud.identificacionSolicitante],
      ["Tipo de usuario", solicitud.tipoSolicitante],
      ["Sección", solicitud.nivelSeccion],
      ["Teléfono", solicitud.telefono],
      ["Correo", solicitud.correo]
    ].filter(([, valor]) => valor);

    const texto = [
      "Nueva solicitud BiblioCRA",
      "",
      ...filas.map(([etiqueta, valor]) => `${etiqueta}: ${valor}`),
      "",
      "La solicitud ya fue registrada en el panel administrativo."
    ].join("\n");

    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head><meta charset="UTF-8"><title>Nueva solicitud BiblioCRA</title></head>
        <body style="margin:0;padding:24px;background:#f3f5f4;font-family:Arial,sans-serif;color:#26332d">
          <div style="max-width:680px;margin:auto;border:1px solid #dfe6e2;border-radius:12px;overflow:hidden;background:#fff">
            <div style="padding:22px;background:#185c37;color:#fff">
              <h1 style="margin:0;font-size:22px">Nueva solicitud BiblioCRA</h1>
            </div>
            <div style="padding:24px">
              <p>Se registró una nueva solicitud de préstamo de materiales.</p>
              <table style="width:100%;border-collapse:collapse">
                ${filas.map(([etiqueta, valor]) => `
                  <tr>
                    <th style="padding:8px;border-bottom:1px solid #e4e8e5;text-align:left">${this.escaparHtml(etiqueta)}</th>
                    <td style="padding:8px;border-bottom:1px solid #e4e8e5">${this.escaparHtml(valor)}</td>
                  </tr>
                `).join("")}
              </table>
              <p style="margin-bottom:0;color:#66736d">La solicitud ya está disponible en el panel administrativo.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return {
      asunto: "Nueva solicitud BiblioCRA",
      texto,
      html
    };
  }

  crearCorreoRecepcionSolicitante(solicitud) {
    const id = solicitud.idSolicitudBibliocra;
    const nombre = solicitud.nombreSolicitante;
    const material = solicitud.nombreMaterial;
    const asunto = `Solicitud BiblioCRA recibida #${id}`;
    const texto = [
      `Hola ${nombre},`,
      "",
      `Recibimos correctamente su solicitud BiblioCRA #${id}.`,
      `Material: ${material}`,
      "Estado: Nueva",
      "",
      "Su solicitud está pendiente de revisión. Espere la respuesta de la biblioteca."
    ].join("\n");
    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head><meta charset="UTF-8"><title>${this.escaparHtml(asunto)}</title></head>
        <body style="margin:0;padding:24px;background:#f3f5f4;font-family:Arial,sans-serif;color:#26332d">
          <div style="max-width:680px;margin:auto;border:1px solid #dfe6e2;border-radius:12px;overflow:hidden;background:#fff">
            <div style="padding:22px;background:#185c37;color:#fff">
              <h1 style="margin:0;font-size:22px">Solicitud BiblioCRA recibida</h1>
            </div>
            <div style="padding:24px">
              <p>Hola <strong>${this.escaparHtml(nombre)}</strong>,</p>
              <p>Recibimos correctamente su solicitud <strong>#${id}</strong>.</p>
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <th style="padding:8px;border-bottom:1px solid #e4e8e5;text-align:left">Material</th>
                  <td style="padding:8px;border-bottom:1px solid #e4e8e5">${this.escaparHtml(material)}</td>
                </tr>
                <tr>
                  <th style="padding:8px;border-bottom:1px solid #e4e8e5;text-align:left">Estado</th>
                  <td style="padding:8px;border-bottom:1px solid #e4e8e5">Nueva</td>
                </tr>
              </table>
              <p>Su solicitud está pendiente de revisión. Espere la respuesta de la biblioteca.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return { asunto, texto, html };
  }

  crearCorreoCambioEstadoSolicitante(solicitud) {
    const id = solicitud.idSolicitudBibliocra;
    const nombre = solicitud.nombreSolicitante;
    const estado = solicitud.estado;
    const descripcion = solicitud.observacionesInternas ||
      solicitud.descripcionEstado ||
      "La biblioteca actualizó su solicitud.";
    const asunto = `Solicitud BiblioCRA #${id}: ${estado}`;
    const texto = [
      `Hola ${nombre},`,
      "",
      `El estado de su solicitud BiblioCRA #${id} cambió a: ${estado}.`,
      solicitud.nombreMaterial
        ? `Material: ${solicitud.nombreMaterial}`
        : null,
      `Mensaje de la biblioteca: ${descripcion}`
    ].filter(Boolean).join("\n");
    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head><meta charset="UTF-8"><title>${this.escaparHtml(asunto)}</title></head>
        <body style="margin:0;padding:24px;background:#f3f5f4;font-family:Arial,sans-serif;color:#26332d">
          <div style="max-width:680px;margin:auto;border:1px solid #dfe6e2;border-radius:12px;overflow:hidden;background:#fff">
            <div style="padding:22px;background:#185c37;color:#fff">
              <h1 style="margin:0;font-size:22px">Actualización de solicitud BiblioCRA</h1>
            </div>
            <div style="padding:24px">
              <p>Hola <strong>${this.escaparHtml(nombre)}</strong>,</p>
              <p>Su solicitud <strong>#${id}</strong> cambió de estado.</p>
              <table style="width:100%;border-collapse:collapse">
                ${solicitud.nombreMaterial ? `
                  <tr>
                    <th style="padding:8px;border-bottom:1px solid #e4e8e5;text-align:left">Material</th>
                    <td style="padding:8px;border-bottom:1px solid #e4e8e5">${this.escaparHtml(solicitud.nombreMaterial)}</td>
                  </tr>
                ` : ""}
                <tr>
                  <th style="padding:8px;border-bottom:1px solid #e4e8e5;text-align:left">Nuevo estado</th>
                  <td style="padding:8px;border-bottom:1px solid #e4e8e5"><strong>${this.escaparHtml(estado)}</strong></td>
                </tr>
              </table>
              <p><strong>Mensaje de la biblioteca:</strong></p>
              <p style="padding:14px;border-radius:8px;background:#f3f5f4;white-space:pre-wrap">${this.escaparHtml(descripcion)}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return { asunto, texto, html };
  }

  async notificarSolicitante(solicitud, crearContenido) {
    if (!this.correoService?.enviarCorreo || !solicitud.correo) {
      return false;
    }

    try {
      await this.correoService.enviarCorreo({
        destinatario: solicitud.correo,
        ...crearContenido.call(this, solicitud)
      });
      return true;
    } catch (error) {
      console.error(
        `No se pudo notificar al solicitante BiblioCRA #${solicitud.idSolicitudBibliocra}:`,
        error.message
      );
      return false;
    }
  }

  async notificarSolicitud(solicitud) {
    if (!this.correoService?.enviarCorreo) {
      return {
        configurados: 0,
        enviados: 0,
        fallidos: 0
      };
    }

    let destinatarios;
    try {
      destinatarios = await this.repositorio.listarDestinatarios();
    } catch (error) {
      console.error(
        "No fue posible consultar los destinatarios BiblioCRA:",
        error.message
      );
      return {
        configurados: 0,
        enviados: 0,
        fallidos: 0
      };
    }

    if (!destinatarios.length) {
      return {
        configurados: 0,
        enviados: 0,
        fallidos: 0
      };
    }

    const contenido = this.crearCorreoSolicitud(solicitud);
    const resultados = await Promise.allSettled(
      destinatarios.map((destinatario) =>
        this.correoService.enviarCorreo({
          destinatario: destinatario.correo,
          ...contenido
        })
      )
    );
    const enviados = resultados.filter(
      (resultado) => resultado.status === "fulfilled"
    ).length;
    const fallidos = resultados.length - enviados;

    if (fallidos) {
      console.error(
        `No se pudieron enviar ${fallidos} notificaciones BiblioCRA.`
      );
    }

    return {
      configurados: destinatarios.length,
      enviados,
      fallidos
    };
  }

  async crear(datos, contexto = {}) {
    datos = datos && typeof datos === "object" ? datos : {};

    if (this.texto(datos.sitioWeb, 300)) {
      return { recibido: true };
    }

    const nombreSolicitante = this.validarTexto(
      datos.nombreSolicitante ?? datos.nombreCompleto,
      { campo: "nombre del usuario", maximo: 180 }
    );
    const identificacionSolicitante = this.validarTexto(
      datos.identificacionSolicitante ?? datos.cedula,
      { campo: "carné o cédula", maximo: 30 }
    );
    const tipoSolicitante = String(
      datos.tipoSolicitante ?? datos.tipoUsuario ?? ""
    ).trim().toUpperCase().replace("ADMINISTRATIVO", "FUNCIONARIO");
    const correo = this.validarCorreo(datos.correo, true);
    const telefono = this.validarTexto(datos.telefono, {
      campo: "teléfono",
      maximo: 30
    });
    const nivelSeccion = this.validarTexto(
      datos.nivelSeccion ?? datos.seccion,
      { campo: "sección", maximo: 50 }
    );
    const nombreMaterial = this.validarTexto(
      datos.nombreMaterial ?? datos.titulo,
      { campo: "título del material", maximo: 250 }
    );
    const autor = this.validarTexto(datos.autor, {
      campo: "autor",
      maximo: 250
    });
    const signatura = this.validarTexto(datos.signatura, {
      campo: "signatura",
      maximo: 120
    });
    const fechaSolicitud = this.validarFecha(
      datos.fechaSolicitud ?? datos.fecha,
      "fecha de solicitud"
    );
    const fechaDevolucion = this.validarFecha(
      datos.fechaDevolucion,
      "fecha de devolución"
    );
    const tipoPrestamo = String(datos.tipoPrestamo ?? "").trim().toUpperCase();

    if (!TIPOS.has(tipoSolicitante)) {
      throw this.error(
        "El tipo de usuario no es válido.",
        "TIPO_SOLICITANTE_INVALIDO"
      );
    }
    if (!TIPOS_PRESTAMO.has(tipoPrestamo)) {
      throw this.error(
        "El tipo de préstamo no es válido.",
        "TIPO_PRESTAMO_BIBLIOCRA_INVALIDO"
      );
    }
    if (fechaDevolucion < fechaSolicitud) {
      throw this.error(
        "La fecha de devolución no puede ser anterior a la solicitud.",
        "FECHAS_BIBLIOCRA_INCONSISTENTES"
      );
    }

    const confirmacion = [true, "true", "on", 1, "1"].includes(
      datos.confirmacion
    );
    if (!confirmacion) {
      throw this.error(
        "Debe confirmar las condiciones del préstamo.",
        "CONFIRMACION_BIBLIOCRA_REQUERIDA"
      );
    }

    const detalles = [
      `Autor: ${autor}`,
      `Signatura: ${signatura}`,
      `Fecha solicitada: ${fechaSolicitud}`,
      `Devolución prevista: ${fechaDevolucion}`
    ].join(" · ");

    const registro = await this.repositorio.crear({
      nombreSolicitante,
      identificacionSolicitante,
      tipoSolicitante,
      correo,
      telefono,
      nivelSeccion,
      observacionesSolicitante: this.validarTexto(
        datos.observacionesSolicitante,
        {
          campo: "observaciones",
          maximo: 1500,
          requerido: false
        }
      ),
      nombreMaterial,
      tipoMaterial: tipoPrestamo,
      observacionesMaterial: detalles,
      direccionIp: this.texto(contexto.direccionIp, 45),
      userAgent: this.texto(contexto.userAgent, 500)
    });

    const solicitudCreada = {
      ...registro,
      nombreSolicitante,
      identificacionSolicitante,
      tipoSolicitante,
      correo,
      telefono,
      nivelSeccion,
      nombreMaterial,
      autor,
      signatura,
      fechaSolicitud,
      fechaDevolucion,
      tipoPrestamo
    };
    const notificacion = await this.notificarSolicitud(solicitudCreada);
    const confirmacionSolicitanteEnviada = await this.notificarSolicitante(
      solicitudCreada,
      this.crearCorreoRecepcionSolicitante
    );

    return {
      ...registro,
      notificacion,
      confirmacionSolicitanteEnviada
    };
  }

  listar(filtros = {}) {
    const idEstado = Number(filtros.idEstado);
    const paginaRecibida = Number(filtros.pagina);
    const limiteRecibido = Number(filtros.limite);
    return this.repositorio.listar({
      idEstado: Number.isInteger(idEstado) && idEstado > 0
        ? idEstado
        : null,
      busqueda: this.texto(filtros.busqueda, 250),
      pagina:
        Number.isInteger(paginaRecibida) && paginaRecibida > 0
          ? paginaRecibida
          : 1,
      limite:
        Number.isInteger(limiteRecibido) && limiteRecibido > 0
          ? Math.min(100, limiteRecibido)
          : 20
    });
  }

  async listarDestinatarios() {
    const destinatarios = await this.repositorio.listarDestinatarios();
    return {
      destinatarios,
      maximo: MAXIMO_DESTINATARIOS,
      disponibles: Math.max(0, MAXIMO_DESTINATARIOS - destinatarios.length)
    };
  }

  async agregarDestinatario(datos, contexto = {}) {
    datos = datos && typeof datos === "object" ? datos : {};
    const nombre = this.validarTexto(datos.nombre, {
      campo: "nombre del destinatario",
      maximo: 150
    });
    const correo = this.validarCorreo(datos?.correo, true);
    const tipo = String(datos.tipo ?? "").trim().toUpperCase();

    if (!TIPOS_DESTINATARIO.has(tipo)) {
      throw this.error(
        "El tipo de destinatario no es válido.",
        "TIPO_DESTINATARIO_BIBLIOCRA_INVALIDO"
      );
    }

    const actuales = await this.repositorio.listarDestinatarios();

    if (
      actuales.some(
        (destinatario) => destinatario.correo.toLowerCase() === correo
      )
    ) {
      throw this.error(
        "El correo ya recibe solicitudes BiblioCRA.",
        "DESTINATARIO_BIBLIOCRA_DUPLICADO",
        409
      );
    }

    if (actuales.length >= MAXIMO_DESTINATARIOS) {
      throw this.error(
        "Solo se permiten tres destinatarios BiblioCRA.",
        "MAXIMO_DESTINATARIOS_BIBLIOCRA",
        409
      );
    }

    const destinatario = await this.repositorio.agregarDestinatario({
      nombre,
      correo,
      tipo,
      idAdministrador: contexto.idAdministrador
    });

    await this.auditoriaService?.registrarSinInterrumpir({
      idAdministrador: contexto.idAdministrador,
      codigoAccion: "CREAR",
      codigoModulo: "BIBLIOTECA",
      tablaAfectada: "destinatarios_bibliocra",
      idRegistroAfectado: String(destinatario.idDestinatario),
      datosNuevos: { nombre, correo, tipo },
      descripcion: "Se agregó un destinatario de solicitudes BiblioCRA.",
      direccionIp: contexto.direccionIp,
      userAgent: contexto.userAgent
    });

    return destinatario;
  }

  async eliminarDestinatario(id, contexto = {}) {
    const idDestinatario = Number(id);
    if (!Number.isInteger(idDestinatario) || idDestinatario <= 0) {
      throw this.error(
        "El destinatario no es válido.",
        "DESTINATARIO_BIBLIOCRA_INVALIDO"
      );
    }

    const eliminado = await this.repositorio.eliminarDestinatario(
      idDestinatario
    );
    if (!eliminado) {
      throw this.error(
        "No se encontró el correo destinatario.",
        "DESTINATARIO_BIBLIOCRA_NO_ENCONTRADO",
        404
      );
    }

    await this.auditoriaService?.registrarSinInterrumpir({
      idAdministrador: contexto.idAdministrador,
      codigoAccion: "ELIMINAR",
      codigoModulo: "BIBLIOTECA",
      tablaAfectada: "destinatarios_bibliocra",
      idRegistroAfectado: String(idDestinatario),
      descripcion: "Se eliminó un destinatario de solicitudes BiblioCRA.",
      direccionIp: contexto.direccionIp,
      userAgent: contexto.userAgent
    });

    return {
      idDestinatario,
      eliminado: true
    };
  }

  async actualizar(id, datos, contexto = {}) {
    datos = datos && typeof datos === "object" ? datos : {};

    const idSolicitudBibliocra = Number(id);
    const idEstadoSolicitud = Number(datos.idEstadoSolicitud);

    if (
      !Number.isInteger(idSolicitudBibliocra) ||
      idSolicitudBibliocra <= 0 ||
      !Number.isInteger(idEstadoSolicitud) ||
      idEstadoSolicitud <= 0
    ) {
      throw this.error(
        "La solicitud o el estado no son válidos.",
        "SOLICITUD_BIBLIOCRA_INVALIDA"
      );
    }

    const resultado = await this.repositorio.actualizar({
      idSolicitudBibliocra,
      idEstadoSolicitud,
      observacionesInternas: this.validarTexto(
        datos.observacionesInternas,
        {
          campo: "mensaje para la persona solicitante",
          maximo: 1500,
          requerido: false
        }
      ),
      idAdministrador: contexto.idAdministrador
    });

    if (!resultado?.actualizado) {
      throw this.error(
        "No se encontró la solicitud.",
        "BIBLIOCRA_NO_ENCONTRADA",
        404
      );
    }

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

    let notificacionSolicitanteEnviada = false;
    if (resultado.cambioEstado) {
      notificacionSolicitanteEnviada = await this.notificarSolicitante(
        resultado,
        this.crearCorreoCambioEstadoSolicitante
      );
    }

    return {
      idSolicitudBibliocra,
      actualizado: true,
      cambioEstado: Boolean(resultado.cambioEstado),
      notificacionSolicitanteEnviada
    };
  }
}

module.exports = SolicitudBibliocraService;
