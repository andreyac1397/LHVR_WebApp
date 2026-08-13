const express = require("express");

const {
  contenidoServices
} = require("../container/dependency-container");

const ContenidoController = require(
  "../shared/content-management/contenido.controller"
);

const crearContenidoRoutes = require(
  "../shared/content-management/crear-contenido.routes"
);

const ExcelReaderService = require(
  "../integrations/excel/excel-reader.service"
);

const ExcelWriterService = require(
  "../integrations/excel/excel-writer.service"
);

const {
  respuestaExitosa
} = require("../shared/utils/response.util");

const router = express.Router();
const lectorExcel = new ExcelReaderService();
const escritorExcel = new ExcelWriterService();

const ENCABEZADOS_HORARIO = [
  "Sección",
  "Profesor guía",
  "Lección",
  "Horario",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes"
];

function descargarPlantillaHorarios(_req, res, next) {
  try {
    const archivo = escritorExcel.crear([
      ENCABEZADOS_HORARIO,
      [
        "7-1",
        "Nombre del profesor guía",
        "1",
        "07:00-07:40",
        "Matemática",
        "Español",
        "Ciencias",
        "Estudios Sociales",
        "Inglés"
      ]
    ]);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="plantilla-horarios-lhvr.xlsx"'
    );
    res.setHeader("Content-Length", archivo.length);
    return res.status(200).send(archivo);
  } catch (error) {
    return next(error);
  }
}

function analizarArchivoHorarios(req, res, next) {
  try {
    if (!req.file?.buffer) {
      const error = new Error("Debe seleccionar un archivo XLSX.");
      error.statusCode = 400;
      error.codigo = "ARCHIVO_EXCEL_REQUERIDO";
      throw error;
    }

    const datos = lectorExcel.leer(req.file.buffer);

    return respuestaExitosa(
      res,
      "El archivo fue leído correctamente. Revise la vista previa antes de guardarlo.",
      datos
    );
  } catch (error) {
    return next(error);
  }
}

Object.entries(contenidoServices).forEach(([ruta, servicio]) => {
  const controlador = new ContenidoController(servicio);
  const opciones = ruta === "horarios"
    ? {
      descargarPlantilla: descargarPlantillaHorarios,
      analizarArchivo: analizarArchivoHorarios
    }
    : {};

  router.use(
    `/${ruta}`,
    crearContenidoRoutes(controlador, opciones)
  );
});

module.exports = router;
