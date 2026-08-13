const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../../src/app");
const {
  autenticacionService
} = require(
  "../../src/container/dependency-container"
);

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

test("crea una cookie HttpOnly y no expone el token al iniciar sin segundo factor", async () => {
  const iniciarSesionOriginal =
    autenticacionService.iniciarSesion;

  autenticacionService.iniciarSesion =
    async () => ({
      autenticado: true,
      requiereVerificacion: false,
      mensaje:
        "Inicio de sesión realizado correctamente.",
      tokenSesion:
        "token-que-no-debe-aparecer-en-json",
      fechaExpiracion:
        "2026-08-14T00:00:00.000Z",
      administrador: {
        idAdministrador: 1,
        nombreCompleto:
          "Administración LHVR",
        correo:
          "administracion@lhvr.test"
      }
    });

  try {
    const respuesta = await fetch(
      baseUrl +
        "/autenticacion/iniciar-sesion",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json"
        },
        body: JSON.stringify({
          correo:
            "administracion@lhvr.test",
          contrasena:
            "Clave-Segura-2026!"
        })
      }
    );

    const cuerpo = await respuesta.json();
    const cookie =
      respuesta.headers.get("set-cookie") || "";

    assert.equal(respuesta.status, 200);
    assert.match(
      cookie,
      /^sesion_admin=/
    );
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.equal(
      cuerpo.datos.tokenSesion,
      undefined
    );
    assert.equal(
      JSON.stringify(cuerpo).includes(
        "token-que-no-debe-aparecer-en-json"
      ),
      false
    );
  } finally {
    autenticacionService.iniciarSesion =
      iniciarSesionOriginal;
  }
});
