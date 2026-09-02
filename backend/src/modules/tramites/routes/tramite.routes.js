const express = require("express");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const tramiteController = require(
  "../controllers/tramite.controller"
);

const router = express.Router();

router.get("/publico", tramiteController.listarPublico);

router.use(authenticationMiddleware);

router.get("/administracion", tramiteController.obtenerAdministracion);
router.get("/importaciones", tramiteController.listarImportaciones);
router.post("/colecciones", tramiteController.guardarColeccion);
router.post(
  "/colecciones/:idColeccion/publicar",
  tramiteController.publicarColeccion
);
router.put(
  "/colecciones/:idColeccion/guardar-cambios",
  tramiteController.guardarCambios
);
router.post(
  "/colecciones/:idColeccion/secciones",
  tramiteController.crearSeccion
);
router.delete(
  "/colecciones/:idColeccion/secciones/:seccion",
  tramiteController.eliminarSeccion
);
router.delete(
  "/colecciones/:idColeccion",
  tramiteController.eliminarColeccion
);
router.post("/elementos", tramiteController.guardarElemento);
router.put(
  "/elementos/:idElemento",
  tramiteController.actualizarElemento
);
router.delete(
  "/elementos/:idElemento/permanente",
  tramiteController.eliminarElemento
);
router.delete(
  "/elementos/:idElemento",
  tramiteController.archivarElemento
);
router.post("/importar", tramiteController.importar);

module.exports = router;
