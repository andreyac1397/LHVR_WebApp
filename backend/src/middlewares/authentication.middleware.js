const crypto = require("node:crypto");

const {
  repositorioAutenticacion: repositorio
} = require(
  "../container/dependency-container"
);

const NOMBRE_COOKIE_SESION = "sesion_admin";
const TIPO_TOKEN_SESION = "SESION";

/**
 * Genera el hash SHA-256 del token recibido.
 *
 * Debe coincidir con el método utilizado al guardar
 * el token en la base de datos.
 *
 * @param {string} token
 * @returns {string}
 */
function generarHashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

/**
 * Crea un error controlado para el middleware
 * centralizado de errores.
 *
 * @param {string} mensaje
 * @param {number} statusCode
 * @param {string} codigo
 * @returns {Error}
 */
function crearError(mensaje, statusCode, codigo) {
  const error = new Error(mensaje);

  error.statusCode = statusCode;
  error.codigo = codigo;

  return error;
}

/**
 * Define las opciones necesarias para eliminar
 * correctamente la cookie administrativa.
 *
 * Deben coincidir con las opciones utilizadas
 * por autenticacion.controller.js al crearla.
 *
 * @returns {object}
 */
function obtenerOpcionesEliminarCookie() {
  const esProduccion =
    process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: esProduccion,

    sameSite: esProduccion
      ? "none"
      : "lax",

    path: "/"
  };
}

/**
 * Elimina la cookie administrativa.
 *
 * @param {object} res
 */
function eliminarCookieSesion(res) {
  res.clearCookie(
    NOMBRE_COOKIE_SESION,
    obtenerOpcionesEliminarCookie()
  );
}

/**
 * Verifica que exista una sesión administrativa válida.
 *
 * Flujo:
 * 1. Lee la cookie sesion_admin.
 * 2. Genera el hash del token.
 * 3. Busca el token activo en SQL Server.
 * 4. Confirma que el administrador tenga acceso.
 * 5. Agrega los datos de sesión al request.
 *
 * Los controladores protegidos podrán acceder mediante:
 *
 * req.sesionAdministrador
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
async function authenticationMiddleware(
  req,
  res,
  next
) {
  try {
    const tokenSesion =
      req.cookies?.[NOMBRE_COOKIE_SESION];

    if (
      typeof tokenSesion !== "string" ||
      tokenSesion.trim() === ""
    ) {
      throw crearError(
        "Debe iniciar sesión para acceder a este recurso.",
        401,
        "SESION_REQUERIDA"
      );
    }

    const tokenHash = generarHashToken(
      tokenSesion.trim()
    );

    const sesion =
      await repositorio.buscarTokenActivo(
        TIPO_TOKEN_SESION,
        tokenHash
      );

    if (!sesion) {
      eliminarCookieSesion(res);

      throw crearError(
        "La sesión expiró o ya no es válida.",
        401,
        "SESION_INVALIDA"
      );
    }

    /*
     * Aunque el token continúe vigente, la cuenta
     * pudo ser bloqueada, desactivada o perder
     * la verificación del correo posteriormente.
     */
    if (
      !sesion.estadoActivo ||
      !sesion.permiteAcceso ||
      !sesion.correoVerificado
    ) {
      /*
       * Revocar el token para impedir que vuelva
       * a utilizarse en solicitudes posteriores.
       */
      await repositorio
        .revocarTokenAdministrador(
          TIPO_TOKEN_SESION,
          tokenHash
        )
        .catch(() => null);

      eliminarCookieSesion(res);

      throw crearError(
        "La cuenta administrativa ya no está habilitada para acceder al panel.",
        403,
        "CUENTA_SIN_ACCESO"
      );
    }

    req.sesionAdministrador = {
      idTokenAdministrador: Number(
        sesion.idTokenAdministrador
      ),

      idAdministrador: Number(
        sesion.idAdministrador
      ),

      tipoToken:
        sesion.tipoToken,

      tokenHash,

      nombreCompleto:
        sesion.nombreCompleto,

      correo:
        sesion.correo,

      idEstadoAdministrador: Number(
        sesion.idEstadoAdministrador
      ),

      nombreEstado:
        sesion.nombreEstado,

      fechaEmision:
        sesion.fechaEmision,

      fechaExpiracion:
        sesion.fechaExpiracion
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authenticationMiddleware;