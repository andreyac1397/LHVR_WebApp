const SqlOfertaAcademicaRepository = require(
  "../repositories/sql-oferta-academica.repository"
);

class CicloEducativoService {
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
   * Normaliza un ciclo educativo obtenido
   * desde SQL Server.
   *
   * @param {object} ciclo
   * @returns {object}
   */
  prepararCiclo(ciclo) {
    return {
      idCicloEducativo:
        Number(
          ciclo.idCicloEducativo
        ),

      nombre:
        ciclo.nombre ?? "",

      descripcion:
        ciclo.descripcion ?? null,

      orden:
        Number(ciclo.orden ?? 0),

      activo:
        ciclo.activo === undefined
          ? true
          : Boolean(ciclo.activo)
    };
  }

  /**
   * Obtiene los ciclos para el panel
   * administrativo.
   *
   * @returns {Promise<Array>}
   */
  async obtenerCiclosAdministrativos() {
    const oferta =
      await this.repositorio
        .obtenerOfertaAdministrativa();

    const ciclos =
      Array.isArray(oferta?.ciclos)
        ? oferta.ciclos
        : [];

    return ciclos
      .map(
        (ciclo) =>
          this.prepararCiclo(ciclo)
      )
      .sort(
        (a, b) =>
          a.orden - b.orden
      );
  }

  /**
   * Obtiene únicamente los ciclos disponibles
   * en la Oferta académica pública.
   *
   * @returns {Promise<Array>}
   */
  async obtenerCiclosPublicos() {
    const oferta =
      await this.repositorio
        .obtenerOfertaPublica();

    const ciclos =
      Array.isArray(oferta?.ciclos)
        ? oferta.ciclos
        : [];

    return ciclos
      .map(
        (ciclo) =>
          this.prepararCiclo(ciclo)
      )
      .sort(
        (a, b) =>
          a.orden - b.orden
      );
  }

  /**
   * Busca un ciclo administrativo por su ID.
   *
   * @param {*} idCicloEducativo
   * @returns {Promise<object>}
   */
  async obtenerCicloPorId(
    idCicloEducativo
  ) {
    const id = Number(
      idCicloEducativo
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw this.crearError(
        "El ciclo educativo indicado no es válido.",
        400,
        "CICLO_EDUCATIVO_INVALIDO"
      );
    }

    const ciclos =
      await this
        .obtenerCiclosAdministrativos();

    const ciclo =
      ciclos.find(
        (item) =>
          item.idCicloEducativo === id
      );

    if (!ciclo) {
      throw this.crearError(
        "El ciclo educativo indicado no existe.",
        404,
        "CICLO_EDUCATIVO_NO_ENCONTRADO"
      );
    }

    return ciclo;
  }
}

module.exports =
  CicloEducativoService;