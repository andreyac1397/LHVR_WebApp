const {
  sql,
  obtenerConexion
} = require("../../../config/database");

class SqlAdministradorRepository {
  mapear(fila) {
    if (!fila) return null;
    return {
      idAdministrador: Number(fila.id_administrador),
      nombreCompleto: fila.nombre_completo,
      correo: fila.correo,
      idEstadoAdministrador: Number(fila.id_estado_administrador),
      nombreEstado: fila.nombre_estado,
      permiteAcceso: Boolean(fila.permite_acceso),
      correoVerificado: Boolean(fila.correo_verificado),
      requiereVerificacion: Boolean(fila.requiere_verificacion),
      requiereCambioContrasena: Boolean(fila.requiere_cambio_contrasena),
      ultimoAcceso: fila.ultimo_acceso,
      fechaCreacion: fila.fecha_creacion,
      fechaActualizacion: fila.fecha_actualizacion
    };
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
      .input("busqueda", sql.NVarChar(180), filtros.busqueda || null)
      .input("id_estado", sql.Int, filtros.idEstado || null)
      .input("offset", sql.Int, (pagina - 1) * limite)
      .input("limite", sql.Int, limite)
      .query(`
        SELECT
          a.id_administrador, a.nombre_completo, a.correo,
          a.id_estado_administrador, ea.nombre AS nombre_estado,
          ea.permite_acceso, a.correo_verificado,
          a.requiere_verificacion, a.requiere_cambio_contrasena,
          a.ultimo_acceso,
          a.fecha_creacion, a.fecha_actualizacion
        FROM dbo.administradores AS a
        INNER JOIN dbo.estados_administrador AS ea
          ON ea.id_estado_administrador = a.id_estado_administrador
        WHERE (@id_estado IS NULL OR a.id_estado_administrador = @id_estado)
          AND (@busqueda IS NULL OR a.nombre_completo LIKE '%' + @busqueda + '%'
            OR a.correo LIKE '%' + @busqueda + '%')
        ORDER BY a.nombre_completo, a.id_administrador
        OFFSET @offset ROWS
        FETCH NEXT @limite ROWS ONLY;

        SELECT id_estado_administrador, nombre, descripcion, permite_acceso
        FROM dbo.estados_administrador
        WHERE activo = 1
        ORDER BY orden, id_estado_administrador;

        SELECT COUNT(*) AS total_registros
        FROM dbo.administradores AS a
        WHERE (@id_estado IS NULL OR a.id_estado_administrador = @id_estado)
          AND (
            @busqueda IS NULL OR
            a.nombre_completo LIKE N'%' + @busqueda + N'%' OR
            a.correo LIKE N'%' + @busqueda + N'%'
          );
      `);
    const totalRegistros = Number(
      resultado.recordsets?.[2]?.[0]?.total_registros || 0
    );
    const totalPaginas = Math.max(1, Math.ceil(totalRegistros / limite));
    return {
      administradores: (resultado.recordsets?.[0] || []).map((fila) => this.mapear(fila)),
      estados: (resultado.recordsets?.[1] || []).map((fila) => ({
        idEstadoAdministrador: Number(fila.id_estado_administrador),
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        permiteAcceso: Boolean(fila.permite_acceso)
      })),
      paginaActual: pagina,
      limite,
      totalRegistros,
      totalPaginas,
      tieneAnterior: pagina > 1,
      tieneSiguiente: pagina < totalPaginas
    };
  }

  async buscarPorCorreo(correo, idExcluir = null) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("correo", sql.NVarChar(254), correo)
      .input("id_excluir", sql.Int, idExcluir)
      .query(`
        SELECT TOP (1) id_administrador
        FROM dbo.administradores
        WHERE LOWER(LTRIM(RTRIM(correo))) = @correo
          AND (@id_excluir IS NULL OR id_administrador <> @id_excluir);
      `);
    return resultado.recordset?.[0] || null;
  }

  async obtenerEstadoAccesoPredeterminado() {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request().query(`
      SELECT TOP (1)
        id_estado_administrador,
        nombre,
        permite_acceso
      FROM dbo.estados_administrador
      WHERE activo = 1 AND permite_acceso = 1
      ORDER BY orden, id_estado_administrador;
    `);
    const fila = resultado.recordset?.[0];
    return fila ? {
      idEstadoAdministrador: Number(fila.id_estado_administrador),
      nombre: fila.nombre,
      permiteAcceso: Boolean(fila.permite_acceso)
    } : null;
  }

  async crear(datos) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("nombre", sql.NVarChar(150), datos.nombreCompleto)
      .input("correo", sql.NVarChar(254), datos.correo)
      .input("hash", sql.NVarChar(255), datos.contrasenaHash)
      .input("id_estado", sql.Int, datos.idEstadoAdministrador)
      .query(`
        INSERT INTO dbo.administradores
          (nombre_completo, correo, contrasena_hash, id_estado_administrador,
           correo_verificado, requiere_verificacion,
           requiere_cambio_contrasena, fecha_creacion, fecha_actualizacion)
        OUTPUT INSERTED.id_administrador
        VALUES (
          @nombre, @correo, @hash, @id_estado,
          1, 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME()
        );
      `);
    return Number(resultado.recordset[0].id_administrador);
  }

  async obtenerPorId(idAdministrador) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id", sql.Int, idAdministrador)
      .query(`
        SELECT a.*, ea.nombre AS nombre_estado, ea.permite_acceso
        FROM dbo.administradores AS a
        INNER JOIN dbo.estados_administrador AS ea
          ON ea.id_estado_administrador = a.id_estado_administrador
        WHERE a.id_administrador = @id;
      `);
    return this.mapear(resultado.recordset?.[0]);
  }

  async obtenerEstado(idEstado) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id", sql.Int, idEstado)
      .query(`
        SELECT id_estado_administrador, nombre, permite_acceso
        FROM dbo.estados_administrador
        WHERE id_estado_administrador = @id AND activo = 1;
      `);
    const fila = resultado.recordset?.[0];
    return fila ? {
      idEstadoAdministrador: Number(fila.id_estado_administrador),
      nombre: fila.nombre,
      permiteAcceso: Boolean(fila.permite_acceso)
    } : null;
  }

  async cambiarEstado(idAdministrador, idEstadoAdministrador) {
    const conexion = await obtenerConexion();
    await conexion.request()
      .input("id", sql.Int, idAdministrador)
      .input("id_estado", sql.Int, idEstadoAdministrador)
      .query(`
        UPDATE dbo.administradores
        SET id_estado_administrador = @id_estado,
            fecha_actualizacion = SYSUTCDATETIME()
        WHERE id_administrador = @id;

        IF EXISTS (
          SELECT 1
          FROM dbo.estados_administrador
          WHERE id_estado_administrador = @id_estado
            AND permite_acceso = 0
        )
        BEGIN
          UPDATE dbo.tokens_administrador
          SET fecha_revocacion = SYSUTCDATETIME()
          WHERE id_administrador = @id
            AND fecha_revocacion IS NULL
            AND usado = 0;
        END;
      `);
    return this.obtenerPorId(idAdministrador);
  }

  async actualizar(idAdministrador, datos) {
    const conexion = await obtenerConexion();
    await conexion.request()
      .input("id", sql.Int, idAdministrador)
      .input("nombre", sql.NVarChar(150), datos.nombreCompleto)
      .input("correo", sql.NVarChar(254), datos.correo)
      .input("id_estado", sql.Int, datos.idEstadoAdministrador)
      .query(`
        UPDATE dbo.administradores
        SET nombre_completo = @nombre,
            correo = @correo,
            id_estado_administrador = @id_estado,
            fecha_actualizacion = SYSUTCDATETIME()
        WHERE id_administrador = @id;

        IF EXISTS (
          SELECT 1
          FROM dbo.estados_administrador
          WHERE id_estado_administrador = @id_estado
            AND permite_acceso = 0
        )
        BEGIN
          UPDATE dbo.tokens_administrador
          SET fecha_revocacion = SYSUTCDATETIME()
          WHERE id_administrador = @id
            AND fecha_revocacion IS NULL
            AND usado = 0;
        END;
      `);
    return this.obtenerPorId(idAdministrador);
  }

  async establecerAccesoTemporal(idAdministrador, contrasenaHash) {
    const conexion = await obtenerConexion();
    await conexion.request()
      .input("id", sql.Int, idAdministrador)
      .input("hash", sql.NVarChar(255), contrasenaHash)
      .query(`
        SET XACT_ABORT ON;
        BEGIN TRANSACTION;

        UPDATE dbo.administradores
        SET contrasena_hash = @hash,
            requiere_cambio_contrasena = 1,
            fecha_actualizacion = SYSUTCDATETIME()
        WHERE id_administrador = @id;

        UPDATE dbo.tokens_administrador
        SET fecha_revocacion = SYSUTCDATETIME()
        WHERE id_administrador = @id
          AND fecha_revocacion IS NULL
          AND usado = 0;

        UPDATE dbo.codigos_verificacion_admin
        SET usado = 1,
            fecha_uso = COALESCE(fecha_uso, SYSUTCDATETIME())
        WHERE id_administrador = @id
          AND usado = 0;

        COMMIT TRANSACTION;
      `);
    return this.obtenerPorId(idAdministrador);
  }
}

module.exports = SqlAdministradorRepository;
