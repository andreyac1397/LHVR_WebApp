const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../../src/app");

let servidor;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    servidor = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${servidor.address().port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve, reject) => servidor.close((error) => error ? reject(error) : resolve()));
});

for (const ruta of [
  "/dashboard/resumen",
  "/auditoria",
  "/administradores",
  "/calendario/administracion",
  "/contacto/administracion",
  "/solicitudes-bibliocra/administracion"
]) {
  test(`protege ${ruta} sin una sesión administrativa`, async () => {
    const respuesta = await fetch(baseUrl + ruta);
    const cuerpo = await respuesta.json();
    assert.equal(respuesta.status, 401);
    assert.equal(cuerpo.exito, false);
    assert.equal(cuerpo.codigo, "SESION_REQUERIDA");
  });
}

test("rechaza contacto público incompleto antes de acceder a la BD", async () => {
  const respuesta = await fetch(baseUrl + "/contacto/publico", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nombreCompleto: "A" })
  });
  const cuerpo = await respuesta.json();
  assert.equal(respuesta.status, 400);
  assert.equal(cuerpo.exito, false);
});

test("rechaza solicitud BiblioCRA incompleta antes de acceder a la BD", async () => {
  const respuesta = await fetch(baseUrl + "/solicitudes-bibliocra/publico", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nombreSolicitante: "Persona" })
  });
  const cuerpo = await respuesta.json();
  assert.equal(respuesta.status, 400);
  assert.equal(cuerpo.exito, false);
});

test("entrega una plantilla XLSX real para horarios", async () => {
  const respuesta = await fetch(baseUrl + "/horarios/plantilla.xlsx");
  const contenido = Buffer.from(await respuesta.arrayBuffer());
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers.get("content-type") || "", /spreadsheetml/);
  assert.equal(contenido.subarray(0, 2).toString("ascii"), "PK");
  assert.ok(contenido.length > 500);
});
