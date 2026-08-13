const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const {
  validarDatosAdministrador
} = require(
  "../src/modules/administradores/validators/administrador.validator"
);

const {
  sql,
  obtenerConexion,
  cerrarConexion
} = require("../src/config/database");

/* Cargar las variables de backend/.env */
dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

/*
 * Obtiene los datos del administrador inicial.
 * Las validaciones generales se realizan en
 * administrador.validator.js.
 */
function obtenerDatosAdministrador() {
  const nombre = process.env.ADMIN_INICIAL_NOMBRE;
  const correo = process.env.ADMIN_INICIAL_CORREO;
  const contrasena = process.env.ADMIN_INICIAL_CONTRASENA;

  if (!nombre || !correo || !contrasena) {
    throw new Error(
      "Faltan las variables ADMIN_INICIAL_NOMBRE, " +
      "ADMIN_INICIAL_CORREO o ADMIN_INICIAL_CONTRASENA en el archivo .env."
    );
  }

  if (
    correo.trim().toLowerCase() === "correo@ejemplo.com" ||
    contrasena === "ContraseñaSegura123*"
  ) {
    throw new Error(
      "Debes reemplazar el correo y la contraseña de ejemplo en el archivo .env."
    );
  }

  return validarDatosAdministrador({
    nombre,
    correo,
    contrasena
  });
}

/* Crear la primera cuenta administrativa */
async function crearAdministradorInicial() {
  try {
    console.log("Creando administrador inicial...");

    const datos = obtenerDatosAdministrador();
    const conexion = await obtenerConexion();

    /*
     * Impedir que este script se utilice cuando
     * ya existe algún administrador.
     */
    const resultadoCantidad = await conexion.request().query(`
      SELECT COUNT(*) AS total
      FROM administradores;
    `);

    const totalAdministradores =
      resultadoCantidad.recordset[0].total;

    if (totalAdministradores > 0) {
      throw new Error(
        "Ya existe al menos un administrador. " +
        "Este script solo puede utilizarse para crear la primera cuenta."
      );
    }

    /*
     * Buscar el estado Activo sin depender
     * directamente de que su ID sea 1.
     */
    const resultadoEstado = await conexion.request().query(`
      SELECT TOP 1
        id_estado_administrador
      FROM estados_administrador
      WHERE LOWER(LTRIM(RTRIM(nombre))) = N'activo'
        AND permite_acceso = 1
        AND activo = 1
      ORDER BY id_estado_administrador;
    `);

    if (resultadoEstado.recordset.length === 0) {
      throw new Error(
        "No se encontró un estado Activo que permita el acceso."
      );
    }

    const idEstadoActivo =
      resultadoEstado.recordset[0].id_estado_administrador;

    /* Proteger la contraseña mediante bcrypt */
    const contrasenaHash = await bcrypt.hash(
      datos.contrasena,
      12
    );

    /*
     * Insertar el administrador usando parámetros
     * para evitar inyección SQL.
     */
    const resultadoInsercion = await conexion
      .request()
      .input(
        "nombre_completo",
        sql.NVarChar(150),
        datos.nombre
      )
      .input(
        "correo",
        sql.NVarChar(254),
        datos.correo
      )
      .input(
        "contrasena_hash",
        sql.NVarChar(255),
        contrasenaHash
      )
      .input(
        "id_estado_administrador",
        sql.Int,
        idEstadoActivo
      )
      .query(`
        INSERT INTO administradores (
          nombre_completo,
          correo,
          contrasena_hash,
          id_estado_administrador,
          correo_verificado,
          requiere_verificacion
        )
        OUTPUT
          INSERTED.id_administrador,
          INSERTED.nombre_completo,
          INSERTED.correo,
          INSERTED.id_estado_administrador
        VALUES (
          @nombre_completo,
          @correo,
          @contrasena_hash,
          @id_estado_administrador,
          1,
          0
        );
      `);

    const administrador = resultadoInsercion.recordset[0];

    console.log("");
    console.log("Administrador inicial creado correctamente.");
    console.log("-------------------------------------");
    console.log(`ID: ${administrador.id_administrador}`);
    console.log(`Nombre: ${administrador.nombre_completo}`);
    console.log(`Correo: ${administrador.correo}`);
    console.log(
      `Estado: ${administrador.id_estado_administrador}`
    );
    console.log("-------------------------------------");
    console.log(
      "La contraseña se guardó protegida mediante hash."
    );
    console.log(
      "Elimina las variables ADMIN_INICIAL_* del archivo .env."
    );
  } catch (error) {
    console.error("");
    console.error(
      "No fue posible crear el administrador inicial:"
    );
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    try {
      await cerrarConexion();
      console.log("Conexión cerrada.");
    } catch (errorCierre) {
      console.error(
        "No se pudo cerrar la conexión:",
        errorCierre.message
      );

      process.exitCode = 1;
    }
  }
}

crearAdministradorInicial();