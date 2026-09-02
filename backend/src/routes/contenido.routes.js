const express = require("express");

const boletinRoutes = require(
  "../modules/boletines/routes/boletin.routes"
);
const calendarioRoutes = require(
  "../modules/calendario/routes/calendario.routes"
);
const bibliotecaRoutes = require(
  "../modules/biblioteca/routes/biblioteca.routes"
);
const docenteRoutes = require(
  "../modules/docentes/routes/docente.routes"
);
const horarioRoutes = require(
  "../modules/horarios/routes/horario.routes"
);
const tramiteRoutes = require(
  "../modules/tramites/routes/tramite.routes"
);
const recursoApoyoRoutes = require(
  "../modules/recursos-apoyo/routes/recurso-apoyo.routes"
);
const galeriaRoutes = require(
  "../modules/galeria/routes/galeria.routes"
);

/*
 * Agregador de rutas: cada módulo conserva su controlador, servicio,
 * repositorio y archivo de rutas; aquí solamente se montan bajo /api.
 */
const router = express.Router();

router.use("/boletines", boletinRoutes);
router.use("/calendario", calendarioRoutes);
router.use("/biblioteca", bibliotecaRoutes);
router.use("/docentes", docenteRoutes);
router.use("/horarios", horarioRoutes);
router.use("/tramites", tramiteRoutes);
router.use("/recursos-apoyo", recursoApoyoRoutes);
router.use("/galeria", galeriaRoutes);

module.exports = router;
