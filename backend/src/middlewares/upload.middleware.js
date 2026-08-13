const crypto = require(
  "node:crypto"
);

const fs = require(
  "node:fs"
);

const path = require(
  "node:path"
);

const multer = require(
  "multer"
);

/*
 * ============================================================
 * MIDDLEWARE DE CARGA DE ARCHIVOS
 * Liceo Hernán Vargas Ramírez
 * ============================================================
 *
 * Este middleware:
 * - Recibe imágenes mediante multipart/form-data.
 * - Valida el tipo MIME.
 * - Limita el tamaño máximo a 5 MB.
 * - Genera nombres únicos.
 * - Guarda las imágenes de páginas en:
 *
 *   backend/uploads/images/paginas
 *
 * El campo esperado desde el formulario es:
 *
 *   imagen
 * ============================================================
 */

const TAMANO_MAXIMO_IMAGEN =
  5 * 1024 * 1024;

const DIRECTORIO_IMAGENES_PAGINAS =
  path.resolve(
    process.cwd(),
    "uploads",
    "images",
    "paginas"
  );

const TIPOS_MIME_PERMITIDOS =
  Object.freeze({
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
  });

/*
 * Garantiza que el directorio exista
 * antes de procesar una carga.
 */
function crearDirectorioSiNoExiste(
  directorio
) {
  if (
    fs.existsSync(
      directorio
    )
  ) {
    return;
  }

  fs.mkdirSync(
    directorio,
    {
      recursive: true
    }
  );
}

crearDirectorioSiNoExiste(
  DIRECTORIO_IMAGENES_PAGINAS
);

/*
 * Crea un error controlado compatible
 * con error-handler.middleware.js.
 */
function crearError(
  mensaje,
  statusCode,
  codigo
) {
  const error =
    new Error(mensaje);

  error.statusCode =
    statusCode;

  error.codigo =
    codigo;

  return error;
}

/*
 * Devuelve la extensión correspondiente
 * al tipo MIME validado.
 */
function obtenerExtensionPorMimeType(
  mimeType
) {
  const tipoNormalizado =
    String(
      mimeType || ""
    )
      .trim()
      .toLowerCase();

  return (
    TIPOS_MIME_PERMITIDOS[
      tipoNormalizado
    ] ||
    null
  );
}

/*
 * Configuración del almacenamiento físico.
 */
const almacenamientoImagenesPaginas =
  multer.diskStorage({
    destination(
      req,
      archivo,
      callback
    ) {
      try {
        crearDirectorioSiNoExiste(
          DIRECTORIO_IMAGENES_PAGINAS
        );

        callback(
          null,
          DIRECTORIO_IMAGENES_PAGINAS
        );
      } catch (error) {
        callback(
          crearError(
            "No se pudo preparar el directorio para guardar la imagen.",
            500,
            "DIRECTORIO_CARGA_NO_DISPONIBLE"
          )
        );
      }
    },

    filename(
      req,
      archivo,
      callback
    ) {
      const extension =
        obtenerExtensionPorMimeType(
          archivo.mimetype
        );

      if (!extension) {
        return callback(
          crearError(
            "El formato de la imagen no es válido.",
            400,
            "FORMATO_IMAGEN_NO_PERMITIDO"
          )
        );
      }

      const identificador =
        crypto.randomUUID();

      const marcaTiempo =
        Date.now();

      const nombreAlmacenado =
        `pagina-${marcaTiempo}-${identificador}${extension}`;

      return callback(
        null,
        nombreAlmacenado
      );
    }
  });

/*
 * Valida el tipo MIME antes de almacenar
 * físicamente el archivo.
 */
function filtrarImagenPagina(
  req,
  archivo,
  callback
) {
  const extension =
    obtenerExtensionPorMimeType(
      archivo.mimetype
    );

  if (!extension) {
    return callback(
      crearError(
        "Solo se permiten imágenes JPG, PNG o WEBP.",
        400,
        "FORMATO_IMAGEN_NO_PERMITIDO"
      ),
      false
    );
  }

  return callback(
    null,
    true
  );
}

/*
 * Configuración interna de Multer.
 */
const cargadorImagenPagina =
  multer({
    storage:
      almacenamientoImagenesPaginas,

    limits: {
      fileSize:
        TAMANO_MAXIMO_IMAGEN,

      files: 1
    },

    fileFilter:
      filtrarImagenPagina
  });

/*
 * Convierte los errores propios de Multer
 * en errores controlados por la aplicación.
 */
function convertirErrorMulter(
  error
) {
  if (
    !(error instanceof multer.MulterError)
  ) {
    return error;
  }

  switch (error.code) {
    case "LIMIT_FILE_SIZE":
      return crearError(
        "La imagen no puede superar los 5 MB.",
        400,
        "IMAGEN_DEMASIADO_GRANDE"
      );

    case "LIMIT_FILE_COUNT":
      return crearError(
        "Solo se permite cargar una imagen por solicitud.",
        400,
        "CANTIDAD_IMAGENES_INVALIDA"
      );

    case "LIMIT_UNEXPECTED_FILE":
      return crearError(
        'El campo del archivo debe llamarse "imagen".',
        400,
        "CAMPO_ARCHIVO_INVALIDO"
      );

    default:
      return crearError(
        "No fue posible procesar la imagen seleccionada.",
        400,
        "ERROR_CARGA_IMAGEN"
      );
  }
}

/*
 * Middleware público utilizado por las rutas.
 *
 * Campo multipart esperado:
 * imagen
 */
function subirImagenPagina(
  req,
  res,
  next
) {
  const procesarImagen =
    cargadorImagenPagina.single(
      "imagen"
    );

  procesarImagen(
    req,
    res,
    (error) => {
      if (error) {
        return next(
          convertirErrorMulter(
            error
          )
        );
      }

      if (!req.file) {
        return next(
          crearError(
            "Debe seleccionar una imagen.",
            400,
            "IMAGEN_OBLIGATORIA"
          )
        );
      }

      return next();
    }
  );
}

module.exports = {
  subirImagenPagina
};