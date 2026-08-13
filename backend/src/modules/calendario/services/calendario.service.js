const ContenidoService = require(
  "../../../shared/content-management/contenido.service"
);

const {
  MODULOS_CONTENIDO
} = require(
  "../../../shared/content-management/contenido-modulos"
);

class CalendarioService extends ContenidoService {
  constructor(repositorio, auditoriaService = null) {
    super(
      MODULOS_CONTENIDO.CALENDARIO,
      repositorio,
      auditoriaService
    );
  }
  validarElemento(normalizado) {
    super.validarElemento(normalizado);

    if (!normalizado.fechaInicio) {
      throw this.crearError(
        "La fecha inicial del evento es obligatoria.",
        "FECHA_EVENTO_REQUERIDA"
      );
    }
  }

  async importar(datos, contexto = {}) {
    const anio = this.numero(datos.anio);

    if (!anio || anio < 2000 || anio > 2100) {
      throw this.crearError(
        "Debe indicar un año válido para el calendario.",
        "ANIO_CALENDARIO_INVALIDO"
      );
    }

    for (const [indice, elemento] of (datos.elementos || []).entries()) {
      const fecha = this.fecha(
        elemento.fechaInicio ?? elemento.fecha,
        `fechaInicio de la fila ${indice + 1}`
      );

      if (fecha && fecha.getUTCFullYear() !== anio) {
        throw this.crearError(
          `La fila ${indice + 1} no pertenece al calendario ${anio}.`,
          "ANIO_EVENTO_NO_COINCIDE"
        );
      }
    }

    return super.importar(datos, contexto);
  }
}

module.exports = CalendarioService;
