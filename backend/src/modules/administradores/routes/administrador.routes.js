const express = require("express");
const authenticationMiddleware = require("../../../middlewares/authentication.middleware");
const administradorController = require("../controllers/administrador.controller");

const router = express.Router();

router.use(authenticationMiddleware);
router.get("/", administradorController.listar);
router.post("/", administradorController.crear);
router.patch("/:idAdministrador/estado", administradorController.cambiarEstado);

module.exports = router;
