const path = require("node:path");
const assert = require("node:assert/strict");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

const SqlAutenticacionRepository = require(
  "../../src/modules/autenticacion/repositories/sql-autenticacion.repository"
);

const {
  cerrarConexion
} = require("../../src/config/database");

/*
 * Prueba de integración del repositorio de autenticación.
 *
 * Comprueba:
 * - Que el repositorio contiene los 11 métodos.
 * - Que Node.js puede buscar un administrador.
 * - Que los nombres de las columnas se transforman correctamente.
 * - Que un correo inexistente devuelve null.
 * - Que se pueden contar los intentos fallidos.
 * - Que un token inexistente devuelve null.
 *
 * Esta prueba no inserta, modifica ni elimina datos.
 */

async function ejecutarPrueba() {
  const correoAdministrador = process.argv[2]
    ?.trim()
    .toLowerCase();

  if (!correoAdministrador) {
    throw new Error(
      "Debe indicar el correo del administrador.\n" +
      "Ejemplo:\n" +
      'node tests/integration/sql-autenticacion.repository.test.js "correo@dominio.com"'
    );
  }

  const repositorio = new SqlAutenticacionRepository();

  console.log("\n========================================");
  console.log(" PRUEBA DEL REPOSITORIO DE AUTENTICACIÓN");
  console.log("========================================\n");

  /*
   * 1. Comprobar que existen todos los métodos
   */
  console.log("1. Comprobando los métodos del repositorio...");

  const metodosEsperados = [
    "buscarAdministradorPorCorreo",
    "registrarIntentoInicioSesion",
    "contarIntentosFallidosRecientes",
    "actualizarUltimoAcceso",
    "crearCodigoVerificacion",
    "obtenerCodigoVerificacionVigente",
    "registrarIntentoFallidoCodigo",
    "marcarCodigoVerificacionUsado",
    "crearTokenAdministrador",
    "buscarTokenActivo",
    "revocarTokenAdministrador"
  ];

  for (const metodo of metodosEsperados) {
    assert.equal(
      typeof repositorio[metodo],
      "function",
      `Falta implementar el método: ${metodo}`
    );
  }

  console.log(
    `   Correcto: existen los ${metodosEsperados.length} métodos.\n`
  );

  /*
   * 2. Buscar el administrador real
   */
  console.log("2. Buscando el administrador por correo...");

  const administrador =
    await repositorio.buscarAdministradorPorCorreo(
      correoAdministrador
    );

  assert.ok(
    administrador,
    "No se encontró el administrador indicado."
  );

  assert.ok(
    Number.isInteger(administrador.idAdministrador),
    "El identificador del administrador no es válido."
  );

  assert.equal(
    administrador.correo,
    correoAdministrador,
    "El correo devuelto no coincide con el solicitado."
  );

  assert.equal(
    typeof administrador.permiteAcceso,
    "boolean",
    "permiteAcceso debe ser un valor booleano."
  );

  assert.equal(
    typeof administrador.estadoActivo,
    "boolean",
    "estadoActivo debe ser un valor booleano."
  );

  assert.equal(
    typeof administrador.correoVerificado,
    "boolean",
    "correoVerificado debe ser un valor booleano."
  );

  assert.equal(
    typeof administrador.requiereVerificacion,
    "boolean",
    "requiereVerificacion debe ser un valor booleano."
  );

  assert.ok(
    typeof administrador.contrasenaHash === "string" &&
    administrador.contrasenaHash.length > 0,
    "No se recibió el hash de la contraseña."
  );

  /*
   * No se muestra contrasenaHash por seguridad.
   */
  console.log("   Administrador encontrado correctamente:");

  console.log({
    idAdministrador: administrador.idAdministrador,
    nombreCompleto: administrador.nombreCompleto,
    correo: administrador.correo,
    nombreEstado: administrador.nombreEstado,
    permiteAcceso: administrador.permiteAcceso,
    estadoActivo: administrador.estadoActivo,
    correoVerificado: administrador.correoVerificado,
    requiereVerificacion:
      administrador.requiereVerificacion
  });

  console.log();

  /*
   * 3. Probar un correo inexistente
   */
  console.log("3. Probando un correo inexistente...");

  const correoInexistente =
    `no-existe-${Date.now()}@prueba.local`;

  const administradorInexistente =
    await repositorio.buscarAdministradorPorCorreo(
      correoInexistente
    );

  assert.equal(
    administradorInexistente,
    null,
    "Un correo inexistente debe devolver null."
  );

  console.log("   Correcto: devolvió null.\n");

  /*
   * 4. Contar intentos fallidos recientes
   */
  console.log("4. Consultando intentos fallidos recientes...");

  const intentos =
    await repositorio.contarIntentosFallidosRecientes({
      correo: correoAdministrador,
      direccionIp: "127.0.0.1",
      ventanaMinutos: 15
    });

  assert.equal(
    typeof intentos.fallidosPorCorreo,
    "number",
    "fallidosPorCorreo debe ser numérico."
  );

  assert.equal(
    typeof intentos.fallidosPorIp,
    "number",
    "fallidosPorIp debe ser numérico."
  );

  assert.equal(
    intentos.ventanaMinutos,
    15,
    "La ventana de minutos no coincide."
  );

  console.log("   Resultado:");

  console.log({
    fallidosPorCorreo:
      intentos.fallidosPorCorreo,
    fallidosPorIp:
      intentos.fallidosPorIp,
    ventanaMinutos:
      intentos.ventanaMinutos
  });

  console.log();

  /*
   * 5. Buscar un token inexistente
   */
  console.log("5. Probando un token inexistente...");

  const tokenInexistente =
    await repositorio.buscarTokenActivo(
      "SESION",
      `hash-inexistente-${Date.now()}`
    );

  assert.equal(
    tokenInexistente,
    null,
    "Un token inexistente debe devolver null."
  );

  console.log("   Correcto: devolvió null.\n");

  console.log("========================================");
  console.log(" TODAS LAS PRUEBAS FUERON CORRECTAS");
  console.log("========================================\n");
}

ejecutarPrueba()
  .catch((error) => {
    console.error("\nLa prueba falló:");
    console.error(error.message);

    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cerrarConexion();
    } catch (error) {
      console.error(
        "No se pudo cerrar la conexión:",
        error.message
      );
    }
  });