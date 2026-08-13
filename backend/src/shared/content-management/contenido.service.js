const {
  normalizarModulo
} = require("./contenido-modulos");

const ESTADOS = new Set([
  "BORRADOR",
  "PUBLICADO",
  "INACTIVO",
  "ARCHIVADO"
]);

class ContenidoService {
  constructor(
    modulo,
    repositorio,
    auditoriaService = null
  ) {
    this.modulo = normalizarModulo(modulo);
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
    if (valor === null || valor === undefined) {
      return null;
    }

    const contenido = String(valor).trim();

    if (!contenido) {
      return null;
    }

    if (maximo && contenido.length > maximo) {
      return contenido.slice(0, maximo);
    }

    return contenido;
  }

  numero(valor, predeterminado = null) {
    if (valor === null || valor === undefined || valor === "") {
      return predeterminado;
    }

    const resultado = Number(valor);

    return Number.isFinite(resultado)
      ? resultado
      : predeterminado;
  }

  fecha(valor, nombreCampo = "fecha") {
    if (!valor) {
      return null;
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      throw this.crearError(
        `El campo ${nombreCampo} no contiene una fecha válida.`,
        "FECHA_CONTENIDO_INVALIDA"
      );
    }

    return fecha;
  }

  url(valor) {
    const enlace = this.texto(valor, 2048);

    if (!enlace) {
      return null;
    }

    if (/^(javascript|data|vbscript):/i.test(enlace)) {
      throw this.crearError(
        "El enlace indicado utiliza un protocolo no permitido.",
        "URL_CONTENIDO_INVALIDA"
      );
    }

    return enlace;
  }

  validarElemento(normalizado) {
    if (!normalizado.titulo) {
      throw this.crearError(
        "El título del contenido es obligatorio.",
        "TITULO_CONTENIDO_REQUERIDO"
      );
    }

    if (
      normalizado.fechaInicio &&
      normalizado.fechaFin &&
      normalizado.fechaFin < normalizado.fechaInicio
    ) {
      throw this.crearError(
        "La fecha final no puede ser anterior a la fecha inicial.",
        "RANGO_FECHAS_INVALIDO"
      );
    }
  }

  estado(valor, predeterminado = "PUBLICADO") {
    const estado = String(valor || predeterminado)
      .trim()
      .toUpperCase();

    if (!ESTADOS.has(estado)) {
      throw this.crearError(
        "El estado indicado no es válido.",
        "ESTADO_CONTENIDO_INVALIDO"
      );
    }

    return estado;
  }

  normalizarElemento(elemento, indice = 0) {
    if (!elemento || typeof elemento !== "object") {
      throw this.crearError(
        `El elemento ${indice + 1} no es válido.`,
        "ELEMENTO_CONTENIDO_INVALIDO"
      );
    }

    const datos =
      elemento.datos && typeof elemento.datos === "object"
        ? elemento.datos
        : {};

    const normalizado = {
      idElemento: this.numero(elemento.idElemento),
      idColeccion: this.numero(elemento.idColeccion),
      claveExterna: this.texto(
        elemento.claveExterna ?? elemento.id,
        180
      ),
      titulo: this.texto(elemento.titulo, 500),
      subtitulo: this.texto(elemento.subtitulo, 500),
      descripcion: this.texto(
        elemento.descripcion ?? elemento.resumen
      ),
      fechaInicio: this.fecha(
        elemento.fechaInicio ?? elemento.fecha,
        "fechaInicio"
      ),
      fechaFin: this.fecha(
        elemento.fechaFin,
        "fechaFin"
      ),
      orden: this.numero(elemento.orden, indice),
      estado: this.estado(elemento.estado),
      destacado: Boolean(
        elemento.destacado === true ||
        elemento.destacado === 1 ||
        elemento.destacado === "1"
      ),
      url: this.url(
        elemento.url ??
        elemento.link ??
        elemento.enlace ??
        elemento.archivo
      ),
      urlSecundaria: this.url(
        elemento.urlSecundaria ?? elemento.link2
      ),
      idArchivo: this.numero(elemento.idArchivo),
      datos: {
        ...datos,
        ...elemento.datosOriginales
      }
    };

    this.validarElemento(normalizado, elemento, indice);

    return normalizado;
  }

  async listarPublico(filtros = {}) {
    const anio = this.numero(filtros.anio);

    const coleccion =
      await this.repositorio.obtenerColeccionPublicada(
        this.modulo,
        anio
      );

    if (!coleccion) {
      return {
        coleccion: null,
        elementos: []
      };
    }

    const elementos = await this.repositorio.listarElementos({
      modulo: this.modulo,
      idColeccion: coleccion.idColeccion,
      soloPublicados: true
    });

    return {
      coleccion,
      elementos
    };
  }

  async obtenerAdministracion(filtros = {}) {
    const colecciones =
      await this.repositorio.listarColecciones(this.modulo);

    let idColeccion = this.numero(filtros.idColeccion);

    if (!idColeccion && colecciones.length > 0) {
      idColeccion = colecciones[0].idColeccion;
    }

    const elementos = idColeccion
      ? await this.repositorio.listarElementos({
        modulo: this.modulo,
        idColeccion,
        soloPublicados: false
      })
      : [];

    return {
      modulo: this.modulo,
      colecciones,
      idColeccionSeleccionada: idColeccion,
      elementos
    };
  }

  async guardarColeccion(datos, contexto = {}) {
    const anio = this.numero(datos.anio);
    const clave = this.texto(datos.clave, 120) ||
      [
        this.modulo.toLowerCase(),
        anio || "general",
        Date.now()
      ].join("-");

    const nombre = this.texto(datos.nombre, 250) ||
      `${this.modulo.replace(/_/g, " ")} ${anio || ""}`.trim();

    const resultado = await this.repositorio.guardarColeccion({
      idColeccion: this.numero(datos.idColeccion),
      modulo: this.modulo,
      clave,
      nombre,
      anio,
      estado: this.estado(datos.estado, "BORRADOR"),
      publicada: Boolean(datos.publicada),
      metadatos:
        datos.metadatos && typeof datos.metadatos === "object"
          ? datos.metadatos
          : {},
      idAdministrador: contexto.idAdministrador
    });

    await this.registrarAuditoria(
      datos.idColeccion ? "EDITAR" : "CREAR",
      resultado.idColeccion,
      null,
      resultado,
      contexto
    );

    return resultado;
  }

  async guardarElemento(datos, contexto = {}) {
    const normalizado = this.normalizarElemento(datos);

    if (!normalizado.idColeccion) {
      throw this.crearError(
        "Debe seleccionar una colección antes de guardar.",
        "COLECCION_REQUERIDA"
      );
    }

    const resultado = await this.repositorio.guardarElemento({
      ...normalizado,
      modulo: this.modulo,
      idAdministrador: contexto.idAdministrador
    });

    await this.registrarAuditoria(
      normalizado.idElemento
        ? "EDITAR"
        : "CREAR",
      resultado.idElemento,
      null,
      resultado,
      contexto
    );

    return resultado;
  }

  async archivarElemento(idElemento, contexto = {}) {
    const id = this.numero(idElemento);

    if (!id) {
      throw this.crearError(
        "El identificador del elemento no es válido.",
        "ID_ELEMENTO_INVALIDO"
      );
    }

    const archivado = await this.repositorio.archivarElemento(
      this.modulo,
      id,
      contexto.idAdministrador
    );

    if (!archivado) {
      throw this.crearError(
        "No se encontró el elemento indicado.",
        "ELEMENTO_NO_ENCONTRADO",
        404
      );
    }

    await this.registrarAuditoria(
      "DESACTIVAR",
      id,
      null,
      { estado: "ARCHIVADO" },
      contexto
    );

    return {
      idElemento: id,
      archivado: true
    };
  }

  async importar(datos, contexto = {}) {
    if (!Array.isArray(datos.elementos)) {
      throw this.crearError(
        "La importación debe incluir una lista de elementos.",
        "ELEMENTOS_IMPORTACION_REQUERIDOS"
      );
    }

    if (datos.elementos.length === 0) {
      throw this.crearError(
        "No se encontraron elementos para importar.",
        "IMPORTACION_VACIA"
      );
    }

    if (datos.elementos.length > 5000) {
      throw this.crearError(
        "La importación supera el máximo de 5000 registros.",
        "IMPORTACION_DEMASIADO_GRANDE"
      );
    }

    const anio = this.numero(datos.anio);
    const elementos = datos.elementos.map(
      (elemento, indice) =>
        this.normalizarElemento(elemento, indice)
    );

    const clavesVistas = new Map();

    elementos.forEach((elemento, indice) => {
      const clave = elemento.claveExterna
        ? `id:${elemento.claveExterna.toLocaleLowerCase("es")}`
        : [
          elemento.titulo?.toLocaleLowerCase("es"),
          elemento.fechaInicio?.toISOString() || "",
          elemento.fechaFin?.toISOString() || ""
        ].join("|");

      if (clavesVistas.has(clave)) {
        throw this.crearError(
          `Las filas ${clavesVistas.get(clave) + 1} y ${indice + 1} están duplicadas.`,
          "ELEMENTO_IMPORTACION_DUPLICADO"
        );
      }

      clavesVistas.set(clave, indice);
    });

    const resultado = await this.repositorio.importarColeccion({
      modulo: this.modulo,
      clave: this.texto(datos.clave, 120) ||
        [
          this.modulo.toLowerCase(),
          anio || "general",
          Date.now()
        ].join("-"),
      nombre: this.texto(datos.nombre, 250) ||
        `${this.modulo.replace(/_/g, " ")} ${anio || ""}`.trim(),
      anio,
      metadatos:
        datos.metadatos && typeof datos.metadatos === "object"
          ? datos.metadatos
          : {},
      reemplazar: datos.reemplazar !== false,
      alcance: this.texto(datos.alcance, 30)?.toUpperCase() || "TOTAL",
      idColeccionBase: this.numero(datos.idColeccionBase),
      publicar: Boolean(datos.publicar),
      tipoOrigen: this.texto(datos.tipoOrigen, 30) || "JSON",
      nombreOrigen: this.texto(datos.nombreOrigen, 260),
      elementos,
      idAdministrador: contexto.idAdministrador
    });

    await this.registrarAuditoria(
      "IMPORTAR_CONTENIDO",
      resultado.idColeccion,
      null,
      {
        cantidadGuardada: resultado.cantidadGuardada,
        publicada: resultado.publicada
      },
      contexto
    );

    return resultado;
  }

  async publicarColeccion(idColeccion, contexto = {}) {
    const id = this.numero(idColeccion);

    if (!id) {
      throw this.crearError(
        "El identificador de la colección no es válido.",
        "ID_COLECCION_INVALIDO"
      );
    }

    const resultado = await this.repositorio.publicarColeccion(
      this.modulo,
      id,
      contexto.idAdministrador
    );

    await this.registrarAuditoria(
      "PUBLICAR",
      id,
      null,
      resultado,
      contexto
    );

    return resultado;
  }

  async listarImportaciones() {
    return this.repositorio.listarImportaciones(this.modulo);
  }

  async registrarAuditoria(
    codigoAccion,
    idRegistro,
    datosAnteriores,
    datosNuevos,
    contexto
  ) {
    if (!this.auditoriaService) {
      return;
    }

    await this.auditoriaService.registrarSinInterrumpir({
      idAdministrador: contexto.idAdministrador ?? null,
      codigoAccion,
      codigoModulo:
        this.modulo === "RECURSOS_APOYO"
          ? "RECURSOS"
          : this.modulo,
      tablaAfectada: "cms_elementos",
      idRegistroAfectado:
        idRegistro === null || idRegistro === undefined
          ? null
          : String(idRegistro),
      datosAnteriores,
      datosNuevos,
      descripcion:
        `${codigoAccion} en el módulo ${this.modulo}.`,
      direccionIp: contexto.direccionIp ?? null,
      userAgent: contexto.userAgent ?? null
    });
  }
}

module.exports = ContenidoService;
