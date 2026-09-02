const fs = require("node:fs/promises");
const path = require("node:path");

const { contenidoServices } = require(
  "../src/container/dependency-container"
);
const boletinService = contenidoServices.boletines;
const calendarioService = contenidoServices.calendario;
const docenteService = contenidoServices.docentes;
const horarioService = contenidoServices.horarios;
const tramiteService = contenidoServices.tramites;
const recursoApoyoService = contenidoServices["recursos-apoyo"];
const galeriaService = contenidoServices.galeria;
const migrarImagenesGaleria = require(
  "./migrar-imagenes-galeria"
);

const {
  cerrarConexion
} = require("../src/config/database");

const RAIZ_PROYECTO = path.resolve(__dirname, "../..");
const DIRECTORIO_DATOS = path.join(
  RAIZ_PROYECTO,
  "frontend-publico",
  "data"
);
const MODULOS_SOLICITADOS = new Set(
  String(process.env.LHVR_CONTENIDO_MODULOS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
);
const CLAVES_MODULO = {
  Boletines: "boletines",
  Calendario: "calendario",
  Docentes: "docentes",
  Horarios: "horarios",
  "Trámites": "tramites",
  "Recursos de apoyo": "recursos-apoyo",
  "Galería": "galeria"
};

function texto(valor) {
  return valor === null || valor === undefined
    ? ""
    : String(valor).trim();
}

async function leerJson(nombreArchivo) {
  const contenido = await fs.readFile(
    path.join(DIRECTORIO_DATOS, nombreArchivo),
    "utf8"
  );

  return JSON.parse(contenido);
}

function separarCsv(linea, separador = ",") {
  const celdas = [];
  let celda = "";
  let entreComillas = false;

  for (let indice = 0; indice < linea.length; indice += 1) {
    const caracter = linea[indice];
    const siguiente = linea[indice + 1];

    if (caracter === '"' && entreComillas && siguiente === '"') {
      celda += '"';
      indice += 1;
    } else if (caracter === '"') {
      entreComillas = !entreComillas;
    } else if (caracter === separador && !entreComillas) {
      celdas.push(celda.trim());
      celda = "";
    } else {
      celda += caracter;
    }
  }

  celdas.push(celda.trim());
  return celdas;
}

async function leerCsv(nombreArchivo) {
  const contenido = await fs.readFile(
    path.join(DIRECTORIO_DATOS, nombreArchivo),
    "utf8"
  );
  const lineas = contenido
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((linea) => linea.trim());
  const encabezados = separarCsv(lineas[0]);

  return lineas.slice(1).map((linea) => {
    const valores = separarCsv(linea);
    return encabezados.reduce((fila, encabezado, indice) => {
      fila[encabezado] = valores[indice] ?? "";
      return fila;
    }, {});
  });
}

async function importarSiEstaVacio(
  nombre,
  servicio,
  datos
) {
  const claveModulo = CLAVES_MODULO[nombre];
  if (
    MODULOS_SOLICITADOS.size > 0 &&
    !MODULOS_SOLICITADOS.has(claveModulo)
  ) {
    return;
  }

  const administracion = await servicio.obtenerAdministracion();

  if (administracion.colecciones.length > 0) {
    console.log(
      `[omitido] ${nombre}: ya existen versiones administrativas.`
    );
    return;
  }

  const resultado = await servicio.importar(
    datos,
    {
      idAdministrador: null,
      direccionIp: "127.0.0.1",
      userAgent: "script-inicializacion-contenido"
    }
  );

  console.log(
    `[creado] ${nombre}: ${resultado.cantidadGuardada} registros.`
  );
}

async function inicializar() {
  const boletines = await leerJson("boletines.json");
  const calendario = await leerJson("calendario.json");
  const docentes = await leerJson("docentes.json");
  const tramites = await leerJson("documentos.json");
  const recursos = await leerJson("enlaces.json");
  const horarios = await leerCsv("horarios.csv");
  const galeria = [
    ["galeria-0.jpg", "Instalaciones del liceo", "Entrada e instalaciones del Liceo Hernán Vargas Ramírez"],
    ["galeria-2.jpg", "Actividades estudiantiles", "Actividad estudiantil en espacio techado del liceo"],
    ["galeria-3.jpg", "Representación deportiva", "Estudiantes representantes en actividades deportivas"],
    ["galeria-4.jpg", "Participación deportiva", "Estudiantes participando en actividades deportivas del liceo"],
    ["galeria-5.jpg", "Discurso de la directora", "Participación cultural y académica en la institución"],
    ["galeria-6.jpg", "Actividad institucional", "Actividad institucional realizada en las instalaciones del liceo"],
    ["galeria-7.jpg", "Exposiciones", "Exposición de proyectos y materiales elaborados por estudiantes"],
    ["galeria-8.jpg", "Vida escolar", "Grupo de estudiantes y personal durante actividad educativa"],
    ["galeria-9.jpg", "Valores institucionales", "Escaleras decoradas con valores institucionales"],
    ["galeria-10.jpg", "Acto cívico", "Estudiantes reunidos en actividad de convivencia escolar"],
    ["galeria-11.jpg", "Actividad artística", "Actividad artística y educativa dentro del liceo"],
    ["galeria-12.jpg", "Ganadores estudiantiles", "Estudiantes representando a la comunidad educativa del liceo"],
    ["galeria-1.jpg", "Actividad cultural", "Actividad cultural con participación estudiantil"]
  ];

  await importarSiEstaVacio(
    "Boletines",
    boletinService,
    {
      nombre: "Boletines iniciales 2026",
      anio: 2026,
      publicar: true,
      reemplazar: true,
      tipoOrigen: "JSON",
      nombreOrigen: "boletines.json",
      elementos: boletines.map((item, indice) => ({
        claveExterna: `boletin-${indice + 1}`,
        titulo: item.titulo,
        descripcion: item.resumen,
        fechaInicio: item.fecha,
        url: item.enlace,
        estado: "PUBLICADO",
        orden: indice,
        datos: {
          categoria: item.categoria
        }
      }))
    }
  );

  await importarSiEstaVacio(
    "Calendario",
    calendarioService,
    {
      nombre: "Calendario MEP 2026",
      anio: 2026,
      publicar: true,
      reemplazar: true,
      tipoOrigen: "JSON",
      nombreOrigen: "calendario.json",
      elementos: calendario.map((item, indice) => ({
        claveExterna: texto(item.id) || `evento-${indice + 1}`,
        titulo: item.titulo,
        descripcion: item.descripcion,
        fechaInicio: item.fechaInicio,
        fechaFin: item.fechaFin || item.fechaInicio,
        url: item.link,
        urlSecundaria: item.link2,
        destacado: Boolean(item.destacado),
        estado: "PUBLICADO",
        orden: indice,
        datos: {
          idOriginal: item.id ?? null,
          nombreCategoria: item.nombreCategoria || "General",
          subcategorias: Array.isArray(item.subcategorias)
            ? item.subcategorias
            : [],
          datosOriginales: item
        }
      }))
    }
  );

  await importarSiEstaVacio(
    "Docentes",
    docenteService,
    {
      nombre: "Directorio docente inicial",
      anio: 2026,
      publicar: true,
      reemplazar: true,
      tipoOrigen: "JSON",
      nombreOrigen: "docentes.json",
      elementos: docentes.map((item, indice) => ({
        claveExterna: `docente-${indice + 1}`,
        titulo: item.nombre,
        subtitulo: item.area,
        descripcion: null,
        estado: "PUBLICADO",
        orden: indice,
        datos: {
          nombre: item.nombre,
          area: item.area,
          departamento: item.area,
          correo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.correo)
            ? item.correo
            : ""
        }
      }))
    }
  );

  await importarSiEstaVacio(
    "Horarios",
    horarioService,
    {
      nombre: "Horario lectivo 2026",
      anio: 2026,
      alcance: "TOTAL",
      publicar: true,
      reemplazar: true,
      tipoOrigen: "CSV",
      nombreOrigen: "horarios.csv",
      elementos: horarios.map((fila, indice) => ({
        claveExterna:
          `${fila.seccion}-${fila.lec || indice + 1}-${indice + 1}`,
        titulo:
          `${fila.seccion} · ${fila.horas || `Lección ${fila.lec}`}`,
        descripcion: fila.profesor_guia || "",
        estado: "PUBLICADO",
        orden: indice,
        datos: { ...fila }
      }))
    }
  );

  await importarSiEstaVacio(
    "Trámites",
    tramiteService,
    {
      nombre: "Trámites y documentos iniciales",
      anio: 2026,
      publicar: true,
      reemplazar: true,
      tipoOrigen: "JSON",
      nombreOrigen: "documentos.json",
      elementos: tramites.map((item, indice) => ({
        claveExterna: `tramite-${indice + 1}`,
        titulo: item.titulo,
        descripcion: item.descripcion,
        url: item.archivo,
        estado: "PUBLICADO",
        orden: indice,
        datos: {
          categoria: item.categoria
        }
      }))
    }
  );

  await importarSiEstaVacio(
    "Recursos de apoyo",
    recursoApoyoService,
    {
      nombre: "Recursos de apoyo iniciales",
      anio: 2026,
      publicar: true,
      reemplazar: true,
      tipoOrigen: "JSON",
      nombreOrigen: "enlaces.json",
      elementos: recursos.map((item, indice) => ({
        claveExterna: `recurso-${indice + 1}`,
        titulo: item.titulo,
        descripcion: item.descripcion,
        url: item.url,
        estado: "PUBLICADO",
        orden: indice,
        datos: {
          publico: item.publico
        }
      }))
    }
  );

  await importarSiEstaVacio(
    "Galería",
    galeriaService,
    {
      nombre: "Galería institucional inicial",
      anio: 2026,
      publicar: true,
      reemplazar: true,
      tipoOrigen: "HTML",
      nombreOrigen: "galeria.html",
      elementos: galeria.map(([archivo, titulo, descripcion], indice) => ({
        claveExterna: `galeria-${indice + 1}`,
        titulo,
        descripcion,
        url: `../assets/img/${archivo}`,
        estado: "PUBLICADO",
        orden: indice,
        datos: {
          categoria: titulo.includes("deport") || titulo.includes("Representación")
            ? "Deporte"
            : titulo.includes("cultural") || titulo.includes("artística")
              ? "Cultura y arte"
              : titulo.includes("Instalaciones") || titulo.includes("Valores")
                ? "Instalaciones"
                : titulo.includes("Exposiciones")
                  ? "Proyectos académicos"
                  : "Vida institucional"
        }
      }))
    }
  );

  if (
    MODULOS_SOLICITADOS.size === 0 ||
    MODULOS_SOLICITADOS.has("galeria")
  ) {
    const resultadoMigracion = await migrarImagenesGaleria();
    console.log(
      `[galería] ${resultadoMigracion.migradas} imágenes iniciales asociadas por id_archivo.`
    );
  }
}

if (require.main === module) {
  inicializar()
    .then(() => {
      console.log("Contenido público inicializado correctamente.");
    })
    .catch((error) => {
      console.error(
        "No fue posible inicializar el contenido:",
        error.message
      );
      process.exitCode = 1;
    })
    .finally(() => cerrarConexion());
}

module.exports = inicializar;
