const ContenidoService = require(
  "../../../shared/content-management/contenido.service"
);

const {
  MODULOS_CONTENIDO
} = require(
  "../../../shared/content-management/contenido-modulos"
);

const PLANTILLA_SECCION = Object.freeze([
  ["1", "07:00-07:40"],
  ["2", "07:40-08:20"],
  ["RECESO", "08:20-08:35", "Receso 15 minutos"],
  ["3", "08:35-09:15"],
  ["4", "09:15-09:55"],
  ["RECESO", "09:55-10:00", "Receso 5 minutos"],
  ["5", "10:00-10:40"],
  ["6", "10:40-11:20"],
  ["ALMUERZO", "11:20-12:00", "Almuerzo 40 minutos"],
  ["7", "12:00-12:40"],
  ["8", "12:40-01:20"],
  ["RECESO", "01:20-01:30", "Receso 10 minutos"],
  ["9", "01:30-02:10"],
  ["10", "02:10-02:50"],
  ["RECESO", "02:50-02:55", "Receso 5 minutos"],
  ["11", "02:55-03:35"],
  ["12", "03:35-04:15"]
]);

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

  }

  normalizarClave(valor) {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  crearElementosPlantilla(seccion, profesorGuia) {
    return PLANTILLA_SECCION.map(
      ([leccion, horas, descanso], orden) => {
        const datos = {
          seccion,
          profesor_guia: profesorGuia || "",
          lec: leccion,
          horas,
          lunes: descanso || "",
          martes: descanso || "",
          miercoles: descanso || "",
          jueves: descanso || "",
          viernes: descanso || ""
        };

        return {
          claveExterna: [seccion, leccion, horas]
            .map((valor) => this.normalizarClave(valor))
            .join("-"),
          titulo: `${seccion} · Lección ${leccion}`,
          descripcion:
            `${horas}${profesorGuia ? ` · ${profesorGuia}` : ""}`,
          orden,
          estado: "PUBLICADO",
          datos
        };
      }
    );
  }

  async crearSeccion(datos, contexto = {}) {
    const idColeccion = this.numero(datos.idColeccion);
    const seccion = this.texto(datos.seccion, 60);
    const profesorGuia = this.texto(datos.profesorGuia, 250) || "";

    if (!idColeccion) {
      throw this.crearError(
        "Debe seleccionar una versión antes de crear la sección.",
        "COLECCION_REQUERIDA"
      );
    }

    if (!seccion || !/^(7|8|9|10|11)-(?:[1-9]|1\d|20)$/.test(seccion)) {
      throw this.crearError(
        "La sección debe usar un nivel del 7 al 11 y un grupo del 1 al 20.",
        "SECCION_HORARIO_INVALIDA"
      );
    }

    const elementos = this.crearElementosPlantilla(
      seccion,
      profesorGuia
    );

    return {
      idColeccion,
      seccion,
      filasCreadas: elementos.length,
      elementos
    };
  }

  async guardarCambios(idColeccion, datos, contexto = {}) {
    const id = this.numero(idColeccion);

    if (!id) {
      throw this.crearError(
        "Debe seleccionar una versión antes de guardar los cambios.",
        "COLECCION_REQUERIDA"
      );
    }

    if (!Array.isArray(datos?.elementos)) {
      throw this.crearError(
        "Debe enviar el estado completo del horario.",
        "ELEMENTOS_HORARIO_REQUERIDOS"
      );
    }

    if (datos.elementos.length > 2000) {
      throw this.crearError(
        "El horario supera el máximo de 2000 filas.",
        "HORARIO_DEMASIADO_GRANDE"
      );
    }

    const elementos = datos.elementos.map((elemento, indice) =>
      this.normalizarElemento(
        {
          ...elemento,
          idColeccion: id
        },
        indice
      )
    );
    const idsExistentes = new Set();
    const clavesExistentes = new Set();

    elementos.forEach((elemento) => {
      if (elemento.idElemento > 0) {
        if (idsExistentes.has(elemento.idElemento)) {
          throw this.crearError(
            "El horario contiene filas repetidas.",
            "ELEMENTO_HORARIO_DUPLICADO"
          );
        }
        idsExistentes.add(elemento.idElemento);
      }

      const clave = String(elemento.claveExterna || "")
        .toLocaleLowerCase("es");
      if (clave && clavesExistentes.has(clave)) {
        throw this.crearError(
          "El horario contiene posiciones duplicadas.",
          "POSICION_HORARIO_DUPLICADA"
        );
      }
      if (clave) {
        clavesExistentes.add(clave);
      }
    });

    const resultado =
      await this.repositorio.guardarCambiosHorario({
        modulo: this.modulo,
        idColeccion: id,
        elementos,
        idAdministrador: contexto.idAdministrador
      });

    await this.registrarAuditoria(
      "GUARDAR_CAMBIOS_HORARIO",
      id,
      null,
      resultado,
      contexto
    );

    return {
      idColeccion: id,
      ...resultado
    };
  }

  async eliminarSeccion(idColeccion, seccion, contexto = {}) {
    const id = this.numero(idColeccion);
    const seccionNormalizada = this.texto(seccion, 60);

    if (!id || !seccionNormalizada) {
      throw this.crearError(
        "La versión y la sección son obligatorias.",
        "SECCION_HORARIO_INVALIDA"
      );
    }

    const filasEliminadas =
      await this.repositorio.eliminarSeccionHorario(
        this.modulo,
        id,
        seccionNormalizada
      );

    if (filasEliminadas === 0) {
      throw this.crearError(
        "No se encontró la sección indicada.",
        "SECCION_HORARIO_NO_ENCONTRADA",
        404
      );
    }

    await this.registrarAuditoria(
      "ELIMINAR_SECCION_HORARIO",
      id,
      null,
      { seccion: seccionNormalizada, filasEliminadas },
      contexto
    );

    return {
      idColeccion: id,
      seccion: seccionNormalizada,
      filasEliminadas
    };
  }

  async exportarColeccion(idColeccion) {
    const id = this.numero(idColeccion);

    if (!id) {
      throw this.crearError(
        "Debe seleccionar una versión para descargar los horarios.",
        "COLECCION_REQUERIDA"
      );
    }

    const coleccion =
      await this.repositorio.obtenerColeccionPorId(
        id,
        this.modulo
      );

    if (!coleccion) {
      throw this.crearError(
        "No se encontró la versión de horarios indicada.",
        "COLECCION_NO_ENCONTRADA",
        404
      );
    }

    const elementos = await this.repositorio.listarElementos({
      modulo: this.modulo,
      idColeccion: id,
      soloPublicados: false
    });

    if (elementos.length === 0) {
      throw this.crearError(
        "La versión seleccionada no contiene horarios para descargar.",
        "HORARIOS_SIN_DATOS"
      );
    }

    return {
      coleccion,
      elementos
    };
  }
}

module.exports = HorarioService;
