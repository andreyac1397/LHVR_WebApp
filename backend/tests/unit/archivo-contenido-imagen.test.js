const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const ArchivoService = require(
  "../../src/modules/archivos/services/archivo.service"
);
const ContenidoService = require(
  "../../src/shared/content-management/contenido.service"
);

test("registra una imagen y conserva su idArchivo al guardar contenido", async () => {
  const raizUploads = path.resolve(process.cwd(), "uploads");
  await fs.mkdir(raizUploads, { recursive: true });
  const directorioPrueba = await fs.mkdtemp(
    path.join(raizUploads, "prueba-imagen-")
  );
  const rutaImagen = path.join(directorioPrueba, "docente-prueba.jpg");
  const contenidoImagen = Buffer.from("imagen-de-prueba");
  await fs.writeFile(rutaImagen, contenidoImagen);

  const repositorioArchivo = {
    async registrarArchivo(datos) {
      return {
        ...datos,
        idArchivo: 77,
        activo: true,
        archivoExistente: false
      };
    }
  };
  const auditoria = { async registrarSinInterrumpir() {} };
  const servicioArchivo = new ArchivoService(repositorioArchivo, auditoria);

  try {
    const registrado = await servicioArchivo.registrarImagenPagina(
      {
        path: rutaImagen,
        originalname: "docente-prueba.jpg",
        filename: "docente-prueba.jpg",
        mimetype: "image/jpeg",
        size: contenidoImagen.length
      },
      { textoAlternativo: "Fotografía de prueba" },
      { idAdministrador: 1 },
      {}
    );

    assert.equal(registrado.archivo.idArchivo, 77);
    assert.match(
      registrado.archivo.rutaRelativa,
      /^\/uploads\/prueba-imagen-/
    );

    const repositorioContenido = {
      async listarElementos() { return []; },
      async guardarElemento(datos) { return datos; }
    };
    const servicioContenido = new ContenidoService(
      "DOCENTES",
      repositorioContenido
    );
    const docente = await servicioContenido.guardarElemento({
      idColeccion: 1,
      titulo: "Docente de prueba",
      idArchivo: registrado.archivo.idArchivo,
      datos: { departamento: "Ciencias" }
    });

    assert.equal(docente.idArchivo, 77);
  } finally {
    await fs.rm(directorioPrueba, { recursive: true, force: true });
  }
});
