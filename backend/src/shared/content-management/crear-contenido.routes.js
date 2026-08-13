const express = require("express");
const multer = require("multer");

const authenticationMiddleware = require(
  "../../middlewares/authentication.middleware"
);

function crearContenidoRoutes(controlador, opciones = {}) {
  const router = express.Router();

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
        callback(error);
        return;
      }

      callback(null, true);
    }
  });

  router.get(
    "/publico",
    controlador.listarPublico
  );

  if (typeof opciones.descargarPlantilla === "function") {
    router.get("/plantilla.xlsx", opciones.descargarPlantilla);
  }

  router.use(authenticationMiddleware);

  router.get(
    "/administracion",
    controlador.obtenerAdministracion
  );

  router.get(
    "/importaciones",
    controlador.listarImportaciones
  );

  if (typeof opciones.analizarArchivo === "function") {
    router.post(
      "/analizar-archivo",
      cargaExcel.single("archivo"),
      opciones.analizarArchivo
    );
  }

  router.post(
    "/colecciones",
    controlador.guardarColeccion
  );

  router.post(
    "/colecciones/:idColeccion/publicar",
    controlador.publicarColeccion
  );

  router.post(
    "/elementos",
    controlador.guardarElemento
  );

  router.put(
    "/elementos/:idElemento",
    controlador.actualizarElemento
  );

  router.delete(
    "/elementos/:idElemento",
    controlador.archivarElemento
  );

  router.post(
    "/importar",
    controlador.importar
  );

  return router;
}

module.exports = crearContenidoRoutes;
