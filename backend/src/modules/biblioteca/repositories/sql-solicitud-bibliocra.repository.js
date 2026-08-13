const {
  sql,
  obtenerConexion
} = require("../../../config/database");

class SqlSolicitudBibliocraRepository {
  async crear(datos) {
    const conexion = await obtenerConexion();
    const transaccion = new sql.Transaction(conexion);
    await transaccion.begin();

    try {
      const resultado = await new sql.Request(transaccion)
        .input("nombre", sql.NVarChar(180), datos.nombreSolicitante)
        .input("identificacion", sql.NVarChar(30), datos.identificacionSolicitante)
        .input("tipo", sql.NVarChar(40), datos.tipoSolicitante)
        .input("correo", sql.NVarChar(254), datos.correo)
        .input("telefono", sql.NVarChar(30), datos.telefono)
        .input("seccion", sql.NVarChar(50), datos.nivelSeccion)
        .input("observaciones", sql.NVarChar(1500), datos.observacionesSolicitante)
        .input("direccion_ip", sql.NVarChar(45), datos.direccionIp)
        .input("user_agent", sql.NVarChar(500), datos.userAgent)
        .query(`
          DECLARE @id_estado INT;
          SELECT TOP 1 @id_estado = id_estado_solicitud
          FROM dbo.estados_solicitud
          WHERE activo = 1
          ORDER BY CASE WHEN nombre = N'Pendiente' THEN 0 ELSE 1 END, orden;

          IF @id_estado IS NULL
            THROW 51030, N'No existe un estado activo para solicitudes BiblioCRA.', 1;

          INSERT INTO dbo.solicitudes_bibliocra (
            nombre_solicitante, identificacion_solicitante, tipo_solicitante,
            correo, telefono, nivel_seccion, observaciones_solicitante,
            id_estado_solicitud, direccion_ip, user_agent
          )
          VALUES (
            @nombre, @identificacion, @tipo, @correo, @telefono, @seccion,
            @observaciones, @id_estado, @direccion_ip, @user_agent
          );

          SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS id_solicitud_bibliocra;
        `);

      const id = Number(resultado.recordset[0].id_solicitud_bibliocra);

      await new sql.Request(transaccion)
        .input("id", sql.BigInt, id)
        .input("material", sql.NVarChar(250), datos.nombreMaterial)
        .input("tipo_material", sql.NVarChar(120), datos.tipoMaterial)
        .input("observaciones", sql.NVarChar(800), datos.observacionesMaterial)
        .query(`
          INSERT INTO dbo.detalle_solicitud_bibliocra (
            id_solicitud_bibliocra, nombre_material, tipo_material,
            cantidad, observaciones
          )
          VALUES (@id, @material, @tipo_material, 1, @observaciones);
        `);

      await transaccion.commit();
      return { idSolicitudBibliocra: id };
    } catch (error) {
      await transaccion.rollback();
      throw error;
    }
  }

  async listar(filtros = {}) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("estado", sql.Int, filtros.idEstado ?? null)
      .input("busqueda", sql.NVarChar(250), filtros.busqueda ?? null)
      .query(`
        SELECT TOP 500
          s.id_solicitud_bibliocra,
          s.nombre_solicitante,
          s.identificacion_solicitante,
          s.tipo_solicitante,
          s.correo,
          s.telefono,
          s.nivel_seccion,
          s.observaciones_solicitante,
          s.id_estado_solicitud,
          e.nombre AS estado,
          s.observaciones_internas,
          s.fecha_solicitud,
          s.fecha_atencion,
          d.nombre_material,
          d.tipo_material,
          d.observaciones AS observaciones_material
        FROM dbo.solicitudes_bibliocra AS s
        INNER JOIN dbo.estados_solicitud AS e
          ON e.id_estado_solicitud = s.id_estado_solicitud
        LEFT JOIN dbo.detalle_solicitud_bibliocra AS d
          ON d.id_solicitud_bibliocra = s.id_solicitud_bibliocra
        WHERE (@estado IS NULL OR s.id_estado_solicitud = @estado)
          AND (
            @busqueda IS NULL OR
            s.nombre_solicitante LIKE N'%' + @busqueda + N'%' OR
            s.identificacion_solicitante LIKE N'%' + @busqueda + N'%' OR
            d.nombre_material LIKE N'%' + @busqueda + N'%'
          )
        ORDER BY s.fecha_solicitud DESC, s.id_solicitud_bibliocra DESC;

        SELECT id_estado_solicitud, nombre, descripcion, orden
        FROM dbo.estados_solicitud
        WHERE activo = 1
        ORDER BY orden, id_estado_solicitud;
      `);

    return {
      solicitudes: resultado.recordsets[0].map((fila) => ({
        idSolicitudBibliocra: Number(fila.id_solicitud_bibliocra),
        nombreSolicitante: fila.nombre_solicitante,
        identificacionSolicitante: fila.identificacion_solicitante,
        tipoSolicitante: fila.tipo_solicitante,
        correo: fila.correo,
        telefono: fila.telefono,
        nivelSeccion: fila.nivel_seccion,
        observacionesSolicitante: fila.observaciones_solicitante,
        idEstadoSolicitud: Number(fila.id_estado_solicitud),
        estado: fila.estado,
        observacionesInternas: fila.observaciones_internas,
        fechaSolicitud: fila.fecha_solicitud,
        fechaAtencion: fila.fecha_atencion,
        nombreMaterial: fila.nombre_material,
        tipoMaterial: fila.tipo_material,
        observacionesMaterial: fila.observaciones_material
      })),
      estados: resultado.recordsets[1].map((fila) => ({
        idEstadoSolicitud: Number(fila.id_estado_solicitud),
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        orden: Number(fila.orden)
      }))
    };
  }

  async actualizar(datos) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id", sql.BigInt, datos.idSolicitudBibliocra)
      .input("estado", sql.Int, datos.idEstadoSolicitud)
      .input("observaciones", sql.NVarChar(1500), datos.observacionesInternas)
      .input("admin", sql.Int, datos.idAdministrador)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM dbo.estados_solicitud
          WHERE id_estado_solicitud = @estado AND activo = 1
        ) THROW 51031, N'El estado de solicitud no existe o está inactivo.', 1;

        UPDATE dbo.solicitudes_bibliocra
        SET
          id_estado_solicitud = @estado,
          observaciones_internas = @observaciones,
          id_administrador_atencion = @admin,
          fecha_atencion = COALESCE(fecha_atencion, SYSUTCDATETIME())
        WHERE id_solicitud_bibliocra = @id;

        SELECT @@ROWCOUNT AS filas_afectadas;
      `);

    return Number(resultado.recordset[0].filas_afectadas) > 0;
  }
}

module.exports = SqlSolicitudBibliocraRepository;
