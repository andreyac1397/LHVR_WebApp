const ComunidadRepositoryContract = require(
  "../contracts/comunidad.repository.contract"
);

const {
  obtenerConexion
} = require(
  "../../../config/database"
);

/*
 * Repositorio SQL Server de Comunidad.
 *
 * Procedimientos utilizados:
 * - dbo.sp_obtener_comunidad_administrativa
 * - dbo.sp_obtener_comunidad_publica
 *
 * Este repositorio solo realiza consultas.
 * Las modificaciones de secciones continúan utilizando
 * el módulo compartido paginas-contenido.
 */
class SqlComunidadRepository
  extends ComunidadRepositoryContract {

  /**
   * Obtiene un recordset de forma segura.
   *
   * @param {object} resultado
   * @param {number} indice
   * @returns {object[]}
   */
  obtenerRecordset(
    resultado,
    indice = 0
  ) {
    if (
      Array.isArray(
        resultado?.recordsets?.[indice]
      )
    ) {
      return resultado.recordsets[indice];
    }

    if (
      indice === 0 &&
      Array.isArray(
        resultado?.recordset
      )
    ) {
      return resultado.recordset;
    }

    return [];
  }

  /**
   * Obtiene la información administrativa de Comunidad.
   *
   * El SP devuelve:
   * 1. Información general de la página.
   * 2. Todas las secciones de Comunidad.
   *
   * @returns {Promise<{
   *   pagina: object|null,
   *   secciones: object[]
   * }>}
   */
  async obtenerComunidadAdministrativa() {
    const conexion =
      await obtenerConexion();

    const resultado =
      await conexion
        .request()
        .execute(
          "dbo.sp_obtener_comunidad_administrativa"
        );

    const paginas =
      this.obtenerRecordset(
        resultado,
        0
      );

    const secciones =
      this.obtenerRecordset(
        resultado,
        1
      );

    return {
      pagina:
        paginas[0] ?? null,

      secciones
    };
  }

  /**
   * Obtiene las secciones publicadas de Comunidad.
   *
   * El SP devuelve un único recordset.
   *
   * @returns {Promise<{
   *   secciones: object[]
   * }>}
   */
  async obtenerComunidadPublica() {
    const conexion =
      await obtenerConexion();

    const resultado =
      await conexion
        .request()
        .execute(
          "dbo.sp_obtener_comunidad_publica"
        );

    return {
      secciones:
        this.obtenerRecordset(
          resultado,
          0
        )
    };
  }
}

module.exports =
  SqlComunidadRepository;
