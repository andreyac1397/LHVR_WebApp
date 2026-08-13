const {
  obtenerConexion,
  cerrarConexion
} = require("../src/config/database");

/**
 * Comprueba la conexión con SQL Server y verifica
 * la estructura general de la base de datos BD-LHVR.
 */
async function verificarConexionBD() {
  let huboError = false;

  try {
    console.log("Verificando conexión con SQL Server...");

    const conexion = await obtenerConexion();

    const resultado = await conexion.request().query(`
  SELECT
    DB_NAME() AS base_datos,
    @@SERVERNAME AS servidor,
    SUSER_SNAME() AS usuario_conectado,

    (
      SELECT COUNT(*)
      FROM sys.tables
      WHERE is_ms_shipped = 0
        AND name <> 'sysdiagrams'
    ) AS total_tablas,

    (
      SELECT COUNT(*)
      FROM sys.columns AS columnas
      INNER JOIN sys.tables AS tablas
        ON columnas.object_id = tablas.object_id
      WHERE tablas.is_ms_shipped = 0
        AND tablas.name <> 'sysdiagrams'
    ) AS total_columnas;
`);

    const informacion = resultado.recordset[0];

    console.log("");
    console.log("Conexión realizada correctamente.");
    console.log("-------------------------------------");
    console.log(`Servidor: ${informacion.servidor}`);
    console.log(`Base de datos: ${informacion.base_datos}`);
    console.log(`Usuario conectado: ${informacion.usuario_conectado}`);
    console.log(`Total de tablas: ${informacion.total_tablas}`);
    console.log(`Total de columnas: ${informacion.total_columnas}`);
    console.log("-------------------------------------");

    if (
      informacion.total_tablas === 55 &&
      informacion.total_columnas === 530
    ) {
      console.log("La estructura general de BD-LHVR es correcta.");
    } else {
      console.warn(
        "La conexión funciona, pero la cantidad de tablas o columnas no coincide con lo esperado."
      );

      console.warn("Esperado: 55 tablas y 530 columnas.");
    }
  } catch (error) {
    huboError = true;

    console.error("");
    console.error("Error al verificar la conexión:");
    console.error(error.message);

    if (error.originalError?.message) {
      console.error(
        "Detalle de SQL Server:",
        error.originalError.message
      );
    }
  } finally {
    try {
      await cerrarConexion();
      console.log("Conexión cerrada.");
    } catch (errorCierre) {
      huboError = true;
      console.error(
        "No se pudo cerrar correctamente la conexión:",
        errorCierre.message
      );
    }

    process.exitCode = huboError ? 1 : 0;
  }
}

verificarConexionBD();  