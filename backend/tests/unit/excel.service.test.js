const test = require("node:test");
const assert = require("node:assert/strict");

const ExcelReaderService = require(
  "../../src/integrations/excel/excel-reader.service"
);
const ExcelWriterService = require(
  "../../src/integrations/excel/excel-writer.service"
);

test("crea y vuelve a leer la plantilla de horarios", () => {
  const archivo = new ExcelWriterService().crear([
    ["Sección", "Profesor guía", "Lección", "Horario", "Miércoles"],
    ["7-1", "Ana", "1", "07:00-07:40", "Matemática"]
  ]);
  const resultado = new ExcelReaderService().leer(archivo);

  assert.deepEqual(resultado.encabezados, [
    "seccion",
    "profesor_guia",
    "lec",
    "horas",
    "miercoles"
  ]);
  assert.equal(resultado.filas[0].seccion, "7-1");
  assert.equal(resultado.filas[0].miercoles, "Matemática");
});

test("crea un libro de horarios con una hoja por seccion", () => {
  const escritor = new ExcelWriterService();
  const lector = new ExcelReaderService();
  const archivo = escritor.crearLibro([
    {
      nombre: "Sección 7-1",
      filas: [
        ["Sección", "Lección", "Lunes", "Estado"],
        ["7-1", "1", "Matemática", "PUBLICADO"]
      ]
    },
    {
      nombre: "Sección 8-2",
      filas: [
        ["Sección", "Lección", "Lunes", "Estado"],
        ["8-2", "1", "Español", "ARCHIVADO"]
      ]
    }
  ]);
  const archivos = lector.extraerArchivosZip(archivo);
  const libro = archivos.get("xl/workbook.xml").toString("utf8");

  assert.ok(archivos.has("xl/worksheets/sheet1.xml"));
  assert.ok(archivos.has("xl/worksheets/sheet2.xml"));
  assert.match(libro, /name="Sección 7-1"/);
  assert.match(libro, /name="Sección 8-2"/);

  const primeraHoja = lector.leer(archivo);
  assert.equal(primeraHoja.filas[0].seccion, "7-1");
  assert.equal(primeraHoja.filas[0].estado, "PUBLICADO");
});
