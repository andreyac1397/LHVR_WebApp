const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, ".env")
});

const app = require("./src/app");

const {
  obtenerConexion,
  cerrarConexion
} = require("./src/config/database");

const PUERTO = Number(process.env.PORT) || 3001;

let servidor = null;

/*
 * Inicia el servidor solamente cuando la conexión
 * con SQL Server se establece correctamente.
 */
async function iniciarServidor() {
  try {
    await obtenerConexion();

    servidor = app.listen(PUERTO, () => {
      console.log("-------------------------------------");
      console.log(`Servidor iniciado en http://localhost:${PUERTO}`);
      console.log(`API: http://localhost:${PUERTO}/api`);
      console.log(`Estado: http://localhost:${PUERTO}/api/estado`);
      console.log("-------------------------------------");
    });

    servidor.on("error", (error) => {
      console.error(
        "No fue posible iniciar el servidor:",
        error.message
      );

      process.exitCode = 1;
    });
  } catch (error) {
    console.error(
      "El servidor no se inició porque falló la conexión con la base de datos."
    );

    process.exitCode = 1;
  }
}

/*
 * Cierra correctamente Express y la conexión
 * con SQL Server.
 */
async function apagarServidor(senal) {
  console.log(`\nCerrando servidor por señal ${senal}...`);

  try {
    if (servidor) {
      await new Promise((resolve, reject) => {
        servidor.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await cerrarConexion();

    console.log("Servidor y conexión cerrados correctamente.");
    process.exit(0);
  } catch (error) {
    console.error(
      "Error al cerrar el servidor:",
      error.message
    );

    process.exit(1);
  }
}

process.on("SIGINT", () => apagarServidor("SIGINT"));
process.on("SIGTERM", () => apagarServidor("SIGTERM"));

iniciarServidor();