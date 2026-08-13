const AuditoriaRepositoryContract = require(
  "../contracts/auditoria.repository.contract"
);

const {
  sql,
  obtenerConexion
} = require("../../../config/database");

/*
 * Repositorio SQL del módulo de auditoría.
 *
 * Es la única clase de este módulo que se comunica
 * directamente con SQL Server.
 *
 * Ejecuta el procedimiento almacenado encargado
 * de registrar las acciones de auditoría.
 */
class SqlAuditoriaRepository
  extends AuditoriaRepositoryContract {

  /**
   * Obtiene la primera fila devuelta por un procedimiento.
   *
   * @param {object} resultado
   * @returns {object|null}
   */
  obtenerPrimeraFila(resultado) {
    if (
      !resultado ||
      !Array.isArray(resultado.recordset) ||
      resultado.recordset.length === 0
    ) {
      return null;
    }

    return resultado.recordset[0];
  }

  /**
   * Convierte un valor numérico proveniente de SQL Server.
   *
   * Evita convertir null en 0.
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

    return Number(valor);
  }

  /**
   * Convierte un objeto a JSON cuando sea necesario.
   *
   * Si el valor ya es una cadena, se conserva.
   *
   * @param {*} valor
   * @returns {string|null}
   */
  convertirJson(valor) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    if (typeof valor === "string") {
      return valor;
    }

    return JSON.stringify(valor);
  }

  /**
   * Registra una acción de auditoría.
   *
   * Procedimiento:
   * dbo.sp_registrar_auditoria
   *
   * @param {object} datosAuditoria
   * @param {number|null} datosAuditoria.idAdministrador
   * @param {string} datosAuditoria.codigoAccion
   * @param {string} datosAuditoria.codigoModulo
   * @param {string|null} datosAuditoria.tablaAfectada
   * @param {string|null} datosAuditoria.idRegistroAfectado
   * @param {string|object|null} datosAuditoria.datosAnteriores
   * @param {string|object|null} datosAuditoria.datosNuevos
   * @param {string|null} datosAuditoria.descripcion
   * @param {string|null} datosAuditoria.direccionIp
   * @param {string|null} datosAuditoria.userAgent
   * @returns {Promise<object>}
   */
  async registrarAuditoria(
    datosAuditoria
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_administrador",
        sql.Int,
        datosAuditoria.idAdministrador ?? null
      )
      .input(
        "codigo_accion",
        sql.NVarChar(50),
        datosAuditoria.codigoAccion
      )
      .input(
        "codigo_modulo",
        sql.NVarChar(60),
        datosAuditoria.codigoModulo
      )
      .input(
        "tabla_afectada",
        sql.NVarChar(128),
        datosAuditoria.tablaAfectada ?? null
      )
      .input(
        "id_registro_afectado",
        sql.NVarChar(100),
        datosAuditoria.idRegistroAfectado ?? null
      )
      .input(
        "datos_anteriores",
        sql.NVarChar(sql.MAX),
        this.convertirJson(
          datosAuditoria.datosAnteriores
        )
      )
      .input(
        "datos_nuevos",
        sql.NVarChar(sql.MAX),
        this.convertirJson(
          datosAuditoria.datosNuevos
        )
      )
      .input(
        "descripcion",
        sql.NVarChar(500),
        datosAuditoria.descripcion ?? null
      )
      .input(
        "direccion_ip",
        sql.NVarChar(45),
        datosAuditoria.direccionIp ?? null
      )
      .input(
        "user_agent",
        sql.NVarChar(500),
        datosAuditoria.userAgent ?? null
      )
      .execute(
        "dbo.sp_registrar_auditoria"
      );

    const fila =
      this.obtenerPrimeraFila(resultado);

    /*
     * Si el procedimiento registra correctamente,
     * pero no devuelve una fila, se retorna la
     * información recibida como confirmación.
     */
    if (!fila) {
      return {
        registrado: true,

        idAuditoria: null,

        idAdministrador:
          datosAuditoria.idAdministrador ?? null,

        codigoAccion:
          datosAuditoria.codigoAccion,

        codigoModulo:
          datosAuditoria.codigoModulo,

        tablaAfectada:
          datosAuditoria.tablaAfectada ?? null,

        idRegistroAfectado:
          datosAuditoria.idRegistroAfectado ?? null,

        datosAnteriores:
          datosAuditoria.datosAnteriores ?? null,

        datosNuevos:
          datosAuditoria.datosNuevos ?? null,

        descripcion:
          datosAuditoria.descripcion ?? null,

        direccionIp:
          datosAuditoria.direccionIp ?? null,

        userAgent:
          datosAuditoria.userAgent ?? null,

        fechaAccion: null
      };
    }

    return {
      registrado: true,

      idAuditoria:
        this.convertirNumero(
          fila.id_auditoria
        ),

      idAdministrador:
        this.convertirNumero(
          fila.id_administrador
        ),

      codigoAccion:
        fila.codigo_accion ??
        fila.accion ??
        datosAuditoria.codigoAccion,

      nombreAccion:
        fila.nombre_accion ?? null,

      codigoModulo:
        fila.codigo_modulo ??
        fila.modulo ??
        datosAuditoria.codigoModulo,

      nombreModulo:
        fila.nombre_modulo ?? null,

      tablaAfectada:
        fila.tabla_afectada ??
        datosAuditoria.tablaAfectada ??
        null,

      idRegistroAfectado:
        fila.id_registro_afectado ??
        datosAuditoria.idRegistroAfectado ??
        null,

      datosAnteriores:
        fila.datos_anteriores ??
        datosAuditoria.datosAnteriores ??
        null,

      datosNuevos:
        fila.datos_nuevos ??
        datosAuditoria.datosNuevos ??
        null,

      descripcion:
        fila.descripcion ??
        datosAuditoria.descripcion ??
        null,

      direccionIp:
        fila.direccion_ip ??
        datosAuditoria.direccionIp ??
        null,

      userAgent:
        fila.user_agent ??
        datosAuditoria.userAgent ??
        null,

      fechaAccion:
        fila.fecha_accion ?? null
    };
  }
}

module.exports = SqlAuditoriaRepository;