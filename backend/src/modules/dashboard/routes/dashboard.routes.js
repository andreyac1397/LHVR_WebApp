const express = require("express");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const dashboardController = require("../controllers/dashboard.controller");

const router = express.Router();
router.get("/resumen", authenticationMiddleware, dashboardController.obtenerResumen);

module.exports = router;
