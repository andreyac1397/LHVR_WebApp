const ArchivoRepositoryContract = require(
  "../contracts/archivo.repository.contract"
);

const {
  sql,
  obtenerConexion
} = require(
  "../../../config/database"
);

/*
 * Repositorio SQL del módulo de archivos.
 *
 * Responsabilidades:
 * - Ejecutar los procedimientos almacenados.
 * - Registrar los metadatos de los archivos.
 * - Convertir los datos de SQL Server
 *   al formato utilizado por el backend.
 *
 * Este repositorio no guarda físicamente
 * los archivos en el servidor.
 */
class SqlArchivoRepository
  extends ArchivoRepositoryContract {

  /**
   * Obtiene la primera fila devuelta
   * por un procedimiento almacenado.
   *
   * @param {object} resultado
   * @returns {object|null}
   */
  obtenerPrimeraFila(resultado) {
    if (
      !resultado ||
      !Array.isArray(
        resultado.recordset
      ) ||
      resultado.recordset.length === 0
    ) {
      return null;
    }

    return resultado.recordset[0];
  }

  /**
   * Convierte un valor numérico
   * proveniente de SQL Server.
   *
   * Evita convertir null en cero.
   *
   * @param {*} valor
   * @returns {number|null}
   */
  convertirNumero(valor) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    const numero =
      Number(valor);

    return Number.isFinite(numero)
      ? numero
      : null;
  }

  /**
   * Convierte un valor proveniente
   * de SQL Server a booleano.
   *
   * @param {*} valor
   * @returns {boolean}
   */
  convertirBooleano(valor) {
    return (
      valor === true ||
      valor === 1
    );
  }

  /**
   * Convierte una fila SQL al formato
   * utilizado por el backend.
   *
   * @param {object} fila
   * @returns {object|null}
   */
  mapearArchivo(fila) {
    if (!fila) {
      return null;
    }

    return {
      idArchivo:
        this.convertirNumero(
          fila.id_archivo
        ),

      nombreOriginal:
        fila.nombre_original ??
        null,

      nombreAlmacenado:
        fila.nombre_almacenado ??
        null,

      rutaRelativa:
        fila.ruta_relativa ??
        null,

      extension:
        fila.extension ??
        null,

      mimeType:
        fila.mime_type ??
        null,

      tamanoBytes:
        this.convertirNumero(
          fila.tamano_bytes
        ),

      anchoPixeles:
        this.convertirNumero(
          fila.ancho_pixeles
        ),

      altoPixeles:
        this.convertirNumero(
          fila.alto_pixeles
        ),

      hashArchivo:
        fila.hash_archivo ??
        null,

      textoAlternativo:
        fila.texto_alternativo ??
        null,

      tipoArchivo:
        fila.tipo_archivo ??
        null,

      activo:
        this.convertirBooleano(
          fila.activo
        ),

      fechaCarga:
        fila.fecha_carga ??
        null,

      idAdministradorCarga:
        this.convertirNumero(
          fila.id_administrador_carga
        ),

      archivoExistente:
        this.convertirBooleano(
          fila.archivo_existente
        )
    };
  }

  /**
   * Registra en la base de datos
   * los metadatos de un archivo.
   *
   * Procedimiento:
   * dbo.sp_registrar_archivo
   *
   * @param {object} datosArchivo
   * @returns {Promise<object>}
   */
  async registrarArchivo(
    datosArchivo
  ) {
    const conexion =
      await obtenerConexion();

    const resultado =
      await conexion
        .request()

        .input(
          "nombre_original",
          sql.NVarChar(260),
          datosArchivo.nombreOriginal
        )

        .input(
          "nombre_almacenado",
          sql.NVarChar(260),
          datosArchivo.nombreAlmacenado
        )

        .input(
          "ruta_relativa",
          sql.NVarChar(500),
          datosArchivo.rutaRelativa
        )

        .input(
          "extension",
          sql.NVarChar(20),
          datosArchivo.extension
        )

        .input(
          "mime_type",
          sql.NVarChar(120),
          datosArchivo.mimeType
        )

        .input(
          "tamano_bytes",
          sql.BigInt,
          datosArchivo.tamanoBytes
        )

        .input(
          "ancho_pixeles",
          sql.Int,
          datosArchivo.anchoPixeles ??
          null
        )

        .input(
          "alto_pixeles",
          sql.Int,
          datosArchivo.altoPixeles ??
          null
        )

        .input(
          "hash_archivo",
          sql.Char(64),
          datosArchivo.hashArchivo ??
          null
        )

        .input(
          "texto_alternativo",
          sql.NVarChar(300),
          datosArchivo.textoAlternativo ??
          null
        )

        .input(
          "tipo_archivo",
          sql.NVarChar(50),
          datosArchivo.tipoArchivo
        )

        .input(
          "id_administrador_carga",
          sql.Int,
          datosArchivo.idAdministradorCarga
        )

        .execute(
          "dbo.sp_registrar_archivo"
        );

    const fila =
      this.obtenerPrimeraFila(
        resultado
      );

    if (!fila) {
      const error =
        new Error(
          "El procedimiento no devolvió la información del archivo registrado."
        );

      error.statusCode = 500;
      error.codigo =
        "ARCHIVO_NO_REGISTRADO";

      throw error;
    }

    return this.mapearArchivo(
      fila
    );
  }
}

module.exports =
  SqlArchivoRepository;