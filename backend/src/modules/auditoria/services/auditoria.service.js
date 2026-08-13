const SqlAuditoriaRepository = require(
  "../repositories/sql-auditoria.repository"
);

/*
 * Servicio del módulo de auditoría.
 *
 * Se encarga de:
 * - Validar los datos recibidos.
 * - Normalizar los valores.
 * - Enviar el registro al repositorio.
 * - Permitir registros seguros que no interrumpan
 *   la operación principal del sistema.
 *
 * Este archivo:
 * - No consulta directamente SQL Server.
 * - No ejecuta procedimientos almacenados.
 * - No conoce detalles de la conexión.
 */
class AuditoriaService {
  /**
   * @param {object} repositorio
   */
  constructor(
    repositorio = new SqlAuditoriaRepository()
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
      typeof valor === "string"
        ? valor.trim()
        : "";

    if (!texto) {
      throw this.crearError(
        `El campo ${nombreCampo} es obligatorio.`,
        400,
        "DATOS_AUDITORIA_INCOMPLETOS"
      );
    }

    if (texto.length > longitudMaxima) {
      throw this.crearError(
        `El campo ${nombreCampo} no puede superar los ${longitudMaxima} caracteres.`,
        400,
        "DATOS_AUDITORIA_INVALIDOS"
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

    const texto = String(valor).trim();

    if (!texto) {
      return null;
    }

    return texto.slice(
      0,
      longitudMaxima
    );
  }

  /**
   * Normaliza el identificador del administrador.
   *
   * @param {*} idAdministrador
   * @returns {number|null}
   */
  normalizarIdAdministrador(
    idAdministrador
  ) {
    if (
      idAdministrador === null ||
      idAdministrador === undefined ||
      idAdministrador === ""
    ) {
      return null;
    }

    const idNormalizado =
      Number(idAdministrador);

    if (
      !Number.isInteger(idNormalizado) ||
      idNormalizado <= 0
    ) {
      throw this.crearError(
        "El identificador del administrador no es válido.",
        400,
        "ID_ADMINISTRADOR_INVALIDO"
      );
    }

    return idNormalizado;
  }

  /**
   * Normaliza la información que se guardará
   * como datos anteriores o datos nuevos.
   *
   * Se permiten:
   * - Objetos.
   * - Arreglos.
   * - Cadenas.
   * - Números.
   * - Valores booleanos.
   * - null.
   *
   * @param {*} valor
   * @returns {*}
   */
  normalizarDatos(valor) {
    if (
      valor === undefined ||
      valor === null
    ) {
      return null;
    }

    if (typeof valor === "string") {
      const texto = valor.trim();

      return texto || null;
    }

    return valor;
  }

  /**
   * Prepara y valida los datos de auditoría.
   *
   * @param {object} datosAuditoria
   * @returns {object}
   */
  prepararDatosAuditoria(
    datosAuditoria
  ) {
    if (
      !datosAuditoria ||
      typeof datosAuditoria !== "object" ||
      Array.isArray(datosAuditoria)
    ) {
      throw this.crearError(
        "Los datos de auditoría no son válidos.",
        400,
        "DATOS_AUDITORIA_INVALIDOS"
      );
    }

    const codigoAccion =
      this.normalizarTextoObligatorio(
        datosAuditoria.codigoAccion,
        "codigoAccion",
        50
      ).toUpperCase();

    const codigoModulo =
      this.normalizarTextoObligatorio(
        datosAuditoria.codigoModulo,
        "codigoModulo",
        60
      ).toUpperCase();

    return {
      idAdministrador:
        this.normalizarIdAdministrador(
          datosAuditoria.idAdministrador
        ),

      codigoAccion,

      codigoModulo,

      tablaAfectada:
        this.normalizarTextoOpcional(
          datosAuditoria.tablaAfectada,
          128
        ),

      idRegistroAfectado:
        this.normalizarTextoOpcional(
          datosAuditoria.idRegistroAfectado,
          100
        ),

      datosAnteriores:
        this.normalizarDatos(
          datosAuditoria.datosAnteriores
        ),

      datosNuevos:
        this.normalizarDatos(
          datosAuditoria.datosNuevos
        ),

      descripcion:
        this.normalizarTextoOpcional(
          datosAuditoria.descripcion,
          500
        ),

      direccionIp:
        this.normalizarTextoOpcional(
          datosAuditoria.direccionIp,
          45
        ),

      userAgent:
        this.normalizarTextoOpcional(
          datosAuditoria.userAgent,
          500
        )
    };
  }

  /**
   * Registra una acción en la auditoría.
   *
   * Si ocurre un error, este se propaga al servicio
   * que realizó la llamada.
   *
   * @param {object} datosAuditoria
   * @param {number|null} datosAuditoria.idAdministrador
   * @param {string} datosAuditoria.codigoAccion
   * @param {string} datosAuditoria.codigoModulo
   * @param {string|null} datosAuditoria.tablaAfectada
   * @param {string|number|null} datosAuditoria.idRegistroAfectado
   * @param {*|null} datosAuditoria.datosAnteriores
   * @param {*|null} datosAuditoria.datosNuevos
   * @param {string|null} datosAuditoria.descripcion
   * @param {string|null} datosAuditoria.direccionIp
   * @param {string|null} datosAuditoria.userAgent
   * @returns {Promise<object>}
   */
  async registrarAuditoria(
    datosAuditoria
  ) {
    const datosPreparados =
      this.prepararDatosAuditoria(
        datosAuditoria
      );

    return this.repositorio
      .registrarAuditoria(
        datosPreparados
      );
  }

  /**
   * Registra una acción sin interrumpir
   * la operación principal.
   *
   * Este método debe utilizarse cuando un error
   * de auditoría no debe impedir acciones como:
   * - Iniciar sesión.
   * - Verificar un código.
   * - Recuperar una contraseña.
   * - Cerrar una sesión.
   *
   * @param {object} datosAuditoria
   * @returns {Promise<object|null>}
   */
  async registrarAuditoriaSegura(
    datosAuditoria
  ) {
    try {
      return await this.registrarAuditoria(
        datosAuditoria
      );
    } catch (error) {
      console.error(
        "No se pudo registrar la auditoría:",
        error.message
      );

      return null;
    }
  }

  /**
   * Alias utilizado por controladores y servicios
   * para registrar auditorías sin interrumpir
   * la operación principal.
   *
   * @param {object} datosAuditoria
   * @returns {Promise<object|null>}
   */
  async registrarSinInterrumpir(
    datosAuditoria
  ) {
    return this.registrarAuditoriaSegura(
      datosAuditoria
    );
  }
}

module.exports = AuditoriaService;