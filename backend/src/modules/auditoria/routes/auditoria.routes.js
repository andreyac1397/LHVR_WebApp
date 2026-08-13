const express = require("express");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const auditoriaController = require("../controllers/auditoria.controller");

const router = express.Router();
router.get("/", authenticationMiddleware, auditoriaController.listar);

module.exports = router;
