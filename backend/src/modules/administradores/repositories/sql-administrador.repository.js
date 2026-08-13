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
      ultimoAcceso: fila.ultimo_acceso,
      fechaCreacion: fila.fecha_creacion,
      fechaActualizacion: fila.fecha_actualizacion
    };
  }

  async listar(filtros = {}) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("busqueda", sql.NVarChar(180), filtros.busqueda || null)
      .input("id_estado", sql.Int, filtros.idEstado || null)
      .query(`
        SELECT
          a.id_administrador, a.nombre_completo, a.correo,
          a.id_estado_administrador, ea.nombre AS nombre_estado,
          ea.permite_acceso, a.correo_verificado,
          a.requiere_verificacion, a.ultimo_acceso,
          a.fecha_creacion, a.fecha_actualizacion
        FROM dbo.administradores AS a
        INNER JOIN dbo.estados_administrador AS ea
          ON ea.id_estado_administrador = a.id_estado_administrador
        WHERE (@id_estado IS NULL OR a.id_estado_administrador = @id_estado)
          AND (@busqueda IS NULL OR a.nombre_completo LIKE '%' + @busqueda + '%'
            OR a.correo LIKE '%' + @busqueda + '%')
        ORDER BY a.nombre_completo, a.id_administrador;

        SELECT id_estado_administrador, nombre, descripcion, permite_acceso
        FROM dbo.estados_administrador
        WHERE activo = 1
        ORDER BY orden, id_estado_administrador;
      `);
    return {
      administradores: (resultado.recordsets?.[0] || []).map((fila) => this.mapear(fila)),
      estados: (resultado.recordsets?.[1] || []).map((fila) => ({
        idEstadoAdministrador: Number(fila.id_estado_administrador),
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        permiteAcceso: Boolean(fila.permite_acceso)
      }))
    };
  }

  async buscarPorCorreo(correo) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("correo", sql.NVarChar(254), correo)
      .query("SELECT TOP (1) id_administrador FROM dbo.administradores WHERE correo = @correo;");
    return resultado.recordset?.[0] || null;
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
           correo_verificado, requiere_verificacion)
        OUTPUT INSERTED.id_administrador
        VALUES (@nombre, @correo, @hash, @id_estado, 1, 1);
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
      `);
    return this.obtenerPorId(idAdministrador);
  }
}

module.exports = SqlAdministradorRepository;
