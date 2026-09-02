const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const BoletinService = require(
  "../../src/modules/boletines/services/boletin.service"
);
const correoCompartido = require(
  "../../src/shared/services/correo.service"
);

function destinatario(id, correo, fuentes = {}) {
  return {
    idDestinatario: id,
    nombreCompleto: `Persona ${id}`,
    correo,
    activo: true,
    categorias: [],
    porCategoria: Boolean(fuentes.categoria),
    porIndividual: Boolean(fuentes.individual),
    porBusqueda: Boolean(fuentes.busqueda)
  };
}

test("normaliza un destinatario multiclase y delega la relación N:M", async () => {
  let guardado;
  const repositorio = {
    guardarDestinatarioCorreo: async (datos) => {
      guardado = datos;
      return { idDestinatario: 1, ...datos };
    }
  };
  const servicio = new BoletinService(repositorio, null, {
    correoEsValido: (correo) => correo.includes("@")
  });

  await servicio.guardarDestinatarioCorreo({
    nombreCompleto: "  Ana Ejemplo  ",
    correo: "ANA@EJEMPLO.COM",
    idsCategorias: [1, 3, 1],
    activo: true
  }, { idAdministrador: 9 });

  assert.equal(guardado.nombreCompleto, "Ana Ejemplo");
  assert.equal(guardado.correo, "ana@ejemplo.com");
  assert.deepEqual(guardado.idsCategorias, [1, 3]);
  assert.equal(guardado.idAdministrador, 9);
});

test("rechaza correo inválido y destinatarios sin categoría", async () => {
  const servicio = new BoletinService({}, null, {
    correoEsValido: () => false
  });
  await assert.rejects(
    servicio.guardarDestinatarioCorreo({
      nombreCompleto: "Persona",
      correo: "incorrecto",
      idsCategorias: [1]
    }),
    (error) => error.codigo === "CORREO_DESTINATARIO_INVALIDO"
  );

  const servicioCorreoValido = new BoletinService({}, null, {
    correoEsValido: () => true
  });
  await assert.rejects(
    servicioCorreoValido.guardarDestinatarioCorreo({
      nombreCompleto: "Persona",
      correo: "persona@ejemplo.com",
      idsCategorias: []
    }),
    (error) => error.codigo === "CATEGORIA_DESTINATARIO_REQUERIDA"
  );
});

test("combina selecciones y vuelve a deduplicar por correo normalizado", async () => {
  const repositorio = {
    resolverSeleccionCorreo: async () => [
      destinatario(1, "persona@ejemplo.com", { categoria: true }),
      destinatario(2, "PERSONA@EJEMPLO.COM", { individual: true }),
      destinatario(3, "otra@ejemplo.com", { busqueda: true })
    ]
  };
  const servicio = new BoletinService(repositorio, null, {});
  const resultado = await servicio.resolverSeleccionCorreo({
    idsCategorias: [1, 2],
    idsDestinatarios: [2, 3],
    criteriosBusqueda: ["gmail.com", "GMAIL.COM"]
  });

  assert.equal(resultado.resumen.totalUnicos, 2);
  assert.deepEqual(
    resultado.destinatarios.map((item) => item.correo),
    ["persona@ejemplo.com", "otra@ejemplo.com"]
  );
  assert.deepEqual(resultado.seleccion.criteriosBusqueda, ["gmail.com"]);
});

test("registra el envío antes de procesar y continúa después de un fallo", async () => {
  const eventos = [];
  const resultados = [];
  const personas = [
    destinatario(1, "uno@ejemplo.com", { categoria: true }),
    destinatario(2, "dos@ejemplo.com", { individual: true }),
    destinatario(3, "tres@ejemplo.com", { busqueda: true })
  ];
  const repositorio = {
    obtenerBoletinCorreo: async () => ({
      idElemento: 21,
      titulo: "Matrícula 2027",
      descripcion: "Información institucional",
      categoria: "circular",
      fechaInicio: "2026-08-20T12:00:00.000Z",
      url: "https://example.com/boletin"
    }),
    obtenerUltimoEnvioBoletin: async () => null,
    resolverSeleccionCorreo: async () => personas,
    crearEnvioBoletin: async (datos) => {
      eventos.push("registro");
      assert.equal(datos.destinatarios.length, 3);
      return 44;
    },
    cambiarEstadoEnvio: async () => eventos.push("enviando"),
    registrarResultadoDestinatario: async (resultado) => {
      resultados.push(resultado);
    },
    finalizarEnvio: async () => ({
      idEnvio: 44,
      estado: "PARCIAL",
      cantidadDestinatarios: 3,
      cantidadEnviados: 2,
      cantidadFallidos: 1
    })
  };
  const correo = {
    enviarBoletin: async ({ destinatario: correoDestino }) => {
      eventos.push(`correo:${correoDestino}`);
      if (correoDestino === "dos@ejemplo.com") {
        const error = new Error("detalle SMTP que no debe persistirse");
        error.codigo = "ERROR_ENVIO_CORREO";
        throw error;
      }
    }
  };
  const servicio = new BoletinService(repositorio, null, correo);

  const envio = await servicio.enviarBoletinCorreo({
    idElementoBoletin: 21,
    seleccion: { idsCategorias: [1], idsDestinatarios: [2] }
  }, { idAdministrador: 5 });

  assert.deepEqual(eventos.slice(0, 2), ["registro", "enviando"]);
  assert.equal(resultados.length, 3);
  assert.equal(resultados.filter((item) => item.estado === "ENVIADO").length, 2);
  assert.equal(resultados.filter((item) => item.estado === "FALLIDO").length, 1);
  assert.doesNotMatch(resultados.find((item) => item.estado === "FALLIDO").mensajeError, /detalle SMTP/);
  assert.equal(envio.estado, "PARCIAL");
});

test("la plantilla de boletín escapa HTML y reutiliza enviarCorreo", async () => {
  const original = correoCompartido.enviarCorreo;
  let mensaje;
  correoCompartido.enviarCorreo = async (datosCorreo) => {
    mensaje = datosCorreo;
    return { enviado: true };
  };
  try {
    await correoCompartido.enviarBoletin({
      destinatario: "prueba@ejemplo.com",
      asunto: "Asunto institucional",
      boletin: {
        titulo: "<script>alert(1)</script>",
        tipo: "Circular",
        descripcion: "Texto <img src=x onerror=alert(1)>",
        fechaInicio: "2026-08-20T12:00:00.000Z",
        url: "javascript:alert(1)"
      }
    });
  } finally {
    correoCompartido.enviarCorreo = original;
  }

  assert.equal(mensaje.destinatario, "prueba@ejemplo.com");
  assert.match(mensaje.texto, /Liceo Hernán Vargas Ramírez/);
  assert.match(mensaje.html, /&lt;script&gt;/);
  assert.doesNotMatch(mensaje.html, /<script>/);
  assert.doesNotMatch(mensaje.html, /javascript:/);
});

test("Gestión de correos expone directorio, selección combinable e historial", () => {
  const raiz = path.resolve(__dirname, "../../..");
  const html = fs.readFileSync(
    path.join(raiz, "panel-administrativo/pages/gestion-contenido/gestionar.html"),
    "utf8"
  );
  const interfaz = fs.readFileSync(
    path.join(raiz, "panel-administrativo/js/modules/boletines-correo.js"),
    "utf8"
  );
  const gestion = fs.readFileSync(
    path.join(raiz, "panel-administrativo/js/modules/gestion-contenido-admin.js"),
    "utf8"
  );

  assert.match(html, /id="gestionCorreosBoletines"/);
  assert.match(html, /Historial de envíos/);
  assert.match(html, /Nuevo destinatario/);
  assert.match(interfaz, /Seleccionar todas las categorías/);
  assert.match(interfaz, /Seleccionar los.*resultados encontrados/);
  assert.match(interfaz, /idsExcluidos/);
  assert.match(interfaz, /Confirmar envío del boletín/);
  assert.match(gestion, /BoletinesCorreoAdmin\?\.antesDeGuardar/);
  assert.match(gestion, /BoletinesCorreoAdmin\?\.despuesDeGuardar/);
});

test("usa las cinco tablas existentes y conserva un solo transporter", () => {
  const raiz = path.resolve(__dirname, "../..");
  const repositorio = fs.readFileSync(
    path.join(raiz, "src/modules/boletines/repositories/sql-boletin.repository.js"),
    "utf8"
  );
  const correo = fs.readFileSync(
    path.join(raiz, "src/shared/services/correo.service.js"),
    "utf8"
  );
  [
    "categorias_destinatario_correo",
    "destinatarios_correo",
    "destinatario_correo_categoria",
    "boletin_envios",
    "boletin_envio_destinatarios"
  ].forEach((tabla) => assert.match(repositorio, new RegExp(`dbo\\.${tabla}`)));
  assert.doesNotMatch(repositorio, /CREATE\s+TABLE/i);
  assert.equal((correo.match(/nodemailer\.createTransport/g) || []).length, 1);
  assert.match(correo, /async enviarBoletin\(/);
  assert.match(correo, /return this\.enviarCorreo\(/);
});
