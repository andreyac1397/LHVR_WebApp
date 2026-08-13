/*
 * DTO de recuperación de contraseña.
 *
 * Los DTO únicamente organizan los datos que pasan
 * desde el controlador hacia el servicio.
 *
 * Las validaciones se realizan previamente en:
 * recuperar-contrasena.validator.js
 */

/**
 * Datos para solicitar un código de recuperación.
 */
class SolicitarRecuperacionDto {
  /**
   * @param {object} datos
   * @param {string} datos.correo
   */
  constructor(datos = {}) {
    this.correo = datos.correo;
  }
}

/**
 * Datos para verificar el código recibido.
 */
class VerificarRecuperacionDto {
  /**
   * @param {object} datos
   * @param {string} datos.tokenRecuperacion
   * @param {string} datos.codigo
   */
  constructor(datos = {}) {
    this.tokenRecuperacion =
      datos.tokenRecuperacion;

    this.codigo =
      datos.codigo;
  }
}

/**
 * Datos para establecer la contraseña nueva.
 */
class RestablecerContrasenaDto {
  /**
   * @param {object} datos
   * @param {string} datos.tokenRestablecimiento
   * @param {string} datos.contrasenaNueva
   * @param {string} datos.confirmarContrasenaNueva
   */
  constructor(datos = {}) {
    this.tokenRestablecimiento =
      datos.tokenRestablecimiento;

    this.contrasenaNueva =
      datos.contrasenaNueva;

    this.confirmarContrasenaNueva =
      datos.confirmarContrasenaNueva;
  }
}

module.exports = {
  SolicitarRecuperacionDto,
  VerificarRecuperacionDto,
  RestablecerContrasenaDto
};