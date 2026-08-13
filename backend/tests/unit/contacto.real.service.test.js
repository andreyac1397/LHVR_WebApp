const test = require("node:test");
const assert = require("node:assert/strict");

const ContactoService = require(
  "../../src/modules/contacto/services/contacto.service"
);

test("normaliza y guarda un mensaje de contacto real", async () => {
  let recibido;
  const servicio = new ContactoService({
    async crear(datos) {
      recibido = datos;
      return { idSolicitudContacto: 9 };
    }
  });

  const resultado = await servicio.crear({
    nombre: "  Persona de Prueba ",
    email: "PERSONA@EJEMPLO.COM",
    asunto: " Consulta ",
    mensaje: " Necesito información institucional. "
  }, {
    direccionIp: "127.0.0.1",
    userAgent: "prueba"
  });

  assert.equal(resultado.idSolicitudContacto, 9);
  assert.equal(recibido.nombreCompleto, "Persona de Prueba");
  assert.equal(recibido.correo, "persona@ejemplo.com");
  assert.equal(recibido.asunto, "Consulta");
});

test("rechaza mensajes de contacto incompletos", async () => {
  const servicio = new ContactoService({ async crear() {} });

  await assert.rejects(
    servicio.crear({
      nombre: "Yo",
      email: "correo-invalido",
      asunto: "",
      mensaje: "corto"
    }),
    (error) => error.codigo === "NOMBRE_CONTACTO_INVALIDO"
  );
});
