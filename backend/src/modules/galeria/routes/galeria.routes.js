const express = require("express");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const galeriaController = require(
  "../controllers/galeria.controller"
);

const router = express.Router();

router.get("/publico", galeriaController.listarPublico);

router.use(authenticationMiddleware);

router.get("/administracion", galeriaController.obtenerAdministracion);
router.get("/importaciones", galeriaController.listarImportaciones);
router.post("/colecciones", galeriaController.guardarColeccion);
router.post(
  "/colecciones/:idColeccion/publicar",
  galeriaController.publicarColeccion
);
router.put(
  "/colecciones/:idColeccion/guardar-cambios",
  galeriaController.guardarCambios
);
router.post(
  "/colecciones/:idColeccion/secciones",
  galeriaController.crearSeccion
);
router.delete(
  "/colecciones/:idColeccion/secciones/:seccion",
  galeriaController.eliminarSeccion
);
router.delete(
  "/colecciones/:idColeccion",
  galeriaController.eliminarColeccion
);
router.post("/elementos", galeriaController.guardarElemento);
router.put(
  "/elementos/:idElemento",
  galeriaController.actualizarElemento
);
router.delete(
  "/elementos/:idElemento/permanente",
  galeriaController.eliminarElemento
);
router.delete(
  "/elementos/:idElemento",
  galeriaController.archivarElemento
);
router.post("/importar", galeriaController.importar);

module.exports = router;
