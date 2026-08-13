const express = require("express");

const autenticacionController = require(
  "../controllers/autenticacion.controller"
);

const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);

const router = express.Router();

/*
 * Rutas del módulo de autenticación.
 *
 * Ruta base:
 * /api/autenticacion
 */

/*
 * Ruta pública.
 *
 * Primera etapa:
 * valida correo y contraseña y envía
 * el código de verificación.
 *
 * POST /api/autenticacion/iniciar-sesion
 */
router.post(
  "/iniciar-sesion",
  autenticacionController.iniciarSesion.bind(
    autenticacionController
  )
);

/*
 * Ruta pública.
 *
 * Segunda etapa:
 * valida el código enviado por correo
 * y crea la sesión administrativa.
 *
 * POST /api/autenticacion/verificar-codigo
 */
router.post(
  "/verificar-codigo",
  autenticacionController.verificarCodigo.bind(
    autenticacionController
  )
);

/*
 * Ruta pública.
 *
 * Primera etapa de recuperación:
 * recibe el correo del administrador,
 * genera un código y lo envía por correo.
 *
 * POST /api/autenticacion/recuperar-contrasena/solicitar
 */
router.post(
  "/recuperar-contrasena/solicitar",
  autenticacionController
    .solicitarRecuperacionContrasena
    .bind(autenticacionController)
);

/*
 * Ruta pública.
 *
 * Segunda etapa de recuperación:
 * valida el código recibido por correo
 * y genera un token temporal para
 * restablecer la contraseña.
 *
 * POST /api/autenticacion/recuperar-contrasena/verificar
 */
router.post(
  "/recuperar-contrasena/verificar",
  autenticacionController
    .verificarCodigoRecuperacion
    .bind(autenticacionController)
);

/*
 * Ruta pública.
 *
 * Tercera etapa de recuperación:
 * establece la contraseña nueva utilizando
 * el token temporal obtenido después
 * de verificar el código.
 *
 * POST /api/autenticacion/recuperar-contrasena/restablecer
 */
router.post(
  "/recuperar-contrasena/restablecer",
  autenticacionController
    .restablecerContrasena
    .bind(autenticacionController)
);

/*
 * Ruta protegida.
 *
 * Comprueba si la cookie sesion_admin
 * representa una sesión válida.
 *
 * GET /api/autenticacion/sesion
 */
router.get(
  "/sesion",
  authenticationMiddleware,
  autenticacionController.obtenerSesion.bind(
    autenticacionController
  )
);

/*
 * Ruta protegida.
 *
 * Valida la contraseña actual, actualiza la nueva
 * contraseña y revoca todas las sesiones activas.
 *
 * PATCH /api/autenticacion/cambiar-contrasena
 */
router.patch(
  "/cambiar-contrasena",
  authenticationMiddleware,
  autenticacionController.cambiarContrasena.bind(
    autenticacionController
  )
);

/*
 * Ruta protegida.
 *
 * Revoca el token actual en SQL Server
 * y elimina la cookie del navegador.
 *
 * POST /api/autenticacion/cerrar-sesion
 */
router.post(
  "/cerrar-sesion",
  authenticationMiddleware,
  autenticacionController.cerrarSesion.bind(
    autenticacionController
  )
);

module.exports = router;