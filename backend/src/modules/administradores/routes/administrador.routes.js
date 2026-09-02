const express = require("express");
const authenticationMiddleware = require("../../../middlewares/authentication.middleware");
const administradorController = require("../controllers/administrador.controller");

const router = express.Router();

router.use(authenticationMiddleware);
router.get("/", administradorController.listar);
router.post("/", administradorController.crear);
router.put("/:idAdministrador", administradorController.actualizar);
router.patch("/:idAdministrador/estado", administradorController.cambiarEstado);
router.post("/:idAdministrador/reenviar-acceso", administradorController.reenviarAcceso);
router.post("/:idAdministrador/recuperacion", administradorController.enviarRecuperacion);

module.exports = router;
