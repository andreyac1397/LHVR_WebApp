const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const AuditoriaService = require(
  "../../src/modules/auditoria/services/auditoria.service"
);
const SolicitudBibliocraService = require(
  "../../src/modules/biblioteca/services/solicitud-bibliocra.service"
);
const AdministradorService = require(
  "../../src/modules/administradores/services/administrador.service"
);

const raiz = path.resolve(__dirname, "../../..");

function leer(ruta) {
  return fs.readFileSync(path.join(raiz, ruta), "utf8");
}

class ElementoFalso {
  constructor() {
    this.value = "";
    this.textContent = "";
    this.innerHTML = "";
    this.className = "";
    this.hidden = false;
    this.disabled = false;
    this.dataset = {};
    this.eventos = new Map();
  }

  addEventListener(tipo, manejador) {
    this.eventos.set(tipo, manejador);
  }

  disparar(tipo, evento = {}) {
    return this.eventos.get(tipo)?.({
      currentTarget: this,
      target: this,
      ...evento
    });
  }

  querySelector() {
    return new ElementoFalso();
  }

  reset() {}
}

function crearDocumento() {
  const elementos = new Map();
  const eventos = new Map();
  return {
    elementos,
    eventos,
    getElementById(id) {
      if (!elementos.has(id)) {
        elementos.set(id, new ElementoFalso());
      }
      return elementos.get(id);
    },
    addEventListener(tipo, manejador) {
      eventos.set(tipo, manejador);
    }
  };
}

function ejecutarModulo(ruta, ventana) {
  ventana.window = ventana;
  ventana.setTimeout = setTimeout;
  ventana.clearTimeout = clearTimeout;
  vm.runInNewContext(leer(ruta), {
    window: ventana,
    document: ventana.document,
    URLSearchParams,
    Intl,
    setTimeout,
    clearTimeout,
    console
  }, { filename: ruta });
}

async function esperar(milisegundos = 20) {
  await new Promise((resolver) => setTimeout(resolver, milisegundos));
}

function respuestaPaginada(ruta, clave) {
  const consulta = new URL(ruta, "http://panel.local");
  const paginaActual = Number(consulta.searchParams.get("pagina"));
  const limite = Number(consulta.searchParams.get("limite"));
  const totalRegistros = 45;
  return {
    datos: {
      [clave]: [],
      estados: [],
      modulos: [],
      acciones: [],
      paginaActual,
      limite,
      totalRegistros,
      totalPaginas: Math.ceil(totalRegistros / limite),
      tieneAnterior: paginaActual > 1,
      tieneSiguiente:
        paginaActual < Math.ceil(totalRegistros / limite)
    }
  };
}

test("las consultas grandes usan OFFSET/FETCH, COUNT y límite parametrizado", () => {
  const repositorios = [
    "backend/src/modules/auditoria/repositories/sql-auditoria.repository.js",
    "backend/src/modules/biblioteca/repositories/sql-solicitud-bibliocra.repository.js",
    "backend/src/modules/administradores/repositories/sql-administrador.repository.js"
  ];

  for (const ruta of repositorios) {
    const codigo = leer(ruta);
    assert.match(codigo, /OFFSET @offset ROWS/);
    assert.match(codigo, /FETCH NEXT @limite ROWS ONLY/);
    assert.match(codigo, /SELECT COUNT\(\*\) AS total_registros/);
    assert.match(codigo, /\.input\("offset", sql\.Int/);
    assert.match(codigo, /\.input\("limite", sql\.Int/);
  }

  assert.doesNotMatch(
    leer("backend/src/modules/biblioteca/repositories/sql-solicitud-bibliocra.repository.js"),
    /SELECT TOP 500/
  );
});

test("los servicios usan 20 por defecto y limitan el máximo a 100", async () => {
  const recibidos = [];
  const repositorioAuditoria = {
    listarAuditoria: async (filtros) => {
      recibidos.push(filtros);
      return filtros;
    }
  };
  const repositorioBibliocra = {
    listar: async (filtros) => {
      recibidos.push(filtros);
      return filtros;
    }
  };
  const repositorioAdministradores = {
    listar: async (filtros) => {
      recibidos.push(filtros);
      return filtros;
    }
  };

  await new AuditoriaService(repositorioAuditoria).listarAuditoria({});
  await new SolicitudBibliocraService(repositorioBibliocra).listar({
    pagina: "3",
    limite: "50"
  });
  await new AdministradorService(repositorioAdministradores).listar({
    pagina: "2",
    limite: "500"
  });

  assert.deepEqual(
    { pagina: recibidos[0].pagina, limite: recibidos[0].limite },
    { pagina: 1, limite: 20 }
  );
  assert.deepEqual(
    { pagina: recibidos[1].pagina, limite: recibidos[1].limite },
    { pagina: 3, limite: 50 }
  );
  assert.deepEqual(
    { pagina: recibidos[2].pagina, limite: recibidos[2].limite },
    { pagina: 2, limite: 100 }
  );
});

test("las tres tablas muestran controles 10, 20, 50 y navegación", () => {
  const paginas = [
    "panel-administrativo/pages/auditoria/historial-auditoria.html",
    "panel-administrativo/pages/biblioteca/solicitudes-bibliocra.html",
    "panel-administrativo/pages/administradores/lista-administradores.html"
  ];

  for (const ruta of paginas) {
    const html = leer(ruta);
    assert.match(html, /<option value="10">10<\/option>/);
    assert.match(html, /<option value="20" selected>20<\/option>/);
    assert.match(html, /<option value="50">50<\/option>/);
    assert.match(html, />Anterior<\/button>/);
    assert.match(html, />Siguiente<\/button>/);
    assert.match(html, /Página 1 de 1/);
  }
});

test("Auditoría navega y reinicia la página al filtrar o cambiar el límite", async () => {
  const documento = crearDocumento();
  const consultas = [];
  const ventana = {
    document: documento,
    API_ADMIN_CLIENT: {
      async get(ruta) {
        consultas.push(ruta);
        return respuestaPaginada(ruta, "registros");
      }
    }
  };

  ejecutarModulo(
    "panel-administrativo/js/modules/auditoria.js",
    ventana
  );
  documento.eventos.get("DOMContentLoaded")();
  await esperar();
  assert.equal(consultas.at(-1), "/auditoria?pagina=1&limite=20");

  documento.getElementById("siguienteAuditoria").disparar("click");
  await esperar();
  assert.equal(consultas.at(-1), "/auditoria?pagina=2&limite=20");

  documento.getElementById("anteriorAuditoria").disparar("click");
  await esperar();
  assert.equal(consultas.at(-1), "/auditoria?pagina=1&limite=20");

  documento.getElementById("siguienteAuditoria").disparar("click");
  await esperar();

  documento.getElementById("filtroModuloAuditoria").value = "SEGURIDAD";
  documento.getElementById("filtroModuloAuditoria").disparar("change");
  await esperar();
  assert.equal(
    consultas.at(-1),
    "/auditoria?pagina=1&limite=20&modulo=SEGURIDAD"
  );

  documento.getElementById("limiteAuditoria").value = "10";
  documento.getElementById("limiteAuditoria").disparar("change");
  await esperar();
  assert.equal(
    consultas.at(-1),
    "/auditoria?pagina=1&limite=10&modulo=SEGURIDAD"
  );
});

test("Administradores navega y reinicia la página con sus filtros", async () => {
  const documento = crearDocumento();
  const consultas = [];
  const ventana = {
    document: documento,
    API_ADMIN_CLIENT: {
      async get(ruta) {
        consultas.push(ruta);
        return respuestaPaginada(ruta, "administradores");
      }
    }
  };

  ejecutarModulo(
    "panel-administrativo/js/modules/administradores.js",
    ventana
  );
  documento.eventos.get("DOMContentLoaded")();
  await esperar();
  assert.equal(
    consultas.at(-1),
    "/administradores?pagina=1&limite=20"
  );

  documento.getElementById("siguienteAdministradores").disparar("click");
  await esperar();
  assert.equal(
    consultas.at(-1),
    "/administradores?pagina=2&limite=20"
  );

  documento.getElementById("anteriorAdministradores").disparar("click");
  await esperar();
  assert.equal(
    consultas.at(-1),
    "/administradores?pagina=1&limite=20"
  );

  documento.getElementById("siguienteAdministradores").disparar("click");
  await esperar();

  documento.getElementById("filtroEstadoAdministradores").value = "2";
  documento.getElementById("filtroEstadoAdministradores").disparar("change");
  await esperar();
  assert.equal(
    consultas.at(-1),
    "/administradores?pagina=1&limite=20&idEstado=2"
  );

  documento.getElementById("limiteAdministradores").value = "50";
  documento.getElementById("limiteAdministradores").disparar("change");
  await esperar();
  assert.equal(
    consultas.at(-1),
    "/administradores?pagina=1&limite=50&idEstado=2"
  );
});
