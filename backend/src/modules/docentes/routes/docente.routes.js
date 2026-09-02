const express = require("express");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const docenteController = require(
  "../controllers/docente.controller"
);

const router = express.Router();

router.get("/publico", docenteController.listarPublico);

router.use(authenticationMiddleware);

router.get("/administracion", docenteController.obtenerAdministracion);
router.get("/importaciones", docenteController.listarImportaciones);
router.post("/colecciones", docenteController.guardarColeccion);
router.post(
  "/colecciones/:idColeccion/publicar",
  docenteController.publicarColeccion
);
router.put(
  "/colecciones/:idColeccion/guardar-cambios",
  docenteController.guardarCambios
);
router.post(
  "/colecciones/:idColeccion/secciones",
  docenteController.crearSeccion
);
router.delete(
  "/colecciones/:idColeccion/secciones/:seccion",
  docenteController.eliminarSeccion
);
router.delete(
  "/colecciones/:idColeccion",
  docenteController.eliminarColeccion
);
router.post("/elementos", docenteController.guardarElemento);
router.put(
  "/elementos/:idElemento",
  docenteController.actualizarElemento
);
router.delete(
  "/elementos/:idElemento/permanente",
  docenteController.eliminarElemento
);
router.delete(
  "/elementos/:idElemento",
  docenteController.archivarElemento
);
router.post("/importar", docenteController.importar);

module.exports = router;
