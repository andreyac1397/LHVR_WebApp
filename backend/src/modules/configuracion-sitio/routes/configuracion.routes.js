/* ============================================================
   CONFIGURACION.ROUTES.JS
   Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Rutas para la configuración general del sitio.

   Endpoints:
   - GET  /publica
   - GET  /administracion
   - PUT  /administracion

   La configuración pública no requiere autenticación.

   La consulta y modificación administrativa requieren
   una sesión válida de administrador.
   ============================================================ */

const express = require("express");

const configuracionController = require(
  "../controllers/configuracion.controller"
);

const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);


/* ============================================================
   ROUTER
   ============================================================ */

const router =
  express.Router();


/* ============================================================
   RUTAS PÚBLICAS
   ============================================================ */

/**
 * Obtiene únicamente las configuraciones marcadas
 * como públicas.
 *
 * Ejemplos:
 * - nombre_institucion
 * - direccion_institucional
 * - telefonos_institucionales
 * - correo_institucional
 * - horario_atencion
 * - facebook_url
 * - google_maps_url
 *
 * Ruta final:
 * GET /api/configuracion-sitio/publica
 */
router.get(
  "/publica",
  configuracionController
    .obtenerConfiguracionPublica
);


/* ============================================================
   RUTAS ADMINISTRATIVAS
   ============================================================ */

/**
 * Obtiene todas las configuraciones del sitio para
 * el panel administrativo.
 *
 * Requiere sesión administrativa.
 *
 * Ruta final:
 * GET /api/configuracion-sitio/administracion
 */
router.get(
  "/administracion",

  authenticationMiddleware,

  configuracionController
    .obtenerConfiguracionAdministracion
);


/**
 * Actualiza una configuración existente.
 *
 * Body esperado:
 *
 * {
 *   "clave": "correo_institucional",
 *   "valor": "correo@institucion.ac.cr"
 * }
 *
 * El id del administrador NO se recibe desde el frontend.
 * El controlador lo obtiene desde req.sesionAdministrador.
 *
 * Requiere sesión administrativa.
 *
 * Ruta final:
 * PUT /api/configuracion-sitio/administracion
 */
router.put(
  "/administracion",

  authenticationMiddleware,

  configuracionController
    .guardarConfiguracion
);


/* ============================================================
   EXPORTACIÓN
   ============================================================ */

module.exports =
  router;