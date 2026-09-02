const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const ChatService = require(
  "../../src/modules/chat/services/chat.service"
);

function conversacionBase(datos = {}) {
  return {
    idConversacion: 10,
    nombreCompleto: "María Pérez",
    cedula: "1-1111-1111",
    idEstadoChat: 1,
    estado: "Nuevo",
    fechaCreacion: "2026-08-20T12:00:00Z",
    fechaUltimaActividad: "2026-08-20T12:00:00Z",
    fechaAtencion: null,
    fechaCierre: null,
    ...datos
  };
}

function crearRepositorio() {
  return {
    creaciones: [],
    mensajesExternos: [],
    mensajesAdministrador: [],
    cambiosEstado: [],
    archivados: [],
    eliminados: [],
    hashesConsultados: [],
    async crearConversacion(datos) {
      this.creaciones.push(datos);
      return conversacionBase({
        tokenAccesoHash: datos.tokenAccesoHash,
        idAdministradorAtencion: 77
      });
    },
    async buscarConversacionPublica(hash) {
      this.hashesConsultados.push(hash);
      return conversacionBase({ tokenAccesoHash: hash });
    },
    async listarMensajesPublicos() {
      return [{
        idMensaje: 1,
        idConversacion: 10,
        tipoRemitente: "ADMINISTRADOR",
        idAdministrador: 7,
        administrador: "Dato interno",
        mensaje: "Respuesta institucional",
        fechaEnvio: "2026-08-20T12:05:00Z",
        fechaLectura: null
      }];
    },
    async crearMensajeExterno(datos) {
      this.mensajesExternos.push(datos);
      return {
        idMensaje: 2,
        idConversacion: 10,
        tipoRemitente: "EXTERNO",
        mensaje: datos.mensaje,
        fechaEnvio: "2026-08-20T12:06:00Z",
        fechaLectura: null
      };
    },
    async marcarMensajesAdministradorLeidos() {
      return 1;
    },
    async listarConversaciones() {
      return { conversaciones: [], estados: [], totalNoLeidos: 0 };
    },
    async obtenerConversacionAdministrativa() {
      return conversacionBase();
    },
    async listarMensajesAdministrativos() {
      return [];
    },
    async marcarMensajesExternosLeidos() {
      return 2;
    },
    async crearMensajeAdministrador(datos) {
      this.mensajesAdministrador.push(datos);
      return {
        idMensaje: 3,
        idConversacion: datos.idConversacion,
        tipoRemitente: "ADMINISTRADOR",
        idAdministrador: datos.idAdministrador,
        mensaje: datos.mensaje
      };
    },
    async actualizarEstado(datos) {
      this.cambiosEstado.push(datos);
      return true;
    },
    async archivarConversacion(datos) {
      this.archivados.push(datos);
      return true;
    },
    async eliminarConversacion(idConversacion) {
      this.eliminados.push(idConversacion);
      return { eliminada: true, mensajesEliminados: 4 };
    }
  };
}

test("genera un token de 32 bytes y guarda únicamente su SHA-256", async () => {
  const repositorio = crearRepositorio();
  const servicio = new ChatService(repositorio);
  const resultado = await servicio.crearConversacion(
    {
      nombreCompleto: "  María   Pérez ",
      cedula: " 1-1111-1111 "
    },
    { direccionIp: "127.0.0.1", userAgent: "Prueba" }
  );

  assert.match(resultado.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(
    Buffer.from(resultado.token, "base64url").length,
    ChatService.BYTES_TOKEN
  );
  assert.equal(repositorio.creaciones[0].nombreCompleto, "María Pérez");
  assert.equal(repositorio.creaciones[0].cedula, "1-1111-1111");
  assert.equal(repositorio.creaciones[0].tokenAccesoHash.length, 64);
  assert.equal(
    repositorio.creaciones[0].tokenAccesoHash,
    crypto.createHash("sha256").update(resultado.token).digest("hex")
  );
  assert.equal(JSON.stringify(resultado).includes("tokenAccesoHash"), false);
  assert.equal(JSON.stringify(resultado).includes("idAdministradorAtencion"), false);
});

test("recupera mensajes solamente mediante el hash del token", async () => {
  const repositorio = crearRepositorio();
  const servicio = new ChatService(repositorio);
  const token = crypto.randomBytes(32).toString("base64url");
  const resultado = await servicio.listarMensajesPublicos(token);

  assert.equal(repositorio.hashesConsultados.length, 1);
  assert.equal(
    repositorio.hashesConsultados[0],
    crypto.createHash("sha256").update(token).digest("hex")
  );
  assert.equal(resultado.mensajes.length, 1);
  assert.equal(JSON.stringify(resultado).includes("tokenAccesoHash"), false);
  assert.equal(JSON.stringify(resultado).includes("idAdministrador"), false);
  assert.equal(JSON.stringify(resultado).includes("Dato interno"), false);
});

test("rechaza tokens inválidos antes de consultar el repositorio", async () => {
  const repositorio = crearRepositorio();
  const servicio = new ChatService(repositorio);

  await assert.rejects(
    servicio.obtenerConversacionPublica("1-1111-1111"),
    (error) =>
      error.codigo === "TOKEN_CHAT_INVALIDO" && error.statusCode === 401
  );
  assert.equal(repositorio.hashesConsultados.length, 0);
});

test("valida mensajes vacíos y mayores de 4000 caracteres", async () => {
  const repositorio = crearRepositorio();
  const servicio = new ChatService(repositorio);
  const token = crypto.randomBytes(32).toString("base64url");

  await assert.rejects(
    servicio.crearMensajeExterno(token, { mensaje: "   " }),
    (error) => error.codigo === "MENSAJE_CHAT_VACIO"
  );
  await assert.rejects(
    servicio.crearMensajeExterno(token, { mensaje: "a".repeat(4001) }),
    (error) => error.codigo === "TEXTO_CHAT_DEMASIADO_LARGO"
  );

  const creado = await servicio.crearMensajeExterno(token, {
    mensaje: "  Buenas   tardes  "
  });
  assert.equal(creado.mensaje, "Buenas tardes");
  assert.equal(repositorio.mensajesExternos.length, 1);
});

test("el administrador del mensaje siempre proviene de la sesión", async () => {
  const repositorio = crearRepositorio();
  const servicio = new ChatService(repositorio);
  await servicio.crearMensajeAdministrador(
    10,
    { mensaje: "Respuesta", idAdministrador: 999 },
    { idAdministrador: 7 }
  );

  assert.equal(repositorio.mensajesAdministrador[0].idAdministrador, 7);
  assert.equal(repositorio.mensajesAdministrador[0].idConversacion, 10);
});

test("normaliza los estados permitidos para cerrar y reabrir", async () => {
  const repositorio = crearRepositorio();
  const servicio = new ChatService(repositorio);

  await servicio.actualizarEstado(
    10,
    { estado: "cerrado" },
    { idAdministrador: 7 }
  );
  await servicio.actualizarEstado(
    10,
    { estado: "en atencion" },
    { idAdministrador: 7 }
  );

  assert.equal(repositorio.cambiosEstado[0].estadoDestino, "Cerrado");
  assert.equal(repositorio.cambiosEstado[1].estadoDestino, "En atención");
});

test("archiva y elimina conversaciones usando la sesión administrativa", async () => {
  const repositorio = crearRepositorio();
  const auditorias = [];
  const servicio = new ChatService(repositorio, {
    async registrarSinInterrumpir(datos) {
      auditorias.push(datos);
    }
  });

  const archivada = await servicio.archivarConversacion(
    10,
    { idAdministrador: 7 }
  );
  const eliminada = await servicio.eliminarConversacion(
    10,
    { idAdministrador: 7 }
  );

  assert.deepEqual(repositorio.archivados[0], {
    idConversacion: 10,
    idAdministrador: 7
  });
  assert.equal(archivada.estado, "Archivado");
  assert.deepEqual(repositorio.eliminados, [10]);
  assert.equal(eliminada.mensajesEliminados, 4);
  assert.equal(auditorias[0].codigoAccion, "CAMBIAR_ESTADO");
  assert.equal(auditorias[1].codigoAccion, "ELIMINAR");
});
