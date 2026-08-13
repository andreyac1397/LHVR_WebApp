/*
 * Contrato del repositorio de auditoría.
 *
 * Define las operaciones que debe implementar
 * sql-auditoria.repository.js.
 *
 * Este archivo:
 * - No consulta SQL Server.
 * - No ejecuta procedimientos almacenados.
 * - No contiene reglas de auditoría.
 * - Solo establece las funciones obligatorias.
 */

class AuditoriaRepositoryContract {
  /**
   * Registra una acción realizada dentro del sistema.
   *
   * @param {object} datosAuditoria
   * @param {number|null} datosAuditoria.idAdministrador
   * @param {string} datosAuditoria.codigoAccion
   * @param {string} datosAuditoria.codigoModulo
   * @param {string|null} datosAuditoria.tablaAfectada
   * @param {string|null} datosAuditoria.idRegistroAfectado
   * @param {string|null} datosAuditoria.datosAnteriores
   * @param {string|null} datosAuditoria.datosNuevos
   * @param {string|null} datosAuditoria.descripcion
   * @param {string|null} datosAuditoria.direccionIp
   * @param {string|null} datosAuditoria.userAgent
   * @returns {Promise<object>}
   */
  async registrarAuditoria(datosAuditoria) {
    throw new Error(
      "El método registrarAuditoria debe ser implementado."
    );
  }
}

module.exports = AuditoriaRepositoryContract;