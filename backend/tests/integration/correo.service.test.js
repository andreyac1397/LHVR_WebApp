const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

const correoService = require(
  "../../src/shared/services/correo.service"
);

/*
 * Prueba de integración del servicio de correo.
 *
 * Comprueba:
 * - La conexión con el servidor SMTP.
 * - El envío real de un código de verificación.
 * - Que Nodemailer devuelva un identificador del mensaje.
 */

async function ejecutarPrueba() {
  const destinatario = process.argv[2]
    ?.trim()
    .toLowerCase();

  if (!destinatario) {
    throw new Error(
      "Debe indicar el correo destinatario.\n" +
      "Ejemplo:\n" +
      'node tests/integration/correo.service.test.js "correo@gmail.com"'
    );
  }

  const codigoPrueba = crypto
    .randomInt(100000, 1000000)
    .toString();

  console.log("\n====================================");
  console.log(" PRUEBA DEL SERVICIO DE CORREO");
  console.log("====================================\n");

  console.log("1. Verificando conexión SMTP...");

  const conexionCorrecta =
    await correoService.verificarConexion();

  assert.equal(
    conexionCorrecta,
    true,
    "La conexión SMTP no fue correcta."
  );

  console.log("   Conexión SMTP correcta.\n");

  console.log("2. Enviando código de prueba...");
  console.log(`   Destinatario: ${destinatario}`);

  const resultado =
    await correoService.enviarCodigoVerificacion({
      destinatario,
      codigo: codigoPrueba,
      minutosVigencia: 10
    });

  assert.equal(
    resultado.enviado,
    true,
    "El servicio no confirmó el envío."
  );

  assert.ok(
    resultado.messageId,
    "No se recibió el identificador del mensaje."
  );

  console.log("   Correo enviado correctamente.");
  console.log(`   Código enviado: ${codigoPrueba}`);
  console.log(`   Identificador: ${resultado.messageId}`);

  console.log("\n====================================");
  console.log(" PRUEBA FINALIZADA CORRECTAMENTE");
  console.log("====================================\n");

  console.log(
    "Revisa la bandeja de entrada y también la carpeta de spam."
  );
}

ejecutarPrueba()
  .catch((error) => {
    console.error("\nLa prueba falló:");
    console.error(error.message);

    process.exitCode = 1;
  })
  .finally(() => {
    correoService.cerrarConexion();
  });