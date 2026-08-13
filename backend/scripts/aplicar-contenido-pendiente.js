const fs = require("node:fs/promises");
const path = require("node:path");

const {
  obtenerConexion,
  cerrarConexion
} = require("../src/config/database");

const inicializarContenido = require(
  "./inicializar-contenido-publico"
);

const MIGRACIONES = [
  "006-gestion-contenido-pendiente.sql",
  "007-auditoria-consulta.sql",
  "008-contenido-comunidad-contacto.sql"
];

function dividirLotes(contenido) {
  return contenido
    .split(/^\s*GO\s*;?\s*$/gim)
    .map((lote) => lote.trim())
    .filter(Boolean);
}

async function ejecutarMigracion(conexion, nombreArchivo) {
  const ruta = path.resolve(
    __dirname,
    "../../database/migrations",
    nombreArchivo
  );
  const contenido = await fs.readFile(ruta, "utf8");
  const lotes = dividirLotes(contenido);

  for (const lote of lotes) {
    await conexion.request().batch(lote);
  }

  console.log(`[migración] ${nombreArchivo}`);
}

async function ejecutar() {
  const conexion = await obtenerConexion();

  for (const migracion of MIGRACIONES) {
    await ejecutarMigracion(conexion, migracion);
  }

  await inicializarContenido();
}

ejecutar()
  .then(() => {
    console.log(
      "Migraciones y contenido inicial aplicados correctamente."
    );
  })
  .catch((error) => {
    console.error(
      "No fue posible preparar los módulos pendientes:",
      error.message
    );
    process.exitCode = 1;
  })
  .finally(() => cerrarConexion());
