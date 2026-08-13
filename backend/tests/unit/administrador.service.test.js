const test = require("node:test");
const assert = require("node:assert/strict");

const AdministradorService = require(
  "../../src/modules/administradores/services/administrador.service"
);

function repositorioFalso() {
  return {
    creado: null,
    async obtenerEstado(id) {
      return { idEstadoAdministrador: Number(id), nombre: Number(id) === 1 ? "Activo" : "Inactivo", permiteAcceso: Number(id) === 1 };
    },
    async buscarPorCorreo() { return null; },
    async crear(datos) { this.creado = datos; return 7; },
    async obtenerPorId(id) {
      return {
        idAdministrador: Number(id),
        idEstadoAdministrador: 1,
        nombreCompleto: "Persona administradora",
        correo: "persona@example.org"
      };
    },
    async cambiarEstado(id, estado) {
      return { idAdministrador: Number(id), idEstadoAdministrador: Number(estado) };
    }
  };
}

test("crea un administrador almacenando hash y nunca la contraseña plana", async () => {
  const repositorio = repositorioFalso();
  const servicio = new AdministradorService(repositorio);
  const resultado = await servicio.crear({
    nombreCompleto: "Persona Administradora",
    correo: "PERSONA@example.org",
    contrasena: "ClaveMuySegura#2026",
    idEstadoAdministrador: 1
  }, { idAdministrador: 1 });

  assert.equal(resultado.idAdministrador, 7);
  assert.equal(repositorio.creado.correo, "persona@example.org");
  assert.match(repositorio.creado.contrasenaHash, /^\$2[aby]\$/);
  assert.notEqual(repositorio.creado.contrasenaHash, "ClaveMuySegura#2026");
});

test("rechaza contraseñas administrativas débiles", async () => {
  const servicio = new AdministradorService(repositorioFalso());
  await assert.rejects(
    servicio.crear({
      nombreCompleto: "Persona Administradora",
      correo: "persona@example.org",
      contrasena: "123456",
      idEstadoAdministrador: 1
    }),
    (error) => error.codigo === "CONTRASENA_ADMIN_DEBIL"
  );
});

test("impide que la sesión activa se deshabilite a sí misma", async () => {
  const servicio = new AdministradorService(repositorioFalso());
  await assert.rejects(
    servicio.cambiarEstado(3, { idEstadoAdministrador: 2 }, { idAdministrador: 3 }),
    (error) => error.codigo === "AUTO_DESACTIVACION_NO_PERMITIDA"
  );
});
