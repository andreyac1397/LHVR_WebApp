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
