/* ============================================================
   CONFIGURACION.REPOSITORY.CONTRACT.JS
   Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Contrato del repositorio de configuración general del sitio.

   Define las operaciones que debe implementar cualquier
   repositorio encargado de acceder a configuracion_sitio.

   Implementación actual:
   - sql-configuracion.repository.js

   Este contrato permite mantener separadas:
   - La lógica de negocio.
   - El acceso a SQL Server.
   ============================================================ */


/* ============================================================
   CONTRATO
   ============================================================ */

class ConfiguracionRepositoryContract {

  /**
   * Obtiene únicamente las configuraciones públicas
   * del sitio.
   *
   * Utilizado por:
   * - Contacto.
   * - Nosotros.
   * - Footer.
   * - Otras páginas públicas.
   *
   * @returns {Promise<Array>}
   */
  async obtenerConfiguracionPublica() {
    throw new Error(
      "El método obtenerConfiguracionPublica() debe ser implementado por el repositorio."
    );
  }


  /**
   * Obtiene todas las configuraciones disponibles
   * para el panel administrativo.
   *
   * Incluye información adicional como:
   * - Estado público.
   * - Fecha de actualización.
   * - Administrador de última modificación.
   *
   * @returns {Promise<Array>}
   */
  async obtenerConfiguracionAdministracion() {
    throw new Error(
      "El método obtenerConfiguracionAdministracion() debe ser implementado por el repositorio."
    );
  }


  /**
   * Actualiza una configuración existente.
   *
   * La clave debe existir previamente en
   * dbo.configuracion_sitio.
   *
   * @param {string} clave
   * @param {string|null} valor
   * @param {number|null} idAdministrador
   *
   * @returns {Promise<object|null>}
   */
  async guardarConfiguracion(
    clave,
    valor,
    idAdministrador = null
  ) {
    throw new Error(
      "El método guardarConfiguracion() debe ser implementado por el repositorio."
    );
  }
}


/* ============================================================
   EXPORTACIÓN
   ============================================================ */

module.exports =
  ConfiguracionRepositoryContract;