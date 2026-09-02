const express = require("express");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const boletinController = require(
  "../controllers/boletin.controller"
);

const router = express.Router();

router.get("/publico", boletinController.listarPublico);

router.use(authenticationMiddleware);

router.get("/administracion", boletinController.obtenerAdministracion);
router.get("/importaciones", boletinController.listarImportaciones);
router.get("/correo/categorias", boletinController.listarCategoriasCorreo);
router.get("/correo/destinatarios", boletinController.listarDestinatariosCorreo);
router.get("/correo/destinatarios/:idDestinatario", boletinController.obtenerDestinatarioCorreo);
router.post("/correo/destinatarios", boletinController.crearDestinatarioCorreo);
router.put("/correo/destinatarios/:idDestinatario", boletinController.actualizarDestinatarioCorreo);
router.patch("/correo/destinatarios/:idDestinatario/estado", boletinController.cambiarEstadoDestinatarioCorreo);
router.post("/correo/seleccion/resolver", boletinController.resolverSeleccionCorreo);
router.get("/correo/envios", boletinController.listarEnviosCorreo);
router.get("/correo/envios/:idEnvio", boletinController.obtenerDetalleEnvioCorreo);
router.post("/correo/envios", boletinController.enviarBoletinCorreo);
router.get("/correo/boletines/:idElemento", boletinController.obtenerEnvioBoletin);
router.post("/colecciones", boletinController.guardarColeccion);
router.post(
  "/colecciones/:idColeccion/publicar",
  boletinController.publicarColeccion
);
router.put(
  "/colecciones/:idColeccion/guardar-cambios",
  boletinController.guardarCambios
);
router.post(
  "/colecciones/:idColeccion/secciones",
  boletinController.crearSeccion
);
router.delete(
  "/colecciones/:idColeccion/secciones/:seccion",
  boletinController.eliminarSeccion
);
router.delete(
  "/colecciones/:idColeccion",
  boletinController.eliminarColeccion
);
router.post("/elementos", boletinController.guardarElemento);
router.put(
  "/elementos/:idElemento",
  boletinController.actualizarElemento
);
router.delete(
  "/elementos/:idElemento/permanente",
  boletinController.eliminarElemento
);
router.delete(
  "/elementos/:idElemento",
  boletinController.archivarElemento
);
router.post("/importar", boletinController.importar);

module.exports = router;
