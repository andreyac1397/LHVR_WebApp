const {
  archivoService:
    archivoServiceContenedor
} = require(
  "../../../container/dependency-container"
);

/*
 * Controlador HTTP del módulo de archivos.
 *
 * Responsabilidades:
 * - Recibir la imagen procesada por Multer.
 * - Obtener los datos adicionales del formulario.
 * - Obtener la sesión del administrador.
 * - Enviar el archivo al servicio.
 * - Construir la respuesta HTTP.
 * - Delegar los errores al middleware centralizado.
 */
class ArchivoController {
  /**
   * @param {object} archivoService
   */
  constructor(
    archivoService =
      archivoServiceContenedor
  ) {
    this.archivoService =
      archivoService;
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
   * Recibe y registra una imagen utilizada
   * por el contenido de una página.
   *
   * La imagen llega mediante:
   * multipart/form-data
   *
   * Campos esperados:
   * - imagen: archivo JPG, PNG o WEBP.
   * - textoAlternativo: descripción opcional.
   *
   * Requiere una sesión administrativa válida.
   *
   * POST /api/archivos/imagenes/paginas
   */
  async subirImagenPagina(
    req,
    res,
    next
  ) {
    try {
      const resultado =
        await this.archivoService
          .registrarImagenPagina(
            req.file,

            {
              textoAlternativo:
                req.body
                  ?.textoAlternativo ??
                null
            },

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
        resultado.archivoExistente
          ? 200
          : 201;

      return res
        .status(statusCode)
        .json({
          exito: true,

          mensaje:
            resultado.mensaje,

          datos: {
            archivoRegistrado:
              resultado
                .archivoRegistrado,

            archivoExistente:
              resultado
                .archivoExistente,

            archivo:
              resultado.archivo
          }
        });
    } catch (error) {
      return next(error);
    }
  }
}

const archivoController =
  new ArchivoController();

module.exports =
  archivoController;