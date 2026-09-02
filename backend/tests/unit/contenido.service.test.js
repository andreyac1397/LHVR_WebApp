const test = require("node:test");
const assert = require("node:assert/strict");

const ContenidoService = require(
  "../../src/shared/content-management/contenido.service"
);

function crearRepositorio() {
  return {
    importaciones: [],
    async obtenerColeccionPublicada() {
      return {
        idColeccion: 1,
        modulo: "BOLETINES",
        publicada: true,
        estado: "PUBLICADO"
      };
    },
    async listarElementos() {
      return [
        {
          idElemento: 1,
          titulo: "Elemento",
          estado: "PUBLICADO"
        }
      ];
    },
    async listarColecciones() {
      return [];
    },
    async importarColeccion(datos) {
      this.importaciones.push(datos);
      return {
        idColeccion: 10,
        cantidadGuardada: datos.elementos.length,
        publicada: datos.publicar
      };
    }
  };
}

test("lista únicamente la colección publicada", async () => {
  const servicio = new ContenidoService(
    "BOLETINES",
    crearRepositorio()
  );
  const resultado = await servicio.listarPublico({});

  assert.equal(resultado.coleccion.idColeccion, 1);
  assert.equal(resultado.elementos.length, 1);
});

test("cada importación sin clave crea una versión diferente", async () => {
  const repositorio = crearRepositorio();
  const servicio = new ContenidoService(
    "BOLETINES",
    repositorio
  );

  await servicio.importar({
    nombre: "Primera",
    anio: 2026,
    elementos: [{ titulo: "A" }]
  });

  await new Promise((resolve) => setTimeout(resolve, 2));

  await servicio.importar({
    nombre: "Segunda",
    anio: 2026,
    elementos: [{ titulo: "B" }]
  });

  assert.notEqual(
    repositorio.importaciones[0].clave,
    repositorio.importaciones[1].clave
  );
});

test("rechaza importaciones vacías", async () => {
  const servicio = new ContenidoService(
    "BOLETINES",
    crearRepositorio()
  );

  await assert.rejects(
    servicio.importar({ elementos: [] }),
    (error) => error.codigo === "IMPORTACION_VACIA"
  );
});

test("rechaza registros duplicados dentro de una importación", async () => {
  const servicio = new ContenidoService(
    "CALENDARIO",
    crearRepositorio()
  );

  await assert.rejects(
    servicio.importar({
      anio: 2026,
      elementos: [
        { id: "MEP-1", titulo: "Actividad", fechaInicio: "2026-08-01" },
        { id: "MEP-1", titulo: "Actividad repetida", fechaInicio: "2026-08-01" }
      ]
    }),
    (error) => error.codigo === "ELEMENTO_IMPORTACION_DUPLICADO"
  );
});

test("bloquea protocolos inseguros en enlaces de contenido", () => {
  const servicio = new ContenidoService("BOLETINES", crearRepositorio());
  [
    "javascript:alert(1)",
    "data:text/html,prueba",
    "file:///etc/passwd",
    "//servidor.example/recurso"
  ].forEach((url) => {
    assert.throws(
      () => servicio.normalizarElemento({ titulo: "Prueba", url }),
      (error) => error.codigo === "URL_CONTENIDO_INVALIDA"
    );
  });
});

test("acepta enlaces web y rutas locales de contenido", () => {
  const servicio = new ContenidoService("BOLETINES", crearRepositorio());

  [
    "https://www.mep.go.cr/documento.pdf",
    "/archivos/documento.pdf",
    "../assets/documento.pdf",
    "mailto:persona@mep.go.cr"
  ].forEach((url) => {
    assert.equal(
      servicio.normalizarElemento({ titulo: "Prueba", url }).url,
      url
    );
  });
});

test("conserva Recordatorio en los datos persistidos de Boletines", async () => {
  const repositorio = crearRepositorio();
  repositorio.listarElementos = async () => [];
  repositorio.guardarElemento = async (datos) => datos;
  const servicio = new ContenidoService("BOLETINES", repositorio);

  const resultado = await servicio.guardarElemento({
    idColeccion: 1,
    titulo: "Recordatorio de matrícula",
    estado: "PUBLICADO",
    datos: { categoria: "recordatorio" }
  });

  assert.equal(resultado.datos.categoria, "recordatorio");
});

test("elimina definitivamente un elemento existente", async () => {
  const repositorio = crearRepositorio();
  repositorio.eliminarElemento = async (modulo, idElemento) => {
    assert.equal(modulo, "HORARIOS");
    assert.equal(idElemento, 15);
    return true;
  };
  const servicio = new ContenidoService("HORARIOS", repositorio);

  const resultado = await servicio.eliminarElemento(15);

  assert.deepEqual(resultado, { idElemento: 15, eliminado: true });
});

test("elimina una version y comunica si era la publicada", async () => {
  const repositorio = crearRepositorio();
  repositorio.eliminarColeccion = async () => ({
    eliminada: true,
    publicada: true
  });
  const servicio = new ContenidoService("HORARIOS", repositorio);

  const resultado = await servicio.eliminarColeccion(4);

  assert.equal(resultado.idColeccion, 4);
  assert.equal(resultado.eliminada, true);
  assert.equal(resultado.eraPublicada, true);
});

test("rechaza un orden ocupado en los módulos de tarjetas", async () => {
  const repositorio = crearRepositorio();
  repositorio.listarElementos = async () => ([
    { idElemento: 8, titulo: "Circular existente", orden: 2, estado: "PUBLICADO" }
  ]);
  repositorio.guardarElemento = async () => {
    throw new Error("No debe guardar cuando el orden está ocupado.");
  };
  const servicio = new ContenidoService("BOLETINES", repositorio);

  await assert.rejects(
    servicio.guardarElemento({
      idColeccion: 1,
      titulo: "Nuevo boletín",
      orden: 2,
      estado: "PUBLICADO"
    }),
    (error) => error.codigo === "ORDEN_CONTENIDO_OCUPADO" && error.statusCode === 409
  );
});
