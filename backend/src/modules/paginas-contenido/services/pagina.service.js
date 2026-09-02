const SqlPaginaRepository = require(
  "../repositories/sql-pagina.repository"
);

/*
 * Servicio de páginas públicas.
 *
 * Responsabilidades:
 * - Validar el slug de una página.
 * - Obtener una página y sus secciones.
 * - Aplicar el filtro de contenido visible.
 * - Listar los estados de publicación.
 *
 * El guardado de secciones se administra desde:
 * seccion-pagina.service.js
 */
class PaginaService {
  /**
   * @param {object} repositorio
   */
  constructor(
    repositorio = new SqlPaginaRepository(),
    auditoriaService = null
  ) {
    this.repositorio = repositorio;
    this.auditoriaService =
      auditoriaService;
  }

  /**
   * Crea un error controlado para el middleware
   * centralizado de errores.
   *
   * @param {string} mensaje
   * @param {number} statusCode
   * @param {string} codigo
   * @returns {Error}
   */
  crearError(
    mensaje,
    statusCode,
    codigo
  ) {
    const error = new Error(mensaje);

    error.statusCode = statusCode;
    error.codigo = codigo;

    return error;
  }

  /**
   * Obtiene el número de error enviado
   * por SQL Server.
   *
   * @param {Error} error
   * @returns {number|null}
   */
  obtenerNumeroErrorSql(error) {
    const numero =
      error?.number ??
      error?.originalError?.info?.number ??
      error?.precedingErrors?.[0]?.number ??
      null;

    if (numero === null) {
      return null;
    }

    const numeroConvertido = Number(numero);

    return Number.isFinite(numeroConvertido)
      ? numeroConvertido
      : null;
  }

  /**
   * Valida y normaliza el slug de una página.
   *
   * Ejemplos válidos:
   * - inicio
   * - nosotros
   * - oferta-academica
   *
   * @param {*} slug
   * @returns {string}
   */
  normalizarSlug(slug) {
    if (typeof slug !== "string") {
      throw this.crearError(
        "El slug de la página es obligatorio.",
        400,
        "SLUG_PAGINA_REQUERIDO"
      );
    }

    const slugNormalizado =
      slug
        .trim()
        .toLowerCase();

    if (!slugNormalizado) {
      throw this.crearError(
        "El slug de la página es obligatorio.",
        400,
        "SLUG_PAGINA_REQUERIDO"
      );
    }

    if (slugNormalizado.length > 160) {
      throw this.crearError(
        "El slug de la página supera la longitud permitida.",
        400,
        "SLUG_PAGINA_DEMASIADO_LARGO"
      );
    }

    const formatoValido =
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        .test(slugNormalizado);

    if (!formatoValido) {
      throw this.crearError(
        "El formato del slug de la página no es válido.",
        400,
        "SLUG_PAGINA_INVALIDO"
      );
    }

    return slugNormalizado;
  }

  /**
   * Convierte el valor recibido en un booleano.
   *
   * Acepta:
   * - true / false
   * - 1 / 0
   * - "true" / "false"
   * - "1" / "0"
   *
   * @param {*} valor
   * @returns {boolean}
   */
  normalizarSoloVisibles(valor) {
    if (
      valor === undefined ||
      valor === null ||
      valor === ""
    ) {
      return false;
    }

    if (typeof valor === "boolean") {
      return valor;
    }

    if (valor === 1 || valor === "1") {
      return true;
    }

    if (valor === 0 || valor === "0") {
      return false;
    }

    if (typeof valor === "string") {
      const valorNormalizado =
        valor
          .trim()
          .toLowerCase();

      if (valorNormalizado === "true") {
        return true;
      }

      if (valorNormalizado === "false") {
        return false;
      }
    }

    throw this.crearError(
      "El filtro de contenido visible no es válido.",
      400,
      "FILTRO_VISIBILIDAD_INVALIDO"
    );
  }

  /**
   * Convierte errores conocidos del procedimiento
   * almacenado en errores controlados de la API.
   *
   * @param {Error} error
   * @returns {Error}
   */
  transformarErrorRepositorio(error) {
    if (error?.statusCode) {
      return error;
    }

    const numeroError =
      this.obtenerNumeroErrorSql(error);

    /*
     * dbo.sp_obtener_contenido_pagina_por_slug
     *
     * 50001:
     * El slug es obligatorio.
     */
    if (numeroError === 50001) {
      return this.crearError(
        "El slug de la página es obligatorio.",
        400,
        "SLUG_PAGINA_REQUERIDO"
      );
    }

    /*
     * 50002:
     * La página solicitada no existe.
     */
    if (numeroError === 50002) {
      return this.crearError(
        "La página solicitada no existe.",
        404,
        "PAGINA_NO_ENCONTRADA"
      );
    }

    return error;
  }

  /**
   * Obtiene los datos generales de una página
   * y las secciones asociadas a ella.
   *
   * Cuando soloVisibles es true, devuelve
   * únicamente contenido publicado y visible.
   *
   * @param {string} slug
   * @param {boolean|string|number} soloVisibles
   * @returns {Promise<{
   *   pagina: object,
   *   secciones: object[]
   * }>}
   */
  async obtenerContenidoPaginaPorSlug(
    slug,
    soloVisibles = false
  ) {
    const slugNormalizado =
      this.normalizarSlug(slug);

    const mostrarSoloVisibles =
      this.normalizarSoloVisibles(
        soloVisibles
      );

    try {
      const resultado =
        await this.repositorio
          .obtenerContenidoPaginaPorSlug(
            slugNormalizado,
            mostrarSoloVisibles
          );

      if (
        !resultado ||
        typeof resultado !== "object"
      ) {
        throw this.crearError(
          "No fue posible obtener el contenido de la página.",
          500,
          "CONTENIDO_PAGINA_INVALIDO"
        );
      }

      if (!resultado.pagina) {
        throw this.crearError(
          mostrarSoloVisibles
            ? "La página solicitada no está disponible."
            : "La página solicitada no existe.",
          404,
          mostrarSoloVisibles
            ? "PAGINA_NO_DISPONIBLE"
            : "PAGINA_NO_ENCONTRADA"
        );
      }

      const secciones =
        Array.isArray(resultado.secciones)
          ? resultado.secciones
          : [];

      return {
        pagina: resultado.pagina,
        secciones
      };
    } catch (error) {
      throw this.transformarErrorRepositorio(
        error
      );
    }
  }

  /**
   * Obtiene el contenido de una página
   * para el panel administrativo.
   *
   * Incluye secciones visibles, ocultas,
   * borradores, inactivas y archivadas.
   *
   * @param {string} slug
   * @returns {Promise<{
   *   pagina: object,
   *   secciones: object[]
   * }>}
   */
  async obtenerContenidoAdministrativo(
    slug
  ) {
    return this
      .obtenerContenidoPaginaPorSlug(
        slug,
        false
      );
  }

  /**
   * Obtiene el contenido público de una página.
   *
   * Solo devuelve contenido cuyo estado
   * permita mostrarse en el sitio público.
   *
   * @param {string} slug
   * @returns {Promise<{
   *   pagina: object,
   *   secciones: object[]
   * }>}
   */
  async obtenerContenidoPublico(
    slug
  ) {
    return this
      .obtenerContenidoPaginaPorSlug(
        slug,
        true
      );
  }

  /**
   * Obtiene las secciones públicas aunque el estado del registro
   * de la página oculte únicamente su encabezado. No expone el
   * título ni la descripción mientras el encabezado esté oculto.
   *
   * Se utiliza en Comunidad y Contacto, donde cada bloque posee
   * un estado independiente.
   */
  async obtenerContenidoPublicoParcial(
    slug
  ) {
    const resultado =
      await this
        .obtenerContenidoPaginaPorSlug(
          slug,
          false
        );

    const encabezadoVisible =
      resultado.pagina
        ?.estadoVisible === true;

    const secciones =
      resultado.secciones.filter(
        (seccion) =>
          seccion?.estadoVisible === true
      );

    return {
      pagina: {
        ...resultado.pagina,
        titulo:
          encabezadoVisible
            ? resultado.pagina.titulo
            : null,
        descripcion:
          encabezadoVisible
            ? resultado.pagina.descripcion
            : null,
        encabezadoVisible
      },
      secciones
    };
  }

  normalizarIdPositivo(
    valor,
    nombreCampo
  ) {
    const numero = Number(valor);

    if (
      !Number.isInteger(numero) ||
      numero <= 0
    ) {
      throw this.crearError(
        `El campo ${nombreCampo} no es válido.`,
        400,
        "IDENTIFICADOR_INVALIDO"
      );
    }

    return numero;
  }

  normalizarTexto(
    valor,
    nombreCampo,
    longitudMaxima,
    obligatorio = false
  ) {
    if (
      valor === null ||
      valor === undefined
    ) {
      if (!obligatorio) {
        return null;
      }

      throw this.crearError(
        `El campo ${nombreCampo} es obligatorio.`,
        400,
        "CAMPO_OBLIGATORIO"
      );
    }

    if (typeof valor !== "string") {
      throw this.crearError(
        `El campo ${nombreCampo} no es válido.`,
        400,
        "TIPO_CAMPO_INVALIDO"
      );
    }

    const texto = valor.trim();

    if (obligatorio && !texto) {
      throw this.crearError(
        `El campo ${nombreCampo} es obligatorio.`,
        400,
        "CAMPO_OBLIGATORIO"
      );
    }

    if (texto.length > longitudMaxima) {
      throw this.crearError(
        `El campo ${nombreCampo} supera la longitud permitida.`,
        400,
        "LONGITUD_CAMPO_INVALIDA"
      );
    }

    return texto || null;
  }

  transformarErrorGuardado(error) {
    if (error?.statusCode) {
      return error;
    }

    const numeroError =
      this.obtenerNumeroErrorSql(error);

    if (numeroError === 51040) {
      return this.crearError(
        "El estado de publicación no existe o está inactivo.",
        400,
        "ESTADO_PUBLICACION_NO_DISPONIBLE"
      );
    }

    if (numeroError === 51041) {
      return this.crearError(
        "La página indicada no existe.",
        404,
        "PAGINA_NO_ENCONTRADA"
      );
    }

    return error;
  }

  /**
   * Actualiza el encabezado y el estado general de una página.
   */
  async guardarPagina(
    datos,
    sesionAdministrador,
    contexto = {}
  ) {
    const datosPreparados = {
      idPagina:
        this.normalizarIdPositivo(
          datos?.idPagina,
          "idPagina"
        ),
      titulo:
        this.normalizarTexto(
          datos?.titulo,
          "titulo",
          200,
          true
        ),
      descripcion:
        this.normalizarTexto(
          datos?.descripcion,
          "descripcion",
          500
        ),
      idEstadoPublicacion:
        this.normalizarIdPositivo(
          datos?.idEstadoPublicacion,
          "idEstadoPublicacion"
        ),
      idAdministradorUltimaModificacion:
        this.normalizarIdPositivo(
          sesionAdministrador
            ?.idAdministrador,
          "idAdministrador"
        )
    };

    let paginaGuardada;

    try {
      paginaGuardada =
        await this.repositorio
          .guardarPagina(
            datosPreparados
          );
    } catch (error) {
      throw this.transformarErrorGuardado(
        error
      );
    }

    if (
      !paginaGuardada ||
      typeof paginaGuardada !== "object"
    ) {
      throw this.crearError(
        "No fue posible obtener la página guardada.",
        500,
        "RESULTADO_PAGINA_INVALIDO"
      );
    }

    await this.auditoriaService
      ?.registrarSinInterrumpir({
        idAdministrador:
          datosPreparados
            .idAdministradorUltimaModificacion,
        codigoAccion: "EDITAR",
        codigoModulo: "PAGINAS",
        tablaAfectada: "paginas",
        idRegistroAfectado:
          paginaGuardada.idPagina,
        datosNuevos: paginaGuardada,
        descripcion:
          `Se actualizó el encabezado y el estado de la página ${paginaGuardada.slug || paginaGuardada.idPagina}.`,
        direccionIp:
          contexto.direccionIp ?? null,
        userAgent:
          contexto.userAgent ?? null
      });

    return {
      guardado: true,
      mensaje:
        "La página fue guardada correctamente.",
      pagina: paginaGuardada
    };
  }

  /**
   * Lista los estados de publicación activos.
   *
   * @returns {Promise<object[]>}
   */
  async listarEstadosPublicacion() {
    const estados =
      await this.repositorio
        .listarEstadosPublicacion();

    if (!Array.isArray(estados)) {
      throw this.crearError(
        "No fue posible obtener los estados de publicación.",
        500,
        "ESTADOS_PUBLICACION_INVALIDOS"
      );
    }

    return estados;
  }
}

module.exports = PaginaService;
