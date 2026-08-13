/*
 * Contrato del repositorio de Oferta académica.
 *
 * Define las operaciones que debe implementar
 * sql-oferta-academica.repository.js.
 *
 * Este archivo:
 * - No consulta SQL Server.
 * - No ejecuta procedimientos almacenados.
 * - No contiene reglas de negocio.
 * - Solo establece las funciones obligatorias.
 */

class OfertaAcademicaRepositoryContract {
  /**
   * Obtiene toda la información necesaria para
   * administrar la página Oferta académica.
   *
   * Incluye:
   * - información de la página
   * - secciones
   * - ciclos educativos
   * - materias
   * - relaciones materia-ciclo
   *
   * @returns {Promise<object>}
   */
  async obtenerOfertaAdministrativa() {
    throw new Error(
      "El método obtenerOfertaAdministrativa debe ser implementado."
    );
  }

  /**
   * Obtiene únicamente la información publicada
   * que puede mostrarse en el sitio público.
   *
   * @returns {Promise<object>}
   */
  async obtenerOfertaPublica() {
    throw new Error(
      "El método obtenerOfertaPublica debe ser implementado."
    );
  }

  /**
   * Crea o actualiza una materia de la
   * Oferta académica.
   *
   * @param {object} datosMateria
   * @returns {Promise<object>}
   */
  async guardarMateria(datosMateria) {
    throw new Error(
      "El método guardarMateria debe ser implementado."
    );
  }

  /**
   * Retira una materia de la Oferta académica
   * sin eliminar físicamente su registro.
   *
   * @param {number} idMateria
   * @param {number|null} idAdministrador
   * @returns {Promise<object>}
   */
  async retirarMateria(
    idMateria,
    idAdministrador
  ) {
    throw new Error(
      "El método retirarMateria debe ser implementado."
    );
  }
}

module.exports =
  OfertaAcademicaRepositoryContract;