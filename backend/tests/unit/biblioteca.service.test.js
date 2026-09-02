const test = require("node:test");
const assert = require("node:assert/strict");

const SolicitudBibliocraService = require(
  "../../src/modules/biblioteca/services/solicitud-bibliocra.service"
);

function datosValidos() {
  return {
    nombreSolicitante: "Ana Estudiante",
    identificacionSolicitante: "3-0123-0456",
    tipoSolicitante: "estudiante",
    correo: "ana@ejemplo.test",
    telefono: "8888-8888",
    nivelSeccion: "8-3",
    nombreMaterial: "El Principito",
    autor: "Antoine de Saint-Exupéry",
    signatura: "843.9 S137p",
    fechaSolicitud: "2026-08-20",
    fechaDevolucion: "2026-08-28",
    tipoPrestamo: "hogar",
    confirmacion: true,
    sitioWeb: ""
  };
}

function crearRepositorio() {
  return {
    creadas: [],
    actualizaciones: [],
    destinatarios: [
      {
        idDestinatario: 1,
        nombre: "Biblioteca",
        tipo: "DOCENTE",
        correo: "biblioteca@ejemplo.test"
      },
      {
        idDestinatario: 2,
        nombre: "Bibliotecólogo",
        tipo: "ADMINISTRADOR",
        correo: "bibliotecologo@ejemplo.test"
      }
    ],
    async crear(datos) {
      this.creadas.push(datos);
      return { idSolicitudBibliocra: 15 };
    },
    async listarDestinatarios() {
      return this.destinatarios;
    },
    async agregarDestinatario(datos) {
      const destinatario = {
        idDestinatario: this.destinatarios.length + 1,
        nombre: datos.nombre,
        tipo: datos.tipo,
        correo: datos.correo
      };
      this.destinatarios.push(destinatario);
      return destinatario;
    },
    async eliminarDestinatario(id) {
      const cantidad = this.destinatarios.length;
      this.destinatarios = this.destinatarios.filter(
        (item) => item.idDestinatario !== id
      );
      return cantidad !== this.destinatarios.length;
    },
    async actualizar(datos) {
      this.actualizaciones.push(datos);
      return {
        actualizado: true,
        cambioEstado: true,
        idSolicitudBibliocra: datos.idSolicitudBibliocra,
        nombreSolicitante: "Ana Estudiante",
        correo: "ana@ejemplo.test",
        idEstadoSolicitud: datos.idEstadoSolicitud,
        estado: "Aprobada",
        descripcionEstado: "Solicitud aprobada.",
        observacionesInternas: datos.observacionesInternas,
        nombreMaterial: "El Principito"
      };
    }
  };
}

test("registra la solicitud antes de notificar a los destinatarios", async () => {
  const repositorio = crearRepositorio();
  const orden = [];
  repositorio.crear = async (datos) => {
    orden.push("guardar");
    repositorio.creadas.push(datos);
    return { idSolicitudBibliocra: 15 };
  };
  const correos = [];
  const correoService = {
    async enviarCorreo(datos) {
      orden.push("correo");
      correos.push(datos);
      return { enviado: true };
    }
  };
  const servicio = new SolicitudBibliocraService(
    repositorio,
    null,
    correoService
  );

  const resultado = await servicio.crear(datosValidos());

  assert.equal(resultado.idSolicitudBibliocra, 15);
  assert.deepEqual(orden, ["guardar", "correo", "correo", "correo"]);
  assert.equal(correos.length, 3);
  assert.equal(correos[0].asunto, "Nueva solicitud BiblioCRA");
  assert.match(correos[0].texto, /El Principito/);
  assert.match(correos[0].texto, /ana@ejemplo\.test/);
  assert.equal(correos[2].destinatario, "ana@ejemplo.test");
  assert.equal(correos[2].asunto, "Solicitud BiblioCRA recibida #15");
  assert.match(correos[2].texto, /pendiente de revisión/i);
  assert.deepEqual(resultado.notificacion, {
    configurados: 2,
    enviados: 2,
    fallidos: 0
  });
  assert.equal(resultado.confirmacionSolicitanteEnviada, true);
});

test("no intenta enviar correo cuando el registro falla", async () => {
  const repositorio = crearRepositorio();
  repositorio.crear = async () => {
    throw new Error("Fallo de persistencia");
  };
  let enviados = 0;
  const servicio = new SolicitudBibliocraService(
    repositorio,
    null,
    {
      async enviarCorreo() {
        enviados += 1;
      }
    }
  );

  await assert.rejects(
    servicio.crear(datosValidos()),
    /Fallo de persistencia/
  );
  assert.equal(enviados, 0);
});

test("registra normalmente cuando no hay destinatarios", async () => {
  const repositorio = crearRepositorio();
  repositorio.destinatarios = [];
  let enviados = 0;
  const servicio = new SolicitudBibliocraService(
    repositorio,
    null,
    {
      async enviarCorreo() {
        enviados += 1;
      }
    }
  );

  const resultado = await servicio.crear(datosValidos());

  assert.equal(resultado.idSolicitudBibliocra, 15);
  assert.equal(repositorio.creadas.length, 1);
  assert.equal(enviados, 1);
  assert.deepEqual(resultado.notificacion, {
    configurados: 0,
    enviados: 0,
    fallidos: 0
  });
  assert.equal(resultado.confirmacionSolicitanteEnviada, true);
});

test("un fallo de correo no revierte la solicitud registrada", async () => {
  const repositorio = crearRepositorio();
  const servicio = new SolicitudBibliocraService(
    repositorio,
    null,
    {
      async enviarCorreo() {
        throw new Error("SMTP no disponible");
      }
    }
  );

  const resultado = await servicio.crear(datosValidos());

  assert.equal(repositorio.creadas.length, 1);
  assert.equal(resultado.idSolicitudBibliocra, 15);
  assert.deepEqual(resultado.notificacion, {
    configurados: 2,
    enviados: 0,
    fallidos: 2
  });
  assert.equal(resultado.confirmacionSolicitanteEnviada, false);
});

test("notifica al solicitante cuando cambia el estado", async () => {
  const repositorio = crearRepositorio();
  const correos = [];
  const servicio = new SolicitudBibliocraService(
    repositorio,
    null,
    {
      async enviarCorreo(datos) {
        correos.push(datos);
        return { enviado: true };
      }
    }
  );

  const resultado = await servicio.actualizar(
    15,
    {
      idEstadoSolicitud: 3,
      observacionesInternas: "Puede retirar el material mañana."
    },
    { idAdministrador: 7 }
  );

  assert.equal(resultado.cambioEstado, true);
  assert.equal(resultado.notificacionSolicitanteEnviada, true);
  assert.equal(correos.length, 1);
  assert.equal(correos[0].destinatario, "ana@ejemplo.test");
  assert.equal(correos[0].asunto, "Solicitud BiblioCRA #15: Aprobada");
  assert.match(correos[0].texto, /Puede retirar el material mañana\./);
  assert.match(correos[0].html, /Puede retirar el material mañana\./);
});

test("no envía otro correo si el estado no cambió", async () => {
  const repositorio = crearRepositorio();
  repositorio.actualizar = async () => ({
    actualizado: true,
    cambioEstado: false
  });
  let correos = 0;
  const servicio = new SolicitudBibliocraService(
    repositorio,
    null,
    {
      async enviarCorreo() {
        correos += 1;
      }
    }
  );

  const resultado = await servicio.actualizar(
    15,
    { idEstadoSolicitud: 3, observacionesInternas: "Sin cambios" },
    { idAdministrador: 7 }
  );

  assert.equal(resultado.cambioEstado, false);
  assert.equal(resultado.notificacionSolicitanteEnviada, false);
  assert.equal(correos, 0);
});

test("un fallo de correo no revierte el cambio de estado", async () => {
  const repositorio = crearRepositorio();
  const servicio = new SolicitudBibliocraService(
    repositorio,
    null,
    {
      async enviarCorreo() {
        throw new Error("SMTP no disponible");
      }
    }
  );

  const resultado = await servicio.actualizar(
    15,
    { idEstadoSolicitud: 4, observacionesInternas: "No disponible" },
    { idAdministrador: 7 }
  );

  assert.equal(resultado.actualizado, true);
  assert.equal(resultado.notificacionSolicitanteEnviada, false);
  assert.equal(repositorio.actualizaciones.length, 1);
});

test("valida todos los campos obligatorios del formulario público", async () => {
  const servicio = new SolicitudBibliocraService(crearRepositorio());

  await assert.rejects(
    servicio.crear({
      ...datosValidos(),
      correo: ""
    }),
    (error) => error.codigo === "CAMPO_BIBLIOCRA_REQUERIDO"
  );
  await assert.rejects(
    servicio.crear({
      ...datosValidos(),
      correo: "correo-invalido"
    }),
    (error) => error.codigo === "CORREO_BIBLIOCRA_INVALIDO"
  );
  await assert.rejects(
    servicio.crear({
      ...datosValidos(),
      signatura: ""
    }),
    (error) => error.codigo === "CAMPO_BIBLIOCRA_REQUERIDO"
  );
  await assert.rejects(
    servicio.crear({
      ...datosValidos(),
      fechaDevolucion: "2026-08-19"
    }),
    (error) => error.codigo === "FECHAS_BIBLIOCRA_INCONSISTENTES"
  );
  await assert.rejects(
    servicio.crear({
      ...datosValidos(),
      confirmacion: false
    }),
    (error) => error.codigo === "CONFIRMACION_BIBLIOCRA_REQUERIDA"
  );
});

test("impide destinatarios duplicados y un cuarto correo", async () => {
  const repositorio = crearRepositorio();
  const servicio = new SolicitudBibliocraService(repositorio);

  await assert.rejects(
    servicio.agregarDestinatario({
      nombre: "Duplicado",
      tipo: "DOCENTE",
      correo: "BIBLIOTECA@EJEMPLO.TEST"
    }),
    (error) =>
      error.codigo === "DESTINATARIO_BIBLIOCRA_DUPLICADO" &&
      error.statusCode === 409
  );

  repositorio.destinatarios.push({
    idDestinatario: 3,
    nombre: "Dirección",
    tipo: "ADMINISTRADOR",
    correo: "direccion@ejemplo.test"
  });

  await assert.rejects(
    servicio.agregarDestinatario({
      nombre: "Cuarto",
      tipo: "SECRETARIA",
      correo: "cuarto@ejemplo.test"
    }),
    (error) =>
      error.codigo === "MAXIMO_DESTINATARIOS_BIBLIOCRA" &&
      error.statusCode === 409
  );
});

test("agrega y elimina destinatarios con operaciones simples", async () => {
  const repositorio = crearRepositorio();
  repositorio.destinatarios = [];
  const servicio = new SolicitudBibliocraService(repositorio);

  const agregado = await servicio.agregarDestinatario({
    nombre: "  Nuevo destinatario ",
    tipo: " secretaria ",
    correo: "  NUEVO@EJEMPLO.TEST "
  });
  assert.equal(agregado.nombre, "Nuevo destinatario");
  assert.equal(agregado.correo, "nuevo@ejemplo.test");
  assert.equal(agregado.tipo, "SECRETARIA");

  const listado = await servicio.listarDestinatarios();
  assert.equal(listado.destinatarios.length, 1);
  assert.equal(listado.disponibles, 2);

  const eliminado = await servicio.eliminarDestinatario(
    agregado.idDestinatario
  );
  assert.equal(eliminado.eliminado, true);
});

test("valida nombre, correo y tipo de cada destinatario", async () => {
  const repositorio = crearRepositorio();
  repositorio.destinatarios = [];
  const servicio = new SolicitudBibliocraService(repositorio);

  await assert.rejects(
    servicio.agregarDestinatario({
      nombre: "",
      correo: "destino@ejemplo.test",
      tipo: "DOCENTE"
    }),
    (error) => error.codigo === "CAMPO_BIBLIOCRA_REQUERIDO"
  );
  await assert.rejects(
    servicio.agregarDestinatario({
      nombre: "Destino",
      correo: "destino@ejemplo.test",
      tipo: "FUNCIONARIO"
    }),
    (error) => error.codigo === "TIPO_DESTINATARIO_BIBLIOCRA_INVALIDO"
  );
});
