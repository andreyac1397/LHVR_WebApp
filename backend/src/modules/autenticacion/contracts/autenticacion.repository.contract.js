/*
 * Contrato del repositorio de autenticación.
 *
 * Define las operaciones que debe implementar
 * sql-autenticacion.repository.js.
 *
 * Este archivo:
 * - No consulta SQL Server.
 * - No ejecuta procedimientos almacenados.
 * - No contiene reglas de autenticación.
 * - Solo establece las funciones obligatorias.
 */

class AutenticacionRepositoryContract {
  /**
   * Busca un administrador por correo.
   *
   * @param {string} correo
   * @returns {Promise<object|null>}
   */
  async buscarAdministradorPorCorreo(correo) {
    throw new Error(
      "El método buscarAdministradorPorCorreo debe ser implementado."
    );
  }

  /**
   * Registra un intento de inicio de sesión.
   *
   * @param {object} datosIntento
   * @param {number|null} datosIntento.idAdministrador
   * @param {string} datosIntento.correoIngresado
   * @param {boolean} datosIntento.exitoso
   * @param {string|null} datosIntento.motivoResultado
   * @param {string|null} datosIntento.direccionIp
   * @param {string|null} datosIntento.userAgent
   * @returns {Promise<object>}
   */
  async registrarIntentoInicioSesion(datosIntento) {
    throw new Error(
      "El método registrarIntentoInicioSesion debe ser implementado."
    );
  }

  /**
   * Cuenta los intentos fallidos recientes
   * por correo y dirección IP.
   *
   * @param {object} filtros
   * @param {string} filtros.correo
   * @param {string|null} filtros.direccionIp
   * @param {number} filtros.ventanaMinutos
   * @returns {Promise<object>}
   */
  async contarIntentosFallidosRecientes(filtros) {
    throw new Error(
      "El método contarIntentosFallidosRecientes debe ser implementado."
    );
  }

  /**
   * Actualiza la fecha del último acceso.
   *
   * @param {number} idAdministrador
   * @returns {Promise<object>}
   */
  async actualizarUltimoAcceso(idAdministrador) {
    throw new Error(
      "El método actualizarUltimoAcceso debe ser implementado."
    );
  }

  /**
   * Actualiza el hash de la contraseña del administrador.
   *
   * El procedimiento almacenado también revoca los tokens
   * activos e invalida los códigos pendientes.
   *
   * @param {number} idAdministrador
   * @param {string} contrasenaHashNueva
   * @returns {Promise<object>}
   */
  async actualizarContrasenaAdministrador(
    idAdministrador,
    contrasenaHashNueva
  ) {
    throw new Error(
      "El método actualizarContrasenaAdministrador debe ser implementado."
    );
  }

  /**
   * Crea un código de verificación protegido.
   *
   * @param {object} datosCodigo
   * @param {number} datosCodigo.idAdministrador
   * @param {string} datosCodigo.tipoCodigo
   * @param {string} datosCodigo.codigoHash
   * @param {number} datosCodigo.minutosVigencia
   * @param {number} datosCodigo.maximoIntentos
   * @param {string|null} datosCodigo.direccionIp
   * @returns {Promise<object>}
   */
  async crearCodigoVerificacion(datosCodigo) {
    throw new Error(
      "El método crearCodigoVerificacion debe ser implementado."
    );
  }

  /**
   * Obtiene el código vigente más reciente.
   *
   * @param {number} idAdministrador
   * @param {string} tipoCodigo
   * @returns {Promise<object|null>}
   */
  async obtenerCodigoVerificacionVigente(
    idAdministrador,
    tipoCodigo
  ) {
    throw new Error(
      "El método obtenerCodigoVerificacionVigente debe ser implementado."
    );
  }

  /**
   * Registra un intento incorrecto de código.
   *
   * @param {number} idCodigoVerificacionAdmin
   * @returns {Promise<object>}
   */
  async registrarIntentoFallidoCodigo(
    idCodigoVerificacionAdmin
  ) {
    throw new Error(
      "El método registrarIntentoFallidoCodigo debe ser implementado."
    );
  }

  /**
   * Marca un código como utilizado.
   *
   * @param {number} idCodigoVerificacionAdmin
   * @returns {Promise<object>}
   */
  async marcarCodigoVerificacionUsado(
    idCodigoVerificacionAdmin
  ) {
    throw new Error(
      "El método marcarCodigoVerificacionUsado debe ser implementado."
    );
  }

  /**
   * Crea un token administrativo protegido.
   *
   * @param {object} datosToken
   * @param {number} datosToken.idAdministrador
   * @param {string} datosToken.tipoToken
   * @param {string} datosToken.tokenHash
   * @param {number} datosToken.minutosVigencia
   * @param {string|null} datosToken.direccionIp
   * @param {string|null} datosToken.userAgent
   * @returns {Promise<object>}
   */
  async crearTokenAdministrador(datosToken) {
    throw new Error(
      "El método crearTokenAdministrador debe ser implementado."
    );
  }

  /**
   * Busca un token activo por su hash.
   *
   * @param {string} tipoToken
   * @param {string} tokenHash
   * @returns {Promise<object|null>}
   */
  async buscarTokenActivo(tipoToken, tokenHash) {
    throw new Error(
      "El método buscarTokenActivo debe ser implementado."
    );
  }

  /**
   * Revoca un token administrativo.
   *
   * @param {string} tipoToken
   * @param {string} tokenHash
   * @returns {Promise<object>}
   */
  async revocarTokenAdministrador(
    tipoToken,
    tokenHash
  ) {
    throw new Error(
      "El método revocarTokenAdministrador debe ser implementado."
    );
  }

  /**
   * Consulta los límites de solicitudes
   * de recuperación de contraseña.
   *
   * @param {object} filtros
   * @param {string} filtros.correoHash
   * @param {string|null} filtros.direccionIp
   * @param {number} filtros.ventanaMinutos
   * @param {number} filtros.segundosEspera
   * @returns {Promise<object>}
   */
  async consultarLimitesRecuperacion(
    filtros
  ) {
    throw new Error(
      "El método consultarLimitesRecuperacion debe ser implementado."
    );
  }
}

module.exports = AutenticacionRepositoryContract;