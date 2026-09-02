/*
 * DTO para actualizar los datos generales de una página.
 * El identificador del administrador se obtiene de la sesión.
 */
class GuardarPaginaDto {
  constructor(datos = {}) {
    this.idPagina = datos.idPagina;
    this.titulo = datos.titulo;
    this.descripcion = datos.descripcion ?? null;
    this.idEstadoPublicacion =
      datos.idEstadoPublicacion;

    Object.freeze(this);
  }

  toObject() {
    return {
      idPagina: this.idPagina,
      titulo: this.titulo,
      descripcion: this.descripcion,
      idEstadoPublicacion:
        this.idEstadoPublicacion
    };
  }
}

module.exports = GuardarPaginaDto;
