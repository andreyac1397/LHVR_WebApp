const SqlOfertaAcademicaRepository = require(
  "../repositories/sql-oferta-academica.repository"
);

const TIPOS_ENLACE_VALIDOS = [
  "INTERNO",
  "EXTERNO",
  "ARCHIVO",
  "NINGUNO"
];

class MateriaService {
  /**
   * @param {object} repositorio
   */
  constructor(
    repositorio =
      new SqlOfertaAcademicaRepository()
  ) {
    this.repositorio = repositorio;
  }

  /**
   * Crea un error controlado.
   *
   * @param {string} mensaje
   * @param {number} statusCode
   * @param {string} codigo
   * @returns {Error}
   */
  crearError(
    mensaje,
    statusCode,
    codigo
  ) {
    const error = new Error(mensaje);

    error.statusCode = statusCode;
    error.codigo = codigo;

    return error;
  }

  /**
   * Normaliza un texto obligatorio.
   *
   * @param {*} valor
   * @param {string} nombreCampo
   * @param {number} longitudMaxima
   * @returns {string}
   */
  normalizarTextoObligatorio(
    valor,
    nombreCampo,
    longitudMaxima
  ) {
    const texto =
      String(valor ?? "").trim();

    if (!texto) {
      throw this.crearError(
        `${nombreCampo} es obligatorio.`,
        400,
        "DATOS_MATERIA_INCOMPLETOS"
      );
    }

    if (
      texto.length >
      longitudMaxima
    ) {
      throw this.crearError(
        `${nombreCampo} supera la longitud permitida.`,
        400,
        "DATOS_MATERIA_INVALIDOS"
      );
    }

    return texto;
  }

  /**
   * Normaliza un texto opcional.
   *
   * @param {*} valor
   * @param {number} longitudMaxima
   * @returns {string|null}
   */
  normalizarTextoOpcional(
    valor,
    longitudMaxima
  ) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    const texto =
      String(valor).trim();

    if (!texto) {
      return null;
    }

    if (
      texto.length >
      longitudMaxima
    ) {
      throw this.crearError(
        "Uno de los textos supera la longitud permitida.",
        400,
        "DATOS_MATERIA_INVALIDOS"
      );
    }

    return texto;
  }

  /**
   * Normaliza un entero positivo.
   *
   * @param {*} valor
   * @param {string} nombreCampo
   * @returns {number}
   */
  obtenerEnteroPositivo(
    valor,
    nombreCampo
  ) {
    const numero =
      Number(valor);

    if (
      !Number.isInteger(numero) ||
      numero <= 0
    ) {
      throw this.crearError(
        `${nombreCampo} no es válido.`,
        400,
        "DATOS_MATERIA_INVALIDOS"
      );
    }

    return numero;
  }

  /**
   * Normaliza el orden.
   *
   * @param {*} valor
   * @returns {number}
   */
  obtenerOrden(valor) {
    const orden =
      Number(valor);

    if (
      !Number.isInteger(orden) ||
      orden < 0
    ) {
      throw this.crearError(
        "El orden de la materia debe ser un número igual o mayor que cero.",
        400,
        "ORDEN_MATERIA_INVALIDO"
      );
    }

    return orden;
  }

  /**
   * Valida y normaliza los ciclos asociados.
   *
   * @param {*} ciclos
   * @returns {Array}
   */
  prepararCiclos(ciclos) {
    if (
      !Array.isArray(ciclos) ||
      ciclos.length === 0
    ) {
      throw this.crearError(
        "Debe seleccionar al menos un ciclo educativo.",
        400,
        "CICLOS_MATERIA_REQUERIDOS"
      );
    }

    const ciclosPreparados =
      ciclos.map(
        (ciclo) => {
          if (
            !ciclo ||
            typeof ciclo !== "object"
          ) {
            throw this.crearError(
              "Uno de los ciclos educativos no es válido.",
              400,
              "CICLO_MATERIA_INVALIDO"
            );
          }

          const idCicloEducativo =
            this.obtenerEnteroPositivo(
              ciclo.idCicloEducativo,
              "El ciclo educativo"
            );

          const orden =
            this.obtenerOrden(
              ciclo.orden
            );

          return {
            idCicloEducativo,
            orden
          };
        }
      );

    const ids =
      ciclosPreparados.map(
        (ciclo) =>
          ciclo.idCicloEducativo
      );

    if (
      new Set(ids).size !==
      ids.length
    ) {
      throw this.crearError(
        "No puede seleccionar el mismo ciclo educativo más de una vez.",
        400,
        "CICLO_MATERIA_DUPLICADO"
      );
    }

    return ciclosPreparados;
  }

  /**
   * Prepara los datos antes de enviarlos
   * al repositorio.
   *
   * @param {object} datos
   * @param {number|null} idAdministrador
   * @returns {object}
   */
  prepararDatosMateria(
    datos,
    idAdministrador = null
  ) {
    if (
      !datos ||
      typeof datos !== "object"
    ) {
      throw this.crearError(
        "Los datos de la materia no son válidos.",
        400,
        "DATOS_MATERIA_INVALIDOS"
      );
    }

    const idMateria =
      datos.idMateria === null ||
      datos.idMateria === undefined
        ? null
        : this.obtenerEnteroPositivo(
          datos.idMateria,
          "La materia"
        );

    const codigo =
      this.normalizarTextoObligatorio(
        datos.codigo,
        "El código",
        30
      )
        .toUpperCase()
        .replace(/\s+/g, "_");

    const nombre =
      this.normalizarTextoObligatorio(
        datos.nombre,
        "El nombre",
        150
      );

    const descripcionPublica =
      this.normalizarTextoOpcional(
        datos.descripcionPublica,
        800
      );

    let urlPlanEstudio =
      this.normalizarTextoOpcional(
        datos.urlPlanEstudio,
        1000
      );

    let textoBoton =
      this.normalizarTextoOpcional(
        datos.textoBoton,
        120
      );

    const tipoEnlace =
      String(
        datos.tipoEnlace ??
        "NINGUNO"
      )
        .trim()
        .toUpperCase();

    if (
      !TIPOS_ENLACE_VALIDOS
        .includes(tipoEnlace)
    ) {
      throw this.crearError(
        "El tipo de enlace seleccionado no es válido.",
        400,
        "TIPO_ENLACE_INVALIDO"
      );
    }

    if (
      tipoEnlace === "NINGUNO"
    ) {
      urlPlanEstudio = null;
      textoBoton = null;
    } else {
      if (
        !urlPlanEstudio ||
        urlPlanEstudio === "#"
      ) {
        throw this.crearError(
          "Debe indicar el enlace del plan de estudio.",
          400,
          "URL_PLAN_ESTUDIO_REQUERIDA"
        );
      }

      if (!textoBoton) {
        throw this.crearError(
          "Debe indicar el texto del botón.",
          400,
          "TEXTO_BOTON_REQUERIDO"
        );
      }
    }

    const orden =
      this.obtenerOrden(
        datos.orden
      );

    const idEstadoPublicacion =
      this.obtenerEnteroPositivo(
        datos.idEstadoPublicacion,
        "El estado de publicación"
      );

    const ciclos =
      this.prepararCiclos(
        datos.ciclos
      );

    let administrador = null;

    if (
      idAdministrador !== null &&
      idAdministrador !== undefined
    ) {
      administrador =
        this.obtenerEnteroPositivo(
          idAdministrador,
          "El administrador"
        );
    }

    return {
      idMateria,
      codigo,
      nombre,
      descripcionPublica,
      urlPlanEstudio,
      textoBoton,
      tipoEnlace,
      orden,

      mostrarOfertaAcademica:
        datos.mostrarOfertaAcademica ===
          undefined
          ? true
          : Boolean(
            datos.mostrarOfertaAcademica
          ),

      activo:
        datos.activo === undefined
          ? true
          : Boolean(datos.activo),

      idEstadoPublicacion,
      idAdministrador:
        administrador,

      ciclos
    };
  }

  /**
   * Obtiene toda la Oferta académica
   * para el panel administrativo.
   *
   * @returns {Promise<object>}
   */
  async obtenerOfertaAdministrativa() {
    return this.repositorio
      .obtenerOfertaAdministrativa();
  }

  /**
   * Obtiene la Oferta académica publicada.
   *
   * @returns {Promise<object>}
   */
  async obtenerOfertaPublica() {
    return this.repositorio
      .obtenerOfertaPublica();
  }

  /**
   * Guarda una materia.
   *
   * Funciona tanto para crear como
   * para actualizar.
   *
   * @param {object} datos
   * @param {number|null} idAdministrador
   * @returns {Promise<object>}
   */
  async guardarMateria(
    datos,
    idAdministrador = null
  ) {
    const datosPreparados =
      this.prepararDatosMateria(
        datos,
        idAdministrador
      );

    return this.repositorio
      .guardarMateria(
        datosPreparados
      );
  }

  /**
   * Retira una materia sin eliminarla
   * físicamente de la base de datos.
   *
   * @param {*} idMateria
   * @param {number|null} idAdministrador
   * @returns {Promise<object>}
   */
  async retirarMateria(
    idMateria,
    idAdministrador = null
  ) {
    const id =
      this.obtenerEnteroPositivo(
        idMateria,
        "La materia"
      );

    let administrador = null;

    if (
      idAdministrador !== null &&
      idAdministrador !== undefined
    ) {
      administrador =
        this.obtenerEnteroPositivo(
          idAdministrador,
          "El administrador"
        );
    }

    const resultado =
      await this.repositorio
        .retirarMateria(
          id,
          administrador
        );

    if (!resultado) {
      throw this.crearError(
        "No fue posible retirar la materia.",
        404,
        "MATERIA_NO_ENCONTRADA"
      );
    }

    return resultado;
  }

  /**
   * Obtiene una materia administrativa
   * mediante su ID.
   *
   * @param {*} idMateria
   * @returns {Promise<object>}
   */
  async obtenerMateriaPorId(
    idMateria
  ) {
    const id =
      this.obtenerEnteroPositivo(
        idMateria,
        "La materia"
      );

    const oferta =
      await this
        .obtenerOfertaAdministrativa();

    const materias =
      Array.isArray(
        oferta?.materias
      )
        ? oferta.materias
        : [];

    const materia =
      materias.find(
        (item) =>
          Number(item.idMateria) ===
          id
      );

    if (!materia) {
      throw this.crearError(
        "La materia indicada no existe.",
        404,
        "MATERIA_NO_ENCONTRADA"
      );
    }

    return materia;
  }
}

module.exports =
  MateriaService;