/*
 * Contrato del repositorio de páginas y contenido.
 *
 * Define las operaciones que debe implementar
 * sql-pagina.repository.js.
 *
 * Este archivo:
 * - No consulta SQL Server.
 * - No ejecuta procedimientos almacenados.
 * - No contiene reglas de negocio.
 * - No valida los datos recibidos.
 * - Solo establece las funciones obligatorias.
 */

class PaginaRepositoryContract {
  /**
   * Obtiene los datos generales de una página
   * y todas las secciones asociadas mediante su slug.
   *
   * Utiliza:
   * dbo.sp_obtener_contenido_pagina_por_slug
   *
   * @param {string} slug
   * @param {boolean} soloVisibles
   * @returns {Promise<{
   *   pagina: object|null,
   *   secciones: object[]
   * }>}
   */
  async obtenerContenidoPaginaPorSlug(
    slug,
    soloVisibles = false
  ) {
    throw new Error(
      "El método obtenerContenidoPaginaPorSlug debe ser implementado."
    );
  }

  /**
   * Actualiza los datos generales y el estado de una página.
   *
   * @param {object} datosPagina
   * @returns {Promise<object>}
   */
  async guardarPagina(datosPagina) {
    throw new Error(
      "El método guardarPagina debe ser implementado."
    );
  }

  /**
   * Crea o actualiza una sección perteneciente
   * a una página pública.
   *
   * Utiliza:
   * dbo.sp_guardar_seccion_pagina
   *
   * @param {object} datosSeccion
   * @param {number|null} datosSeccion.idSeccionPagina
   * @param {number} datosSeccion.idPagina
   * @param {string} datosSeccion.clave
   * @param {string|null} datosSeccion.etiqueta
   * @param {string|null} datosSeccion.titulo
   * @param {string|null} datosSeccion.subtitulo
   * @param {string|null} datosSeccion.contenido
   * @param {number|null} datosSeccion.idArchivo
   * @param {string|null} datosSeccion.textoAlternativo
   * @param {string|null} datosSeccion.textoBoton
   * @param {string|null} datosSeccion.urlBoton
   * @param {string|null} datosSeccion.tipoEnlace
   * @param {string|null} datosSeccion.tipoDiseno
   * @param {string|null} datosSeccion.posicionImagen
   * @param {number} datosSeccion.orden
   * @param {number} datosSeccion.idEstadoPublicacion
   * @param {number} datosSeccion.idAdministradorUltimaModificacion
   * @returns {Promise<object>}
   */
  async guardarSeccionPagina(datosSeccion) {
    throw new Error(
      "El método guardarSeccionPagina debe ser implementado."
    );
  }


    /**
   * Retira lógicamente una sección de una página,
   * cambiando su estado de publicación a Archivado.
   *
   * Utiliza:
   * dbo.sp_retirar_seccion_pagina
   *
   * @param {object} datosRetiro
   * @param {number} datosRetiro.idSeccionPagina
   * @param {number} datosRetiro.idAdministradorUltimaModificacion
   * @returns {Promise<object|null>}
   */
  async retirarSeccionPagina(datosRetiro) {
    throw new Error(
      "El método retirarSeccionPagina debe ser implementado."
    );
  }

  /**
   * Lista los estados de publicación activos
   * disponibles para páginas y secciones.
   *
   * Utiliza:
   * dbo.sp_listar_estados_publicacion
   *
   * @returns {Promise<object[]>}
   */
  async listarEstadosPublicacion() {
    throw new Error(
      "El método listarEstadosPublicacion debe ser implementado."
    );
  }
}

module.exports = PaginaRepositoryContract;
