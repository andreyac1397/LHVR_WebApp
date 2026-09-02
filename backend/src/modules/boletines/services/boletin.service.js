const ContenidoService = require(
  "../../../shared/content-management/contenido.service"
);
const { MODULOS_CONTENIDO } = require(
  "../../../shared/content-management/contenido-modulos"
);

/** Servicio de contenido y correo del módulo Boletines. */
class BoletinService extends ContenidoService {
  constructor(repositorio, auditoriaService = null, correoService = null) {
    super(MODULOS_CONTENIDO.BOLETINES, repositorio, auditoriaService);
    this.correoService = correoService;
  }

  idPositivo(valor, nombre = "identificador") {
    const id = Number(valor);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw this.crearError(
        `El ${nombre} no es válido.`,
        "IDENTIFICADOR_INVALIDO"
      );
    }
    return id;
  }

  idsUnicos(valores) {
    if (!Array.isArray(valores)) return [];
    return [...new Set(valores
      .map(Number)
      .filter((id) => Number.isSafeInteger(id) && id > 0))];
  }

  normalizarSeleccion(datos = {}) {
    const criteriosBusqueda = Array.isArray(datos.criteriosBusqueda)
      ? [...new Set(datos.criteriosBusqueda
        .map((valor) => this.texto(valor, 250)?.toLowerCase())
        .filter(Boolean))]
      : [];
    return {
      idsCategorias: this.idsUnicos(datos.idsCategorias),
      idsDestinatarios: this.idsUnicos(datos.idsDestinatarios),
      criteriosBusqueda,
      idsExcluidos: this.idsUnicos(datos.idsExcluidos)
    };
  }

  async listarCategoriasCorreo() {
    return {
      categorias: await this.repositorio.listarCategoriasCorreo()
    };
  }

  async listarDestinatariosCorreo(filtros = {}) {
    let activo = null;
    if (["1", "true", "activo"].includes(String(filtros.activo).toLowerCase())) {
      activo = true;
    } else if (["0", "false", "inactivo"].includes(String(filtros.activo).toLowerCase())) {
      activo = false;
    }
    return this.repositorio.listarDestinatariosCorreo({
      busqueda: this.texto(filtros.buscar || filtros.busqueda, 250),
      idCategoria: filtros.idCategoria
        ? this.idPositivo(filtros.idCategoria, "identificador de categoría")
        : null,
      activo,
      pagina: Math.max(1, Number(filtros.pagina || 1)),
      limite: Math.min(100, Math.max(1, Number(filtros.limite || 20)))
    });
  }

  async obtenerDestinatarioCorreo(idDestinatario) {
    const destinatario = await this.repositorio.obtenerDestinatarioCorreo(
      this.idPositivo(idDestinatario, "identificador del destinatario")
    );
    if (!destinatario) {
      throw this.crearError(
        "No se encontró el destinatario indicado.",
        "DESTINATARIO_CORREO_NO_ENCONTRADO",
        404
      );
    }
    return destinatario;
  }

  async guardarDestinatarioCorreo(datos = {}, contexto = {}) {
    const nombreCompleto = this.texto(datos.nombreCompleto, 180);
    const correo = this.texto(datos.correo, 254)?.toLowerCase();
    const idsCategorias = this.idsUnicos(datos.idsCategorias);

    if (!nombreCompleto) {
      throw this.crearError(
        "El nombre completo es obligatorio.",
        "NOMBRE_DESTINATARIO_REQUERIDO"
      );
    }
    if (!correo) {
      throw this.crearError(
        "El correo electrónico es obligatorio.",
        "CORREO_DESTINATARIO_REQUERIDO"
      );
    }
    if (!this.correoService?.correoEsValido(correo)) {
      throw this.crearError(
        "El formato del correo electrónico no es válido.",
        "CORREO_DESTINATARIO_INVALIDO"
      );
    }
    if (idsCategorias.length === 0) {
      throw this.crearError(
        "Seleccione al menos una categoría.",
        "CATEGORIA_DESTINATARIO_REQUERIDA"
      );
    }

    return this.repositorio.guardarDestinatarioCorreo({
      idDestinatario: datos.idDestinatario
        ? this.idPositivo(datos.idDestinatario, "identificador del destinatario")
        : null,
      nombreCompleto,
      correo,
      idsCategorias,
      activo: datos.activo === undefined || datos.activo === true ||
        ["1", "true", "activo"].includes(String(datos.activo).toLowerCase()),
      idAdministrador: contexto.idAdministrador
    });
  }

  async cambiarEstadoDestinatarioCorreo(idDestinatario, activo, contexto = {}) {
    const estadoActivo = activo === true ||
      ["1", "true", "activo"].includes(String(activo).toLowerCase());
    const cambiado = await this.repositorio.cambiarEstadoDestinatarioCorreo({
      idDestinatario: this.idPositivo(idDestinatario, "identificador del destinatario"),
      activo: estadoActivo,
      idAdministrador: contexto.idAdministrador
    });
    if (!cambiado) {
      throw this.crearError(
        "No se encontró el destinatario indicado.",
        "DESTINATARIO_CORREO_NO_ENCONTRADO",
        404
      );
    }
    return this.obtenerDestinatarioCorreo(idDestinatario);
  }

  async resolverSeleccionCorreo(datos = {}) {
    const seleccion = this.normalizarSeleccion(datos);
    const encontrados = await this.repositorio.resolverSeleccionCorreo(seleccion);
    const porCorreo = new Map();
    encontrados.forEach((destinatario) => {
      const correo = this.texto(destinatario.correo, 254)?.toLowerCase();
      if (correo && !porCorreo.has(correo)) {
        porCorreo.set(correo, { ...destinatario, correo });
      }
    });
    const destinatarios = [...porCorreo.values()];
    const resumen = {
      totalUnicos: destinatarios.length,
      porCategoria: destinatarios.filter((item) => item.porCategoria).length,
      porIndividual: destinatarios.filter((item) => item.porIndividual).length,
      porBusqueda: destinatarios.filter((item) => item.porBusqueda).length
    };
    return { seleccion, resumen, destinatarios };
  }

  etiquetaTipo(tipo) {
    const normalizado = String(tipo || "boletin")
      .trim().toLowerCase().replace(/s$/, "");
    return ({
      circular: "Circular",
      comunicado: "Comunicado",
      noticia: "Noticia",
      actividad: "Actividad",
      recordatorio: "Recordatorio",
      boletin: "Boletín"
    })[normalizado] || "Boletín";
  }

  mensajeErrorControlado(error) {
    const codigo = String(error?.codigo || "ERROR_ENVIO_CORREO")
      .replace(/[^A-Z0-9_]/gi, "")
      .slice(0, 80) || "ERROR_ENVIO_CORREO";
    return `${codigo}: No fue posible entregar el correo al destinatario.`;
  }

  async procesarConcurrencia(elementos, limite, procesar) {
    let indice = 0;
    const trabajador = async () => {
      while (indice < elementos.length) {
        const actual = indice;
        indice += 1;
        await procesar(elementos[actual]);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(limite, elementos.length) }, trabajador)
    );
  }

  async enviarBoletinCorreo(datos = {}, contexto = {}) {
    if (!this.correoService?.enviarBoletin) {
      throw this.crearError(
        "El servicio compartido de correo no está disponible.",
        "SERVICIO_CORREO_NO_DISPONIBLE",
        503
      );
    }
    const idAdministrador = this.idPositivo(
      contexto.idAdministrador,
      "identificador del administrador"
    );
    const idElementoBoletin = this.idPositivo(
      datos.idElementoBoletin,
      "identificador del boletín"
    );
    const boletin = await this.repositorio.obtenerBoletinCorreo(idElementoBoletin);
    if (!boletin) {
      throw this.crearError(
        "No se encontró un boletín válido para enviar.",
        "BOLETIN_NO_ENCONTRADO",
        404
      );
    }
    if (await this.repositorio.obtenerUltimoEnvioBoletin(idElementoBoletin)) {
      throw this.crearError(
        "Este boletín ya tiene un envío registrado. El reenvío no está disponible.",
        "BOLETIN_YA_ENVIADO",
        409
      );
    }

    const resuelta = await this.resolverSeleccionCorreo(datos.seleccion || {});
    if (resuelta.destinatarios.length === 0) {
      throw this.crearError(
        "Seleccione al menos un destinatario activo.",
        "ENVIO_SIN_DESTINATARIOS"
      );
    }
    const tipo = this.etiquetaTipo(boletin.categoria);
    const asunto = `Liceo Hernán Vargas Ramírez | ${tipo}: ${boletin.titulo}`
      .slice(0, 250);
    const idEnvio = await this.repositorio.crearEnvioBoletin({
      idElementoBoletin,
      idAdministrador,
      asunto,
      destinatarios: resuelta.destinatarios
    });

    await this.repositorio.cambiarEstadoEnvio(idEnvio, "ENVIANDO");
    await this.procesarConcurrencia(resuelta.destinatarios, 3, async (destinatario) => {
      try {
        await this.correoService.enviarBoletin({
          destinatario: destinatario.correo,
          asunto,
          boletin: { ...boletin, tipo }
        });
        await this.repositorio.registrarResultadoDestinatario({
          idEnvio,
          correo: destinatario.correo,
          estado: "ENVIADO",
          mensajeError: null
        });
      } catch (error) {
        await this.repositorio.registrarResultadoDestinatario({
          idEnvio,
          correo: destinatario.correo,
          estado: "FALLIDO",
          mensajeError: this.mensajeErrorControlado(error)
        });
      }
    });
    return this.repositorio.finalizarEnvio(idEnvio);
  }

  async listarEnviosCorreo(filtros = {}) {
    return this.repositorio.listarEnviosCorreo({
      pagina: Math.max(1, Number(filtros.pagina || 1)),
      limite: Math.min(100, Math.max(1, Number(filtros.limite || 20)))
    });
  }

  async obtenerDetalleEnvioCorreo(idEnvio) {
    const detalle = await this.repositorio.obtenerDetalleEnvioCorreo(
      this.idPositivo(idEnvio, "identificador del envío")
    );
    if (!detalle) {
      throw this.crearError(
        "No se encontró el envío indicado.",
        "ENVIO_BOLETIN_NO_ENCONTRADO",
        404
      );
    }
    return detalle;
  }

  async obtenerEnvioBoletin(idElementoBoletin) {
    return {
      envio: await this.repositorio.obtenerUltimoEnvioBoletin(
        this.idPositivo(idElementoBoletin, "identificador del boletín")
      )
    };
  }
}

module.exports = BoletinService;
