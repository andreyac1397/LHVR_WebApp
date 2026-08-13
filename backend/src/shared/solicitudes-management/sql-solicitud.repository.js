const {
  sql,
  obtenerConexion
} = require("../../config/database");

class SqlSolicitudRepository {
  leerJson(valor) {
    if (!valor) {
      return {};
    }

    if (typeof valor === "object") {
      return valor;
    }

    try {
      return JSON.parse(valor);
    } catch (_error) {
      return {};
    }
  }

  normalizar(fila) {
    return {
      idSolicitud: Number(fila.id_solicitud),
      modulo: fila.modulo,
      nombreCompleto: fila.nombre_completo,
      correo: fila.correo,
      telefono: fila.telefono,
      asunto: fila.asunto,
      mensaje: fila.mensaje,
      estado: fila.estado,
      datos: this.leerJson(fila.datos_json),
      respuesta: fila.respuesta,
      idAdministradorUltimaModificacion:
        fila.id_administrador_ultima_modificacion === null
          ? null
          : Number(
            fila.id_administrador_ultima_modificacion
          ),
      fechaCreacion: fila.fecha_creacion,
      fechaActualizacion: fila.fecha_actualizacion
    };
  }

  async crear(datos) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input("modulo", sql.NVarChar(60), datos.modulo)
      .input(
        "nombre_completo",
        sql.NVarChar(180),
        datos.nombreCompleto
      )
      .input("correo", sql.NVarChar(254), datos.correo)
      .input(
        "telefono",
        sql.NVarChar(40),
        datos.telefono ?? null
      )
      .input(
        "asunto",
        sql.NVarChar(250),
        datos.asunto ?? null
      )
      .input(
        "mensaje",
        sql.NVarChar(sql.MAX),
        datos.mensaje ?? null
      )
      .input(
        "datos_json",
        sql.NVarChar(sql.MAX),
        JSON.stringify(datos.datos || {})
      )
      .query(`
        INSERT INTO dbo.cms_solicitudes (
          modulo,
          nombre_completo,
          correo,
          telefono,
          asunto,
          mensaje,
          estado,
          datos_json
        )
        OUTPUT INSERTED.*
        VALUES (
          @modulo,
          @nombre_completo,
          @correo,
          @telefono,
          @asunto,
          @mensaje,
          N'PENDIENTE',
          @datos_json
        );
      `);

    return this.normalizar(resultado.recordset[0]);
  }

  async listar(modulo, filtros = {}) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input("modulo", sql.NVarChar(60), modulo)
      .input(
        "estado",
        sql.NVarChar(30),
        filtros.estado ?? null
      )
      .input(
        "busqueda",
        sql.NVarChar(250),
        filtros.busqueda ?? null
      )
      .query(`
        SELECT TOP 500
          id_solicitud,
          modulo,
          nombre_completo,
          correo,
          telefono,
          asunto,
          mensaje,
          estado,
          datos_json,
          respuesta,
          id_administrador_ultima_modificacion,
          fecha_creacion,
          fecha_actualizacion
        FROM dbo.cms_solicitudes
        WHERE modulo = @modulo
          AND (
            @estado IS NULL OR
            estado = @estado
          )
          AND (
            @busqueda IS NULL OR
            nombre_completo LIKE N'%' + @busqueda + N'%' OR
            correo LIKE N'%' + @busqueda + N'%' OR
            asunto LIKE N'%' + @busqueda + N'%'
          )
        ORDER BY
          CASE estado
            WHEN N'PENDIENTE' THEN 0
            WHEN N'EN_PROCESO' THEN 1
            ELSE 2
          END,
          fecha_creacion DESC;
      `);

    return resultado.recordset.map(
      (fila) => this.normalizar(fila)
    );
  }

  async actualizar(datos) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_solicitud",
        sql.Int,
        datos.idSolicitud
      )
      .input("modulo", sql.NVarChar(60), datos.modulo)
      .input("estado", sql.NVarChar(30), datos.estado)
      .input(
        "respuesta",
        sql.NVarChar(sql.MAX),
        datos.respuesta ?? null
      )
      .input(
        "id_administrador",
        sql.Int,
        datos.idAdministrador ?? null
      )
      .query(`
        UPDATE dbo.cms_solicitudes
        SET
          estado = @estado,
          respuesta = @respuesta,
          id_administrador_ultima_modificacion =
            @id_administrador,
          fecha_actualizacion = SYSUTCDATETIME()
        WHERE id_solicitud = @id_solicitud
          AND modulo = @modulo;

        IF @@ROWCOUNT = 0
        BEGIN
          THROW 51101,
            N'No se encontró la solicitud indicada.',
            1;
        END;

        SELECT
          id_solicitud,
          modulo,
          nombre_completo,
          correo,
          telefono,
          asunto,
          mensaje,
          estado,
          datos_json,
          respuesta,
          id_administrador_ultima_modificacion,
          fecha_creacion,
          fecha_actualizacion
        FROM dbo.cms_solicitudes
        WHERE id_solicitud = @id_solicitud;
      `);

    return this.normalizar(resultado.recordset[0]);
  }
}

module.exports = SqlSolicitudRepository;
