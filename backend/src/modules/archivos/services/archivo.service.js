const crypto = require(
  "node:crypto"
);

const fs = require(
  "node:fs/promises"
);

const path = require(
  "node:path"
);

const SqlArchivoRepository = require(
  "../repositories/sql-archivo.repository"
);

const AuditoriaService = require(
  "../../auditoria/services/auditoria.service"
);

const TAMANO_MAXIMO_IMAGEN =
  5 * 1024 * 1024;

const TIPOS_MIME_PERMITIDOS =
  Object.freeze({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  });

/*
 * Servicio del módulo de archivos.
 *
 * Responsabilidades:
 * - Validar la imagen almacenada temporalmente
 *   por el middleware de carga.
 * - Comprobar que el archivo esté dentro
 *   de la carpeta uploads del backend.
 * - Generar el hash SHA-256.
 * - Preparar los metadatos.
 * - Registrar el archivo en SQL Server.
 * - Eliminar archivos físicos huérfanos.
 * - Registrar la operación en auditoría.
 */
class ArchivoService {
  /**
   * @param {object} repositorio
   * @param {object} auditoriaService
   */
  constructor(
    repositorio =
      new SqlArchivoRepository(),

    auditoriaService =
      new AuditoriaService()
  ) {
    this.repositorio =
      repositorio;

    this.auditoriaService =
      auditoriaService;
  }

  /**
   * Crea un error controlado para el
   * middleware centralizado de errores.
   *
   * @param {string} mensaje
   * @param {number} statusCode
   * @param {string} codigo
   * @returns {Error}
   */
  crearError(
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

  /**
   * Normaliza un texto opcional.
   *
   * @param {*} valor
   * @param {number} longitudMaxima
   * @returns {string|null}
   */
  normalizarTextoOpcional(
    valor,
    longitudMaxima
  ) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    const contenido =
      String(valor).trim();

    if (!contenido) {
      return null;
    }

    return contenido.slice(
      0,
      longitudMaxima
    );
  }

  /**
   * Obtiene y valida el identificador
   * del administrador autenticado.
   *
   * @param {object} sesionAdministrador
   * @returns {number}
   */
  obtenerIdAdministrador(
    sesionAdministrador
  ) {
    const idAdministrador =
      Number(
        sesionAdministrador
          ?.idAdministrador
      );

    if (
      !Number.isInteger(
        idAdministrador
      ) ||
      idAdministrador <= 0
    ) {
      throw this.crearError(
        "No existe una sesión administrativa válida.",
        401,
        "SESION_INVALIDA"
      );
    }

    return idAdministrador;
  }

  /**
   * Devuelve la carpeta raíz donde
   * se almacenan los archivos públicos.
   *
   * @returns {string}
   */
  obtenerDirectorioUploads() {
    return path.resolve(
      process.cwd(),
      "uploads"
    );
  }

  /**
   * Comprueba que la ruta física esté
   * dentro de backend/uploads.
   *
   * Evita que se registren archivos
   * ubicados fuera del almacenamiento
   * permitido por el sistema.
   *
   * @param {string} rutaArchivo
   * @returns {string}
   */
  validarRutaFisica(
    rutaArchivo
  ) {
    if (
      typeof rutaArchivo !==
        "string" ||
      rutaArchivo.trim() === ""
    ) {
      throw this.crearError(
        "La ruta física del archivo no es válida.",
        400,
        "RUTA_ARCHIVO_INVALIDA"
      );
    }

    const directorioUploads =
      this.obtenerDirectorioUploads();

    const rutaAbsoluta =
      path.resolve(
        rutaArchivo
      );

    const rutaUploadsConSeparador =
      directorioUploads.endsWith(
        path.sep
      )
        ? directorioUploads
        : `${directorioUploads}${path.sep}`;

    if (
      rutaAbsoluta !==
        directorioUploads &&
      !rutaAbsoluta.startsWith(
        rutaUploadsConSeparador
      )
    ) {
      throw this.crearError(
        "El archivo está fuera del directorio permitido.",
        400,
        "RUTA_ARCHIVO_NO_PERMITIDA"
      );
    }

    return rutaAbsoluta;
  }

  /**
   * Convierte la ruta física en una ruta
   * pública relativa.
   *
   * Ejemplo:
   * /uploads/images/paginas/archivo.jpg
   *
   * @param {string} rutaAbsoluta
   * @returns {string}
   */
  construirRutaRelativa(
    rutaAbsoluta
  ) {
    const rutaBackend =
      path.resolve(
        process.cwd()
      );

    const rutaRelativa =
      path.relative(
        rutaBackend,
        rutaAbsoluta
      );

    return (
      "/" +
      rutaRelativa.replace(
        /\\/g,
        "/"
      )
    );
  }

  /**
   * Genera el hash SHA-256 del contenido
   * real del archivo.
   *
   * @param {string} rutaAbsoluta
   * @returns {Promise<string>}
   */
  async generarHashArchivo(
    rutaAbsoluta
  ) {
    const contenido =
      await fs.readFile(
        rutaAbsoluta
      );

    return crypto
      .createHash("sha256")
      .update(contenido)
      .digest("hex");
  }

  /**
   * Elimina un archivo físico sin reemplazar
   * el error o resultado principal.
   *
   * @param {string|null} rutaAbsoluta
   * @returns {Promise<void>}
   */
  async eliminarArchivoSinInterrumpir(
    rutaAbsoluta
  ) {
    if (!rutaAbsoluta) {
      return;
    }

    try {
      await fs.unlink(
        rutaAbsoluta
      );
    } catch (error) {
      if (
        error?.code !==
        "ENOENT"
      ) {
        console.error(
          "No se pudo eliminar el archivo físico:",
          error.message
        );
      }
    }
  }

  /**
   * Valida la información proporcionada
   * por el middleware de subida.
   *
   * El objeto esperado corresponde al
   * formato producido por Multer.
   *
   * @param {object} archivo
   * @returns {Promise<object>}
   */
  async prepararImagenSubida(
    archivo
  ) {
    if (
      !archivo ||
      typeof archivo !==
        "object"
    ) {
      throw this.crearError(
        "Debe seleccionar una imagen.",
        400,
        "IMAGEN_OBLIGATORIA"
      );
    }

    const mimeType =
      String(
        archivo.mimetype ||
        ""
      )
        .trim()
        .toLowerCase();

    const extension =
      TIPOS_MIME_PERMITIDOS[
        mimeType
      ];

    if (!extension) {
      throw this.crearError(
        "La imagen debe estar en formato JPG, PNG o WEBP.",
        400,
        "FORMATO_IMAGEN_NO_PERMITIDO"
      );
    }

    const tamanoBytes =
      Number(
        archivo.size
      );

    if (
      !Number.isInteger(
        tamanoBytes
      ) ||
      tamanoBytes <= 0
    ) {
      throw this.crearError(
        "La imagen seleccionada está vacía o dañada.",
        400,
        "IMAGEN_VACIA"
      );
    }

    if (
      tamanoBytes >
      TAMANO_MAXIMO_IMAGEN
    ) {
      throw this.crearError(
        "La imagen no puede superar los 5 MB.",
        400,
        "IMAGEN_DEMASIADO_GRANDE"
      );
    }

    const nombreOriginal =
      path
        .basename(
          String(
            archivo.originalname ||
            ""
          )
        )
        .trim()
        .slice(
          0,
          260
        );

    if (!nombreOriginal) {
      throw this.crearError(
        "El nombre original de la imagen no es válido.",
        400,
        "NOMBRE_ARCHIVO_INVALIDO"
      );
    }

    const nombreAlmacenado =
      path
        .basename(
          String(
            archivo.filename ||
            ""
          )
        )
        .trim()
        .slice(
          0,
          260
        );

    if (!nombreAlmacenado) {
      throw this.crearError(
        "El nombre almacenado de la imagen no es válido.",
        500,
        "NOMBRE_ALMACENADO_INVALIDO"
      );
    }

    const rutaAbsoluta =
      this.validarRutaFisica(
        archivo.path
      );

    let informacionArchivo;

    try {
      informacionArchivo =
        await fs.stat(
          rutaAbsoluta
        );
    } catch (error) {
      throw this.crearError(
        "La imagen subida no fue encontrada en el servidor.",
        500,
        "IMAGEN_FISICA_NO_ENCONTRADA"
      );
    }

    if (
      !informacionArchivo.isFile()
    ) {
      throw this.crearError(
        "La ruta recibida no corresponde con un archivo.",
        500,
        "RUTA_NO_CORRESPONDE_ARCHIVO"
      );
    }

    const tamanoFisico =
      Number(
        informacionArchivo.size
      );

    if (
      tamanoFisico !==
      tamanoBytes
    ) {
      throw this.crearError(
        "El tamaño físico de la imagen no coincide con la carga recibida.",
        500,
        "TAMANO_ARCHIVO_INCONSISTENTE"
      );
    }

    const hashArchivo =
      await this.generarHashArchivo(
        rutaAbsoluta
      );

    return {
      rutaAbsoluta,
      nombreOriginal,
      nombreAlmacenado,

      rutaRelativa:
        this.construirRutaRelativa(
          rutaAbsoluta
        ),

      extension,
      mimeType,
      tamanoBytes,
      hashArchivo
    };
  }

  /**
   * Registra una imagen perteneciente
   * al contenido de una página.
   *
   * Flujo:
   * 1. Valida la sesión.
   * 2. Valida el archivo físico.
   * 3. Genera el hash SHA-256.
   * 4. Registra los metadatos en SQL Server.
   * 5. Elimina el archivo nuevo si ya existía
   *    otro con el mismo contenido.
   * 6. Registra la auditoría.
   *
   * @param {object} archivo
   * @param {object} datos
   * @param {string|null} datos.textoAlternativo
   * @param {object} sesionAdministrador
   * @param {object} contexto
   * @returns {Promise<object>}
   */
  async registrarImagenPagina(
    archivo,
    datos,
    sesionAdministrador,
    contexto = {}
  ) {
    const idAdministrador =
      this.obtenerIdAdministrador(
        sesionAdministrador
      );

    let imagenPreparada =
      null;

    try {
      imagenPreparada =
        await this.prepararImagenSubida(
          archivo
        );

      const textoAlternativo =
        this.normalizarTextoOpcional(
          datos?.textoAlternativo,
          300
        );

      const archivoRegistrado =
        await this.repositorio
          .registrarArchivo({
            nombreOriginal:
              imagenPreparada
                .nombreOriginal,

            nombreAlmacenado:
              imagenPreparada
                .nombreAlmacenado,

            rutaRelativa:
              imagenPreparada
                .rutaRelativa,

            extension:
              imagenPreparada
                .extension,

            mimeType:
              imagenPreparada
                .mimeType,

            tamanoBytes:
              imagenPreparada
                .tamanoBytes,

            /*
             * Las dimensiones se mantendrán
             * en null hasta incorporar el
             * procesador de imágenes.
             */
            anchoPixeles:
              null,

            altoPixeles:
              null,

            hashArchivo:
              imagenPreparada
                .hashArchivo,

            textoAlternativo,

            tipoArchivo:
              "IMAGEN_PAGINA",

            idAdministradorCarga:
              idAdministrador
          });

      /*
       * Si el procedimiento encontró otro
       * archivo con el mismo hash, elimina
       * la nueva copia física para evitar
       * archivos duplicados.
       */
      if (
        archivoRegistrado
          .archivoExistente
      ) {
        await this
          .eliminarArchivoSinInterrumpir(
            imagenPreparada
              .rutaAbsoluta
          );
      }

      await this.auditoriaService
        .registrarSinInterrumpir({
          idAdministrador,

          codigoAccion:
            archivoRegistrado
              .archivoExistente
              ? "REUTILIZAR_ARCHIVO"
              : "SUBIR_ARCHIVO",

          codigoModulo:
            "ARCHIVOS",

          tablaAfectada:
            "archivos",

          idRegistroAfectado:
            archivoRegistrado
              .idArchivo,

          datosNuevos: {
            idArchivo:
              archivoRegistrado
                .idArchivo,

            nombreOriginal:
              archivoRegistrado
                .nombreOriginal,

            rutaRelativa:
              archivoRegistrado
                .rutaRelativa,

            mimeType:
              archivoRegistrado
                .mimeType,

            tamanoBytes:
              archivoRegistrado
                .tamanoBytes,

            tipoArchivo:
              archivoRegistrado
                .tipoArchivo,

            archivoExistente:
              archivoRegistrado
                .archivoExistente
          },

          descripcion:
            archivoRegistrado
              .archivoExistente
              ? "Se reutilizó una imagen que ya estaba registrada."
              : "Se cargó una imagen para el contenido de una página.",

          direccionIp:
            contexto.direccionIp ??
            null,

          userAgent:
            contexto.userAgent ??
            null
        });

      return {
        archivoRegistrado: true,

        archivoExistente:
          archivoRegistrado
            .archivoExistente,

        mensaje:
          archivoRegistrado
            .archivoExistente
            ? "La imagen ya existía y fue reutilizada correctamente."
            : "La imagen fue cargada correctamente.",

        archivo:
          archivoRegistrado
      };
    } catch (error) {
      /*
       * Si la imagen física fue creada,
       * pero no pudo registrarse en SQL Server,
       * se elimina para evitar archivos huérfanos.
       */
      if (
        imagenPreparada
          ?.rutaAbsoluta
      ) {
        await this
          .eliminarArchivoSinInterrumpir(
            imagenPreparada
              .rutaAbsoluta
          );
      } else if (
        archivo?.path
      ) {
        let rutaSegura = null;

        try {
          rutaSegura =
            this.validarRutaFisica(
              archivo.path
            );
        } catch (
          errorRuta
        ) {
          rutaSegura = null;
        }

        await this
          .eliminarArchivoSinInterrumpir(
            rutaSegura
          );
      }

      throw error;
    }
  }
}

module.exports =
  ArchivoService;