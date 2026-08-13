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
