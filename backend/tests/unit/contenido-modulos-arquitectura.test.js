const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { contenidoServices } = require(
  "../../src/container/dependency-container"
);

const casos = [
  ["boletines", "BoletinService", "SqlBoletinRepository"],
  ["calendario", "CalendarioService", "SqlCalendarioRepository"],
  ["biblioteca", "BibliotecaService", "SqlBibliotecaRepository"],
  ["docentes", "DocenteService", "SqlDocenteRepository"],
  ["horarios", "HorarioService", "SqlHorarioRepository"],
  ["tramites", "TramiteService", "SqlTramiteRepository"],
  ["recursos-apoyo", "RecursoApoyoService", "SqlRecursoApoyoRepository"],
  ["galeria", "GaleriaService", "SqlGaleriaRepository"]
];

test("cada módulo versionado usa su servicio y repositorio propios", () => {
  casos.forEach(([modulo, servicio, repositorio]) => {
    assert.equal(
      contenidoServices[modulo].constructor.name,
      servicio,
      `${modulo} debe usar ${servicio}`
    );
    assert.equal(
      contenidoServices[modulo].repositorio.constructor.name,
      repositorio,
      `${modulo} debe usar ${repositorio}`
    );
  });
});

test("cada módulo expone un archivo de rutas propio", () => {
  const rutas = [
    "boletines/routes/boletin.routes",
    "calendario/routes/calendario.routes",
    "biblioteca/routes/biblioteca.routes",
    "docentes/routes/docente.routes",
    "horarios/routes/horario.routes",
    "tramites/routes/tramite.routes",
    "recursos-apoyo/routes/recurso-apoyo.routes",
    "galeria/routes/galeria.routes"
  ];

  rutas.forEach((ruta) => {
    const router = require(`../../src/modules/${ruta}`);
    assert.equal(typeof router, "function", `${ruta} debe exportar un router`);

    const archivo = path.resolve(__dirname, `../../src/modules/${ruta}.js`);
    const codigo = fs.readFileSync(archivo, "utf8");
    assert.doesNotMatch(
      codigo,
      /crearContenidoRoutes/,
      `${ruta} debe declarar sus rutas directamente`
    );
  });
});

test("cada módulo declara su controlador sin sustituirlo por el genérico", () => {
  const controladores = [
    "boletines/controllers/boletin.controller.js",
    "calendario/controllers/calendario.controller.js",
    "biblioteca/controllers/biblioteca.controller.js",
    "docentes/controllers/docente.controller.js",
    "horarios/controllers/horario.controller.js",
    "tramites/controllers/tramite.controller.js",
    "recursos-apoyo/controllers/recurso-apoyo.controller.js",
    "galeria/controllers/galeria.controller.js"
  ];

  controladores.forEach((ruta) => {
    const codigo = fs.readFileSync(
      path.resolve(__dirname, `../../src/modules/${ruta}`),
      "utf8"
    );
    assert.doesNotMatch(codigo, /ContenidoController/);
    assert.match(codigo, /async listarPublico/);
    assert.match(codigo, /async guardarElemento/);
  });
});
