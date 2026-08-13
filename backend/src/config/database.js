const path = require("path");
const sql = require("mssql/msnodesqlv8");
const dotenv = require("dotenv");

/* Cargar las variables del archivo backend/.env */
dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

/* Convertir variables de texto a valores booleanos */
const convertirBooleano = (valor) => {
  return String(valor).toLowerCase() === "true";
};

/* Configuración de la conexión con SQL Server */
const configuracionBD = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  driver: "ODBC Driver 18 for SQL Server",

  options: {
    trustedConnection: convertirBooleano(
      process.env.DB_TRUSTED_CONNECTION
    ),
    trustServerCertificate: convertirBooleano(
      process.env.DB_TRUST_SERVER_CERTIFICATE
    )
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },

  connectionTimeout: 15000,
  requestTimeout: 30000
};

/* Guardará una única conexión compartida */
let poolConexion = null;

/**
 * Obtiene la conexión activa con SQL Server.
 * Si todavía no existe, crea el pool de conexiones.
 */
async function obtenerConexion() {
  try {
    if (poolConexion && poolConexion.connected) {
      return poolConexion;
    }

    poolConexion = await new sql.ConnectionPool(
      configuracionBD
    ).connect();

    console.log(
      `Conexión establecida con la base de datos ${process.env.DB_DATABASE}`
    );

    return poolConexion;
  } catch (error) {
    poolConexion = null;

    console.error(
      "No fue posible conectar con SQL Server:",
      error.message
    );

    throw error;
  }
}

/**
 * Cierra el pool de conexiones.
 * Se utilizará principalmente en pruebas o al cerrar el servidor.
 */
async function cerrarConexion() {
  if (poolConexion) {
    await poolConexion.close();
    poolConexion = null;
  }
}

module.exports = {
  sql,
  obtenerConexion,
  cerrarConexion
};