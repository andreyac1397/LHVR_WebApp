const {
  materiaService,
  cicloEducativoService
} = require(
  "../../../container/dependency-container"
);

/**
 * Obtiene el administrador autenticado.
 *
 * @param {object} req
 * @returns {number}
 */
function obtenerIdAdministrador(req) {
  const idAdministrador =
    Number(
      req.sesionAdministrador
        ?.idAdministrador
    );

  if (
    !Number.isInteger(
      idAdministrador
    ) ||
    idAdministrador <= 0
  ) {
    const error =
      new Error(
        "Debe iniciar sesión para realizar esta operación."
      );

    error.statusCode = 401;
    error.codigo =
      "SESION_REQUERIDA";

    throw error;
  }

  return idAdministrador;
}

/*
 * Controlador del módulo Oferta académica.
 *
 * La consulta pública no requiere autenticación.
 * Las operaciones administrativas son protegidas
 * desde oferta-academica.routes.js.
 */
class OfertaAcademicaController {
  /**
   * Obtiene la oferta académica publicada.
   *
   * GET /api/oferta-academica/publica
   */
  async obtenerOfertaPublica(
    req,
    res,
    next
  ) {
    try {
      const resultado =
        await materiaService
          .obtenerOfertaPublica();

      return res.status(200).json({
        exito: true,

        mensaje:
          "La oferta académica fue obtenida correctamente.",

        datos: resultado
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Obtiene toda la información de Oferta académica
   * para el panel administrativo.
   *
   * GET /api/oferta-academica/administracion
   */
  async obtenerOfertaAdministrativa(
    req,
    res,
    next
  ) {
    try {
      const resultado =
        await materiaService
          .obtenerOfertaAdministrativa();

      return res.status(200).json({
        exito: true,

        mensaje:
          "La oferta académica administrativa fue obtenida correctamente.",

        datos: resultado
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Obtiene los ciclos educativos disponibles
   * para el panel administrativo.
   *
   * GET /api/oferta-academica/ciclos
   */
  async obtenerCiclos(
    req,
    res,
    next
  ) {
    try {
      const ciclos =
        await cicloEducativoService
          .obtenerCiclosAdministrativos();

      return res.status(200).json({
        exito: true,

        mensaje:
          "Los ciclos educativos fueron obtenidos correctamente.",

        datos: {
          ciclos
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Crea una materia nueva dentro
   * de Oferta académica.
   *
   * POST /api/oferta-academica/materias
   */
  async crearMateria(
    req,
    res,
    next
  ) {
    try {
      const idAdministrador =
        obtenerIdAdministrador(req);

      const datos =
        req.body &&
        typeof req.body ===
          "object"
          ? req.body
          : {};

      const resultado =
        await materiaService
          .guardarMateria(
            {
              ...datos,
              idMateria: null
            },
            idAdministrador
          );

      return res.status(201).json({
        exito: true,

        mensaje:
          "La materia fue creada correctamente.",

        datos: resultado
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Actualiza una materia existente.
   *
   * PUT /api/oferta-academica/materias/:idMateria
   */
  async actualizarMateria(
    req,
    res,
    next
  ) {
    try {
      const idAdministrador =
        obtenerIdAdministrador(req);

      const datos =
        req.body &&
        typeof req.body ===
          "object"
          ? req.body
          : {};

      const resultado =
        await materiaService
          .guardarMateria(
            {
              ...datos,

              idMateria:
                req.params
                  .idMateria
            },
            idAdministrador
          );

      return res.status(200).json({
        exito: true,

        mensaje:
          "La materia fue actualizada correctamente.",

        datos: resultado
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retira una materia de Oferta académica.
   *
   * La materia no se elimina físicamente.
   * El procedimiento almacenado:
   * - desactiva la materia,
   * - la retira de la oferta,
   * - la archiva,
   * - desactiva sus relaciones con ciclos.
   *
   * DELETE /api/oferta-academica/materias/:idMateria
   */
  async retirarMateria(
    req,
    res,
    next
  ) {
    try {
      const idAdministrador =
        obtenerIdAdministrador(req);

      const resultado =
        await materiaService
          .retirarMateria(
            req.params.idMateria,
            idAdministrador
          );

      return res.status(200).json({
        exito: true,

        mensaje:
          "La materia fue retirada de la oferta académica correctamente.",

        datos: resultado
      });
    } catch (error) {
      return next(error);
    }
  }
}

const ofertaAcademicaController =
  new OfertaAcademicaController();

module.exports =
  ofertaAcademicaController;