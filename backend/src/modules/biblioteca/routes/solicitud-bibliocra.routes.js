const express = require("express");
const solicitudBibliocraController = require(
  "../controllers/solicitud-bibliocra.controller"
);
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const crearLimitePublico = require(
  "../../../middlewares/public-rate-limit.middleware"
);

const router = express.Router();
router.post(
  "/publico",
  crearLimitePublico({ maximo: 5, codigo: "LIMITE_BIBLIOCRA_EXCEDIDO" }),
  solicitudBibliocraController.crear
);
router.use(authenticationMiddleware);
router.get("/administracion", solicitudBibliocraController.listar);
router.patch("/administracion/:idSolicitud", solicitudBibliocraController.actualizar);

module.exports = router;
