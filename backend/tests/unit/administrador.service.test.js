const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const AdministradorService = require(
  "../../src/modules/administradores/services/administrador.service"
);

function repositorioFalso() {
  return {
    creado: null,
    hashTemporal: null,
    async obtenerEstado(id) {
      return { idEstadoAdministrador: Number(id), nombre: Number(id) === 1 ? "Activo" : "Inactivo", permiteAcceso: Number(id) === 1 };
    },
    async obtenerEstadoAccesoPredeterminado() {
      return { idEstadoAdministrador: 1, nombre: "Activo", permiteAcceso: true };
    },
    async buscarPorCorreo() { return null; },
    async crear(datos) { this.creado = datos; return 7; },
    async obtenerPorId(id) {
      return {
        idAdministrador: Number(id),
        idEstadoAdministrador: 1,
        nombreCompleto: "Persona administradora",
        correo: "persona@example.org",
        permiteAcceso: true,
        correoVerificado: true,
        requiereCambioContrasena: true
      };
    },
    async actualizar(id, datos) {
      return { idAdministrador: Number(id), ...datos };
    },
    async cambiarEstado(id, estado) {
      return { idAdministrador: Number(id), idEstadoAdministrador: Number(estado) };
    },
    async establecerAccesoTemporal(id, hash) {
      this.hashTemporal = hash;
      return this.obtenerPorId(id);
    }
  };
}

function correoFalso({ fallar = false } = {}) {
  return {
    ultimoEnvio: null,
    async enviarAccesoTemporalAdministrador(datos) {
      if (fallar) throw new Error("SMTP no disponible");
      this.ultimoEnvio = datos;
      return { enviado: true };
    }
  };
}

test("crea un administrador con clave temporal segura, guarda solo el hash y envía la clave por correo", async () => {
  const repositorio = repositorioFalso();
  const correo = correoFalso();
  const servicio = new AdministradorService(repositorio, null, correo);
  const resultado = await servicio.crear({
    nombreCompleto: "Persona Administradora",
    correo: "PERSONA@example.org"
  }, { idAdministrador: 1 });

  assert.equal(resultado.administrador.idAdministrador, 7);
  assert.equal(resultado.correoAccesoEnviado, true);
  assert.equal(repositorio.creado.correo, "persona@example.org");
  assert.match(repositorio.creado.contrasenaHash, /^\$2[aby]\$/);
  assert.equal(repositorio.creado.idEstadoAdministrador, 1);
  assert.match(correo.ultimoEnvio.contrasenaTemporal, /[a-z]/);
  assert.match(correo.ultimoEnvio.contrasenaTemporal, /[A-Z]/);
  assert.match(correo.ultimoEnvio.contrasenaTemporal, /\d/);
  assert.match(correo.ultimoEnvio.contrasenaTemporal, /[^A-Za-z0-9]/);
  assert.equal(
    await bcrypt.compare(correo.ultimoEnvio.contrasenaTemporal, repositorio.creado.contrasenaHash),
    true
  );
  assert.equal(JSON.stringify(resultado).includes(correo.ultimoEnvio.contrasenaTemporal), false);
  assert.equal(Object.hasOwn(resultado, "contrasena"), false);
});

test("mantiene la cuenta creada y reporta una advertencia cuando falla el correo", async () => {
  const repositorio = repositorioFalso();
  const servicio = new AdministradorService(repositorio, null, correoFalso({ fallar: true }));
  const resultado = await servicio.crear({
    nombreCompleto: "Persona Administradora",
    correo: "persona@example.org"
  });
  assert.equal(resultado.administrador.idAdministrador, 7);
  assert.equal(resultado.correoAccesoEnviado, false);
  assert.match(resultado.advertencia, /Reenviar acceso/i);
});

test("impide que la sesión activa se deshabilite a sí misma", async () => {
  const servicio = new AdministradorService(repositorioFalso());
  await assert.rejects(
    servicio.cambiarEstado(3, { idEstadoAdministrador: 2 }, { idAdministrador: 3 }),
    (error) => error.codigo === "AUTO_DESACTIVACION_NO_PERMITIDA"
  );
});

test("impide editar la propia cuenta desde el listado", async () => {
  const servicio = new AdministradorService(repositorioFalso());
  await assert.rejects(
    servicio.actualizar(3, {
      nombreCompleto: "Nombre actualizado",
      correo: "actualizado@example.org",
      idEstadoAdministrador: 1
    }, { idAdministrador: 3 }),
    (error) => error.codigo === "AUTO_EDICION_ADMIN_NO_PERMITIDA"
  );
});

test("reenviar acceso reemplaza el hash, exige cambio y nunca devuelve la clave temporal", async () => {
  const repositorio = repositorioFalso();
  const correo = correoFalso();
  const servicio = new AdministradorService(repositorio, null, correo);
  const resultado = await servicio.reenviarAcceso(7, { idAdministrador: 1 });
  assert.match(repositorio.hashTemporal, /^\$2[aby]\$/);
  assert.equal(resultado.administrador.requiereCambioContrasena, true);
  assert.equal(JSON.stringify(resultado).includes(correo.ultimoEnvio.contrasenaTemporal), false);
});
