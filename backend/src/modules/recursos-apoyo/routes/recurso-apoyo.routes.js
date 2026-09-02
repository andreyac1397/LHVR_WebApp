const express = require("express");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const recursoApoyoController = require(
  "../controllers/recurso-apoyo.controller"
);

const router = express.Router();

router.get("/publico", recursoApoyoController.listarPublico);

router.use(authenticationMiddleware);

router.get("/administracion", recursoApoyoController.obtenerAdministracion);
router.get("/importaciones", recursoApoyoController.listarImportaciones);
router.post("/colecciones", recursoApoyoController.guardarColeccion);
router.post(
  "/colecciones/:idColeccion/publicar",
  recursoApoyoController.publicarColeccion
);
router.put(
  "/colecciones/:idColeccion/guardar-cambios",
  recursoApoyoController.guardarCambios
);
router.post(
  "/colecciones/:idColeccion/secciones",
  recursoApoyoController.crearSeccion
);
router.delete(
  "/colecciones/:idColeccion/secciones/:seccion",
  recursoApoyoController.eliminarSeccion
);
router.delete(
  "/colecciones/:idColeccion",
  recursoApoyoController.eliminarColeccion
);
router.post("/elementos", recursoApoyoController.guardarElemento);
router.put(
  "/elementos/:idElemento",
  recursoApoyoController.actualizarElemento
);
router.delete(
  "/elementos/:idElemento/permanente",
  recursoApoyoController.eliminarElemento
);
router.delete(
  "/elementos/:idElemento",
  recursoApoyoController.archivarElemento
);
router.post("/importar", recursoApoyoController.importar);

module.exports = router;
