/* ============================================================
   SQL-CONFIGURACION.REPOSITORY.JS
   Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Repositorio SQL para la configuración general del sitio.

   Responsabilidades:
   - Obtener configuración pública.
   - Obtener configuración administrativa.
   - Actualizar valores de configuración existentes.
   - Convertir los nombres provenientes de SQL Server
     al formato utilizado por Node.js.

   Procedimientos utilizados:
   - dbo.sp_obtener_configuracion_sitio_publica
   - dbo.sp_obtener_configuracion_sitio_administracion
   - dbo.sp_guardar_configuracion_sitio
   ============================================================ */

const ConfiguracionRepositoryContract = require(
  "../contracts/configuracion.repository.contract"
);

const {
  sql,
  obtenerConexion
} = require(
  "../../../config/database"
);


/*
 * ============================================================
 * REPOSITORIO
 * ============================================================
 */

class SqlConfiguracionRepository
  extends ConfiguracionRepositoryContract {

  /*
   * ==========================================================
   * UTILIDADES
   * ==========================================================
   */

  /**
   * Convierte un valor numérico proveniente de SQL Server.
   *
   * Evita convertir null o undefined en 0.
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

    const numero = Number(valor);

    return Number.isNaN(numero)
      ? null
      : numero;
  }


  /**
   * Convierte una fila de SQL Server al formato utilizado
   * por el backend.
   *
   * @param {object} fila
   * @returns {object|null}
   */
  mapearConfiguracion(fila) {
    if (!fila) {
      return null;
    }

    return {
      idConfiguracionSitio:
        this.convertirNumero(
          fila.id_configuracion_sitio
        ),

      clave:
        fila.clave ?? null,

      valor:
        fila.valor ?? null,

      tipoDato:
        fila.tipo_dato ?? null,

      grupo:
        fila.grupo ?? null,

      descripcion:
        fila.descripcion ?? null,

      esPublico:
        fila.es_publico === undefined
          ? true
          : Boolean(fila.es_publico),

      fechaActualizacion:
        fila.fecha_actualizacion ??
        null,

      idAdministradorUltimaModificacion:
        this.convertirNumero(
          fila
            .id_administrador_ultima_modificacion
        )
    };
  }


  /**
   * Obtiene el recordset principal de una ejecución SQL.
   *
   * @param {object} resultado
   * @returns {Array}
   */
  obtenerFilas(resultado) {
    if (
      !resultado ||
      !Array.isArray(
        resultado.recordset
      )
    ) {
      return [];
    }

    return resultado.recordset;
  }


  /**
   * Obtiene la primera fila de una ejecución SQL.
   *
   * @param {object} resultado
   * @returns {object|null}
   */
  obtenerPrimeraFila(resultado) {
    const filas =
      this.obtenerFilas(resultado);

    if (filas.length === 0) {
      return null;
    }

    return filas[0];
  }


  /*
   * ==========================================================
   * CONSULTAS
   * ==========================================================
   */

  /**
   * Obtiene únicamente las configuraciones públicas.
   *
   * Utilizado por:
   * - Sitio público.
   * - Contacto.
   * - Nosotros.
   * - Footer.
   *
   * Procedimiento:
   * dbo.sp_obtener_configuracion_sitio_publica
   *
   * @returns {Promise<Array>}
   */
  async obtenerConfiguracionPublica() {
    const conexion =
      await obtenerConexion();

    const resultado =
      await conexion
        .request()
        .execute(
          "dbo.sp_obtener_configuracion_sitio_publica"
        );

    return this
      .obtenerFilas(resultado)
      .map(
        (fila) =>
          this.mapearConfiguracion(
            fila
          )
      );
  }


  /**
   * Obtiene todas las configuraciones disponibles para
   * el panel administrativo.
   *
   * Incluye:
   * - Valor.
   * - Tipo.
   * - Grupo.
   * - Estado público.
   * - Fecha de modificación.
   * - Administrador que realizó el último cambio.
   *
   * Procedimiento:
   * dbo.sp_obtener_configuracion_sitio_administracion
   *
   * @returns {Promise<Array>}
   */
  async obtenerConfiguracionAdministracion() {
    const conexion =
      await obtenerConexion();

    const resultado =
      await conexion
        .request()
        .execute(
          "dbo.sp_obtener_configuracion_sitio_administracion"
        );

    return this
      .obtenerFilas(resultado)
      .map(
        (fila) =>
          this.mapearConfiguracion(
            fila
          )
      );
  }


  /*
   * ==========================================================
   * ACTUALIZACIÓN
   * ==========================================================
   */

  /**
   * Actualiza una configuración existente.
   *
   * El procedimiento almacenado no permite crear claves
   * arbitrarias. La clave debe existir previamente en
   * dbo.configuracion_sitio.
   *
   * Procedimiento:
   * dbo.sp_guardar_configuracion_sitio
   *
   * @param {string} clave
   * @param {string|null} valor
   * @param {number|null} idAdministrador
   *
   * @returns {Promise<object|null>}
   */
  async guardarConfiguracion(
    clave,
    valor,
    idAdministrador = null
  ) {
    const conexion =
      await obtenerConexion();

    const resultado =
      await conexion
        .request()

        .input(
          "clave",
          sql.NVarChar(120),
          clave
        )

        .input(
          "valor",
          sql.NVarChar(sql.MAX),
          valor ?? null
        )

        .input(
          "id_administrador",
          sql.Int,
          idAdministrador ?? null
        )

        .execute(
          "dbo.sp_guardar_configuracion_sitio"
        );

    const fila =
      this.obtenerPrimeraFila(
        resultado
      );

    return this.mapearConfiguracion(
      fila
    );
  }
}


module.exports =
  SqlConfiguracionRepository;