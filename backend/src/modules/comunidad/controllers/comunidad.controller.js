const {
  comunidadService
} = require(
  "../../../container/dependency-container"
);

/*
 * Controlador HTTP de Comunidad.
 *
 * Endpoints esperados:
 * - GET /api/comunidad/publica
 * - GET /api/comunidad/administracion
 */
class ComunidadController {
  /**
   * GET /api/comunidad/publica
   */
  async obtenerComunidadPublica(
    req,
    res,
    next
  ) {
    try {
      const datos =
        await comunidadService
          .obtenerComunidadPublica();

      return res
        .status(200)
        .json({
          exito: true,

          mensaje:
            "La información pública de Comunidad fue obtenida correctamente.",

          datos
        });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/comunidad/administracion
   *
   * Esta ruta debe ejecutarse después de
   * authentication.middleware.js.
   */
  async obtenerComunidadAdministrativa(
    req,
    res,
    next
  ) {
    try {
      const datos =
        await comunidadService
          .obtenerComunidadAdministrativa();

      return res
        .status(200)
        .json({
          exito: true,

          mensaje:
            "La información administrativa de Comunidad fue obtenida correctamente.",

          datos
        });
    } catch (error) {
      return next(error);
    }
  }
}

const comunidadController =
  new ComunidadController();

module.exports =
  comunidadController;
