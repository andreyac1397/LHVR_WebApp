/*
 * Contrato del repositorio de archivos.
 *
 * Define las operaciones que debe implementar
 * sql-archivo.repository.js.
 *
 * Este archivo:
 * - No consulta SQL Server.
 * - No ejecuta procedimientos almacenados.
 * - No guarda archivos físicamente.
 * - Solo establece las funciones obligatorias
 *   del repositorio de archivos.
 */

class ArchivoRepositoryContract {
  /**
   * Registra en la base de datos los metadatos
   * de un archivo almacenado en el servidor.
   *
   * Procedimiento esperado:
   * dbo.sp_registrar_archivo
   *
   * @param {object} datosArchivo
   * @param {string} datosArchivo.nombreOriginal
   * @param {string} datosArchivo.nombreAlmacenado
   * @param {string} datosArchivo.rutaRelativa
   * @param {string} datosArchivo.extension
   * @param {string} datosArchivo.mimeType
   * @param {number} datosArchivo.tamanoBytes
   * @param {number|null} datosArchivo.anchoPixeles
   * @param {number|null} datosArchivo.altoPixeles
   * @param {string|null} datosArchivo.hashArchivo
   * @param {string|null} datosArchivo.textoAlternativo
   * @param {string} datosArchivo.tipoArchivo
   * @param {number} datosArchivo.idAdministradorCarga
   * @returns {Promise<object>}
   */
  async registrarArchivo(
    datosArchivo
  ) {
    throw new Error(
      "El método registrarArchivo debe ser implementado."
    );
  }
}

module.exports =
  ArchivoRepositoryContract;