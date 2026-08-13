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

test("los enlaces HTML del panel no apuntan a pantallas vacías", () => {
  const raizPanel = path.join(raiz, "panel-administrativo");
  const pendientes = [raizPanel];
  const archivosHtml = [];

  while (pendientes.length) {
    const directorio = pendientes.pop();
    for (const entrada of fs.readdirSync(directorio, { withFileTypes: true })) {
      const destino = path.join(directorio, entrada.name);
      if (entrada.isDirectory()) pendientes.push(destino);
      if (entrada.isFile() && entrada.name.endsWith(".html")) archivosHtml.push(destino);
    }
  }

  for (const archivo of archivosHtml.filter((item) => fs.statSync(item).size > 0)) {
    const codigo = fs.readFileSync(archivo, "utf8");
    const enlaces = [...codigo.matchAll(/href\s*=\s*["']([^"']+\.html(?:[?#][^"']*)?)["']/gi)]
      .map((coincidencia) => coincidencia[1])
      .filter((href) => !/^(?:https?:|\/\/)/i.test(href));

    for (const href of enlaces) {
      const destino = path.resolve(path.dirname(archivo), href.split(/[?#]/)[0]);
      assert.ok(fs.existsSync(destino), `No existe el enlace ${href} en ${path.relative(raiz, archivo)}`);
      assert.ok(fs.statSync(destino).size > 0, `El enlace ${href} apunta a una pantalla vacía.`);
    }
  }
});

test("el layout revela el contenedor raíz después de construir el panel", () => {
  const archivo = path.join(
    raiz,
    "panel-administrativo/js/components/layout-admin.js"
  );
  const codigo = fs.readFileSync(archivo, "utf8");

  assert.match(
    codigo,
    /contenidoPagina\.removeAttribute\(\s*["']hidden["']\s*\)/,
    "El layout debe mostrar el contenedor raíz al terminar de construirse."
  );
});
