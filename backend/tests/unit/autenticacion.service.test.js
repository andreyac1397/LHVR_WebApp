const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const AutenticacionService = require(
  "../../src/modules/autenticacion/services/autenticacion.service"
);

async function crearContexto(
  requiereVerificacion
) {
  const contrasena =
    "Clave-Segura-2026!";

  const administrador = {
    idAdministrador: 7,
    nombreCompleto:
      "Administración LHVR",
    correo:
      "administracion@lhvr.test",
    contrasenaHash:
      await bcrypt.hash(contrasena, 4),
    idEstadoAdministrador: 1,
    nombreEstado: "Activo",
    estadoActivo: true,
    permiteAcceso: true,
    correoVerificado: true,
    requiereVerificacion
  };

  const llamadas = {
    sesiones: 0,
    verificaciones: 0,
    intentos: 0,
    accesos: 0
  };

  const repositorio = {
    async contarIntentosFallidosRecientes() {
      return {
        fallidosPorCorreo: 0,
        fallidosPorIp: 0
      };
    },

    async buscarAdministradorPorCorreo() {
      return administrador;
    },

    async registrarIntentoInicioSesion() {
      llamadas.intentos += 1;
    },

    async actualizarUltimoAcceso() {
      llamadas.accesos += 1;
    }
  };

  const servicioVerificacion = {
    async crearSesionAdministrador() {
      llamadas.sesiones += 1;
      return {
        tokenSesion:
          "token-de-sesion-seguro",
        fechaExpiracion:
          "2026-08-14T00:00:00.000Z"
      };
    },

    async iniciarVerificacion() {
      llamadas.verificaciones += 1;
      return {
        autenticado: false,
        requiereVerificacion: true,
        tokenVerificacion:
          "token-de-verificacion"
      };
    }
  };

  const auditoria = {
    async registrarAuditoriaSegura() {
      return null;
    }
  };

  return {
    contrasena,
    llamadas,
    servicio:
      new AutenticacionService(
        repositorio,
        servicioVerificacion,
        null,
        auditoria
      )
  };
}

test("crea una sesión real cuando la cuenta no requiere segundo factor", async () => {
  const contexto =
    await crearContexto(false);

  const resultado =
    await contexto.servicio
      .iniciarSesion(
        {
          correo:
            "ADMINISTRACION@LHVR.TEST",
          contrasena:
            contexto.contrasena
        },
        {
          direccionIp: "127.0.0.1",
          userAgent: "prueba"
        }
      );

  assert.equal(resultado.autenticado, true);
  assert.equal(
    resultado.tokenSesion,
    "token-de-sesion-seguro"
  );
  assert.equal(
    resultado.fechaExpiracion,
    "2026-08-14T00:00:00.000Z"
  );
  assert.equal(contexto.llamadas.sesiones, 1);
  assert.equal(contexto.llamadas.verificaciones, 0);
  assert.equal(contexto.llamadas.intentos, 1);
  assert.equal(contexto.llamadas.accesos, 1);
  assert.equal(
    Object.hasOwn(
      resultado.administrador,
      "contrasenaHash"
    ),
    false
  );
});

test("mantiene el flujo de verificación para cuentas con segundo factor", async () => {
  const contexto =
    await crearContexto(true);

  const resultado =
    await contexto.servicio
      .iniciarSesion({
        correo:
          "administracion@lhvr.test",
        contrasena:
          contexto.contrasena
      });

  assert.equal(
    resultado.tokenVerificacion,
    "token-de-verificacion"
  );
  assert.equal(contexto.llamadas.verificaciones, 1);
  assert.equal(contexto.llamadas.sesiones, 0);
});
