/*
 * DTO para cambiar la contraseña de un administrador.
 *
 * Su responsabilidad es transportar los datos ya validados
 * desde el controlador hacia el servicio.
 *
 * No valida reglas.
 * No consulta la base de datos.
 * No genera hashes.
 */

class CambiarContrasenaDTO {
  /**
   * @param {object} datos
   * @param {string} datos.contrasenaActual
   * @param {string} datos.contrasenaNueva
   * @param {string} datos.confirmarContrasenaNueva
   */
  constructor(datos) {
    this.contrasenaActual =
      datos.contrasenaActual;

    this.contrasenaNueva =
      datos.contrasenaNueva;

    this.confirmarContrasenaNueva =
      datos.confirmarContrasenaNueva;

    /*
     * Evita que el objeto sea modificado
     * después de su creación.
     */
    Object.freeze(this);
  }
}

/**
 * Crea el DTO de cambio de contraseña.
 *
 * Las contraseñas no se recortan con trim(),
 * porque los espacios pueden formar parte de ellas.
 *
 * @param {object} datos
 * @returns {CambiarContrasenaDTO}
 */
function crearCambiarContrasenaDTO(datos) {
  return new CambiarContrasenaDTO({
    contrasenaActual:
      datos.contrasenaActual,

    contrasenaNueva:
      datos.contrasenaNueva,

    confirmarContrasenaNueva:
      datos.confirmarContrasenaNueva
  });
}

module.exports = {
  CambiarContrasenaDTO,
  crearCambiarContrasenaDTO
};