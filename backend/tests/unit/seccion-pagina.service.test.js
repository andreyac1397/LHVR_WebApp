const test = require("node:test");
const assert = require("node:assert/strict");

const SeccionPaginaService = require(
  "../../src/modules/paginas-contenido/services/seccion-pagina.service"
);

function crearServicio() {
  return new SeccionPaginaService({}, {});
}

test("bloquea protocolos inseguros en botones de pagina", () => {
  const servicio = crearServicio();

  [
    ["data:text/html,prueba", "ARCHIVO"],
    ["file:///etc/passwd", "ARCHIVO"],
    ["//servidor.example/recurso", "EXTERNO"],
    ["https://example.org", "INTERNO"]
  ].forEach(([url, tipo]) => {
    assert.throws(
      () => servicio.validarDatosBoton("Abrir", url, tipo),
      (error) => [
        "URL_BOTON_INVALIDA",
        "URL_INTERNA_INVALIDA"
      ].includes(error.codigo)
    );
  });
});

test("acepta enlaces de pagina acordes con su tipo", () => {
  const servicio = crearServicio();

  assert.doesNotThrow(() =>
    servicio.validarDatosBoton(
      "Visitar",
      "https://www.mep.go.cr/",
      "EXTERNO"
    )
  );

  assert.doesNotThrow(() =>
    servicio.validarDatosBoton(
      "Conocer",
      "pages/nosotros.html",
      "INTERNO"
    )
  );

  assert.doesNotThrow(() =>
    servicio.validarDatosBoton(
      "Descargar",
      "/uploads/documento.pdf",
      "ARCHIVO"
    )
  );
});
