const crearSolicitudRoutes = require(
  "../../../shared/solicitudes-management/crear-solicitud.routes"
);

const solicitudBibliocraController = require(
  "../controllers/solicitud-bibliocra.controller"
);

module.exports = crearSolicitudRoutes(
  solicitudBibliocraController
);
