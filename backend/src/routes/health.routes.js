const express = require("express");

const {
  obtenerConexion
} = require("../config/database");

const {
  respuestaExitosa
} = require("../shared/utils/response.util");

const router = express.Router();

/*
 * GET /api/estado
 * Comprueba que la API y SQL Server estén funcionando.
 */
router.get("/", async (req, res, next) => {
  try {
    const conexion = await obtenerConexion();

    const resultado = await conexion.request().query(`
      SELECT
        DB_NAME() AS base_datos,
        @@SERVERNAME AS servidor,
        GETDATE() AS fecha_servidor;
    `);

    return respuestaExitosa(
      res,
      "Servidor y base de datos funcionando correctamente",
      resultado.recordset[0]
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;