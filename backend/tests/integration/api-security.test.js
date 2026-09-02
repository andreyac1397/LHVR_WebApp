const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../../src/app");
const {
  autenticacionService,
  servicioVerificacion,
  repositorioAutenticacion
} = require(
  "../../src/container/dependency-container"
);

const paginaController = require(
  "../../src/modules/paginas-contenido/controllers/pagina.controller"
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
  "/boletines/correo/categorias",
  "/boletines/correo/destinatarios",
  "/boletines/correo/envios",
  "/horarios/colecciones/1/exportar.xlsx",
  "/solicitudes-bibliocra/administracion",
  "/solicitudes-bibliocra/administracion/destinatarios",
  "/chat/administracion/conversaciones"
]) {
  test(`protege ${ruta} sin una sesión administrativa`, async () => {
    const respuesta = await fetch(baseUrl + ruta);
    const cuerpo = await respuesta.json();
    assert.equal(respuesta.status, 401);
    assert.equal(cuerpo.exito, false);
    assert.equal(cuerpo.codigo, "SESION_REQUERIDA");
  });
}

for (const [metodo, ruta] of [
  ["POST", "/boletines/correo/destinatarios"],
  ["POST", "/boletines/correo/seleccion/resolver"],
  ["POST", "/boletines/correo/envios"],
  ["PATCH", "/boletines/correo/destinatarios/1/estado"],
  ["POST", "/solicitudes-bibliocra/administracion/destinatarios"],
  ["DELETE", "/solicitudes-bibliocra/administracion/destinatarios/1"],
  ["PATCH", "/solicitudes-bibliocra/administracion/1"],
  ["POST", "/chat/administracion/conversaciones/1/mensajes"],
  ["PATCH", "/chat/administracion/conversaciones/1/estado"],
  ["PATCH", "/chat/administracion/conversaciones/1/archivar"],
  ["DELETE", "/chat/administracion/conversaciones/1"],
  ["POST", "/chat/administracion/conversaciones/1/marcar-leidos"]
]) {
  test(`protege ${metodo} ${ruta} sin una sesión administrativa`, async () => {
    const respuesta = await fetch(baseUrl + ruta, {
      method: metodo,
      headers: { "content-type": "application/json" },
      body: metodo === "DELETE" ? undefined : JSON.stringify({})
    });
    const cuerpo = await respuesta.json();
    assert.equal(respuesta.status, 401);
    assert.equal(cuerpo.exito, false);
    assert.equal(cuerpo.codigo, "SESION_REQUERIDA");
  });
}

test("rechaza la creación pública de chat sin identidad antes de acceder a la BD", async () => {
  const respuesta = await fetch(baseUrl + "/chat/publico/conversaciones", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nombreCompleto: "", cedula: "" })
  });
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 400);
  assert.equal(cuerpo.exito, false);
  assert.equal(cuerpo.codigo, "NOMBRE_CHAT_INVALIDO");
});

test("rechaza un token público de chat inválido", async () => {
  const respuesta = await fetch(baseUrl + "/chat/publico/mensajes", {
    headers: { authorization: "Bearer 1-1111-1111" }
  });
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 401);
  assert.equal(cuerpo.exito, false);
  assert.equal(cuerpo.codigo, "TOKEN_CHAT_INVALIDO");
});

for (const mensaje of ["", "a".repeat(4001)]) {
  test(`rechaza un mensaje público de chat con longitud ${mensaje.length}`, async () => {
    const respuesta = await fetch(baseUrl + "/chat/publico/mensajes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${"A".repeat(43)}`
      },
      body: JSON.stringify({ mensaje })
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.exito, false);
    assert.ok([
      "MENSAJE_CHAT_VACIO",
      "TEXTO_CHAT_DEMASIADO_LARGO"
    ].includes(cuerpo.codigo));
  });
}

test("protege la actualizacion general de paginas", async () => {
  const respuesta = await fetch(
    baseUrl + "/paginas/administracion/12",
    {
      method: "PUT",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        titulo: "Contacto",
        descripcion: "Descripción",
        idEstadoPublicacion: 2
      })
    }
  );

  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 401);
  assert.equal(cuerpo.exito, false);
  assert.equal(cuerpo.codigo, "SESION_REQUERIDA");
});

test("protege el guardado conjunto de horarios", async () => {
  const respuesta = await fetch(
    baseUrl + "/horarios/colecciones/1/guardar-cambios",
    {
      method: "PUT",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ elementos: [] })
    }
  );
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 401);
  assert.equal(cuerpo.exito, false);
  assert.equal(cuerpo.codigo, "SESION_REQUERIDA");
});

test("permite consultar contenido parcial sin sesion administrativa", async () => {
  const metodoOriginal =
    paginaController
      .obtenerContenidoPublicoParcial;

  paginaController
    .obtenerContenidoPublicoParcial =
      async (_req, res) =>
        res.status(200).json({
          exito: true,
          datos: {
            pagina: {
              encabezadoVisible: false
            },
            secciones: []
          }
        });

  try {
    const respuesta = await fetch(
      baseUrl +
        "/paginas/publicas-parciales/comunidad"
    );

    const cuerpo =
      await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.exito, true);
    assert.equal(
      cuerpo.datos.pagina
        .encabezadoVisible,
      false
    );
  } finally {
    paginaController
      .obtenerContenidoPublicoParcial =
        metodoOriginal;
  }
});

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

test("una sesión con cambio obligatorio solo puede consultar la sesión y no usar el panel", async () => {
  const buscarOriginal = repositorioAutenticacion.buscarTokenActivo;
  repositorioAutenticacion.buscarTokenActivo = async () => ({
    idTokenAdministrador: 11,
    idAdministrador: 7,
    tipoToken: "SESION",
    nombreCompleto: "Cuenta temporal",
    correo: "temporal@example.org",
    idEstadoAdministrador: 1,
    nombreEstado: "Activo",
    estadoActivo: true,
    permiteAcceso: true,
    correoVerificado: true,
    requiereCambioContrasena: true,
    fechaEmision: "2026-08-20T00:00:00.000Z",
    fechaExpiracion: "2026-08-21T00:00:00.000Z"
  });

  try {
    const sesion = await fetch(baseUrl + "/autenticacion/sesion", {
      headers: { cookie: "sesion_admin=token-temporal" }
    });
    const cuerpoSesion = await sesion.json();
    assert.equal(sesion.status, 200);
    assert.equal(cuerpoSesion.datos.administrador.requiereCambioContrasena, true);

    const protegida = await fetch(baseUrl + "/dashboard/resumen", {
      headers: { cookie: "sesion_admin=token-temporal" }
    });
    const cuerpoProtegido = await protegida.json();
    assert.equal(protegida.status, 403);
    assert.equal(cuerpoProtegido.codigo, "CAMBIO_CONTRASENA_REQUERIDO");
  } finally {
    repositorioAutenticacion.buscarTokenActivo = buscarOriginal;
  }
});

test("el cambio obligatorio renueva la sesión sin exponer el token", async () => {
  const buscarOriginal = repositorioAutenticacion.buscarTokenActivo;
  const cambiarOriginal = autenticacionService.cambiarContrasena;
  const crearSesionOriginal = servicioVerificacion.crearSesionAdministrador;
  repositorioAutenticacion.buscarTokenActivo = async () => ({
    idTokenAdministrador: 11,
    idAdministrador: 7,
    tipoToken: "SESION",
    nombreCompleto: "Cuenta temporal",
    correo: "temporal@example.org",
    idEstadoAdministrador: 1,
    nombreEstado: "Activo",
    estadoActivo: true,
    permiteAcceso: true,
    correoVerificado: true,
    requiereCambioContrasena: true
  });
  autenticacionService.cambiarContrasena = async () => ({
    contrasenaActualizada: true
  });
  servicioVerificacion.crearSesionAdministrador = async () => ({
    tokenSesion: "token-renovado-secreto",
    fechaExpiracion: "2026-08-21T00:00:00.000Z"
  });

  try {
    const respuesta = await fetch(baseUrl + "/autenticacion/cambiar-contrasena-obligatoria", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        cookie: "sesion_admin=token-temporal"
      },
      body: JSON.stringify({
        contrasenaActual: "Temporal-Segura-2026!",
        contrasenaNueva: "Definitiva-Segura-2026!",
        confirmarContrasenaNueva: "Definitiva-Segura-2026!"
      })
    });
    const cuerpo = await respuesta.json();
    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.datos.requiereCambioContrasena, false);
    assert.equal(cuerpo.datos.requiereNuevoInicioSesion, false);
    assert.match(respuesta.headers.get("set-cookie") || "", /^sesion_admin=/);
    assert.equal(JSON.stringify(cuerpo).includes("token-renovado-secreto"), false);
  } finally {
    repositorioAutenticacion.buscarTokenActivo = buscarOriginal;
    autenticacionService.cambiarContrasena = cambiarOriginal;
    servicioVerificacion.crearSesionAdministrador = crearSesionOriginal;
  }
});
