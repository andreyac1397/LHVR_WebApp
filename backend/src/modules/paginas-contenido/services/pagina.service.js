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
    repositorio = new SqlPaginaRepository()
  ) {
    this.repositorio = repositorio;
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