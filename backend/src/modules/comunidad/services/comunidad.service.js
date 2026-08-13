/*
 * Servicio de Comunidad.
 *
 * Coordina las consultas específicas del módulo.
 * Las operaciones de edición de las secciones se mantienen
 * en el servicio compartido de paginas-contenido.
 */
class ComunidadService {
  /**
   * @param {object} repositorio
   */
  constructor(
    repositorio
  ) {
    if (
      !repositorio ||
      typeof repositorio
        .obtenerComunidadAdministrativa !==
        "function" ||
      typeof repositorio
        .obtenerComunidadPublica !==
        "function"
    ) {
      throw new Error(
        "El repositorio de Comunidad no es válido."
      );
    }

    this.repositorio =
      repositorio;
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
    const error =
      new Error(
        mensaje
      );

    error.statusCode =
      statusCode;

    error.codigo =
      codigo;

    return error;
  }

  /**
   * Obtiene Comunidad para el panel administrativo.
   *
   * @returns {Promise<{
   *   pagina: object,
   *   secciones: object[]
   * }>}
   */
  async obtenerComunidadAdministrativa() {
    const resultado =
      await this.repositorio
        .obtenerComunidadAdministrativa();

    if (
      !resultado ||
      typeof resultado !== "object"
    ) {
      throw this.crearError(
        "No fue posible obtener la información administrativa de Comunidad.",
        500,
        "COMUNIDAD_ADMIN_RESULTADO_INVALIDO"
      );
    }

    if (
      !resultado.pagina
    ) {
      throw this.crearError(
        "No se encontró la página Comunidad.",
        404,
        "COMUNIDAD_NO_ENCONTRADA"
      );
    }

    return {
      pagina:
        resultado.pagina,

      secciones:
        Array.isArray(
          resultado.secciones
        )
          ? resultado.secciones
          : []
    };
  }

  /**
   * Obtiene las secciones publicadas de Comunidad.
   *
   * @returns {Promise<{
   *   secciones: object[]
   * }>}
   */
  async obtenerComunidadPublica() {
    const resultado =
      await this.repositorio
        .obtenerComunidadPublica();

    if (
      !resultado ||
      typeof resultado !== "object"
    ) {
      throw this.crearError(
        "No fue posible obtener la información pública de Comunidad.",
        500,
        "COMUNIDAD_PUBLICA_RESULTADO_INVALIDO"
      );
    }

    return {
      secciones:
        Array.isArray(
          resultado.secciones
        )
          ? resultado.secciones
          : []
    };
  }
}

module.exports =
  ComunidadService;
