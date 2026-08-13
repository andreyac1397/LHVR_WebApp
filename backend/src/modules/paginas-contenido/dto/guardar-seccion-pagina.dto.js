/*
 * DTO utilizado para transportar los datos
 * necesarios para crear o actualizar una sección
 * perteneciente a una página pública.
 *
 * Este archivo:
 * - No consulta la base de datos.
 * - No ejecuta procedimientos almacenados.
 * - No obtiene datos de la sesión.
 * - No contiene reglas de negocio.
 * - Solo organiza los datos validados.
 */

class GuardarSeccionPaginaDto {
  /**
   * @param {object} datos
   * @param {number|null} datos.idSeccionPagina
   * @param {number} datos.idPagina
   * @param {string} datos.clave
   * @param {string|null} datos.etiqueta
   * @param {string|null} datos.titulo
   * @param {string|null} datos.subtitulo
   * @param {string|null} datos.contenido
   * @param {number|null} datos.idArchivo
   * @param {string|null} datos.textoAlternativo
   * @param {string|null} datos.textoBoton
   * @param {string|null} datos.urlBoton
   * @param {string|null} datos.tipoEnlace
   * @param {string|null} datos.tipoDiseno
   * @param {string|null} datos.posicionImagen
   * @param {number} datos.orden
   * @param {number} datos.idEstadoPublicacion
   */
  constructor(datos = {}) {
    this.idSeccionPagina =
      datos.idSeccionPagina ?? null;

    this.idPagina =
      datos.idPagina;

    this.clave =
      datos.clave;

    this.etiqueta =
      datos.etiqueta ?? null;

    this.titulo =
      datos.titulo ?? null;

    this.subtitulo =
      datos.subtitulo ?? null;

    this.contenido =
      datos.contenido ?? null;

    this.idArchivo =
      datos.idArchivo ?? null;

    this.textoAlternativo =
      datos.textoAlternativo ?? null;

    this.textoBoton =
      datos.textoBoton ?? null;

    this.urlBoton =
      datos.urlBoton ?? null;

    this.tipoEnlace =
      datos.tipoEnlace ?? null;

    this.tipoDiseno =
      datos.tipoDiseno ?? null;

    this.posicionImagen =
      datos.posicionImagen ?? null;

    this.orden =
      datos.orden ?? 0;

    this.idEstadoPublicacion =
      datos.idEstadoPublicacion;

    Object.freeze(this);
  }

  /**
   * Devuelve una representación plana del DTO.
   *
   * @returns {object}
   */
  toObject() {
    return {
      idSeccionPagina:
        this.idSeccionPagina,

      idPagina:
        this.idPagina,

      clave:
        this.clave,

      etiqueta:
        this.etiqueta,

      titulo:
        this.titulo,

      subtitulo:
        this.subtitulo,

      contenido:
        this.contenido,

      idArchivo:
        this.idArchivo,

      textoAlternativo:
        this.textoAlternativo,

      textoBoton:
        this.textoBoton,

      urlBoton:
        this.urlBoton,

      tipoEnlace:
        this.tipoEnlace,

      tipoDiseno:
        this.tipoDiseno,

      posicionImagen:
        this.posicionImagen,

      orden:
        this.orden,

      idEstadoPublicacion:
        this.idEstadoPublicacion
    };
  }
}

module.exports = GuardarSeccionPaginaDto;