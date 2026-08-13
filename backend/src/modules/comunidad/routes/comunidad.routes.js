const express =
  require("express");

const comunidadController =
  require(
    "../controllers/comunidad.controller"
  );

const authenticationMiddleware =
  require(
    "../../../middlewares/authentication.middleware"
  );

const router =
  express.Router();

/*
 * Ruta pública.
 *
 * GET /api/comunidad/publica
 */
router.get(
  "/publica",
  comunidadController
    .obtenerComunidadPublica
);

/*
 * Ruta administrativa protegida.
 *
 * GET /api/comunidad/administracion
 */
router.get(
  "/administracion",
  authenticationMiddleware,
  comunidadController
    .obtenerComunidadAdministrativa
);

module.exports =
  router;
