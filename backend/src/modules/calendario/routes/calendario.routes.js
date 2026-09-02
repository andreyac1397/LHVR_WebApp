const express = require("express");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const calendarioController = require(
  "../controllers/calendario.controller"
);

const router = express.Router();

router.get("/publico", calendarioController.listarPublico);

router.use(authenticationMiddleware);

router.get("/administracion", calendarioController.obtenerAdministracion);
router.get("/importaciones", calendarioController.listarImportaciones);
router.post("/colecciones", calendarioController.guardarColeccion);
router.post(
  "/colecciones/:idColeccion/publicar",
  calendarioController.publicarColeccion
);
router.put(
  "/colecciones/:idColeccion/guardar-cambios",
  calendarioController.guardarCambios
);
router.post(
  "/colecciones/:idColeccion/secciones",
  calendarioController.crearSeccion
);
router.delete(
  "/colecciones/:idColeccion/secciones/:seccion",
  calendarioController.eliminarSeccion
);
router.delete(
  "/colecciones/:idColeccion",
  calendarioController.eliminarColeccion
);
router.post("/elementos", calendarioController.guardarElemento);
router.put(
  "/elementos/:idElemento",
  calendarioController.actualizarElemento
);
router.delete(
  "/elementos/:idElemento/permanente",
  calendarioController.eliminarElemento
);
router.delete(
  "/elementos/:idElemento",
  calendarioController.archivarElemento
);
router.post("/importar", calendarioController.importar);

module.exports = router;
