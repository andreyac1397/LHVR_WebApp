const {
  sql,
  obtenerConexion
} = require("../../../config/database");

class SqlSolicitudBibliocraRepository {
  extraerFechaDevolucion(observaciones) {
    const coincidencia = String(observaciones ?? "").match(
      /Devoluci(?:ó|o)n prevista:\s*(\d{4}-\d{2}-\d{2})/i
    );
    return coincidencia?.[1] || null;
  }

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
          SELECT @id_estado = id_estado_solicitud
          FROM dbo.estados_solicitud
          WHERE activo = 1
            AND nombre = N'Nueva';

          IF @id_estado IS NULL
            THROW 51030, N'No existe el estado activo Nueva para solicitudes BiblioCRA.', 1;

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

      const numero = Number(
        error?.number ??
        error?.originalError?.info?.number
      );
      if (numero === 51030) {
        error.statusCode = 500;
        error.codigo = "ESTADO_NUEVA_BIBLIOCRA_NO_DISPONIBLE";
      }

      throw error;
    }
  }

  async listar(filtros = {}) {
    const pagina = Number.isInteger(Number(filtros.pagina)) &&
      Number(filtros.pagina) > 0
      ? Number(filtros.pagina)
      : 1;
    const limite = Number.isInteger(Number(filtros.limite)) &&
      Number(filtros.limite) > 0
      ? Math.min(100, Number(filtros.limite))
      : 20;
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("estado", sql.Int, filtros.idEstado ?? null)
      .input("busqueda", sql.NVarChar(250), filtros.busqueda ?? null)
      .input("offset", sql.Int, (pagina - 1) * limite)
      .input("limite", sql.Int, limite)
      .query(`
        SELECT
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
        ORDER BY s.fecha_solicitud DESC, s.id_solicitud_bibliocra DESC
        OFFSET @offset ROWS
        FETCH NEXT @limite ROWS ONLY;

        SELECT id_estado_solicitud, nombre, descripcion, orden
        FROM dbo.estados_solicitud
        WHERE activo = 1
        ORDER BY orden, id_estado_solicitud;

        SELECT COUNT(*) AS total_registros
        FROM dbo.solicitudes_bibliocra AS s
        LEFT JOIN dbo.detalle_solicitud_bibliocra AS d
          ON d.id_solicitud_bibliocra = s.id_solicitud_bibliocra
        WHERE (@estado IS NULL OR s.id_estado_solicitud = @estado)
          AND (
            @busqueda IS NULL OR
            s.nombre_solicitante LIKE N'%' + @busqueda + N'%' OR
            s.identificacion_solicitante LIKE N'%' + @busqueda + N'%' OR
            d.nombre_material LIKE N'%' + @busqueda + N'%'
          );
      `);

    const totalRegistros = Number(
      resultado.recordsets[2][0]?.total_registros || 0
    );
    const totalPaginas = Math.max(1, Math.ceil(totalRegistros / limite));

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
        observacionesMaterial: fila.observaciones_material,
        fechaDevolucion: this.extraerFechaDevolucion(
          fila.observaciones_material
        )
      })),
      estados: resultado.recordsets[1].map((fila) => ({
        idEstadoSolicitud: Number(fila.id_estado_solicitud),
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        orden: Number(fila.orden)
      })),
      paginaActual: pagina,
      limite,
      totalRegistros,
      totalPaginas,
      tieneAnterior: pagina > 1,
      tieneSiguiente: pagina < totalPaginas
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
        SET XACT_ABORT ON;

        BEGIN TRY
          BEGIN TRANSACTION;

          IF NOT EXISTS (
            SELECT 1 FROM dbo.estados_solicitud
            WHERE id_estado_solicitud = @estado AND activo = 1
          ) THROW 51031, N'El estado de solicitud no existe o está inactivo.', 1;

          DECLARE @estado_anterior INT;

          SELECT @estado_anterior = id_estado_solicitud
          FROM dbo.solicitudes_bibliocra WITH (UPDLOCK, HOLDLOCK)
          WHERE id_solicitud_bibliocra = @id;

          IF @estado_anterior IS NOT NULL
          BEGIN
            UPDATE dbo.solicitudes_bibliocra
            SET
              id_estado_solicitud = @estado,
              observaciones_internas = @observaciones,
              id_administrador_atencion = @admin,
              fecha_atencion = COALESCE(fecha_atencion, SYSUTCDATETIME())
            WHERE id_solicitud_bibliocra = @id;
          END;

          SELECT TOP (1)
            s.id_solicitud_bibliocra,
            s.nombre_solicitante,
            s.correo,
            s.observaciones_internas,
            s.id_estado_solicitud,
            e.nombre AS estado,
            e.descripcion AS descripcion_estado,
            d.nombre_material,
            @estado_anterior AS id_estado_anterior
          FROM dbo.solicitudes_bibliocra AS s
          INNER JOIN dbo.estados_solicitud AS e
            ON e.id_estado_solicitud = s.id_estado_solicitud
          LEFT JOIN dbo.detalle_solicitud_bibliocra AS d
            ON d.id_solicitud_bibliocra = s.id_solicitud_bibliocra
          WHERE s.id_solicitud_bibliocra = @id;

          COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
          IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
          THROW;
        END CATCH;
      `);

    const fila = resultado.recordset[0];
    if (!fila) {
      return { actualizado: false };
    }

    return {
      actualizado: true,
      cambioEstado:
        Number(fila.id_estado_anterior) !== Number(fila.id_estado_solicitud),
      idSolicitudBibliocra: Number(fila.id_solicitud_bibliocra),
      nombreSolicitante: fila.nombre_solicitante,
      correo: fila.correo,
      idEstadoSolicitud: Number(fila.id_estado_solicitud),
      estado: fila.estado,
      descripcionEstado: fila.descripcion_estado,
      observacionesInternas: fila.observaciones_internas,
      nombreMaterial: fila.nombre_material
    };
  }

  async listarDestinatarios() {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request().query(`
      SELECT
        id_destinatario,
        nombre,
        correo,
        tipo,
        fecha_creacion
      FROM dbo.destinatarios_bibliocra
      ORDER BY nombre, id_destinatario;
    `);

    return resultado.recordset.map((fila) => ({
      idDestinatario: Number(fila.id_destinatario),
      nombre: fila.nombre,
      correo: fila.correo,
      tipo: fila.tipo,
      fechaCreacion: fila.fecha_creacion
    }));
  }

  async agregarDestinatario(datos) {
    const conexion = await obtenerConexion();

    try {
      const resultado = await conexion.request()
        .input("nombre", sql.NVarChar(150), datos.nombre)
        .input("correo", sql.NVarChar(254), datos.correo)
        .input("tipo", sql.NVarChar(30), datos.tipo)
        .query(`
          SET XACT_ABORT ON;
          SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

          BEGIN TRY
            BEGIN TRANSACTION;

            IF EXISTS (
              SELECT 1
              FROM dbo.destinatarios_bibliocra
                WITH (UPDLOCK, HOLDLOCK)
              WHERE correo = @correo
            )
              THROW 51032, N'El correo ya recibe solicitudes BiblioCRA.', 1;

            DECLARE @cantidad INT;

            SELECT @cantidad = COUNT(*)
            FROM dbo.destinatarios_bibliocra
              WITH (UPDLOCK, HOLDLOCK);

            IF @cantidad >= 3
              THROW 51033, N'Solo se permiten tres destinatarios BiblioCRA.', 1;

            INSERT INTO dbo.destinatarios_bibliocra (
              nombre,
              correo,
              tipo
            )
            VALUES (
              @nombre,
              @correo,
              @tipo
            );

            DECLARE @id_destinatario INT = SCOPE_IDENTITY();

            COMMIT TRANSACTION;

            SELECT
              id_destinatario,
              nombre,
              correo,
              tipo,
              fecha_creacion
            FROM dbo.destinatarios_bibliocra
            WHERE id_destinatario = @id_destinatario;
          END TRY
          BEGIN CATCH
            IF XACT_STATE() <> 0
              ROLLBACK TRANSACTION;

            THROW;
          END CATCH;
        `);

      const fila = resultado.recordset[0];
      return {
        idDestinatario: Number(fila.id_destinatario),
        nombre: fila.nombre,
        correo: fila.correo,
        tipo: fila.tipo,
        fechaCreacion: fila.fecha_creacion
      };
    } catch (error) {
      const numero = Number(
        error?.number ??
        error?.originalError?.info?.number
      );

      if ([51032, 2601, 2627].includes(numero)) {
        error.statusCode = 409;
        error.codigo = "DESTINATARIO_BIBLIOCRA_DUPLICADO";
      }

      if (numero === 51033) {
        error.statusCode = 409;
        error.codigo = "MAXIMO_DESTINATARIOS_BIBLIOCRA";
      }

      throw error;
    }
  }

  async eliminarDestinatario(idDestinatario) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id", sql.Int, idDestinatario)
      .query(`
        DELETE FROM dbo.destinatarios_bibliocra
        WHERE id_destinatario = @id;

        SELECT @@ROWCOUNT AS filas_afectadas;
      `);

    return Number(resultado.recordset[0].filas_afectadas) > 0;
  }
}

module.exports = SqlSolicitudBibliocraRepository;
