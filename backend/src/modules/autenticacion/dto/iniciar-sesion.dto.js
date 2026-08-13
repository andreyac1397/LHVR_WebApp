/*
 * DTO para el inicio de sesión administrativo.
 *
 * Recibe únicamente los datos que ya fueron revisados
 * por iniciar-sesion.validator.js.
 *
 * No valida credenciales, no consulta SQL Server
 * y no compara contraseñas.
 */

class IniciarSesionDTO {
  constructor({ correo, contrasena }) {
    this.correo = correo;
    this.contrasena = contrasena;

    /* Impide modificar el DTO después de crearlo */
    Object.freeze(this);
  }
}

/**
 * Construye el DTO con los datos validados.
 */
function crearIniciarSesionDTO(datosValidados) {
  if (
    datosValidados === null ||
    typeof datosValidados !== "object" ||
    Array.isArray(datosValidados)
  ) {
    const error = new Error(
      "No fue posible preparar los datos del inicio de sesión."
    );

    error.statusCode = 400;
    throw error;
  }

  return new IniciarSesionDTO({
    correo: datosValidados.correo,
    contrasena: datosValidados.contrasena
  });
}

module.exports = {
  IniciarSesionDTO,
  crearIniciarSesionDTO
};  