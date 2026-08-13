const ContenidoService = require(
  "../../../shared/content-management/contenido.service"
);

const {
  MODULOS_CONTENIDO
} = require(
  "../../../shared/content-management/contenido-modulos"
);

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes"];

class HorarioService extends ContenidoService {
  constructor(repositorio, auditoriaService = null) {
    super(
      MODULOS_CONTENIDO.HORARIOS,
      repositorio,
      auditoriaService
    );
  }

  validarElemento(normalizado) {
    super.validarElemento(normalizado);

    const seccion = this.texto(normalizado.datos?.seccion, 60);
    const leccion = this.texto(
      normalizado.datos?.lec ?? normalizado.datos?.leccion,
      30
    );
    const horas = this.texto(
      normalizado.datos?.horas ?? normalizado.datos?.horario,
      60
    );
    const tieneClase = DIAS.some((dia) =>
      Boolean(this.texto(normalizado.datos?.[dia], 500)));

    if (!seccion) {
      throw this.crearError(
        "La sección es obligatoria en cada fila del horario.",
        "SECCION_HORARIO_REQUERIDA"
      );
    }

    if (!leccion || !horas) {
      throw this.crearError(
        "Cada fila debe indicar la lección y el rango de horas.",
        "BLOQUE_HORARIO_INCOMPLETO"
      );
    }

    if (!tieneClase) {
      throw this.crearError(
        "Cada fila debe incluir al menos una actividad de lunes a viernes.",
        "DIAS_HORARIO_VACIOS"
      );
    }
  }
}

module.exports = HorarioService;
