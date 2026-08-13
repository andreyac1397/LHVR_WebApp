const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const raiz = path.resolve(__dirname, "../../..");

test("todas las rutas del menú administrativo existen y tienen contenido", () => {
  const archivoMenu = path.join(raiz, "panel-administrativo/js/components/barra-lateral.js");
  const codigo = fs.readFileSync(archivoMenu, "utf8");
  const rutas = [...codigo.matchAll(/["'](pages\/[^"']+\.html(?:\?[^"']*)?)["']/g)]
    .map((coincidencia) => coincidencia[1].split("?")[0]);

  assert.ok(rutas.length >= 10, "El menú debe contener sus rutas navegables.");
  for (const ruta of new Set(rutas)) {
    const destino = path.join(raiz, "panel-administrativo", ruta);
    assert.ok(fs.existsSync(destino), `No existe la ruta del menú: ${ruta}`);
    assert.ok(fs.statSync(destino).size > 0, `La ruta del menú está vacía: ${ruta}`);
  }
});

test("las páginas públicas principales y sus scripts conectores existen", () => {
  const archivos = [
    "frontend-publico/pages/calendario.html",
    "frontend-publico/pages/documentos-importantes.html",
    "frontend-publico/pages/contacto-ubicacion.html",
    "frontend-publico/pages/FormularioBibliocra.html",
    "frontend-publico/js/calendario.js",
    "frontend-publico/js/horarios.js",
    "frontend-publico/js/contacto.js",
    "frontend-publico/js/solicitud-bibliocra.js"
  ];
  for (const relativo of archivos) {
    const archivo = path.join(raiz, relativo);
    assert.ok(fs.existsSync(archivo), `Falta el archivo público ${relativo}`);
    assert.ok(fs.statSync(archivo).size > 0, `El archivo público está vacío: ${relativo}`);
  }
});
