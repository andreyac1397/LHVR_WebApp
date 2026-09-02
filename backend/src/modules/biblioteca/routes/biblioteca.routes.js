const express = require("express");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const bibliotecaController = require(
  "../controllers/biblioteca.controller"
);

const router = express.Router();

router.get("/publico", bibliotecaController.listarPublico);

router.use(authenticationMiddleware);

router.get("/administracion", bibliotecaController.obtenerAdministracion);
router.get("/importaciones", bibliotecaController.listarImportaciones);
router.post("/colecciones", bibliotecaController.guardarColeccion);
router.post(
  "/colecciones/:idColeccion/publicar",
  bibliotecaController.publicarColeccion
);
router.put(
  "/colecciones/:idColeccion/guardar-cambios",
  bibliotecaController.guardarCambios
);
router.post(
  "/colecciones/:idColeccion/secciones",
  bibliotecaController.crearSeccion
);
router.delete(
  "/colecciones/:idColeccion/secciones/:seccion",
  bibliotecaController.eliminarSeccion
);
router.delete(
  "/colecciones/:idColeccion",
  bibliotecaController.eliminarColeccion
);
router.post("/elementos", bibliotecaController.guardarElemento);
router.put(
  "/elementos/:idElemento",
  bibliotecaController.actualizarElemento
);
router.delete(
  "/elementos/:idElemento/permanente",
  bibliotecaController.eliminarElemento
);
router.delete(
  "/elementos/:idElemento",
  bibliotecaController.archivarElemento
);
router.post("/importar", bibliotecaController.importar);

module.exports = router;
