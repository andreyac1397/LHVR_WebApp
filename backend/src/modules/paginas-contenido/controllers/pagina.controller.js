const {
  paginaService: paginaServiceContenedor,
  seccionPaginaService:
    seccionPaginaServiceContenedor
} = require(
  "../../../container/dependency-container"
);

const PaginaValidator = require(
  "../validators/pagina.validator"
);

/*
 * Controlador HTTP del módulo
 * de páginas y contenido.
 *
 * Responsabilidades:
 * - Recibir parámetros, consultas y cuerpos HTTP.
 * - Ejecutar las validaciones iniciales.
 * - Llamar a los servicios correspondientes.
 * - Construir las respuestas JSON.
 * - Enviar los errores al middleware centralizado.
 */
class PaginaController {
  /**
   * @param {object} paginaService
   * @param {object} seccionPaginaService
   * @param {object} paginaValidator
   */
  constructor(
    paginaService =
      paginaServiceContenedor,

    seccionPaginaService =
      seccionPaginaServiceContenedor,

    paginaValidator =
      new PaginaValidator()
  ) {
    this.paginaService =
      paginaService;

    this.seccionPaginaService =
      seccionPaginaService;

    this.paginaValidator =
      paginaValidator;
  }

  /**
   * Obtiene la dirección IP del cliente.
   *
   * @param {object} req
   * @returns {string|null}
   */
  obtenerDireccionIp(req) {
    const direccionIp =
      req.ip ||
      req.socket?.remoteAddress ||
      null;

    if (!direccionIp) {
      return null;
    }

    return String(direccionIp)
      .replace(/^::ffff:/, "")
      .slice(0, 45);
  }

  /**
   * Obtiene la información del navegador.
   *
   * @param {object} req
   * @returns {string|null}
   */
  obtenerUserAgent(req) {
    const userAgent =
      req.get("user-agent");

    if (!userAgent) {
      return null;
    }

    return String(userAgent)
      .slice(0, 500);
  }

  /**
   * Obtiene el contenido público de una página.
   *
   * Solo devuelve:
   * - Páginas visibles.
   * - Secciones visibles.
   * - Archivos activos.
   *
   * No requiere una sesión administrativa.
   *
   * GET /api/paginas/publicas/:slug
   */
  async obtenerContenidoPublico(
    req,
    res,
    next
  ) {
    try {
      const slug =
        this.paginaValidator
          .validarSlug(
            req.params?.slug
          );

      const resultado =
        await this.paginaService
          .obtenerContenidoPublico(
            slug
          );

      return res.status(200).json({
        exito: true,

        mensaje:
          "El contenido público de la página fue obtenido correctamente.",

        datos: {
          pagina:
            resultado.pagina,

          secciones:
            resultado.secciones
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Obtiene el contenido de una página
   * para el panel administrativo.
   *
   * Incluye:
   * - Contenido publicado.
   * - Borradores.
   * - Contenido inactivo.
   * - Contenido archivado.
   *
   * Requiere una sesión administrativa válida.
   *
   * GET /api/paginas/administracion/:slug
   */
  async obtenerContenidoAdministrativo(
    req,
    res,
    next
  ) {
    try {
      const slug =
        this.paginaValidator
          .validarSlug(
            req.params?.slug
          );

      const resultado =
        await this.paginaService
          .obtenerContenidoAdministrativo(
            slug
          );

      return res.status(200).json({
        exito: true,

        mensaje:
          "El contenido administrativo de la página fue obtenido correctamente.",

        datos: {
          pagina:
            resultado.pagina,

          secciones:
            resultado.secciones
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Obtiene secciones públicas conservando estados independientes
   * para el encabezado y el resto del contenido.
   *
   * GET /api/paginas/publicas-parciales/:slug
   */
  async obtenerContenidoPublicoParcial(
    req,
    res,
    next
  ) {
    try {
      const slug =
        this.paginaValidator
          .validarSlug(
            req.params?.slug
          );

      const resultado =
        await this.paginaService
          .obtenerContenidoPublicoParcial(
            slug
          );

      return res.status(200).json({
        exito: true,
        mensaje:
          "El contenido público parcial fue obtenido correctamente.",
        datos: {
          pagina: resultado.pagina,
          secciones: resultado.secciones
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Actualiza el encabezado y estado general de una página.
   * PUT /api/paginas/administracion/:idPagina
   */
  async guardarPagina(
    req,
    res,
    next
  ) {
    try {
      const dto =
        this.paginaValidator
          .crearGuardarPaginaDto(
            req.params?.idPagina,
            req.body
          );

      const resultado =
        await this.paginaService
          .guardarPagina(
            dto.toObject(),
            req.sesionAdministrador,
            {
              direccionIp:
                this.obtenerDireccionIp(req),
              userAgent:
                this.obtenerUserAgent(req)
            }
          );

      return res.status(200).json({
        exito: true,
        mensaje: resultado.mensaje,
        datos: {
          guardado: resultado.guardado,
          pagina: resultado.pagina
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Lista los estados de publicación activos.
   *
   * Requiere una sesión administrativa válida.
   *
   * GET /api/paginas/estados-publicacion
   */
  async listarEstadosPublicacion(
    req,
    res,
    next
  ) {
    try {
      const estados =
        await this.paginaService
          .listarEstadosPublicacion();

      return res.status(200).json({
        exito: true,

        mensaje:
          "Los estados de publicación fueron obtenidos correctamente.",

        datos: {
          estados
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Crea o actualiza una sección
   * perteneciente a una página pública.
   *
   * Cuando idSeccionPagina es null:
   * - Crea una sección nueva.
   *
   * Cuando idSeccionPagina contiene un valor:
   * - Actualiza la sección existente.
   *
   * El identificador del administrador
   * se obtiene desde req.sesionAdministrador.
   *
   * Requiere una sesión administrativa válida.
   *
   * POST /api/paginas/secciones
   */
  async guardarSeccion(
    req,
    res,
    next
  ) {
    try {
      const dto =
        this.paginaValidator
          .crearGuardarSeccionPaginaDto(
            req.body
          );

      const resultado =
        await this.seccionPaginaService
          .guardarSeccion(
            dto.toObject(),

            req.sesionAdministrador,

            {
              direccionIp:
                this.obtenerDireccionIp(
                  req
                ),

              userAgent:
                this.obtenerUserAgent(
                  req
                )
            }
          );

      const statusCode =
        resultado.operacion ===
        "CREACION"
          ? 201
          : 200;

      return res
        .status(statusCode)
        .json({
          exito: true,

          mensaje:
            resultado.mensaje,

          datos: {
            guardado:
              resultado.guardado,

            operacion:
              resultado.operacion,

            seccion:
              resultado.seccion
          }
        });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retira lógicamente una sección de página.
   *
   * No elimina físicamente el registro.
   * Cambia su estado de publicación a Archivado.
   *
   * El identificador del administrador
   * se obtiene desde req.sesionAdministrador.
   *
   * Requiere una sesión administrativa válida.
   *
   * POST /api/paginas/secciones/:idSeccionPagina/retirar
   */
  async retirarSeccion(
    req,
    res,
    next
  ) {
    try {
      const idSeccionPagina =
        req.params
          ?.idSeccionPagina;

      const resultado =
        await this.seccionPaginaService
          .retirarSeccion(
            idSeccionPagina,

            req.sesionAdministrador,

            {
              direccionIp:
                this.obtenerDireccionIp(
                  req
                ),

              userAgent:
                this.obtenerUserAgent(
                  req
                )
            }
          );

      return res
        .status(200)
        .json({
          exito: true,

          mensaje:
            resultado.mensaje,

          datos: {
            retirado:
              resultado.retirado,

            yaRetirada:
              resultado.yaRetirada,

            seccion:
              resultado.seccion
          }
        });
    } catch (error) {
      return next(error);
    }
  }
}

const paginaController =
  new PaginaController();

module.exports =
  paginaController;
