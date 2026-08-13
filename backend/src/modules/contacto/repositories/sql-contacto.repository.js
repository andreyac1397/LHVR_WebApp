const {
  sql,
  obtenerConexion
} = require("../../../config/database");

class SqlContactoRepository {
  normalizar(fila) {
    if (!fila) return null;

    return {
      idSolicitudContacto: Number(fila.id_solicitud_contacto),
      nombreCompleto: fila.nombre_completo,
      correo: fila.correo,
      asunto: fila.asunto,
      mensaje: fila.mensaje,
      idEstadoSolicitudContacto: Number(fila.id_estado_solicitud_contacto),
      estado: fila.estado,
      fechaEnvio: fila.fecha_envio,
      fechaLectura: fila.fecha_lectura,
      fechaRespuesta: fila.fecha_respuesta,
      fechaCierre: fila.fecha_cierre,
      idAdministradorAtencion: fila.id_administrador_atencion === null
        ? null
        : Number(fila.id_administrador_atencion),
      observacionInterna: fila.observacion_interna,
      esSpam: Boolean(fila.es_spam)
    };
  }

  async crear(datos) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("nombre", sql.NVarChar(180), datos.nombreCompleto)
      .input("correo", sql.NVarChar(254), datos.correo)
      .input("asunto", sql.NVarChar(250), datos.asunto)
      .input("mensaje", sql.NVarChar(4000), datos.mensaje)
      .input("direccion_ip", sql.NVarChar(45), datos.direccionIp)
      .input("user_agent", sql.NVarChar(500), datos.userAgent)
      .query(`
        DECLARE @id_estado INT;

        SELECT TOP 1 @id_estado = id_estado_solicitud_contacto
        FROM dbo.estados_solicitud_contacto
        WHERE activo = 1
        ORDER BY CASE WHEN nombre = N'Nuevo' THEN 0 ELSE 1 END, orden;

        IF @id_estado IS NULL
          THROW 51020, N'No existe un estado activo para recibir mensajes.', 1;

        INSERT INTO dbo.solicitudes_contacto (
          nombre_completo, correo, asunto, mensaje,
          id_estado_solicitud_contacto, direccion_ip, user_agent
        )
        VALUES (
          @nombre, @correo, @asunto, @mensaje,
          @id_estado, @direccion_ip, @user_agent
        );

        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS id_solicitud_contacto;
      `);

    return {
      idSolicitudContacto: Number(resultado.recordset[0].id_solicitud_contacto)
    };
  }

  async listar(filtros = {}) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("estado", sql.Int, filtros.idEstado ?? null)
      .input("busqueda", sql.NVarChar(250), filtros.busqueda ?? null)
      .query(`
        SELECT TOP 500
          s.id_solicitud_contacto,
          s.nombre_completo,
          s.correo,
          s.asunto,
          s.mensaje,
          s.id_estado_solicitud_contacto,
          e.nombre AS estado,
          s.fecha_envio,
          s.fecha_lectura,
          s.fecha_respuesta,
          s.fecha_cierre,
          s.id_administrador_atencion,
          s.observacion_interna,
          s.es_spam
        FROM dbo.solicitudes_contacto AS s
        INNER JOIN dbo.estados_solicitud_contacto AS e
          ON e.id_estado_solicitud_contacto = s.id_estado_solicitud_contacto
        WHERE (@estado IS NULL OR s.id_estado_solicitud_contacto = @estado)
          AND (
            @busqueda IS NULL OR
            s.nombre_completo LIKE N'%' + @busqueda + N'%' OR
            s.correo LIKE N'%' + @busqueda + N'%' OR
            s.asunto LIKE N'%' + @busqueda + N'%'
          )
        ORDER BY s.fecha_envio DESC, s.id_solicitud_contacto DESC;

        SELECT
          id_estado_solicitud_contacto,
          nombre,
          descripcion,
          orden
        FROM dbo.estados_solicitud_contacto
        WHERE activo = 1
        ORDER BY orden, id_estado_solicitud_contacto;
      `);

    return {
      solicitudes: resultado.recordsets[0].map((fila) => this.normalizar(fila)),
      estados: resultado.recordsets[1].map((fila) => ({
        idEstadoSolicitudContacto: Number(fila.id_estado_solicitud_contacto),
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        orden: Number(fila.orden)
      }))
    };
  }

  async actualizar(datos) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id", sql.BigInt, datos.idSolicitudContacto)
      .input("id_estado", sql.Int, datos.idEstadoSolicitudContacto)
      .input("observacion", sql.NVarChar(1500), datos.observacionInterna)
      .input("es_spam", sql.Bit, datos.esSpam)
      .input("id_admin", sql.Int, datos.idAdministrador)
      .query(`
        DECLARE @nombre_estado NVARCHAR(80);

        SELECT @nombre_estado = nombre
        FROM dbo.estados_solicitud_contacto
        WHERE id_estado_solicitud_contacto = @id_estado AND activo = 1;

        IF @nombre_estado IS NULL
          THROW 51021, N'El estado indicado no existe o está inactivo.', 1;

        UPDATE dbo.solicitudes_contacto
        SET
          id_estado_solicitud_contacto = @id_estado,
          observacion_interna = @observacion,
          es_spam = @es_spam,
          id_administrador_atencion = @id_admin,
          fecha_lectura = CASE
            WHEN fecha_lectura IS NULL AND @nombre_estado <> N'Nuevo'
              THEN SYSUTCDATETIME()
            ELSE fecha_lectura
          END,
          fecha_respuesta = CASE
            WHEN fecha_respuesta IS NULL AND @nombre_estado = N'Respondido'
              THEN SYSUTCDATETIME()
            ELSE fecha_respuesta
          END,
          fecha_cierre = CASE
            WHEN @nombre_estado IN (N'Archivado', N'Descartado')
              THEN COALESCE(fecha_cierre, SYSUTCDATETIME())
            ELSE fecha_cierre
          END
        WHERE id_solicitud_contacto = @id;

        SELECT @@ROWCOUNT AS filas_afectadas;
      `);

    return Number(resultado.recordset[0].filas_afectadas) > 0;
  }
}

module.exports = SqlContactoRepository;
