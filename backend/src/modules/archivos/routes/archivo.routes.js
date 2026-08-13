const express = require("express");

const archivoController = require(
  "../controllers/archivo.controller"
);

const authenticationMiddleware = require(
  "../../../middlewares/authentication.middleware"
);

const {
  subirImagenPagina
} = require(
  "../../../middlewares/upload.middleware"
);

const router = express.Router();

/*
 * ============================================================
 * RUTAS DE ARCHIVOS
 * Liceo Hernán Vargas Ramírez
 * ============================================================
 *
 * Ruta base:
 * /api/archivos
 *
 * Todas las rutas de este módulo requieren
 * una sesión administrativa válida.
 * ============================================================
 */


/*
 * ============================================================
 * 1. PROTECCIÓN DE RUTAS
 * ============================================================
 *
 * La autenticación se ejecuta antes de Multer
 * para evitar guardar archivos enviados por
 * usuarios sin una sesión válida.
 */
router.use(
  authenticationMiddleware
);


/*
 * ============================================================
 * 2. SUBIR IMAGEN DE PÁGINA
 * ============================================================
 *
 * Recibe:
 * multipart/form-data
 *
 * Campos:
 * - imagen: archivo JPG, PNG o WEBP.
 * - textoAlternativo: texto opcional.
 *
 * Flujo:
 * 1. Valida la sesión administrativa.
 * 2. Procesa y guarda físicamente la imagen.
 * 3. Registra sus metadatos en SQL Server.
 * 4. Devuelve el idArchivo generado.
 *
 * POST /api/archivos/imagenes/paginas
 */
router.post(
  "/imagenes/paginas",

  subirImagenPagina,

  (
    req,
    res,
    next
  ) =>
    archivoController
      .subirImagenPagina(
        req,
        res,
        next
      )
);

module.exports = router;