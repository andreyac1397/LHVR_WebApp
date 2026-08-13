/*
 * Contrato del repositorio de Comunidad.
 *
 * Define únicamente las operaciones de lectura específicas
 * que necesita la página Comunidad.
 *
 * El guardado de las secciones continúa utilizando el módulo
 * compartido paginas-contenido.
 */

class ComunidadRepositoryContract {
  /**
   * Obtiene la página Comunidad y todas sus secciones
   * para el panel administrativo.
   *
   * @returns {Promise<{
   *   pagina: object|null,
   *   secciones: object[]
   * }>}
   */
  async obtenerComunidadAdministrativa() {
    throw new Error(
      "El método obtenerComunidadAdministrativa debe ser implementado."
    );
  }

  /**
   * Obtiene únicamente las secciones publicadas
   * de la página Comunidad.
   *
   * @returns {Promise<{
   *   secciones: object[]
   * }>}
   */
  async obtenerComunidadPublica() {
    throw new Error(
      "El método obtenerComunidadPublica debe ser implementado."
    );
  }
}

module.exports =
  ComunidadRepositoryContract;
