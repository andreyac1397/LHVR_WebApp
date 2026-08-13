const express = require("express");

const authenticationMiddleware = require(
  "../../middlewares/authentication.middleware"
);

function crearSolicitudRoutes(controlador) {
  const router = express.Router();

  router.post(
    "/publico",
    controlador.crear
  );

  router.use(authenticationMiddleware);

  router.get(
    "/administracion",
    controlador.listar
  );

  router.put(
    "/:idSolicitud",
    controlador.actualizar
  );

  return router;
}

module.exports = crearSolicitudRoutes;
