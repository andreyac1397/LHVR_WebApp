const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const {
  archivoService,
  contenidoServices
} = require("../src/container/dependency-container");
const {
  obtenerConexion,
  cerrarConexion
} = require("../src/config/database");

const RAIZ_BACKEND = path.resolve(__dirname, "..");
const DIRECTORIO_GALERIA = path.resolve(
  RAIZ_BACKEND,
  "..",
  "frontend-publico",
  "assets",
  "img"
);
const MIME_POR_EXTENSION = Object.freeze({
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
});

function contexto(idAdministrador) {
  return {
    idAdministrador,
    direccionIp: "127.0.0.1",
    userAgent: "script-migracion-imagenes-galeria"
  };
}

async function obtenerIdAdministradorCarga() {
  const conexion = await obtenerConexion();
  const resultado = await conexion.request().query(`
    SELECT TOP (1)
      id_administrador AS idAdministrador
    FROM dbo.administradores
    ORDER BY id_administrador;
  `);
  const idAdministrador = Number(resultado.recordset?.[0]?.idAdministrador);

  if (!Number.isInteger(idAdministrador) || idAdministrador <= 0) {
    throw new Error(
      "No existe un administrador para registrar las imágenes iniciales de Galería."
    );
  }

  return idAdministrador;
}

function obtenerNombreGaleria(url) {
  const coincidencia = String(url || "").match(
    /(?:^|\/)\b(galeria-(?:[0-9]|1[0-2])\.(?:jpe?g|png|webp))$/i
  );
  return coincidencia?.[1] || null;
}

function categoriaGaleria(titulo) {
  const valor = String(titulo || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/instalaciones|valores/.test(valor)) return "Instalaciones";
  if (/actividades estudiantiles/.test(valor)) return "Actividades estudiantiles";
  if (/deport|representacion|participacion deportiva/.test(valor)) return "Deporte";
  if (/cultural|artistica|discurso/.test(valor)) return "Cultura y arte";
  if (/exposiciones|proyecto/.test(valor)) return "Proyectos académicos";
  return "Vida institucional";
}

async function prepararArchivo(nombreOriginal) {
  const rutaOrigen = path.join(DIRECTORIO_GALERIA, nombreOriginal);
  const extension = path.extname(nombreOriginal).toLowerCase();
  const mimeType = MIME_POR_EXTENSION[extension];

  if (!mimeType) {
    throw new Error(`Formato no permitido para ${nombreOriginal}.`);
  }

  const directorioDestino = path.join(
    archivoService.obtenerDirectorioUploads(),
    "images",
    "paginas"
  );
  await fs.mkdir(directorioDestino, { recursive: true });

  const nombreAlmacenado = [
    "pagina",
    Date.now(),
    crypto.randomUUID()
  ].join("-") + extension.replace(".jpeg", ".jpg");
  const rutaDestino = path.join(directorioDestino, nombreAlmacenado);

  await fs.copyFile(rutaOrigen, rutaDestino);
  const informacion = await fs.stat(rutaDestino);

  return {
    path: rutaDestino,
    originalname: nombreOriginal,
    filename: nombreAlmacenado,
    mimetype: mimeType,
    size: Number(informacion.size)
  };
}

async function migrarImagenesGaleria() {
  if (path.resolve(process.cwd()) !== RAIZ_BACKEND) {
    throw new Error(
      "Ejecute la migración desde backend para usar su directorio uploads."
    );
  }

  const galeriaService = contenidoServices.galeria;
  const administracion = await galeriaService.obtenerAdministracion();
  const pendientes = [];

  for (const coleccion of administracion.colecciones) {
    const contenido = await galeriaService.obtenerAdministracion({
      idColeccion: coleccion.idColeccion
    });

    contenido.elementos.forEach((elemento) => {
      const nombreArchivo = elemento.idArchivo
        ? null
        : obtenerNombreGaleria(elemento.url);

      if (nombreArchivo) {
        pendientes.push({ elemento, nombreArchivo });
      }
    });
  }

  if (pendientes.length === 0) {
    return { migradas: 0, omitidas: 0 };
  }

  const idAdministrador = await obtenerIdAdministradorCarga();
  const sesion = { idAdministrador };
  const datosContexto = contexto(idAdministrador);
  let migradas = 0;

  for (const pendiente of pendientes) {
    const archivo = await prepararArchivo(pendiente.nombreArchivo);
    const resultadoArchivo = await archivoService.registrarImagenPagina(
      archivo,
      { textoAlternativo: pendiente.elemento.descripcion },
      sesion,
      datosContexto
    );
    const idArchivo = Number(resultadoArchivo.archivo?.idArchivo);

    if (!Number.isInteger(idArchivo) || idArchivo <= 0) {
      throw new Error(
        `No se obtuvo idArchivo para ${pendiente.nombreArchivo}.`
      );
    }

    await galeriaService.guardarElemento(
      {
        ...pendiente.elemento,
        url: null,
        idArchivo,
        datos: {
          ...pendiente.elemento.datos,
          categoria:
            pendiente.elemento.datos?.categoria ||
            categoriaGaleria(pendiente.elemento.titulo)
        }
      },
      datosContexto
    );
    migradas += 1;
  }

  return {
    migradas,
    omitidas: pendientes.length - migradas
  };
}

if (require.main === module) {
  migrarImagenesGaleria()
    .then((resultado) => {
      console.log(
        `Migración de Galería completada: ${resultado.migradas} imágenes asociadas por id_archivo.`
      );
    })
    .catch((error) => {
      console.error("No fue posible migrar las imágenes de Galería:", error.message);
      process.exitCode = 1;
    })
    .finally(() => cerrarConexion());
}

module.exports = migrarImagenesGaleria;
