const test = require("node:test");
const assert = require("node:assert/strict");

const PaginaService = require(
  "../../src/modules/paginas-contenido/services/pagina.service"
);

test("actualiza la fila existente de la pagina y registra auditoria", async () => {
  let datosRepositorio = null;
  let datosAuditoria = null;

  const repositorio = {
    async guardarPagina(datos) {
      datosRepositorio = datos;

      return {
        idPagina: datos.idPagina,
        slug: "contacto",
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        idEstadoPublicacion:
          datos.idEstadoPublicacion,
        nombreEstado: "Inactivo",
        estadoVisible: false
      };
    }
  };

  const auditoriaService = {
    async registrarSinInterrumpir(datos) {
      datosAuditoria = datos;
    }
  };

  const servicio = new PaginaService(
    repositorio,
    auditoriaService
  );

  const resultado = await servicio.guardarPagina(
    {
      idPagina: "12",
      titulo: "  Contacto y ubicación  ",
      descripcion: "  Estamos para atenderte.  ",
      idEstadoPublicacion: "3"
    },
    {
      idAdministrador: 7
    },
    {
      direccionIp: "127.0.0.1",
      userAgent: "prueba"
    }
  );

  assert.equal(resultado.guardado, true);
  assert.equal(resultado.pagina.idPagina, 12);
  assert.deepEqual(datosRepositorio, {
    idPagina: 12,
    titulo: "Contacto y ubicación",
    descripcion: "Estamos para atenderte.",
    idEstadoPublicacion: 3,
    idAdministradorUltimaModificacion: 7
  });
  assert.equal(
    datosAuditoria.tablaAfectada,
    "paginas"
  );
  assert.equal(
    datosAuditoria.codigoAccion,
    "EDITAR"
  );
});

test("rechaza encabezados vacios antes de consultar el repositorio", async () => {
  let consultas = 0;

  const servicio = new PaginaService({
    async guardarPagina() {
      consultas += 1;
      return {};
    }
  });

  await assert.rejects(
    servicio.guardarPagina(
      {
        idPagina: 10,
        titulo: "   ",
        descripcion: null,
        idEstadoPublicacion: 2
      },
      {
        idAdministrador: 1
      }
    ),
    (error) =>
      error.codigo ===
      "CAMPO_OBLIGATORIO"
  );

  assert.equal(consultas, 0);
});

test("oculta solo el encabezado y conserva las secciones publicadas", async () => {
  const servicio = new PaginaService({
    async obtenerContenidoPaginaPorSlug(
      slug,
      soloVisibles
    ) {
      assert.equal(slug, "comunidad");
      assert.equal(soloVisibles, false);

      return {
        pagina: {
          idPagina: 10,
          slug: "comunidad",
          titulo: "Encabezado en borrador",
          descripcion: "No debe exponerse",
          estadoVisible: false
        },
        secciones: [
          {
            clave: "INTRO_COMUNIDAD",
            titulo: "Introducción publicada",
            estadoVisible: true
          },
          {
            clave: "CIERRE_COMUNIDAD",
            titulo: "Cierre inactivo",
            estadoVisible: false
          }
        ]
      };
    }
  });

  const resultado =
    await servicio
      .obtenerContenidoPublicoParcial(
        "comunidad"
      );

  assert.equal(
    resultado.pagina.encabezadoVisible,
    false
  );
  assert.equal(resultado.pagina.titulo, null);
  assert.equal(resultado.pagina.descripcion, null);
  assert.deepEqual(
    resultado.secciones.map(
      (seccion) => seccion.clave
    ),
    ["INTRO_COMUNIDAD"]
  );
});
