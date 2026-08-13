const express = require("express");

const contactoController = require("../controllers/contacto.controller");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const crearLimitePublico = require(
  "../../../middlewares/public-rate-limit.middleware"
);

const router = express.Router();
const limitarContacto = crearLimitePublico({
  maximo: 5,
  codigo: "LIMITE_CONTACTO_EXCEDIDO",
  mensaje: "Se recibieron varios mensajes en poco tiempo. Intente nuevamente más tarde."
});

router.post("/publico", limitarContacto, contactoController.crear);
router.use(authenticationMiddleware);
router.get("/administracion", contactoController.listar);
router.patch("/administracion/:idSolicitud", contactoController.actualizar);

module.exports = router;
