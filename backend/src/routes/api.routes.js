const express = require("express");

const healthRoutes = require(
  "./health.routes"
);

const autenticacionRoutes = require(
  "../modules/autenticacion/routes/autenticacion.routes"
);

const paginaRoutes = require(
  "../modules/paginas-contenido/routes/pagina.routes"
);

const archivoRoutes = require(
  "../modules/archivos/routes/archivo.routes"
);

const ofertaAcademicaRoutes = require(
  "../modules/oferta-academica/routes/oferta-academica.routes"
);

const comunidadRoutes = require(
  "../modules/comunidad/routes/comunidad.routes"
);

const configuracionRoutes = require(
  "../modules/configuracion-sitio/routes/configuracion.routes"
);

const contenidoRoutes = require(
  "./contenido.routes"
);

const contactoRoutes = require(
  "../modules/contacto/routes/contacto.routes"
);

const solicitudBibliocraRoutes = require(
  "../modules/biblioteca/routes/solicitud-bibliocra.routes"
);

const dashboardRoutes = require(
  "../modules/dashboard/routes/dashboard.routes"
);

const auditoriaRoutes = require(
  "../modules/auditoria/routes/auditoria.routes"
);

const administradorRoutes = require(
  "../modules/administradores/routes/administrador.routes"
);

const {
  respuestaExitosa
} = require(
  "../shared/utils/response.util"
);

const router =
  express.Router();


/*
 * GET /api
 * Ruta principal de la API.
 */
router.get(
  "/",
  (req, res) => {
    return respuestaExitosa(
      res,
      "API del Liceo Hernán Vargas Ramírez disponible"
    );
  }
);


/*
 * Rutas de comprobación del sistema
 */
router.use(
  "/estado",
  healthRoutes
);


/*
 * Rutas de autenticación administrativa
 */
router.use(
  "/autenticacion",
  autenticacionRoutes
);


/*
 * Rutas de páginas y contenido
 */
router.use(
  "/paginas",
  paginaRoutes
);


/*
 * Rutas de carga y gestión de archivos
 */
router.use(
  "/archivos",
  archivoRoutes
);


/*
 * Rutas de Oferta académica
 */
router.use(
  "/oferta-academica",
  ofertaAcademicaRoutes
);


/*
 * Rutas de Comunidad
 */
router.use(
  "/comunidad",
  comunidadRoutes
);


/*
 * Rutas de configuración general del sitio
 *
 * GET /api/configuracion-sitio/publica
 * GET /api/configuracion-sitio/administracion
 * PUT /api/configuracion-sitio/administracion
 */
router.use(
  "/configuracion-sitio",
  configuracionRoutes
);

router.use(
  "/contacto",
  contactoRoutes
);

router.use(
  "/solicitudes-bibliocra",
  solicitudBibliocraRoutes
);

router.use(
  "/dashboard",
  dashboardRoutes
);

router.use(
  "/auditoria",
  auditoriaRoutes
);

router.use(
  "/administradores",
  administradorRoutes
);


/*
 * Contenido versionado: boletines, calendario, BiblioCRA, docentes,
 * horarios, trámites, recursos de apoyo y galería.
 */
router.use(
  "/",
  contenidoRoutes
);


module.exports =
  router;
