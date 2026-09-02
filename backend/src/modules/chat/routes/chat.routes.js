const express = require("express");
const chatController = require("../controllers/chat.controller");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const crearLimitePublico = require(
  "../../../middlewares/public-rate-limit.middleware"
);

const router = express.Router();
const limitarCreacion = crearLimitePublico({
  ventanaMs: 15 * 60 * 1000,
  maximo: 5,
  codigo: "LIMITE_CREACION_CHAT_EXCEDIDO",
  mensaje: "Se iniciaron varias conversaciones. Intente nuevamente más tarde."
});
const limitarMensajes = crearLimitePublico({
  ventanaMs: 60 * 1000,
  maximo: 30,
  codigo: "LIMITE_MENSAJES_CHAT_EXCEDIDO",
  mensaje: "Se enviaron varios mensajes. Espere un momento e intente nuevamente."
});

router.post(
  "/publico/conversaciones",
  limitarCreacion,
  chatController.crearConversacionPublica
);
router.get(
  "/publico/conversacion",
  chatController.obtenerConversacionPublica
);
router.get(
  "/publico/mensajes",
  chatController.listarMensajesPublicos
);
router.post(
  "/publico/mensajes",
  limitarMensajes,
  chatController.crearMensajePublico
);
router.post(
  "/publico/marcar-leidos",
  chatController.marcarMensajesPublicosLeidos
);

router.use(authenticationMiddleware);
router.get(
  "/administracion/conversaciones",
  chatController.listarConversaciones
);
router.get(
  "/administracion/conversaciones/:idConversacion",
  chatController.obtenerConversacion
);
router.get(
  "/administracion/conversaciones/:idConversacion/mensajes",
  chatController.listarMensajes
);
router.post(
  "/administracion/conversaciones/:idConversacion/mensajes",
  chatController.crearMensaje
);
router.patch(
  "/administracion/conversaciones/:idConversacion/estado",
  chatController.actualizarEstado
);
router.patch(
  "/administracion/conversaciones/:idConversacion/archivar",
  chatController.archivarConversacion
);
router.delete(
  "/administracion/conversaciones/:idConversacion",
  chatController.eliminarConversacion
);
router.post(
  "/administracion/conversaciones/:idConversacion/marcar-leidos",
  chatController.marcarMensajesLeidos
);

module.exports = router;
