const express = require("express");

const paginaController = require(
  "../controllers/pagina.controller"
);

const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);

const router = express.Router();

/*
 * ============================================================
 * RUTAS DE PÁGINAS Y CONTENIDO
 * Liceo Hernán Vargas Ramírez
 * ============================================================
 *
 * Ruta base:
 * /api/paginas
 *
 * Rutas públicas:
 * - No requieren sesión administrativa.
 *
 * Rutas administrativas:
 * - Requieren la cookie sesion_admin.
 * - Utilizan authentication.middleware.js.
 * ============================================================
 */


/*
 * ============================================================
 * 1. RUTAS PÚBLICAS
 * ============================================================
 */

/**
 * Obtiene una página pública y únicamente
 * sus secciones visibles.
 *
 * Ejemplo:
 * GET /api/paginas/publicas/inicio
 */
router.get(
  "/publicas/:slug",
  (
    req,
    res,
    next
  ) =>
    paginaController
      .obtenerContenidoPublico(
        req,
        res,
        next
      )
);


/*
 * ============================================================
 * 2. PROTECCIÓN DE RUTAS ADMINISTRATIVAS
 * ============================================================
 *
 * Todas las rutas declaradas después de este punto
 * requieren una sesión administrativa válida.
 */
router.use(
  authenticationMiddleware
);


/*
 * ============================================================
 * 3. ESTADOS DE PUBLICACIÓN
 * ============================================================
 */

/**
 * Lista los estados de publicación activos.
 *
 * GET /api/paginas/estados-publicacion
 */
router.get(
  "/estados-publicacion",
  (
    req,
    res,
    next
  ) =>
    paginaController
      .listarEstadosPublicacion(
        req,
        res,
        next
      )
);


/*
 * ============================================================
 * 4. CONTENIDO PARA EL PANEL ADMINISTRATIVO
 * ============================================================
 */

/**
 * Obtiene una página y todas sus secciones,
 * incluyendo borradores, contenido inactivo
 * y contenido archivado.
 *
 * Ejemplo:
 * GET /api/paginas/administracion/inicio
 */
router.get(
  "/administracion/:slug",
  (
    req,
    res,
    next
  ) =>
    paginaController
      .obtenerContenidoAdministrativo(
        req,
        res,
        next
      )
);


/*
 * ============================================================
 * 5. GUARDAR SECCIONES
 * ============================================================
 */

/**
 * Crea o actualiza una sección de página.
 *
 * Cuando idSeccionPagina es null:
 * - Crea una sección.
 *
 * Cuando idSeccionPagina contiene un valor:
 * - Actualiza la sección existente.
 *
 * POST /api/paginas/secciones
 */
router.post(
  "/secciones",
  (
    req,
    res,
    next
  ) =>
    paginaController
      .guardarSeccion(
        req,
        res,
        next
      )
);


/*
 * ============================================================
 * 6. RETIRAR SECCIONES
 * ============================================================
 */

/**
 * Retira lógicamente una sección de página.
 *
 * No elimina físicamente el registro.
 * Cambia su estado de publicación a Archivado.
 *
 * POST /api/paginas/secciones/:idSeccionPagina/retirar
 */
router.post(
  "/secciones/:idSeccionPagina/retirar",
  (
    req,
    res,
    next
  ) =>
    paginaController
      .retirarSeccion(
        req,
        res,
        next
      )
);


module.exports = router;