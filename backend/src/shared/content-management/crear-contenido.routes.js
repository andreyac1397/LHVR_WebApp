const express = require("express");

const authenticationMiddleware = require(
  "../../middlewares/authentication.middleware"
);

function crearContenidoRoutes(controlador) {
  const router = express.Router();

  router.get(
    "/publico",
    controlador.listarPublico
  );

  router.use(authenticationMiddleware);

  router.get(
    "/administracion",
    controlador.obtenerAdministracion
  );

  router.get(
    "/importaciones",
    controlador.listarImportaciones
  );

  router.post(
    "/colecciones",
    controlador.guardarColeccion
  );

  router.post(
    "/colecciones/:idColeccion/publicar",
    controlador.publicarColeccion
  );

  router.post(
    "/elementos",
    controlador.guardarElemento
  );

  router.put(
    "/elementos/:idElemento",
    controlador.actualizarElemento
  );

  router.delete(
    "/elementos/:idElemento",
    controlador.archivarElemento
  );

  router.post(
    "/importar",
    controlador.importar
  );

  return router;
}

module.exports = crearContenidoRoutes;
