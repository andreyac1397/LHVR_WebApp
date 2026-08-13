const express = require(
  "express"
);

const ofertaAcademicaController =
  require(
    "../controllers/oferta-academica.controller"
  );

const authenticationMiddleware =
  require(
    "../../../middlewares/authentication.middleware"
  );

const router =
  express.Router();

/*
 * ============================================================
 * RUTAS PÚBLICAS
 * ============================================================
 */

/**
 * Obtiene únicamente el contenido publicado
 * de Oferta académica.
 *
 * GET /api/oferta-academica/publica
 */
router.get(
  "/publica",

  ofertaAcademicaController
    .obtenerOfertaPublica
);


/*
 * ============================================================
 * RUTAS ADMINISTRATIVAS
 * ============================================================
 */

/**
 * Obtiene toda la información necesaria
 * para administrar Oferta académica.
 *
 * GET /api/oferta-academica/administracion
 */
router.get(
  "/administracion",

  authenticationMiddleware,

  ofertaAcademicaController
    .obtenerOfertaAdministrativa
);

/**
 * Obtiene los ciclos educativos disponibles.
 *
 * GET /api/oferta-academica/ciclos
 */
router.get(
  "/ciclos",

  authenticationMiddleware,

  ofertaAcademicaController
    .obtenerCiclos
);

/**
 * Crea una materia.
 *
 * POST /api/oferta-academica/materias
 */
router.post(
  "/materias",

  authenticationMiddleware,

  ofertaAcademicaController
    .crearMateria
);

/**
 * Actualiza una materia.
 *
 * PUT /api/oferta-academica/materias/:idMateria
 */
router.put(
  "/materias/:idMateria",

  authenticationMiddleware,

  ofertaAcademicaController
    .actualizarMateria
);

/**
 * Retira una materia sin eliminar
 * físicamente su registro.
 *
 * DELETE /api/oferta-academica/materias/:idMateria
 */
router.delete(
  "/materias/:idMateria",

  authenticationMiddleware,

  ofertaAcademicaController
    .retirarMateria
);

module.exports = router;