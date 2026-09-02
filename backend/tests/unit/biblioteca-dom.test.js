const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const raiz = path.resolve(__dirname, "../../..");

class ElementoFalso {
  constructor(id = "") {
    this.id = id;
    this.hidden = false;
    this.disabled = false;
    this.value = "";
    this.innerHTML = "";
    this.textContent = "";
    this.className = "";
    this.dataset = {};
    this.title = "";
    this.eventos = new Map();
    this.campos = {};
    this.classList = {
      add() {},
      remove() {}
    };
  }

  addEventListener(tipo, manejador) {
    this.eventos.set(tipo, manejador);
  }

  disparar(tipo, evento) {
    return this.eventos.get(tipo)?.(evento);
  }

  reset() {}

  focus() {}

  checkValidity() {
    return true;
  }

  reportValidity() {}

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
  }
}

function crearDocumento(ids = []) {
  const elementos = new Map(
    ids.map((id) => [id, new ElementoFalso(id)])
  );
  const eventos = new Map();

  return {
    body: new ElementoFalso("body"),
    elementos,
    eventos,
    getElementById(id) {
      if (!elementos.has(id)) {
        elementos.set(id, new ElementoFalso(id));
      }
      return elementos.get(id);
    },
    addEventListener(tipo, manejador) {
      eventos.set(tipo, manejador);
    },
    querySelector() {
      return null;
    }
  };
}

function ejecutarModulo(rutaRelativa, ventana) {
  const codigo = fs.readFileSync(
    path.join(raiz, rutaRelativa),
    "utf8"
  );
  ventana.window = ventana;
  ventana.globalThis = ventana;
  ventana.setTimeout = setTimeout;
  ventana.clearTimeout = clearTimeout;

  vm.runInNewContext(codigo, {
    window: ventana,
    document: ventana.document,
    console,
    URL,
    URLSearchParams,
    Intl,
    FormData: class FormDataFalso {
      constructor(formulario) {
        this.formulario = formulario;
      }

      get(nombre) {
        return this.formulario.campos[nombre] ?? null;
      }
    },
    fetch: ventana.fetch,
    setTimeout,
    clearTimeout
  }, { filename: rutaRelativa });
}

async function esperarRender() {
  await new Promise((resolver) => setTimeout(resolver, 20));
}

test("Biblioteca administrativa renderiza acciones visibles para activos e inactivos", async () => {
  const documento = crearDocumento([
    "contenidoBibliotecaAdmin",
    "mensajeBiblioteca",
    "nombrePaginaBiblioteca",
    "rutaPaginaBiblioteca",
    "fechaPaginaBiblioteca",
    "estadoPaginaBiblioteca",
    "tituloBiblioteca",
    "descripcionBiblioteca",
    "estadoBiblioteca",
    "botonGuardarEncabezadoBiblioteca",
    "selectorColeccionBiblioteca",
    "botonPublicarBiblioteca",
    "botonEliminarVersionBiblioteca",
    "cuerpoVersionesBiblioteca",
    "versionesBibliotecaVacias",
    "seccionesBibliotecaAdmin",
    "formularioEncabezadoBiblioteca",
    "botonRecargarBiblioteca",
    "formularioTarjetaBiblioteca",
    "botonCerrarModalTarjetaBiblioteca",
    "botonCancelarTarjetaBiblioteca",
    "modalTarjetaBiblioteca"
  ]);
  const actualizaciones = [];
  const api = {
    async get(ruta) {
      if (ruta.startsWith("/paginas/administracion/biblioteca")) {
        return {
          datos: {
            pagina: {
              idPagina: 8,
              nombre: "Biblioteca",
              ruta: "/pages/biblioteca-recursos.html",
              titulo: "Biblioteca BiblioCRA",
              descripcion: "Contenido de prueba",
              idEstadoPublicacion: 1,
              nombreEstado: "Publicado",
              estadoVisible: true
            }
          }
        };
      }
      if (ruta === "/paginas/estados-publicacion") {
        return {
          datos: {
            estados: [
              { idEstadoPublicacion: 1, nombre: "Publicado" }
            ]
          }
        };
      }
      if (ruta.startsWith("/biblioteca/administracion")) {
        return {
          datos: {
            idColeccionSeleccionada: 10,
            colecciones: [
              {
                idColeccion: 10,
                nombre: "Biblioteca 2026",
                anio: 2026,
                estado: "PUBLICADO",
                publicada: true
              }
            ],
            elementos: [
              {
                idElemento: 101,
                idColeccion: 10,
                titulo: "Servicio activo",
                descripcion: "Visible al público",
                orden: 1,
                estado: "PUBLICADO",
                datos: { grupo: "servicios", tipo: "tarjeta" }
              },
              {
                idElemento: 102,
                idColeccion: 10,
                titulo: "Servicio retirado",
                descripcion: "Solo administración",
                orden: 2,
                estado: "INACTIVO",
                datos: { grupo: "servicios", tipo: "tarjeta" }
              },
              {
                idElemento: 103,
                idColeccion: 10,
                titulo: "Reglamento",
                descripcion: "Normas de uso",
                orden: 1,
                estado: "PUBLICADO",
                datos: {
                  grupo: "reglamento-recursos",
                  subgrupo: "reglamento",
                  tipo: "tarjeta",
                  imagen: "/uploads/reglamento.png"
                }
              },
              {
                idElemento: 104,
                idColeccion: 10,
                titulo: "Recursos digitales",
                descripcion: "Enlaces de apoyo",
                orden: 2,
                estado: "PUBLICADO",
                datos: {
                  grupo: "reglamento-recursos",
                  subgrupo: "recursos-digitales",
                  tipo: "tarjeta",
                  imagen: "/uploads/recurso.png"
                }
              }
            ]
          }
        };
      }
      throw new Error(`Ruta simulada inesperada: ${ruta}`);
    },
    async put(ruta, datos) {
      actualizaciones.push({ ruta, datos });
      return { datos: { idElemento: 101 } };
    }
  };
  const ventana = {
    document: documento,
    API_ADMIN_CLIENT: api,
    location: { href: "https://panel.ejemplo.test/biblioteca" },
    ModalAdmin: { confirmar: async () => false }
  };

  ejecutarModulo(
    "panel-administrativo/js/modules/biblioteca-contenido.js",
    ventana
  );
  documento.eventos.get("DOMContentLoaded")();
  await esperarRender();

  const html = documento.getElementById(
    "seccionesBibliotecaAdmin"
  ).innerHTML;
  assert.match(
    html,
    /data-id="101"[\s\S]*?data-editar-tarjeta="101"[\s\S]*?>Editar<[\s\S]*?>Retirar</
  );
  assert.match(
    html,
    /biblioteca-admin__tarjeta--inactiva"[\s\S]*?data-id="102"[\s\S]*?data-editar-tarjeta="102"[\s\S]*?>Editar<[\s\S]*?>Reactivar</
  );
  assert.equal(
    (html.match(/data-editar-tarjeta=/g) || []).length,
    4
  );
  assert.match(html, /Reglamento y recursos digitales[\s\S]*?2 de 2 tarjetas/);
  assert.equal((html.match(/biblioteca-admin__tarjetas--dos/g) || []).length, 1);

  const secciones = documento.getElementById(
    "seccionesBibliotecaAdmin"
  );
  const modal = documento.getElementById("modalTarjetaBiblioteca");
  modal.hidden = true;
  secciones.disparar("click", {
    target: {
      closest(selector) {
        return selector === "[data-editar-tarjeta]"
          ? { dataset: { editarTarjeta: "101" } }
          : null;
      }
    }
  });

  assert.equal(modal.hidden, false);
  assert.equal(
    documento.getElementById("tituloModalTarjetaBiblioteca").textContent,
    "Editar: Servicio activo"
  );
  assert.equal(
    documento.getElementById("tarjetaBibliotecaTitulo").value,
    "Servicio activo"
  );
  assert.equal(
    documento.getElementById("tarjetaBibliotecaDescripcion").value,
    "Visible al público"
  );

  secciones.disparar("click", {
    target: {
      closest(selector) {
        return selector === "[data-editar-tarjeta]"
          ? { dataset: { editarTarjeta: "103" } }
          : null;
      }
    }
  });
  assert.equal(documento.getElementById("campoImagenTarjetaBiblioteca").hidden, false);
  assert.equal(documento.getElementById("campoImagenesTarjetaBiblioteca").hidden, true);

  secciones.disparar("click", {
    target: {
      closest(selector) {
        return selector === "[data-editar-tarjeta]"
          ? { dataset: { editarTarjeta: "104" } }
          : null;
      }
    }
  });
  assert.equal(documento.getElementById("campoImagenTarjetaBiblioteca").hidden, false);
  assert.equal(documento.getElementById("campoImagenesTarjetaBiblioteca").hidden, false);

  secciones.disparar("click", {
    target: {
      closest(selector) {
        return selector === "[data-editar-tarjeta]"
          ? { dataset: { editarTarjeta: "101" } }
          : null;
      }
    }
  });

  const formulario = documento.getElementById(
    "formularioTarjetaBiblioteca"
  );
  formulario.campos = {
    titulo: "Servicio editado",
    etiqueta: "Atención",
    orden: "1",
    descripcion: "Descripción actualizada",
    url: "https://biblioteca.ejemplo.test",
    estado: "PUBLICADO"
  };
  formulario.disparar("submit", {
    preventDefault() {},
    currentTarget: formulario
  });
  await esperarRender();

  assert.equal(actualizaciones.length, 1);
  assert.equal(
    actualizaciones[0].ruta,
    "/biblioteca/elementos/101"
  );
  assert.equal(actualizaciones[0].datos.titulo, "Servicio editado");
  assert.equal(
    actualizaciones[0].datos.descripcion,
    "Descripción actualizada"
  );
  assert.equal(modal.hidden, true);
});

test("Biblioteca pública oculta contenido inactivo y el encabezado despublicado", async () => {
  const documento = crearDocumento();
  const secciones = new Map([
    "informacion-rapida",
    "nuestra-biblioteca",
    "historia",
    "servicios",
    "areas",
    "prestamo",
    "materiales",
    "reglamento-recursos"
  ].map((grupo) => [grupo, new ElementoFalso(grupo)]));
  const cuadriculaMateriales = new ElementoFalso("materiales-grid");
  const cuadriculaServicios = new ElementoFalso("servicios-grid");
  const galeriaAreas = new ElementoFalso("areas-gallery");
  const tarjetaReglamento = new ElementoFalso("reglamento-card");
  const tarjetaRecursos = new ElementoFalso("recursos-card");
  const tituloReglamentoRecursos = new ElementoFalso("reglamento-recursos-title");
  const textoReglamentoRecursos = new ElementoFalso("reglamento-recursos-text");
  secciones.get("materiales").querySelector = (selector) =>
    selector === ".cuadricula--4" ? cuadriculaMateriales : null;
  secciones.get("servicios").querySelector = (selector) =>
    selector === ".cuadricula--3" ? cuadriculaServicios : null;
  secciones.get("areas").querySelector = (selector) =>
    selector === ".biblioteca-galeria" ? galeriaAreas : null;
  secciones.get("reglamento-recursos").querySelector = (selector) => ({
    ".biblioteca-reglamento-card": tarjetaReglamento,
    ".biblioteca-recursos-card": tarjetaRecursos,
    ".encabezado-seccion .titulo-seccion": tituloReglamentoRecursos,
    ".encabezado-seccion .subtitulo-seccion": textoReglamentoRecursos
  })[selector] || null;
  const principal = new ElementoFalso("main");
  const banda = new ElementoFalso("banda");
  documento.querySelector = (selector) => {
    if (selector === 'body[data-pagina="biblioteca"] main') {
      return principal;
    }
    if (selector === 'body[data-pagina="biblioteca"] main .banda') {
      return banda;
    }
    const grupo = selector.match(
      /^\[data-biblioteca-grupo="(.+)"\]$/
    )?.[1];
    return grupo ? secciones.get(grupo) : null;
  };
  const ventana = {
    document: documento,
    API_PUBLICA_URL: "https://api.ejemplo.test/api",
    location: {
      href: "https://sitio.ejemplo.test/pages/biblioteca-recursos.html",
      origin: "https://sitio.ejemplo.test"
    },
    async fetch(url) {
      if (url.endsWith("/biblioteca/publico")) {
        return {
          ok: true,
          async json() {
            return {
              datos: {
                elementos: [
                  {
                    estado: "INACTIVO",
                    titulo: "Servicio retirado",
                    datos: { grupo: "servicios", tipo: "tarjeta" }
                  },
                  {
                    estado: "PUBLICADO",
                    titulo: "Servicio enlazado",
                    descripcion: "Servicio disponible",
                    url: "https://biblioteca.ejemplo.test/servicio",
                    datos: {
                      grupo: "servicios",
                      tipo: "tarjeta",
                      textoBoton: "Consultar servicio"
                    }
                  },
                  {
                    estado: "PUBLICADO",
                    titulo: "Área activa",
                    descripcion: "Espacio disponible",
                    url: "https://biblioteca.ejemplo.test/area",
                    datos: {
                      grupo: "areas",
                      tipo: "tarjeta",
                      imagen: "https://biblioteca.ejemplo.test/area.png",
                      textoBoton: "Consultar área"
                    }
                  },
                  {
                    estado: "PUBLICADO",
                    titulo: "Material enlazado",
                    descripcion: "Material de prueba",
                    url: "https://biblioteca.ejemplo.test/material",
                    datos: {
                      grupo: "materiales",
                      tipo: "tarjeta",
                      textoBoton: "Consultar material"
                    }
                  },
                  {
                    estado: "PUBLICADO",
                    titulo: "Reglamento y recursos actualizados",
                    descripcion: "Encabezado editable de la sección",
                    datos: {
                      grupo: "reglamento-recursos",
                      subgrupo: "encabezado",
                      tipo: "texto"
                    }
                  },
                  {
                    estado: "PUBLICADO",
                    titulo: "Reglamento de la Biblioteca",
                    descripcion: "Normas de uso",
                    url: "https://biblioteca.ejemplo.test/reglamento",
                    datos: {
                      grupo: "reglamento-recursos",
                      subgrupo: "reglamento",
                      tipo: "tarjeta",
                      etiqueta: "Reglamento",
                      imagen: "https://biblioteca.ejemplo.test/reglamento.png",
                      textoBoton: "Abrir reglamento"
                    }
                  },
                  {
                    estado: "PUBLICADO",
                    titulo: "Revista digital",
                    descripcion: "Recursos de lectura",
                    url: "https://biblioteca.ejemplo.test/revista",
                    datos: {
                      grupo: "reglamento-recursos",
                      subgrupo: "recursos-digitales",
                      tipo: "tarjeta",
                      etiqueta: "Recursos",
                      imagen: "https://biblioteca.ejemplo.test/revista.png",
                      textoBoton: "Abrir revista"
                    }
                  }
                ]
              }
            };
          }
        };
      }
      return {
        ok: true,
        async json() {
          return {
            datos: {
              pagina: {
                estadoVisible: false,
                encabezadoVisible: false
              }
            }
          };
        }
      };
    }
  };

  ejecutarModulo(
    "frontend-publico/js/biblioteca-contenido-publico.js",
    ventana
  );
  documento.eventos.get("DOMContentLoaded")();
  await esperarRender();

  assert.equal(secciones.get("servicios").hidden, false);
  assert.equal(secciones.get("areas").hidden, false);
  assert.equal(secciones.get("materiales").hidden, false);
  assert.equal(secciones.get("reglamento-recursos").hidden, false);
  assert.equal(secciones.get("informacion-rapida").hidden, true);
  assert.match(
    cuadriculaMateriales.innerHTML,
    /href="https:\/\/biblioteca\.ejemplo\.test\/material"[\s\S]*?Consultar material/
  );
  assert.match(
    cuadriculaServicios.innerHTML,
    /href="https:\/\/biblioteca\.ejemplo\.test\/servicio"[\s\S]*?Consultar servicio/
  );
  assert.match(
    galeriaAreas.innerHTML,
    /area\.png[\s\S]*?href="https:\/\/biblioteca\.ejemplo\.test\/area"[\s\S]*?Consultar área/
  );
  assert.doesNotMatch(cuadriculaServicios.innerHTML, /Servicio retirado/);
  assert.match(
    tarjetaReglamento.innerHTML,
    /href="https:\/\/biblioteca\.ejemplo\.test\/reglamento"[\s\S]*?Abrir reglamento/
  );
  assert.match(tarjetaReglamento.innerHTML, /<img[^>]+reglamento\.png/);
  assert.match(
    tarjetaRecursos.innerHTML,
    /revista\.png[\s\S]*?href="https:\/\/biblioteca\.ejemplo\.test\/revista"/
  );
  assert.equal(tituloReglamentoRecursos.textContent, "Reglamento y recursos actualizados");
  assert.equal(textoReglamentoRecursos.textContent, "Encabezado editable de la sección");
  assert.equal(banda.hidden, true);
});

test("Solicitudes renderiza tablas y bloquea un cuarto destinatario", async () => {
  const actualizaciones = [];
  const consultasSolicitudes = [];
  const documento = crearDocumento([
    "estadoSolicitudesBibliocra",
    "filtroEstadoBibliocra",
    "busquedaBibliocra",
    "cuerpoSolicitudesBibliocra",
    "cuerpoDestinatariosBibliocra",
    "destinatariosBibliocraVacios",
    "botonAgregarDestinatarioBibliocra",
    "contadorDestinatariosBibliocra",
    "botonCerrarDestinatarioBibliocra",
    "botonCancelarDestinatarioBibliocra",
    "modalDestinatarioBibliocra",
    "formularioDestinatarioBibliocra",
    "nombreDestinatarioBibliocra",
    "correoDestinatarioBibliocra",
    "tipoDestinatarioBibliocra",
    "modalGestionSolicitudBibliocra",
    "tituloModalGestionSolicitudBibliocra",
    "detalleGestionSolicitudBibliocra",
    "estadoGestionSolicitudBibliocra",
    "observacionGestionSolicitudBibliocra",
    "botonCerrarGestionSolicitudBibliocra",
    "botonCancelarGestionSolicitudBibliocra",
    "formularioGestionSolicitudBibliocra"
  ]);
  const api = {
    async get(ruta) {
      if (ruta.startsWith("/solicitudes-bibliocra/administracion?")) {
        consultasSolicitudes.push(ruta);
        const consulta = new URL(ruta, "http://panel.local");
        const paginaActual = Number(consulta.searchParams.get("pagina"));
        const limite = Number(consulta.searchParams.get("limite"));
        const totalRegistros = 25;
        const totalPaginas = Math.ceil(totalRegistros / limite);
        return {
          datos: {
            solicitudes: [
              {
                idSolicitudBibliocra: 21,
                nombreMaterial: "Libro solicitado",
                tipoMaterial: "HOGAR",
                nombreSolicitante: "Persona de prueba",
                identificacionSolicitante: "QA-21",
                nivelSeccion: "8-3",
                idEstadoSolicitud: 1,
                estado: "Nueva",
                tipoSolicitante: "ESTUDIANTE",
                fechaSolicitud: "2026-08-20T12:00:00Z",
                fechaDevolucion: "2026-08-28"
              }
            ],
            estados: [
              { idEstadoSolicitud: 1, nombre: "Nueva" },
              { idEstadoSolicitud: 2, nombre: "En revisión" }
            ],
            paginaActual,
            limite,
            totalRegistros,
            totalPaginas,
            tieneAnterior: paginaActual > 1,
            tieneSiguiente: paginaActual < totalPaginas
          }
        };
      }
      if (
        ruta ===
        "/solicitudes-bibliocra/administracion/destinatarios"
      ) {
        return {
          datos: {
            maximo: 3,
            destinatarios: [
              {
                idDestinatario: 1,
                nombre: "Docente Uno",
                correo: "uno@ejemplo.test",
                tipo: "DOCENTE"
              },
              {
                idDestinatario: 2,
                nombre: "Administración",
                correo: "dos@ejemplo.test",
                tipo: "ADMINISTRADOR"
              },
              {
                idDestinatario: 3,
                nombre: "Secretaría",
                correo: "tres@ejemplo.test",
                tipo: "SECRETARIA"
              }
            ]
          }
        };
      }
      throw new Error(`Ruta simulada inesperada: ${ruta}`);
    },
    async patch(ruta, datos) {
      actualizaciones.push({ ruta, datos });
      return { datos: { actualizado: true } };
    }
  };
  const ventana = {
    document: documento,
    API_ADMIN_CLIENT: api,
    ModalAdmin: { confirmar: async () => false }
  };

  ejecutarModulo(
    "panel-administrativo/js/modules/biblioteca.js",
    ventana
  );
  documento.eventos.get("DOMContentLoaded")();
  await esperarRender();

  assert.equal(
    consultasSolicitudes[0],
    "/solicitudes-bibliocra/administracion?pagina=1&limite=20"
  );
  assert.equal(
    documento.getElementById("resumenPaginacionBibliocra").textContent,
    "Mostrando 1–20 de 25 registros"
  );
  assert.equal(
    documento.getElementById("anteriorBibliocra").disabled,
    true
  );
  assert.equal(
    documento.getElementById("siguienteBibliocra").disabled,
    false
  );

  documento.getElementById("siguienteBibliocra").disparar("click", {});
  await esperarRender();
  assert.equal(
    consultasSolicitudes.at(-1),
    "/solicitudes-bibliocra/administracion?pagina=2&limite=20"
  );
  assert.equal(
    documento.getElementById("paginaBibliocra").textContent,
    "Página 2 de 2"
  );

  documento.getElementById("anteriorBibliocra").disparar("click", {});
  await esperarRender();
  assert.equal(
    consultasSolicitudes.at(-1),
    "/solicitudes-bibliocra/administracion?pagina=1&limite=20"
  );

  documento.getElementById("siguienteBibliocra").disparar("click", {});
  await esperarRender();

  documento.getElementById("filtroEstadoBibliocra").value = "1";
  documento.getElementById("filtroEstadoBibliocra").disparar("change", {});
  await esperarRender();
  assert.equal(
    consultasSolicitudes.at(-1),
    "/solicitudes-bibliocra/administracion?pagina=1&limite=20&idEstado=1"
  );

  documento.getElementById("limiteBibliocra").value = "50";
  documento.getElementById("limiteBibliocra").disparar("change", {});
  await esperarRender();
  assert.equal(
    consultasSolicitudes.at(-1),
    "/solicitudes-bibliocra/administracion?pagina=1&limite=50&idEstado=1"
  );
  assert.match(
    documento.getElementById("cuerpoSolicitudesBibliocra").innerHTML,
    /#21[\s\S]*?28 ago 2026[\s\S]*?Persona de prueba[\s\S]*?QA-21[\s\S]*?Libro solicitado[\s\S]*?Nueva[\s\S]*?data-gestionar-solicitud/
  );
  const correos = documento.getElementById(
    "cuerpoDestinatariosBibliocra"
  ).innerHTML;
  assert.match(correos, /Docente Uno[\s\S]*?uno@ejemplo\.test[\s\S]*?Docente/);
  assert.match(correos, /Administración[\s\S]*?Administrador/);
  assert.match(correos, /Secretaría/);
  assert.equal(
    (correos.match(/data-eliminar-destinatario=/g) || []).length,
    3
  );
  assert.doesNotMatch(correos, /Editar|Activar|Desactivar/);
  assert.equal(
    documento.getElementById("contadorDestinatariosBibliocra").textContent,
    "3 de 3"
  );
  assert.equal(
    documento.getElementById("botonAgregarDestinatarioBibliocra").disabled,
    true
  );

  documento.getElementById("cuerpoSolicitudesBibliocra").disparar(
    "click",
    {
      target: {
        closest(selector) {
          return selector === "[data-gestionar-solicitud]"
            ? { dataset: { gestionarSolicitud: "21" } }
            : null;
        }
      }
    }
  );
  assert.equal(
    documento.getElementById("modalGestionSolicitudBibliocra").hidden,
    false
  );
  assert.match(
    documento.getElementById("detalleGestionSolicitudBibliocra").innerHTML,
    /Persona de prueba[\s\S]*?Libro solicitado/
  );

  documento.getElementById("estadoGestionSolicitudBibliocra").value = "2";
  documento.getElementById("observacionGestionSolicitudBibliocra").value =
    "Revisión administrativa";
  await documento.getElementById("formularioGestionSolicitudBibliocra").disparar(
    "submit",
    {
      preventDefault() {},
      currentTarget: documento.getElementById(
        "formularioGestionSolicitudBibliocra"
      )
    }
  );
  assert.equal(actualizaciones.length, 1);
  assert.equal(
    actualizaciones[0].ruta,
    "/solicitudes-bibliocra/administracion/21"
  );
  assert.equal(actualizaciones[0].datos.idEstadoSolicitud, 2);
  assert.equal(
    actualizaciones[0].datos.observacionesInternas,
    "Revisión administrativa"
  );
});

test("Solicitudes agrega y elimina destinatarios desde el panel", async () => {
  const documento = crearDocumento();
  let destinatarios = [];
  const enviados = [];
  const eliminados = [];
  const api = {
    async get(ruta) {
      if (ruta.startsWith("/solicitudes-bibliocra/administracion?")) {
        return {
          datos: {
            solicitudes: [],
            estados: [],
            paginaActual: 1,
            limite: 20,
            totalRegistros: 0,
            totalPaginas: 1,
            tieneAnterior: false,
            tieneSiguiente: false
          }
        };
      }
      if (
        ruta ===
        "/solicitudes-bibliocra/administracion/destinatarios"
      ) {
        return {
          datos: { maximo: 3, destinatarios }
        };
      }
      throw new Error(`Ruta simulada inesperada: ${ruta}`);
    },
    async post(ruta, datos) {
      enviados.push({ ruta, datos });
      destinatarios = [{
        idDestinatario: 9,
        nombre: datos.nombre,
        correo: datos.correo,
        tipo: datos.tipo
      }];
      return { datos: destinatarios[0] };
    },
    async delete(ruta) {
      eliminados.push(ruta);
      destinatarios = [];
      return { datos: { eliminado: true } };
    }
  };
  const ventana = {
    document: documento,
    API_ADMIN_CLIENT: api,
    ModalAdmin: { confirmar: async () => true }
  };

  ejecutarModulo(
    "panel-administrativo/js/modules/biblioteca.js",
    ventana
  );
  documento.eventos.get("DOMContentLoaded")();
  await esperarRender();

  assert.equal(
    documento.getElementById("destinatariosBibliocraVacios").hidden,
    false
  );
  documento.getElementById("nombreDestinatarioBibliocra").value =
    "María López";
  documento.getElementById("correoDestinatarioBibliocra").value =
    "MARIA@LICEO.CR";
  documento.getElementById("tipoDestinatarioBibliocra").value = "DOCENTE";
  await documento.getElementById("formularioDestinatarioBibliocra").disparar(
    "submit",
    {
      preventDefault() {},
      currentTarget: documento.getElementById(
        "formularioDestinatarioBibliocra"
      )
    }
  );

  assert.equal(enviados.length, 1);
  assert.equal(enviados[0].datos.nombre, "María López");
  assert.equal(enviados[0].datos.correo, "maria@liceo.cr");
  assert.equal(enviados[0].datos.tipo, "DOCENTE");
  assert.match(
    documento.getElementById("cuerpoDestinatariosBibliocra").innerHTML,
    /María López[\s\S]*?maria@liceo\.cr[\s\S]*?Docente/
  );

  await documento.getElementById("cuerpoDestinatariosBibliocra").disparar(
    "click",
    {
      target: {
        closest(selector) {
          return selector === "[data-eliminar-destinatario]"
            ? { dataset: { eliminarDestinatario: "9" } }
            : null;
        }
      }
    }
  );
  await esperarRender();
  assert.equal(
    eliminados[0],
    "/solicitudes-bibliocra/administracion/destinatarios/9"
  );
  assert.equal(
    documento.getElementById("destinatariosBibliocraVacios").hidden,
    false
  );
});
