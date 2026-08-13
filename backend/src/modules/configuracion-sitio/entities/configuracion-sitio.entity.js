/* ============================================================
   CONFIGURACION-SITIO.ENTITY.JS
   Liceo Hernán Vargas Ramírez
   ------------------------------------------------------------
   Entidad que representa una configuración general del sitio.

   Tabla relacionada:
   dbo.configuracion_sitio

   Ejemplos de configuraciones:
   - nombre_institucion
   - direccion_institucional
   - telefonos_institucionales
   - correo_institucional
   - horario_atencion
   - facebook_url
   - google_maps_url

   Esta entidad NO accede directamente a la base de datos.
   Solo representa y normaliza los datos de configuración.
   ============================================================ */


/* ============================================================
   ENTIDAD
   ============================================================ */

class ConfiguracionSitioEntity {

  /**
   * @param {object} datos
   */
  constructor(datos = {}) {

    this.idConfiguracionSitio =
      this.convertirNumero(
        datos.idConfiguracionSitio ??
        datos.id_configuracion_sitio
      );

    this.clave =
      datos.clave ?? null;

    this.valor =
      datos.valor ?? null;

    this.tipoDato =
      datos.tipoDato ??
      datos.tipo_dato ??
      null;

    this.grupo =
      datos.grupo ?? null;

    this.descripcion =
      datos.descripcion ?? null;

    this.esPublico =
      this.convertirBooleano(
        datos.esPublico ??
        datos.es_publico
      );

    this.fechaActualizacion =
      datos.fechaActualizacion ??
      datos.fecha_actualizacion ??
      null;

    this.idAdministradorUltimaModificacion =
      this.convertirNumero(
        datos.idAdministradorUltimaModificacion ??
        datos.id_administrador_ultima_modificacion
      );
  }


  /* ==========================================================
     UTILIDADES
     ========================================================== */

  /**
   * Convierte un valor a número sin transformar
   * null o undefined en cero.
   *
   * @param {*} valor
   * @returns {number|null}
   */
  convertirNumero(valor) {

    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    const numero =
      Number(valor);

    return Number.isNaN(numero)
      ? null
      : numero;
  }


  /**
   * Convierte diferentes representaciones
   * a booleano.
   *
   * SQL Server normalmente devuelve 0 o 1
   * para columnas BIT.
   *
   * @param {*} valor
   * @returns {boolean}
   */
  convertirBooleano(valor) {

    if (
      valor === null ||
      valor === undefined
    ) {
      return false;
    }

    if (
      valor === true ||
      valor === 1 ||
      valor === "1"
    ) {
      return true;
    }

    if (
      typeof valor === "string" &&
      valor.toLowerCase() === "true"
    ) {
      return true;
    }

    return false;
  }


  /* ==========================================================
     INFORMACIÓN DE LA ENTIDAD
     ========================================================== */

  /**
   * Indica si la configuración contiene
   * una clave válida.
   *
   * @returns {boolean}
   */
  tieneClaveValida() {

    return Boolean(
      String(
        this.clave ?? ""
      ).trim()
    );
  }


  /**
   * Indica si actualmente tiene un valor definido.
   *
   * @returns {boolean}
   */
  tieneValor() {

    if (
      this.valor === null ||
      this.valor === undefined
    ) {
      return false;
    }

    return (
      String(this.valor).trim() !== ""
    );
  }


  /**
   * Indica si la configuración puede ser enviada
   * al sitio público.
   *
   * @returns {boolean}
   */
  esVisiblePublicamente() {

    return this.esPublico === true;
  }


  /* ==========================================================
     CONVERSIONES
     ========================================================== */

  /**
   * Devuelve la entidad como objeto simple para
   * utilizarla en servicios y respuestas de la API.
   *
   * @returns {object}
   */
  toObject() {

    return {
      idConfiguracionSitio:
        this.idConfiguracionSitio,

      clave:
        this.clave,

      valor:
        this.valor,

      tipoDato:
        this.tipoDato,

      grupo:
        this.grupo,

      descripcion:
        this.descripcion,

      esPublico:
        this.esPublico,

      fechaActualizacion:
        this.fechaActualizacion,

      idAdministradorUltimaModificacion:
        this.idAdministradorUltimaModificacion
    };
  }


  /**
   * Devuelve únicamente la información necesaria
   * para consumo público.
   *
   * No expone:
   * - Administrador de última modificación.
   * - Metadatos internos innecesarios.
   *
   * @returns {object}
   */
  toPublicObject() {

    return {
      clave:
        this.clave,

      valor:
        this.valor,

      tipoDato:
        this.tipoDato,

      grupo:
        this.grupo,

      descripcion:
        this.descripcion
    };
  }


  /* ==========================================================
     CREACIÓN
     ========================================================== */

  /**
   * Crea una entidad a partir de una fila
   * proveniente directamente de SQL Server.
   *
   * @param {object} fila
   * @returns {ConfiguracionSitioEntity|null}
   */
  static desdeFilaSql(fila) {

    if (!fila) {
      return null;
    }

    return new ConfiguracionSitioEntity({
      idConfiguracionSitio:
        fila.id_configuracion_sitio,

      clave:
        fila.clave,

      valor:
        fila.valor,

      tipoDato:
        fila.tipo_dato,

      grupo:
        fila.grupo,

      descripcion:
        fila.descripcion,

      esPublico:
        fila.es_publico,

      fechaActualizacion:
        fila.fecha_actualizacion,

      idAdministradorUltimaModificacion:
        fila.id_administrador_ultima_modificacion
    });
  }
}


/* ============================================================
   EXPORTACIÓN
   ============================================================ */

module.exports =
  ConfiguracionSitioEntity;