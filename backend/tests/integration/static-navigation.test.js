const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const raiz = path.resolve(__dirname, "../../..");

function extraerBloque(codigo, marcadorInicial, marcadorFinal) {
  const inicio = codigo.indexOf(marcadorInicial);
  const fin = codigo.indexOf(marcadorFinal, inicio);

  assert.ok(inicio >= 0 && fin > inicio, `Debe existir el bloque ${marcadorInicial}.`);

  return codigo.slice(inicio, fin);
}

function verificarColeccionRetirable({
  archivoRelativo,
  marcadorFiltro,
  marcadorDespuesFiltro,
  marcadorGuardado,
  marcadorDespuesGuardado,
  patronTipo,
  nombreColeccion
}) {
  const codigo = fs.readFileSync(path.join(raiz, archivoRelativo), "utf8");
  const filtroAdministrativo = extraerBloque(
    codigo,
    marcadorFiltro,
    marcadorDespuesFiltro
  );
  const guardado = extraerBloque(
    codigo,
    marcadorGuardado,
    marcadorDespuesGuardado
  );

  assert.match(
    filtroAdministrativo,
    patronTipo,
    `El panel debe reconocer ${nombreColeccion}.`
  );
  assert.match(
    filtroAdministrativo,
    /!comun\.esSeccionArchivada/,
    `El panel debe ocultar solo ${nombreColeccion} retirados.`
  );
  assert.doesNotMatch(
    filtroAdministrativo,
    /esSeccionVisible/,
    `El panel debe conservar ${nombreColeccion} inactivos.`
  );
  assert.match(
    guardado,
    /comun\.retirarSeccion\(/,
    `Quitar ${nombreColeccion} debe ejecutar el retiro logico.`
  );
}

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

test("los frontends permiten configurar la URL de la API sin editar cada módulo", () => {
  const archivosPublicos = [
    "frontend-publico/js/main.js",
    "frontend-publico/js/inicio.js",
    "frontend-publico/js/oferta-academica.js",
    "frontend-publico/js/nosotros.js",
    "frontend-publico/js/comunidad.js",
    "frontend-publico/js/calendario.js",
    "frontend-publico/js/horarios.js",
    "frontend-publico/js/contacto.js",
    "frontend-publico/js/solicitud-bibliocra.js",
    "frontend-publico/js/contenido-modulos-publico.js"
  ];

  for (const relativo of archivosPublicos) {
    const codigo = fs.readFileSync(path.join(raiz, relativo), "utf8");
    assert.match(
      codigo,
      /API_PUBLICA_URL/,
      `${relativo} debe respetar la URL pública compartida.`
    );
  }

  const configuracionAdmin = fs.readFileSync(
    path.join(
      raiz,
      "panel-administrativo/js/config/api-admin.config.js"
    ),
    "utf8"
  );

  assert.match(
    configuracionAdmin,
    /global\.API_ADMIN_URL/,
    "El panel debe permitir configurar la URL administrativa antes de cargar sus módulos."
  );
});

test("Biblioteca conserva su diseño especializado al cargar contenido dinámico", () => {
  const html = fs.readFileSync(
    path.join(raiz, "frontend-publico/pages/biblioteca-recursos.html"),
    "utf8"
  );
  const javascript = fs.readFileSync(
    path.join(raiz, "frontend-publico/js/biblioteca-contenido-publico.js"),
    "utf8"
  );
  const css = fs.readFileSync(
    path.join(raiz, "frontend-publico/css/biblioteca.css"),
    "utf8"
  );
  const htmlAdmin = fs.readFileSync(
    path.join(
      raiz,
      "panel-administrativo/pages/biblioteca/contenido-biblioteca.html"
    ),
    "utf8"
  );
  const javascriptAdmin = fs.readFileSync(
    path.join(
      raiz,
      "panel-administrativo/js/modules/biblioteca-contenido.js"
    ),
    "utf8"
  );
  const repositorio = fs.readFileSync(
    path.join(
      raiz,
      "backend/src/shared/content-management/sql-contenido.repository.js"
    ),
    "utf8"
  );
  const solicitudesHtml = fs.readFileSync(
    path.join(
      raiz,
      "panel-administrativo/pages/biblioteca/solicitudes-bibliocra.html"
    ),
    "utf8"
  );
  const solicitudesJavascript = fs.readFileSync(
    path.join(
      raiz,
      "panel-administrativo/js/modules/biblioteca.js"
    ),
    "utf8"
  );
  const gestionContenidoJavascript = fs.readFileSync(
    path.join(
      raiz,
      "panel-administrativo/js/modules/gestion-contenido-admin.js"
    ),
    "utf8"
  );
  const formularioPublico = fs.readFileSync(
    path.join(
      raiz,
      "frontend-publico/js/solicitud-bibliocra.js"
    ),
    "utf8"
  );
  const formularioPublicoHtml = fs.readFileSync(
    path.join(
      raiz,
      "frontend-publico/pages/FormularioBibliocra.html"
    ),
    "utf8"
  );
  const repositorioSolicitudes = fs.readFileSync(
    path.join(
      raiz,
      "backend/src/modules/biblioteca/repositories/sql-solicitud-bibliocra.repository.js"
    ),
    "utf8"
  );

  [
    "informacion-rapida",
    "nuestra-biblioteca",
    "historia",
    "servicios",
    "areas",
    "prestamo",
    "materiales",
    "reglamento-recursos"
  ].forEach((grupo) => {
    assert.match(html, new RegExp(`data-biblioteca-grupo=["']${grupo}["']`));
  });

  assert.doesNotMatch(javascript, /section:not\(\.banda\).*remove/);
  assert.match(javascript, /function renderNuestraBiblioteca\(/);
  assert.match(javascript, /bloqueTexto\.hidden = !principal/);
  assert.match(javascript, /function renderHistoria\(/);
  assert.match(javascript, /function renderPrestamo\(/);
  assert.match(javascript, /function renderReglamentoRecursos\(/);
  assert.match(javascript, /\["reglamento", "recursos-digitales", "reglamento-recursos"\]/);
  assert.match(javascript, /Promise\.allSettled/);
  assert.match(javascript, /\["http:", "https:"\]/);
  assert.match(css, /\.biblioteca-destacado__logo img[\s\S]*?object-fit:\s*contain/);
  assert.match(css, /\.biblioteca-destacado__logo img[\s\S]*?width:\s*auto/);
  assert.match(javascript, /estado === "PUBLICADO"/);
  assert.match(javascript, /banda\.hidden = !visible/);
  assert.match(javascript, /PAGINA_NO_DISPONIBLE/);

  assert.match(htmlAdmin, /id="modalTarjetaBiblioteca"/);
  assert.match(htmlAdmin, /id="cuerpoVersionesBiblioteca"/);
  assert.match(htmlAdmin, /id="botonEliminarVersionBiblioteca"/);
  assert.match(htmlAdmin, /id="archivoImagenBiblioteca"[^>]+type="file"/);
  assert.match(htmlAdmin, /id="archivosImagenesBiblioteca"[^>]+multiple/);
  assert.doesNotMatch(htmlAdmin, /name="imagen"[^>]+placeholder="\.\.\/assets/);
  assert.doesNotMatch(javascriptAdmin, /<details/);
  assert.match(javascriptAdmin, /data-editar-tarjeta/);
  assert.match(javascriptAdmin, /data-cambiar-estado/);
  assert.match(javascriptAdmin, /"\/archivos\/imagenes\/paginas"/);
  assert.match(javascriptAdmin, /id: "reglamento-recursos"/);
  assert.match(javascriptAdmin, /max: 2/);
  assert.match(javascriptAdmin, /tarjetasFijas: true/);
  assert.match(javascriptAdmin, /subgrupo: "encabezado"/);
  assert.match(javascriptAdmin, /estado\.subgrupoEditado === "recursos-digitales"/);
  assert.match(javascriptAdmin, /id: "prestamo"[^\n]+max: 1, imagen: true/);
  assert.doesNotMatch(javascriptAdmin, /global\.confirm|window\.confirm|\balert\(|\bprompt\(/);
  assert.doesNotMatch(solicitudesJavascript, /global\.confirm|window\.confirm|\balert\(|\bprompt\(/);
  assert.match(javascript, /opciones\.mostrarEnlace !== false/);
  assert.match(
    html,
    /biblioteca-reglamento-card[\s\S]*?biblioteca-recursos-card/
  );
  assert.match(javascript, /biblioteca-reglamento-card[\s\S]*?biblioteca-documento/);
  assert.match(javascript, /biblioteca-area-card--con-enlace/);
  assert.match(javascript, /textoEnlace: "Ver material"/);
  [
    "comunidad-admin__tarjeta",
    "comunidad-admin__vista",
    "comunidad-admin__vista-contenido",
    "comunidad-seccion__etiqueta",
    "comunidad-seccion__titulo-visual"
  ].forEach((clase) => {
    assert.match(javascriptAdmin, new RegExp(clase));
    assert.match(gestionContenidoJavascript, new RegExp(clase));
  });
  assert.match(javascriptAdmin, /activar \? "PUBLICADO" : "INACTIVO"/);
  assert.match(
    javascriptAdmin,
    /api\.delete\(`\/biblioteca\/colecciones\/\$\{idColeccion\}`\)/
  );
  assert.match(
    repositorio,
    /@modulo IN \(N'HORARIOS', N'BIBLIOTECA'\)/
  );

  assert.match(solicitudesHtml, /id="cuerpoSolicitudesBibliocra"/);
  assert.match(solicitudesHtml, /id="cuerpoDestinatariosBibliocra"/);
  assert.match(solicitudesHtml, /id="modalDestinatarioBibliocra"/);
  assert.match(solicitudesHtml, /Agregar destinatario/);
  assert.match(solicitudesHtml, /id="nombreDestinatarioBibliocra"/);
  assert.match(solicitudesHtml, /id="correoDestinatarioBibliocra"/);
  assert.match(solicitudesHtml, /id="tipoDestinatarioBibliocra"/);
  assert.match(solicitudesHtml, /id="modalGestionSolicitudBibliocra"/);
  assert.doesNotMatch(
    solicitudesHtml,
    /Editar (?:correo|destinatario)/
  );
  assert.match(
    solicitudesJavascript,
    /estado\.maximoDestinatarios = Number\(datos\.maximo\) \|\| 3/
  );
  assert.match(
    solicitudesJavascript,
    /data-eliminar-destinatario/
  );
  assert.match(solicitudesJavascript, /data-gestionar-solicitud/);
  assert.match(
    formularioPublicoHtml,
    /<input[^>]+type="email"[^>]+name="correo"[^>]+maxlength="254"[^>]+required/
  );
  assert.match(repositorioSolicitudes, /FROM dbo\.destinatarios_bibliocra/);
  assert.match(repositorioSolicitudes, /INSERT INTO dbo\.destinatarios_bibliocra/);
  assert.doesNotMatch(
    repositorioSolicitudes,
    new RegExp([
      "destinatarios",
      "solicitudes",
      "bibliocra"
    ].join("_"))
  );
  assert.match(repositorioSolicitudes, /AND nombre = N'Nueva'/);
  assert.match(
    formularioPublico,
    /confirmacion: datosFormulario\.get\("confirmacion"\) === "on"/
  );
});

test("el editor de Inicio conserva los accesos rapidos inactivos", () => {
  verificarColeccionRetirable({
    archivoRelativo: "panel-administrativo/js/modules/paginas-inicio.js",
    marcadorFiltro: "function obtenerAccesos()",
    marcadorDespuesFiltro: "function crearClaveAcceso()",
    marcadorGuardado: "async function guardarAccesosRapidos()",
    marcadorDespuesGuardado: "function agregarAccesoRapido()",
    patronTipo: /esAccesoRapido/,
    nombreColeccion: "los accesos rapidos"
  });
});

test("el editor de Nosotros conserva las normativas inactivas", () => {
  verificarColeccionRetirable({
    archivoRelativo: "panel-administrativo/js/modules/paginas-nosotros.js",
    marcadorFiltro: "function obtenerNormativas()",
    marcadorDespuesFiltro: "function crearClaveNormativa()",
    marcadorGuardado: "async function guardarNormativas()",
    marcadorDespuesGuardado: "function agregarNormativa()",
    patronTipo: /esNormativa/,
    nombreColeccion: "las normativas"
  });
});

test("Nosotros oculta y vuelve a mostrar Mision y Vision segun su estado", () => {
  const codigo = fs.readFileSync(
    path.join(raiz, "frontend-publico/js/nosotros.js"),
    "utf8"
  );
  const visibilidad = extraerBloque(
    codigo,
    "function establecerVisibilidad(",
    "function establecerTexto("
  );

  assert.match(
    visibilidad,
    /style\.setProperty\(\s*["']display["']\s*,\s*["']none["']\s*\)/,
    "Los elementos inactivos deben quedar fuera del diseño visible."
  );
  assert.match(
    visibilidad,
    /style\.removeProperty\(\s*["']display["']\s*\)/,
    "Los elementos publicados deben poder mostrarse nuevamente."
  );
});

test("Oferta academica respeta los estados de sus secciones publicas", () => {
  const codigo = fs.readFileSync(
    path.join(raiz, "frontend-publico/js/oferta-academica.js"),
    "utf8"
  );
  const html = fs.readFileSync(
    path.join(raiz, "frontend-publico/pages/oferta-academica.html"),
    "utf8"
  );
  const renderizado = extraerBloque(
    codigo,
    "function renderizarContenidoGeneral(",
    "function crearBotonFiltro("
  );

  assert.match(html, /id=["']encabezadoOferta["']/);
  assert.match(html, /id=["']encabezadoProgramasOferta["']/);
  assert.match(
    renderizado,
    /establecerVisibilidad\(\s*elementos\.encabezadoOferta,\s*Boolean\(encabezado\)\s*\)/,
    "El encabezado principal debe ocultarse si no esta publicado."
  );
  assert.match(
    renderizado,
    /establecerVisibilidad\(\s*elementos\.encabezadoProgramas,\s*Boolean\(programas\)\s*\)/,
    "El encabezado de programas debe ocultarse si no esta publicado."
  );
  assert.match(
    renderizado,
    /establecerVisibilidad\(\s*elementos\.nota,\s*Boolean\(nota\)\s*\)/,
    "La nota debe ocultarse si no esta publicada."
  );
});

test("Comunidad administra y oculta solo su encabezado", () => {
  const htmlAdmin = fs.readFileSync(
    path.join(raiz, "panel-administrativo/pages/comunidad/comunidad.html"),
    "utf8"
  );
  const jsAdmin = fs.readFileSync(
    path.join(raiz, "panel-administrativo/js/modules/comunidad.js"),
    "utf8"
  );
  const htmlPublico = fs.readFileSync(
    path.join(raiz, "frontend-publico/pages/comunidad.html"),
    "utf8"
  );
  const jsPublico = fs.readFileSync(
    path.join(raiz, "frontend-publico/js/comunidad.js"),
    "utf8"
  );

  assert.match(htmlAdmin, /id=["']formularioEncabezadoComunidad["']/);
  assert.match(jsAdmin, /comun\.guardarPagina\(datos\)/);
  assert.match(htmlPublico, /id=["']tituloEncabezadoComunidad["']/);
  assert.match(htmlPublico, /id=["']descripcionEncabezadoComunidad["']/);
  assert.match(jsPublico, /paginas\/publicas-parciales\/comunidad/);
  assert.match(jsPublico, /encabezadoVisible/);
  assert.match(jsPublico, /error\.statusCode === 404/);
});

test("Contacto administra el encabezado y oculta cada seccion independientemente", () => {
  const htmlAdmin = fs.readFileSync(
    path.join(raiz, "panel-administrativo/pages/paginas-contenido/editar-secciones.html"),
    "utf8"
  );
  const jsAdmin = fs.readFileSync(
    path.join(raiz, "panel-administrativo/js/modules/paginas-contacto.js"),
    "utf8"
  );
  const htmlPublico = fs.readFileSync(
    path.join(raiz, "frontend-publico/pages/contacto-ubicacion.html"),
    "utf8"
  );
  const jsPublico = fs.readFileSync(
    path.join(raiz, "frontend-publico/js/contacto.js"),
    "utf8"
  );

  assert.match(htmlAdmin, /id=["']formularioEncabezadoContacto["']/);
  assert.match(jsAdmin, /comun\.guardarPagina\(datos\)/);
  assert.match(jsPublico, /paginas\/publicas-parciales/);
  assert.match(jsPublico, /encabezadoVisible/);
  assert.match(
    htmlPublico,
    /id=["']bloqueDatosContactoPublico["'][\s\S]*?<\/ul>\s*<\/div>\s*<!--[\s\S]*?UBICACIÓN[\s\S]*?id=["']bloqueUbicacionContactoPublico["']/
  );

  const ocultamientos =
    jsPublico.match(
      /establecerVisibilidad\(\s*bloque,\s*Boolean\(seccion\)\s*\)/g
    ) || [];

  assert.equal(
    ocultamientos.length,
    3,
    "Datos, ubicación y formulario deben respetar su estado por separado."
  );
  assert.match(jsPublico, /paginaNoDisponible/);
});

test("Horarios usa una tabla semanal editable solo en el panel administrativo", () => {
  const htmlAdmin = fs.readFileSync(
    path.join(
      raiz,
      "panel-administrativo/pages/gestion-contenido/gestionar.html"
    ),
    "utf8"
  );
  const jsAdmin = fs.readFileSync(
    path.join(
      raiz,
      "panel-administrativo/js/modules/gestion-contenido-admin.js"
    ),
    "utf8"
  );
  const cssAdmin = fs.readFileSync(
    path.join(
      raiz,
      "panel-administrativo/css/gestion-contenido-admin.css"
    ),
    "utf8"
  );
  const repositorioContenido = fs.readFileSync(
    path.join(
      raiz,
      "backend/src/shared/content-management/sql-contenido.repository.js"
    ),
    "utf8"
  );
  const rutasContenido = fs.readFileSync(
    path.join(
      raiz,
      "backend/src/shared/content-management/crear-contenido.routes.js"
    ),
    "utf8"
  );

  assert.match(htmlAdmin, /id=["']selectorNivelHorario["']/);
  assert.match(htmlAdmin, /id=["']selectorSeccionHorario["']/);
  assert.match(htmlAdmin, /id=["']botonGuardarHorario["']/);
  assert.match(htmlAdmin, /id=["']botonEliminarColeccion["']/);
  assert.match(htmlAdmin, /id=["']botonNuevaSeccionHorario["']/);
  assert.match(htmlAdmin, /id=["']botonEliminarSeccionHorario["']/);
  assert.match(htmlAdmin, /id=["']botonDescargarHorarios["']/);
  assert.match(htmlAdmin, /id=["']modalSeccionHorario["']/);
  assert.match(jsAdmin, /configuracion\.apiBase === ["']horarios["']/);
  assert.match(jsAdmin, /function renderizarEditorHorarios\(/);
  assert.match(jsAdmin, /data-horario-campo=/);
  assert.match(
    jsAdmin,
    /idsEliminados\.map/
  );
  assert.match(
    jsAdmin,
    /Guarde primero los cambios de la tabla antes de publicar la versión/
  );
  assert.match(cssAdmin, /\.horario-admin__tabla th/);
  assert.match(cssAdmin, /background:\s*#2b563a/);
  assert.match(
    jsAdmin,
    /const textoAccion = estaInactivo \? "Activar" : "Desactivar"/
  );
  assert.match(jsAdmin, /function cambiarEstadoHorario\(/);
  assert.match(jsAdmin, /function eliminarFilaHorario\(/);
  assert.match(jsAdmin, /function guardarSeccionHorario\(/);
  assert.match(jsAdmin, /estado\.guardandoSeccionHorario/);
  assert.match(jsAdmin, /estructuraHorarioModificada/);
  assert.match(jsAdmin, /\/elementos\/\$\{idElemento\}\/permanente/);
  assert.match(jsAdmin, /function crearPlantillaSeccionHorario\(/);
  assert.match(jsAdmin, /profesorHorarioModificado/);
  assert.match(jsAdmin, /Sección nueva pendiente de guardar/);
  assert.match(jsAdmin, /function descargarHorariosExcel\(/);
  assert.match(jsAdmin, /function eliminarColeccion\(/);
  assert.match(jsAdmin, /const maximoLeccionesHorario = 16/);
  assert.match(jsAdmin, /titulo: "La posición ya está ocupada"/);
  assert.match(jsAdmin, /global\.ModalAdmin\.confirmar/);
  assert.match(cssAdmin, /\.horario-admin__fila--inactiva td/);
  assert.match(
    repositorioContenido,
    /@solo_publicados = 0 AND\s*@modulo (?:= N'HORARIOS'|IN \(N'HORARIOS', N'BIBLIOTECA'\))/,
    "Los horarios archivados deben seguir disponibles en la administración."
  );
  assert.match(
    rutasContenido,
    /\/elementos\/:idElemento\/permanente/
  );
  assert.match(
    rutasContenido,
    /\/colecciones\/:idColeccion\/secciones\/:seccion/
  );
  assert.match(
    rutasContenido,
    /router\.delete\(\s*"\/colecciones\/:idColeccion"/
  );
  assert.match(
    rutasContenido,
    /\/colecciones\/:idColeccion\/exportar\.xlsx/
  );
  assert.match(
    rutasContenido,
    /\/colecciones\/:idColeccion\/guardar-cambios/
  );
});

test("los módulos visuales reutilizan exactamente el patrón administrativo de Comunidad", () => {
  const html = fs.readFileSync(path.join(raiz, "panel-administrativo/pages/gestion-contenido/gestionar.html"), "utf8");
  const js = fs.readFileSync(path.join(raiz, "panel-administrativo/js/modules/gestion-contenido-admin.js"), "utf8");
  const config = fs.readFileSync(path.join(raiz, "panel-administrativo/js/modules/configuracion-gestion-contenido.js"), "utf8");
  const migracionGaleria = fs.readFileSync(path.join(raiz, "backend/scripts/migrar-imagenes-galeria.js"), "utf8");

  assert.match(html, /formularios-admin\.css/);
  assert.match(html, /class="comunidad-admin__tarjetas"/);
  assert.match(html, /class="gestion-contenido__modal-contenido comunidad-modal"/);
  assert.match(js, /comunidad-admin__cerrar-superior/);
  assert.match(js, /comunidad-admin__desplegable/);
  assert.match(js, />Retirar</);
  assert.match(js, /botonEliminarColeccion\.hidden = !\(esGestionHorarios \|\| usaTarjetas\)/);
  assert.match(config, /boletines:[\s\S]*?importacion: \{ habilitada: false/);
  assert.match(config, /galeria:[\s\S]*?usarTarjetas: true/);
  assert.match(config, /campo\("idArchivo", "Fotografía", "image"/);
  assert.match(config, /campo\("idArchivo", "Imagen", "image"/);
  assert.doesNotMatch(config, /campo\("url", "Fotografía"/);
  assert.match(js, /contenedor\.append\(etiqueta, control, vista\)/);
  assert.match(js, /control\.archivoPendiente/);
  assert.match(js, /await prepararImagenesFormulario\(formulario, datos\)/);
  assert.match(js, /await prepararImagenesFormulario\(evento\.currentTarget, datos\)/);
  assert.match(js, /"\/archivos\/imagenes\/paginas"/);
  assert.match(js, /contenido-tarjetas-admin__imagen-vacia/);
  assert.match(migracionGaleria, /archivoService\.registrarImagenPagina/);
  assert.match(migracionGaleria, /idArchivo/);
  assert.match(migracionGaleria, /url: null/);
  assert.match(migracionGaleria, /categoriaGaleria\(pendiente\.elemento\.titulo\)/);
  assert.match(js, /ORDEN|Orden ocupado|ordenDisponible/);
  assert.match(js, /filtroCategoriaContenido/);
});

test("Boletines ofrece Recordatorio al crear, editar y filtrar", () => {
  const config = fs.readFileSync(path.join(raiz, "panel-administrativo/js/modules/configuracion-gestion-contenido.js"), "utf8");
  const boletines = fs.readFileSync(path.join(raiz, "frontend-publico/pages/boletines.html"), "utf8");
  const migracion = fs.readFileSync(path.join(raiz, "database/migrations/013-recordatorio-boletines.sql"), "utf8");

  assert.match(config, /valor: "recordatorio", etiqueta: "Recordatorio"/);
  assert.match(config, /campo\("categoria", "Tipo", "select"[\s\S]*?opciones: tiposBoletin/);
  assert.match(boletines, /data-filtro="recordatorio"/);
  assert.match(migracion, /JSON_MODIFY/);
  assert.match(migracion, /N'\$\.categoria'/);
  assert.match(migracion, /N'recordatorio'/);
});

test("los cuatro módulos públicos no recuperan contenido local como fallback", () => {
  const boletines = fs.readFileSync(path.join(raiz, "frontend-publico/js/boletines.js"), "utf8");
  const filtros = fs.readFileSync(path.join(raiz, "frontend-publico/js/filtros.js"), "utf8");
  const modulos = fs.readFileSync(path.join(raiz, "frontend-publico/js/contenido-modulos-publico.js"), "utf8");
  const encabezados = fs.readFileSync(path.join(raiz, "frontend-publico/js/encabezado-contenido-publico.js"), "utf8");
  const galeria = fs.readFileSync(path.join(raiz, "frontend-publico/pages/galeria.html"), "utf8");
  const docentes = fs.readFileSync(path.join(raiz, "frontend-publico/pages/directorio-docente.html"), "utf8");
  const recursos = fs.readFileSync(path.join(raiz, "frontend-publico/pages/enlaces-interes.html"), "utf8");
  const paginaBoletines = fs.readFileSync(path.join(raiz, "frontend-publico/pages/boletines.html"), "utf8");

  assert.doesNotMatch(boletines, /cargarJSON\("data\/boletines\.json"\)/);
  assert.doesNotMatch(filtros, /cargarJSON\("data\/(docentes|enlaces)\.json"\)/);
  assert.doesNotMatch(modulos, /Se conserva la galería estática/);
  assert.match(encabezados, /banda\.hidden = true/);
  assert.match(filtros, /function resolverArchivoPublico\(/);
  [galeria, docentes, recursos, paginaBoletines].forEach((pagina) => {
    assert.match(pagina, /<section class="banda" hidden>/);
  });
  assert.doesNotMatch(galeria, /galeria-0\.jpg/);
});
