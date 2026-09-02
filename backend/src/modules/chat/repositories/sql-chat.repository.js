const {
  sql,
  obtenerConexion
} = require("../../../config/database");

class SqlChatRepository {
  normalizarConversacion(fila, incluirAdministracion = false) {
    if (!fila) {
      return null;
    }

    const conversacion = {
      idConversacion: Number(fila.id_conversacion),
      nombreCompleto: fila.nombre_completo,
      cedula: fila.cedula,
      idEstadoChat: Number(fila.id_estado_chat),
      estado: fila.estado,
      fechaCreacion: fila.fecha_creacion,
      fechaUltimaActividad: fila.fecha_ultima_actividad,
      fechaAtencion: fila.fecha_atencion,
      fechaCierre: fila.fecha_cierre
    };

    if (incluirAdministracion) {
      conversacion.idAdministradorAtencion =
        fila.id_administrador_atencion === null
          ? null
          : Number(fila.id_administrador_atencion);
      conversacion.administradorAtencion =
        fila.administrador_atencion || null;
      conversacion.mensajesNoLeidos =
        Number(fila.mensajes_no_leidos || 0);
    }

    return conversacion;
  }

  normalizarMensaje(fila, incluirAdministrador = false) {
    const mensaje = {
      idMensaje: Number(fila.id_mensaje),
      idConversacion: Number(fila.id_conversacion),
      tipoRemitente: fila.tipo_remitente,
      mensaje: fila.mensaje,
      fechaEnvio: fila.fecha_envio,
      fechaLectura: fila.fecha_lectura
    };

    if (incluirAdministrador) {
      mensaje.idAdministrador = fila.id_administrador === null
        ? null
        : Number(fila.id_administrador);
      mensaje.administrador = fila.administrador || null;
    }

    return mensaje;
  }

  mapearError(error) {
    const numero = Number(
      error?.number ??
      error?.originalError?.info?.number
    );
    const configuracion = {
      51100: [500, "ESTADO_NUEVO_CHAT_NO_DISPONIBLE"],
      51101: [401, "TOKEN_CHAT_INVALIDO"],
      51102: [409, "CONVERSACION_CHAT_CERRADA"],
      51103: [404, "CONVERSACION_CHAT_NO_ENCONTRADA"],
      51104: [500, "ESTADO_ATENCION_CHAT_NO_DISPONIBLE"],
      51105: [500, "ESTADO_CERRADO_CHAT_NO_DISPONIBLE"],
      51106: [409, "TRANSICION_ESTADO_CHAT_INVALIDA"],
      51107: [500, "ESTADO_ARCHIVADO_CHAT_NO_DISPONIBLE"]
    }[numero];

    if (configuracion) {
      [error.statusCode, error.codigo] = configuracion;
    }

    return error;
  }

  async crearConversacion(datos) {
    const conexion = await obtenerConexion();

    try {
      const resultado = await conexion.request()
        .input("nombre", sql.NVarChar(180), datos.nombreCompleto)
        .input("cedula", sql.NVarChar(30), datos.cedula)
        .input("token_hash", sql.VarChar(64), datos.tokenAccesoHash)
        .input("direccion_ip", sql.NVarChar(45), datos.direccionIp)
        .input("user_agent", sql.NVarChar(500), datos.userAgent)
        .query(`
          DECLARE @id_estado INT;

          SELECT TOP (1) @id_estado = id_estado_chat
          FROM dbo.estados_chat
          WHERE nombre = N'Nuevo'
          ORDER BY id_estado_chat;

          IF @id_estado IS NULL
            THROW 51100, N'No existe el estado Nuevo para iniciar el chat.', 1;

          INSERT INTO dbo.chat_conversaciones (
            nombre_completo,
            cedula,
            token_acceso_hash,
            id_estado_chat,
            id_administrador_atencion,
            fecha_creacion,
            fecha_ultima_actividad,
            fecha_atencion,
            fecha_cierre,
            direccion_ip,
            user_agent
          )
          VALUES (
            @nombre,
            @cedula,
            @token_hash,
            @id_estado,
            NULL,
            SYSUTCDATETIME(),
            SYSUTCDATETIME(),
            NULL,
            NULL,
            @direccion_ip,
            @user_agent
          );

          DECLARE @id_conversacion BIGINT = SCOPE_IDENTITY();

          SELECT
            c.id_conversacion,
            c.nombre_completo,
            c.cedula,
            c.id_estado_chat,
            e.nombre AS estado,
            c.fecha_creacion,
            c.fecha_ultima_actividad,
            c.fecha_atencion,
            c.fecha_cierre
          FROM dbo.chat_conversaciones AS c
          INNER JOIN dbo.estados_chat AS e
            ON e.id_estado_chat = c.id_estado_chat
          WHERE c.id_conversacion = @id_conversacion;
        `);

      return this.normalizarConversacion(resultado.recordset[0]);
    } catch (error) {
      throw this.mapearError(error);
    }
  }

  async buscarConversacionPublica(tokenAccesoHash) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("token_hash", sql.VarChar(64), tokenAccesoHash)
      .query(`
        SELECT TOP (1)
          c.id_conversacion,
          c.nombre_completo,
          c.cedula,
          c.id_estado_chat,
          e.nombre AS estado,
          c.fecha_creacion,
          c.fecha_ultima_actividad,
          c.fecha_atencion,
          c.fecha_cierre
        FROM dbo.chat_conversaciones AS c
        INNER JOIN dbo.estados_chat AS e
          ON e.id_estado_chat = c.id_estado_chat
        WHERE c.token_acceso_hash = @token_hash;
      `);

    return this.normalizarConversacion(resultado.recordset[0]);
  }

  async listarMensajesPublicos(tokenAccesoHash) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("token_hash", sql.VarChar(64), tokenAccesoHash)
      .query(`
        SELECT
          m.id_mensaje,
          m.id_conversacion,
          m.tipo_remitente,
          m.mensaje,
          m.fecha_envio,
          m.fecha_lectura
        FROM dbo.chat_mensajes AS m
        INNER JOIN dbo.chat_conversaciones AS c
          ON c.id_conversacion = m.id_conversacion
        WHERE c.token_acceso_hash = @token_hash
        ORDER BY m.fecha_envio, m.id_mensaje;
      `);

    return resultado.recordset.map((fila) =>
      this.normalizarMensaje(fila)
    );
  }

  async crearMensajeExterno(datos) {
    const conexion = await obtenerConexion();
    const transaccion = new sql.Transaction(conexion);
    await transaccion.begin();

    try {
      const resultado = await new sql.Request(transaccion)
        .input("token_hash", sql.VarChar(64), datos.tokenAccesoHash)
        .input("mensaje", sql.NVarChar(4000), datos.mensaje)
        .query(`
          DECLARE @id_conversacion BIGINT;
          DECLARE @estado NVARCHAR(80);

          SELECT TOP (1)
            @id_conversacion = c.id_conversacion,
            @estado = e.nombre
          FROM dbo.chat_conversaciones AS c WITH (UPDLOCK, HOLDLOCK)
          INNER JOIN dbo.estados_chat AS e
            ON e.id_estado_chat = c.id_estado_chat
          WHERE c.token_acceso_hash = @token_hash;

          IF @id_conversacion IS NULL
            THROW 51101, N'El acceso a la conversación no es válido.', 1;

          IF @estado IN (N'Cerrado', N'Archivado')
            THROW 51102, N'La conversación fue cerrada por el liceo.', 1;

          INSERT INTO dbo.chat_mensajes (
            id_conversacion,
            tipo_remitente,
            id_administrador,
            mensaje,
            fecha_envio,
            fecha_lectura
          )
          VALUES (
            @id_conversacion,
            N'EXTERNO',
            NULL,
            @mensaje,
            SYSUTCDATETIME(),
            NULL
          );

          UPDATE dbo.chat_conversaciones
          SET fecha_ultima_actividad = SYSUTCDATETIME()
          WHERE id_conversacion = @id_conversacion;

          DECLARE @id_mensaje BIGINT = SCOPE_IDENTITY();

          SELECT
            id_mensaje,
            id_conversacion,
            tipo_remitente,
            mensaje,
            fecha_envio,
            fecha_lectura
          FROM dbo.chat_mensajes
          WHERE id_mensaje = @id_mensaje;
        `);

      await transaccion.commit();
      return this.normalizarMensaje(resultado.recordset[0]);
    } catch (error) {
      await transaccion.rollback();
      throw this.mapearError(error);
    }
  }

  async marcarMensajesAdministradorLeidos(tokenAccesoHash) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("token_hash", sql.VarChar(64), tokenAccesoHash)
      .query(`
        UPDATE m
        SET fecha_lectura = SYSUTCDATETIME()
        FROM dbo.chat_mensajes AS m
        INNER JOIN dbo.chat_conversaciones AS c
          ON c.id_conversacion = m.id_conversacion
        WHERE c.token_acceso_hash = @token_hash
          AND m.tipo_remitente = N'ADMINISTRADOR'
          AND m.fecha_lectura IS NULL;

        SELECT @@ROWCOUNT AS filas_afectadas;
      `);

    return Number(resultado.recordset[0].filas_afectadas);
  }

  async listarConversaciones(filtros = {}) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("estado", sql.Int, filtros.idEstadoChat ?? null)
      .input("busqueda", sql.NVarChar(180), filtros.busqueda ?? null)
      .query(`
        SELECT TOP (300)
          c.id_conversacion,
          c.nombre_completo,
          c.cedula,
          c.id_estado_chat,
          e.nombre AS estado,
          c.id_administrador_atencion,
          a.nombre_completo AS administrador_atencion,
          c.fecha_creacion,
          c.fecha_ultima_actividad,
          c.fecha_atencion,
          c.fecha_cierre,
          (
            SELECT COUNT(*)
            FROM dbo.chat_mensajes AS m
            WHERE m.id_conversacion = c.id_conversacion
              AND m.tipo_remitente = N'EXTERNO'
              AND m.fecha_lectura IS NULL
          ) AS mensajes_no_leidos
        FROM dbo.chat_conversaciones AS c
        INNER JOIN dbo.estados_chat AS e
          ON e.id_estado_chat = c.id_estado_chat
        LEFT JOIN dbo.administradores AS a
          ON a.id_administrador = c.id_administrador_atencion
        WHERE (
            (@estado IS NULL AND e.nombre <> N'Archivado') OR
            c.id_estado_chat = @estado
          )
          AND (
            @busqueda IS NULL OR
            c.nombre_completo LIKE N'%' + @busqueda + N'%' OR
            c.cedula LIKE N'%' + @busqueda + N'%'
          )
        ORDER BY c.fecha_ultima_actividad DESC, c.id_conversacion DESC;

        SELECT id_estado_chat, nombre
        FROM dbo.estados_chat
        WHERE nombre IN (N'Nuevo', N'En atención', N'Cerrado', N'Archivado')
        ORDER BY id_estado_chat;

        SELECT COUNT(*) AS total_no_leidos
        FROM dbo.chat_mensajes AS m
        INNER JOIN dbo.chat_conversaciones AS c
          ON c.id_conversacion = m.id_conversacion
        INNER JOIN dbo.estados_chat AS e
          ON e.id_estado_chat = c.id_estado_chat
        WHERE m.tipo_remitente = N'EXTERNO'
          AND m.fecha_lectura IS NULL
          AND e.nombre <> N'Archivado';
      `);

    return {
      conversaciones: resultado.recordsets[0].map((fila) =>
        this.normalizarConversacion(fila, true)
      ),
      estados: resultado.recordsets[1].map((fila) => ({
        idEstadoChat: Number(fila.id_estado_chat),
        nombre: fila.nombre
      })),
      totalNoLeidos: Number(
        resultado.recordsets[2][0]?.total_no_leidos || 0
      )
    };
  }

  async obtenerConversacionAdministrativa(idConversacion) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id", sql.BigInt, idConversacion)
      .query(`
        SELECT TOP (1)
          c.id_conversacion,
          c.nombre_completo,
          c.cedula,
          c.id_estado_chat,
          e.nombre AS estado,
          c.id_administrador_atencion,
          a.nombre_completo AS administrador_atencion,
          c.fecha_creacion,
          c.fecha_ultima_actividad,
          c.fecha_atencion,
          c.fecha_cierre,
          (
            SELECT COUNT(*)
            FROM dbo.chat_mensajes AS m
            WHERE m.id_conversacion = c.id_conversacion
              AND m.tipo_remitente = N'EXTERNO'
              AND m.fecha_lectura IS NULL
          ) AS mensajes_no_leidos
        FROM dbo.chat_conversaciones AS c
        INNER JOIN dbo.estados_chat AS e
          ON e.id_estado_chat = c.id_estado_chat
        LEFT JOIN dbo.administradores AS a
          ON a.id_administrador = c.id_administrador_atencion
        WHERE c.id_conversacion = @id;
      `);

    return this.normalizarConversacion(resultado.recordset[0], true);
  }

  async listarMensajesAdministrativos(idConversacion) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id", sql.BigInt, idConversacion)
      .query(`
        SELECT
          m.id_mensaje,
          m.id_conversacion,
          m.tipo_remitente,
          m.id_administrador,
          a.nombre_completo AS administrador,
          m.mensaje,
          m.fecha_envio,
          m.fecha_lectura
        FROM dbo.chat_mensajes AS m
        LEFT JOIN dbo.administradores AS a
          ON a.id_administrador = m.id_administrador
        WHERE m.id_conversacion = @id
        ORDER BY m.fecha_envio, m.id_mensaje;
      `);

    return resultado.recordset.map((fila) =>
      this.normalizarMensaje(fila, true)
    );
  }

  async marcarMensajesExternosLeidos(idConversacion) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id", sql.BigInt, idConversacion)
      .query(`
        UPDATE dbo.chat_mensajes
        SET fecha_lectura = SYSUTCDATETIME()
        WHERE id_conversacion = @id
          AND tipo_remitente = N'EXTERNO'
          AND fecha_lectura IS NULL;

        SELECT @@ROWCOUNT AS filas_afectadas;
      `);

    return Number(resultado.recordset[0].filas_afectadas);
  }

  async crearMensajeAdministrador(datos) {
    const conexion = await obtenerConexion();
    const transaccion = new sql.Transaction(conexion);
    await transaccion.begin();

    try {
      const resultado = await new sql.Request(transaccion)
        .input("id", sql.BigInt, datos.idConversacion)
        .input("id_admin", sql.Int, datos.idAdministrador)
        .input("mensaje", sql.NVarChar(4000), datos.mensaje)
        .query(`
          DECLARE @estado NVARCHAR(80);
          DECLARE @id_estado_atencion INT;

          SELECT @estado = e.nombre
          FROM dbo.chat_conversaciones AS c WITH (UPDLOCK, HOLDLOCK)
          INNER JOIN dbo.estados_chat AS e
            ON e.id_estado_chat = c.id_estado_chat
          WHERE c.id_conversacion = @id;

          IF @estado IS NULL
            THROW 51103, N'No se encontró la conversación.', 1;

          IF @estado IN (N'Cerrado', N'Archivado')
            THROW 51102, N'Reabra la conversación antes de responder.', 1;

          IF @estado = N'Nuevo'
          BEGIN
            SELECT TOP (1) @id_estado_atencion = id_estado_chat
            FROM dbo.estados_chat
            WHERE nombre = N'En atención'
            ORDER BY id_estado_chat;

            IF @id_estado_atencion IS NULL
              THROW 51104, N'No existe el estado En atención.', 1;

            UPDATE dbo.chat_conversaciones
            SET
              id_estado_chat = @id_estado_atencion,
              id_administrador_atencion = @id_admin,
              fecha_atencion = COALESCE(fecha_atencion, SYSUTCDATETIME()),
              fecha_cierre = NULL
            WHERE id_conversacion = @id;
          END
          ELSE
          BEGIN
            UPDATE dbo.chat_conversaciones
            SET
              id_administrador_atencion = COALESCE(
                id_administrador_atencion,
                @id_admin
              ),
              fecha_atencion = COALESCE(fecha_atencion, SYSUTCDATETIME())
            WHERE id_conversacion = @id;
          END;

          INSERT INTO dbo.chat_mensajes (
            id_conversacion,
            tipo_remitente,
            id_administrador,
            mensaje,
            fecha_envio,
            fecha_lectura
          )
          VALUES (
            @id,
            N'ADMINISTRADOR',
            @id_admin,
            @mensaje,
            SYSUTCDATETIME(),
            NULL
          );

          UPDATE dbo.chat_conversaciones
          SET fecha_ultima_actividad = SYSUTCDATETIME()
          WHERE id_conversacion = @id;

          DECLARE @id_mensaje BIGINT = SCOPE_IDENTITY();

          SELECT
            m.id_mensaje,
            m.id_conversacion,
            m.tipo_remitente,
            m.id_administrador,
            a.nombre_completo AS administrador,
            m.mensaje,
            m.fecha_envio,
            m.fecha_lectura
          FROM dbo.chat_mensajes AS m
          LEFT JOIN dbo.administradores AS a
            ON a.id_administrador = m.id_administrador
          WHERE m.id_mensaje = @id_mensaje;
        `);

      await transaccion.commit();
      return this.normalizarMensaje(resultado.recordset[0], true);
    } catch (error) {
      await transaccion.rollback();
      throw this.mapearError(error);
    }
  }

  async actualizarEstado(datos) {
    const conexion = await obtenerConexion();

    try {
      const resultado = await conexion.request()
        .input("id", sql.BigInt, datos.idConversacion)
        .input("id_admin", sql.Int, datos.idAdministrador)
        .input("estado_destino", sql.NVarChar(80), datos.estadoDestino)
        .query(`
          DECLARE @estado_actual NVARCHAR(80);
          DECLARE @id_estado_destino INT;

          SELECT @estado_actual = e.nombre
          FROM dbo.chat_conversaciones AS c
          INNER JOIN dbo.estados_chat AS e
            ON e.id_estado_chat = c.id_estado_chat
          WHERE c.id_conversacion = @id;

          IF @estado_actual IS NULL
            THROW 51103, N'No se encontró la conversación.', 1;

          SELECT TOP (1) @id_estado_destino = id_estado_chat
          FROM dbo.estados_chat
          WHERE nombre = @estado_destino
          ORDER BY id_estado_chat;

          IF @id_estado_destino IS NULL AND @estado_destino = N'En atención'
            THROW 51104, N'No existe el estado En atención.', 1;

          IF @id_estado_destino IS NULL AND @estado_destino = N'Cerrado'
            THROW 51105, N'No existe el estado Cerrado.', 1;

          IF NOT (
            (@estado_actual = N'Nuevo' AND @estado_destino = N'En atención') OR
            (@estado_actual = N'En atención' AND @estado_destino = N'Cerrado') OR
            (@estado_actual = N'Cerrado' AND @estado_destino = N'En atención')
          )
            THROW 51106, N'El cambio de estado solicitado no está permitido.', 1;

          UPDATE dbo.chat_conversaciones
          SET
            id_estado_chat = @id_estado_destino,
            id_administrador_atencion = CASE
              WHEN @estado_destino = N'En atención'
                THEN @id_admin
              ELSE COALESCE(id_administrador_atencion, @id_admin)
            END,
            fecha_atencion = CASE
              WHEN @estado_destino = N'En atención'
                THEN COALESCE(fecha_atencion, SYSUTCDATETIME())
              ELSE fecha_atencion
            END,
            fecha_cierre = CASE
              WHEN @estado_destino = N'Cerrado'
                THEN SYSUTCDATETIME()
              ELSE NULL
            END,
            fecha_ultima_actividad = SYSUTCDATETIME()
          WHERE id_conversacion = @id;

          SELECT @@ROWCOUNT AS filas_afectadas;
        `);

      return Number(resultado.recordset[0].filas_afectadas) > 0;
    } catch (error) {
      throw this.mapearError(error);
    }
  }

  async archivarConversacion(datos) {
    const conexion = await obtenerConexion();

    try {
      const resultado = await conexion.request()
        .input("id", sql.BigInt, datos.idConversacion)
        .input("id_admin", sql.Int, datos.idAdministrador)
        .query(`
          DECLARE @id_estado_archivado INT;

          IF NOT EXISTS (
            SELECT 1
            FROM dbo.chat_conversaciones WITH (UPDLOCK, HOLDLOCK)
            WHERE id_conversacion = @id
          )
            THROW 51103, N'No se encontró la conversación.', 1;

          SELECT TOP (1) @id_estado_archivado = id_estado_chat
          FROM dbo.estados_chat
          WHERE nombre = N'Archivado'
          ORDER BY id_estado_chat;

          IF @id_estado_archivado IS NULL
            THROW 51107, N'No existe el estado Archivado.', 1;

          UPDATE dbo.chat_conversaciones
          SET
            id_estado_chat = @id_estado_archivado,
            id_administrador_atencion = COALESCE(
              id_administrador_atencion,
              @id_admin
            ),
            fecha_cierre = COALESCE(fecha_cierre, SYSUTCDATETIME()),
            fecha_ultima_actividad = SYSUTCDATETIME()
          WHERE id_conversacion = @id;

          SELECT @@ROWCOUNT AS filas_afectadas;
        `);

      return Number(resultado.recordset[0].filas_afectadas) > 0;
    } catch (error) {
      throw this.mapearError(error);
    }
  }

  async eliminarConversacion(idConversacion) {
    const conexion = await obtenerConexion();
    const transaccion = new sql.Transaction(conexion);
    await transaccion.begin();

    try {
      const resultado = await new sql.Request(transaccion)
        .input("id", sql.BigInt, idConversacion)
        .query(`
          IF NOT EXISTS (
            SELECT 1
            FROM dbo.chat_conversaciones WITH (UPDLOCK, HOLDLOCK)
            WHERE id_conversacion = @id
          )
            THROW 51103, N'No se encontró la conversación.', 1;

          DELETE FROM dbo.chat_mensajes
          WHERE id_conversacion = @id;

          DECLARE @mensajes_eliminados INT = @@ROWCOUNT;

          DELETE FROM dbo.chat_conversaciones
          WHERE id_conversacion = @id;

          SELECT
            @@ROWCOUNT AS conversaciones_eliminadas,
            @mensajes_eliminados AS mensajes_eliminados;
        `);

      await transaccion.commit();
      return {
        eliminada:
          Number(resultado.recordset[0].conversaciones_eliminadas) > 0,
        mensajesEliminados:
          Number(resultado.recordset[0].mensajes_eliminados || 0)
      };
    } catch (error) {
      await transaccion.rollback();
      throw this.mapearError(error);
    }
  }
}

module.exports = SqlChatRepository;
