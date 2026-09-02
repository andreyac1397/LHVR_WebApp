const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);
const horarioController = require(
  "../controllers/horario.controller"
);
const { contenidoServices } = require(
  "../../../container/dependency-container"
);
const ExcelReaderService = require(
  "../../../integrations/excel/excel-reader.service"
);
const ExcelWriterService = require(
  "../../../integrations/excel/excel-writer.service"
);
const { respuestaExitosa } = require(
  "../../../shared/utils/response.util"
);

const router = express.Router();
const lectorExcel = new ExcelReaderService();
const escritorExcel = new ExcelWriterService();
const horarioService = contenidoServices.horarios;
const ENCABEZADOS = [
  "Sección", "Profesor guía", "Lección", "Horario", "Lunes",
  "Martes", "Miércoles", "Jueves", "Viernes"
];
const cargaExcel = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: 8 * 1024 * 1024 },
  fileFilter(_req, archivo, callback) {
    const extensionValida = /\.xlsx$/i.test(archivo.originalname || "");
    const mimeValido = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream"
    ].includes(archivo.mimetype);
    if (!extensionValida || !mimeValido) {
      const error = new Error("Solo se permiten archivos XLSX de hasta 8 MB.");
      error.statusCode = 400;
      error.codigo = "ARCHIVO_EXCEL_NO_PERMITIDO";
      return callback(error);
    }
    return callback(null, true);
  }
});

function descargarPlantilla(_req, res, next) {
  try {
    const archivo = escritorExcel.crear([
      ENCABEZADOS,
      ["7-1", "Nombre del profesor guía", "1", "07:00-07:40",
        "Matemática", "Español", "Ciencias", "Estudios Sociales", "Inglés"]
    ]);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="plantilla-horarios-lhvr.xlsx"');
    res.setHeader("Content-Length", archivo.length);
    return res.status(200).send(archivo);
  } catch (error) { return next(error); }
}

function analizarArchivo(req, res, next) {
  try {
    if (!req.file?.buffer) {
      const error = new Error("Debe seleccionar un archivo XLSX.");
      error.statusCode = 400;
      error.codigo = "ARCHIVO_EXCEL_REQUERIDO";
      throw error;
    }
    return respuestaExitosa(res,
      "El archivo fue leído correctamente. Revise la vista previa antes de guardarlo.",
      lectorExcel.leer(req.file.buffer));
  } catch (error) { return next(error); }
}

function crearHojas(elementos) {
  const grupos = new Map();
  elementos.forEach((elemento) => {
    const seccion = String(elemento.datos?.seccion || "").trim();
    if (!seccion) return;
    if (!grupos.has(seccion)) grupos.set(seccion, []);
    grupos.get(seccion).push(elemento);
  });
  return [...grupos.entries()]
    .sort(([a], [b]) => String(a).localeCompare(String(b), "es", { numeric: true }))
    .map(([seccion, filas]) => ({
      nombre: `Sección ${seccion}`,
      filas: [[...ENCABEZADOS, "Estado"], ...filas
        .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
        .map((elemento) => {
          const d = elemento.datos || {};
          return [seccion, d.profesor_guia || "", d.lec || d.leccion || "",
            d.horas || d.horario || "", d.lunes || "", d.martes || "",
            d.miercoles || "", d.jueves || "", d.viernes || "", elemento.estado || ""];
        })]
    }));
}

function nombreArchivo(coleccion) {
  const base = ["horarios", coleccion.nombre, coleccion.anio]
    .filter(Boolean).join("-").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "horarios-lhvr"}.xlsx`;
}

async function descargarExportacion(req, res, next) {
  try {
    const resultado = await horarioService.exportarColeccion(req.params.idColeccion);
    const hojas = crearHojas(resultado.elementos);
    if (!hojas.length) {
      const error = new Error("No se encontraron secciones válidas para generar el Excel.");
      error.statusCode = 400;
      error.codigo = "HORARIOS_SIN_SECCIONES";
      throw error;
    }
    const archivo = escritorExcel.crearLibro(hojas);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo(resultado.coleccion)}"`);
    res.setHeader("Content-Length", archivo.length);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(archivo);
  } catch (error) { return next(error); }
}

router.get("/publico", horarioController.listarPublico);
router.get("/plantilla.xlsx", descargarPlantilla);
router.use(authenticationMiddleware);
router.get("/administracion", horarioController.obtenerAdministracion);
router.get("/importaciones", horarioController.listarImportaciones);
router.get("/colecciones/:idColeccion/exportar.xlsx", descargarExportacion);
router.post("/analizar-archivo", cargaExcel.single("archivo"), analizarArchivo);
router.post("/colecciones", horarioController.guardarColeccion);
router.post("/colecciones/:idColeccion/publicar", horarioController.publicarColeccion);
router.put("/colecciones/:idColeccion/guardar-cambios", horarioController.guardarCambios);
router.post("/colecciones/:idColeccion/secciones", horarioController.crearSeccion);
router.delete("/colecciones/:idColeccion/secciones/:seccion", horarioController.eliminarSeccion);
router.delete("/colecciones/:idColeccion", horarioController.eliminarColeccion);
router.post("/elementos", horarioController.guardarElemento);
router.put("/elementos/:idElemento", horarioController.actualizarElemento);
router.delete("/elementos/:idElemento/permanente", horarioController.eliminarElemento);
router.delete("/elementos/:idElemento", horarioController.archivarElemento);
router.post("/importar", horarioController.importar);

module.exports = router;
