const test = require("node:test");
const assert = require("node:assert/strict");

const SolicitudService = require(
  "../../src/shared/solicitudes-management/solicitud.service"
);

function repositorio() {
  return {
    async crear(datos) {
      return { idSolicitud: 1, ...datos, estado: "PENDIENTE" };
    },
    async actualizar(datos) {
      return datos;
    }
  };
}

test("valida nombre, correo y mensaje", async () => {
  const servicio = new SolicitudService("CONTACTO", repositorio());

  await assert.rejects(
    servicio.crear({ nombre: "Persona", correo: "incorrecto", mensaje: "Hola" }),
    (error) => error.codigo === "CORREO_SOLICITUD_INVALIDO"
  );
});

test("normaliza y crea una solicitud pública", async () => {
  const servicio = new SolicitudService("CONTACTO", repositorio());
  const resultado = await servicio.crear({
    nombre: "  Persona  ",
    correo: "CORREO@EJEMPLO.COM",
    asunto: "Consulta",
    mensaje: "Necesito información"
  });

  assert.equal(resultado.nombreCompleto, "Persona");
  assert.equal(resultado.correo, "correo@ejemplo.com");
  assert.equal(resultado.estado, "PENDIENTE");
});
