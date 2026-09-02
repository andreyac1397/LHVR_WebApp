const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ContenidoService = require(
  "../../src/shared/content-management/contenido.service"
);
const HorarioService = require(
  "../../src/modules/horarios/services/horario.service"
);

function obtenerConfiguracionHorarios() {
  const rutaConfiguracion = path.resolve(
    __dirname,
    "../../../panel-administrativo/js/modules/configuracion-gestion-contenido.js"
  );
  const codigo = fs.readFileSync(rutaConfiguracion, "utf8");
  const window = {
    location: {
      search: "?modulo=horarios",
      replace() {}
    }
  };

  vm.runInNewContext(codigo, {
    window,
    document: {
      title: "",
      body: { dataset: {} }
    },
    URLSearchParams
  });

  return window.CONFIGURACION_GESTION_CONTENIDO;
}

function crearRepositorio() {
  return {
    importacion: null,
    async importarColeccion(datos) {
      this.importacion = datos;

      return {
        idColeccion: 1,
        cantidadGuardada: datos.elementos.length,
        publicada: datos.publicar
      };
    }
  };
}

test("permite varios recreos de una seccion cuando tienen horas distintas", async () => {
  const configuracion = obtenerConfiguracionHorarios();
  const mapear = configuracion.importacion.mapear;
  const fila3 = {
    seccion: "7-1",
    lec: "RECESO",
    horas: "08:20-08:35",
    lunes: "RECESO"
  };
  const fila6 = {
    seccion: "7-1",
    lec: "RECESO",
    horas: "09:55-10:00",
    lunes: "RECESO"
  };
  const elementos = [mapear(fila3, 2), mapear(fila6, 5)];
  const repositorio = crearRepositorio();
  const servicio = new ContenidoService("HORARIOS", repositorio);

  const resultado = await servicio.importar({
    nombre: "Horario 2026",
    anio: 2026,
    elementos
  });

  assert.notEqual(
    elementos[0].claveExterna,
    elementos[1].claveExterna
  );
  assert.equal(resultado.cantidadGuardada, 2);
});

test("conserva la deteccion de filas de horario realmente duplicadas", async () => {
  const configuracion = obtenerConfiguracionHorarios();
  const mapear = configuracion.importacion.mapear;
  const fila = {
    seccion: "7-1",
    lec: "RECESO",
    horas: "08:20-08:35",
    lunes: "RECESO"
  };
  const servicio = new ContenidoService(
    "HORARIOS",
    crearRepositorio()
  );

  await assert.rejects(
    servicio.importar({
      anio: 2026,
      elementos: [mapear(fila, 2), mapear({ ...fila }, 5)]
    }),
    (error) => error.codigo === "ELEMENTO_IMPORTACION_DUPLICADO"
  );
});

test("la importacion guarda el lote con OPENJSON y fechas obligatorias", () => {
  const rutaRepositorio = path.resolve(
    __dirname,
    "../../src/shared/content-management/sql-contenido.repository.js"
  );
  const codigo = fs.readFileSync(rutaRepositorio, "utf8");
  const importarColeccion = codigo.slice(
    codigo.indexOf("async importarColeccion"),
    codigo.indexOf("async listarImportaciones")
  );

  assert.match(
    importarColeccion,
    /FROM OPENJSON\(@elementos_json\)/
  );
  assert.match(
    importarColeccion,
    /fecha_creacion,\s*fecha_actualizacion/
  );
  assert.match(
    importarColeccion,
    /SYSUTCDATETIME\(\),\s*SYSUTCDATETIME\(\)/
  );
  assert.doesNotMatch(importarColeccion, /\.bulk\(/);
});

test("prepara localmente una seccion con 12 lecciones y descansos", async () => {
  const servicio = new HorarioService({});

  const resultado = await servicio.crearSeccion({
    idColeccion: 3,
    seccion: "8-2",
    profesorGuia: "María Mora"
  });

  const filas = resultado.elementos;
  const lecciones = filas.filter((fila) => /^\d+$/.test(fila.datos.lec));
  const recreos = filas.filter((fila) => fila.datos.lec === "RECESO");
  const almuerzos = filas.filter((fila) => fila.datos.lec === "ALMUERZO");

  assert.equal(resultado.filasCreadas, 17);
  assert.equal(lecciones.length, 12);
  assert.equal(recreos.length, 4);
  assert.equal(almuerzos.length, 1);
  assert.ok(lecciones.every((fila) =>
    ["lunes", "martes", "miercoles", "jueves", "viernes"]
      .every((dia) => fila.datos[dia] === "")
  ));
  assert.ok(filas.every(
    (fila) => fila.datos.profesor_guia === "María Mora"
  ));
  assert.ok(filas.every(
    (fila) => fila.estado === "PUBLICADO"
  ));
});

test("guarda en un solo lote el estado completo del horario", async () => {
  const repositorio = {
    datos: null,
    async guardarCambiosHorario(datos) {
      this.datos = datos;
      return {
        filasCreadas: 1,
        filasActualizadas: 1,
        filasEliminadas: 1
      };
    }
  };
  const servicio = new HorarioService(repositorio);
  const resultado = await servicio.guardarCambios(
    7,
    {
      elementos: [
        {
          idElemento: 20,
          idColeccion: 7,
          claveExterna: "7-1-1-07-00-07-40",
          titulo: "7-1 · Lección 1",
          estado: "PUBLICADO",
          datos: {
            seccion: "7-1",
            lec: "1",
            horas: "07:00-07:40"
          }
        },
        {
          idElemento: null,
          idColeccion: 7,
          claveExterna: "7-1-2-07-40-08-20",
          titulo: "7-1 · Lección 2",
          estado: "PUBLICADO",
          datos: {
            seccion: "7-1",
            lec: "2",
            horas: "07:40-08:20"
          }
        }
      ]
    },
    { idAdministrador: 3 }
  );

  assert.equal(repositorio.datos.modulo, "HORARIOS");
  assert.equal(repositorio.datos.idColeccion, 7);
  assert.equal(repositorio.datos.elementos.length, 2);
  assert.equal(repositorio.datos.idAdministrador, 3);
  assert.equal(resultado.filasCreadas, 1);
  assert.equal(resultado.filasEliminadas, 1);
});

test("sincroniza el lote de horarios dentro de una transaccion SQL", () => {
  const rutaRepositorio = path.resolve(
    __dirname,
    "../../src/shared/content-management/sql-contenido.repository.js"
  );
  const codigo = fs.readFileSync(rutaRepositorio, "utf8");
  const guardarCambios = codigo.slice(
    codigo.indexOf("async guardarCambiosHorario"),
    codigo.indexOf("async crearSeccionHorario")
  );

  assert.match(guardarCambios, /await transaccion\.begin\(\)/);
  assert.match(guardarCambios, /FROM OPENJSON\(@elementos_json\)/);
  assert.match(guardarCambios, /DELETE actual/);
  assert.match(guardarCambios, /UPDATE actual/);
  assert.match(guardarCambios, /INSERT INTO dbo\.cms_elementos/);
  assert.match(guardarCambios, /await transaccion\.commit\(\)/);
});

test("elimina de una vez todas las filas de una seccion", async () => {
  const repositorio = {
    async eliminarSeccionHorario(modulo, idColeccion, seccion) {
      assert.equal(modulo, "HORARIOS");
      assert.equal(idColeccion, 9);
      assert.equal(seccion, "11-1");
      return 17;
    }
  };
  const servicio = new HorarioService(repositorio);

  const resultado = await servicio.eliminarSeccion(9, "11-1");

  assert.equal(resultado.filasEliminadas, 17);
});

test("rechaza una seccion fuera de los niveles institucionales", async () => {
  const servicio = new HorarioService({});

  await assert.rejects(
    servicio.crearSeccion({ idColeccion: 1, seccion: "6-1" }),
    (error) => error.codigo === "SECCION_HORARIO_INVALIDA"
  );
});

test("permite guardar una leccion vacia de la plantilla mientras se completa", () => {
  const servicio = new HorarioService({});

  const elemento = servicio.normalizarElemento({
    titulo: "7-1 · Lección 1",
    datos: {
      seccion: "7-1",
      lec: "1",
      horas: "07:00-07:40",
      lunes: "",
      martes: "",
      miercoles: "",
      jueves: "",
      viernes: ""
    }
  });

  assert.equal(elemento.datos.seccion, "7-1");
  assert.equal(elemento.datos.lunes, "");
});

test("obtiene todas las filas de una version para exportarlas", async () => {
  const coleccion = {
    idColeccion: 12,
    nombre: "Horario lectivo",
    anio: 2026
  };
  const elementos = [
    {
      idElemento: 1,
      estado: "ARCHIVADO",
      datos: { seccion: "7-1", lec: "1" }
    }
  ];
  const repositorio = {
    async obtenerColeccionPorId(idColeccion, modulo) {
      assert.equal(idColeccion, 12);
      assert.equal(modulo, "HORARIOS");
      return coleccion;
    },
    async listarElementos(filtros) {
      assert.deepEqual(filtros, {
        modulo: "HORARIOS",
        idColeccion: 12,
        soloPublicados: false
      });
      return elementos;
    }
  };
  const servicio = new HorarioService(repositorio);

  const resultado = await servicio.exportarColeccion(12);

  assert.equal(resultado.coleccion, coleccion);
  assert.equal(resultado.elementos, elementos);
});
