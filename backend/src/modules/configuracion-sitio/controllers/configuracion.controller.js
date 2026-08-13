/* ============================================================
   CONFIGURACION.CONTROLLER.JS
   Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Controlador HTTP para la configuración general del sitio.

   Responsabilidades:
   - Obtener configuración pública.
   - Obtener configuración para administración.
   - Guardar cambios realizados desde el panel administrativo.
   - Obtener el administrador autenticado desde la sesión.
   - Delegar la lógica de negocio al servicio.
   - Delegar errores al middleware global.

   Formato de respuesta:
   {
     exito: true,
     mensaje: "...",
     datos: ...
   }
   ============================================================ */

const ConfiguracionService = require(
  "../services/configuracion.service"
);


/* ============================================================
   CONTROLADOR
   ============================================================ */

class ConfiguracionController {

  /**
   * @param {ConfiguracionService} configuracionService
   */
  constructor(
    configuracionService =
      new ConfiguracionService()
  ) {
    this.configuracionService =
      configuracionService;

    /*
     * Se enlazan los métodos para poder utilizarlos
     * directamente desde Express Router.
     */
    this.obtenerConfiguracionPublica =
      this.obtenerConfiguracionPublica.bind(
        this
      );

    this.obtenerConfiguracionAdministracion =
      this.obtenerConfiguracionAdministracion.bind(
        this
      );

    this.guardarConfiguracion =
      this.guardarConfiguracion.bind(
        this
      );
  }


  /* ==========================================================
     UTILIDADES
     ========================================================== */

  /**
   * Obtiene el identificador del administrador autenticado.
   *
   * El middleware de autenticación coloca la sesión
   * administrativa en:
   *
   * req.sesionAdministrador
   *
   * @param {object} req
   * @returns {number|null}
   */
  obtenerIdAdministrador(req) {
    return (
      req.sesionAdministrador
        ?.idAdministrador ??
      null
    );
  }


  /* ==========================================================
     CONFIGURACIÓN PÚBLICA
     ========================================================== */

  /**
   * GET
   *
   * Obtiene únicamente las configuraciones públicas.
   *
   * Este endpoint puede ser utilizado por:
   * - Página Contacto.
   * - Página Nosotros.
   * - Footer.
   * - Otras partes públicas del sitio.
   */
  async obtenerConfiguracionPublica(
    req,
    res,
    next
  ) {
    try {
      const configuraciones =
        await this.configuracionService
          .obtenerConfiguracionPublica();


      return res
        .status(200)
        .json({
          exito: true,

          mensaje:
            "Configuración pública obtenida correctamente.",

          datos:
            configuraciones
        });

    } catch (error) {
      return next(error);
    }
  }


  /* ==========================================================
     CONFIGURACIÓN ADMINISTRATIVA
     ========================================================== */

  /**
   * GET
   *
   * Obtiene todas las configuraciones disponibles
   * para el panel administrativo.
   *
   * Este endpoint debe estar protegido por la
   * autenticación administrativa.
   */
  async obtenerConfiguracionAdministracion(
    req,
    res,
    next
  ) {
    try {
      const configuraciones =
        await this.configuracionService
          .obtenerConfiguracionAdministracion();


      return res
        .status(200)
        .json({
          exito: true,

          mensaje:
            "Configuración administrativa obtenida correctamente.",

          datos:
            configuraciones
        });

    } catch (error) {
      return next(error);
    }
  }


  /* ==========================================================
     GUARDAR CONFIGURACIÓN
     ========================================================== */

  /**
   * PUT / PATCH
   *
   * Actualiza una configuración existente.
   *
   * Body esperado:
   *
   * {
   *   "clave": "correo_institucional",
   *   "valor": "correo@institucion.ac.cr"
   * }
   *
   * El administrador no se recibe desde el frontend.
   * Se obtiene de la sesión autenticada.
   */
  async guardarConfiguracion(
    req,
    res,
    next
  ) {
    try {
      const idAdministrador =
        this.obtenerIdAdministrador(
          req
        );


      const configuracionGuardada =
        await this.configuracionService
          .guardarConfiguracion(
            req.body,
            idAdministrador
          );


      return res
        .status(200)
        .json({
          exito: true,

          mensaje:
            "Configuración actualizada correctamente.",

          datos:
            configuracionGuardada
        });

    } catch (error) {
      return next(error);
    }
  }
}


/* ============================================================
   INSTANCIA DEL CONTROLADOR
   ============================================================ */

const configuracionController =
  new ConfiguracionController();


module.exports =
  configuracionController;