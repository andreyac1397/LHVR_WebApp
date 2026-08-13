const {
  obtenerConexion
} = require("../../../config/database");

class SqlDashboardRepository {
  async obtenerResumen() {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request().query(`
      SELECT
        (
          SELECT COUNT_BIG(*)
          FROM dbo.cms_elementos AS e
          INNER JOIN dbo.cms_colecciones AS c ON c.id_coleccion = e.id_coleccion
          WHERE e.modulo = N'BOLETINES' AND e.estado = N'PUBLICADO'
            AND c.publicada = 1 AND c.estado = N'PUBLICADO'
        ) AS boletines_publicados,
        (
          SELECT COUNT_BIG(*)
          FROM dbo.cms_elementos AS e
          INNER JOIN dbo.cms_colecciones AS c ON c.id_coleccion = e.id_coleccion
          WHERE e.modulo = N'CALENDARIO' AND e.estado = N'PUBLICADO'
            AND c.publicada = 1 AND c.estado = N'PUBLICADO'
            AND e.fecha_fin >= CONVERT(date, SYSUTCDATETIME())
            AND e.fecha_inicio < DATEADD(day, 31, CONVERT(date, SYSUTCDATETIME()))
        ) AS eventos_proximos,
        (
          SELECT COUNT_BIG(*)
          FROM dbo.solicitudes_bibliocra AS s
          INNER JOIN dbo.estados_solicitud AS e ON e.id_estado_solicitud = s.id_estado_solicitud
          WHERE e.nombre = N'Pendiente'
        ) AS solicitudes_bibliocra_pendientes,
        (
          SELECT COUNT_BIG(*)
          FROM dbo.cms_elementos AS e
          INNER JOIN dbo.cms_colecciones AS c ON c.id_coleccion = e.id_coleccion
          WHERE e.modulo = N'DOCENTES' AND e.estado = N'PUBLICADO'
            AND c.publicada = 1 AND c.estado = N'PUBLICADO'
        ) AS docentes_publicados,
        (
          SELECT COUNT_BIG(*)
          FROM dbo.solicitudes_contacto AS s
          INNER JOIN dbo.estados_solicitud_contacto AS e
            ON e.id_estado_solicitud_contacto = s.id_estado_solicitud_contacto
          WHERE e.nombre = N'Nuevo' AND s.es_spam = 0
        ) AS mensajes_nuevos;

      SELECT TOP 5
        e.id_elemento,
        e.titulo,
        e.descripcion,
        e.fecha_inicio,
        e.fecha_fin,
        JSON_VALUE(e.datos_json, '$.nombreCategoria') AS categoria
      FROM dbo.cms_elementos AS e
      INNER JOIN dbo.cms_colecciones AS c ON c.id_coleccion = e.id_coleccion
      WHERE e.modulo = N'CALENDARIO' AND e.estado = N'PUBLICADO'
        AND c.publicada = 1 AND c.estado = N'PUBLICADO'
        AND e.fecha_fin >= CONVERT(date, SYSUTCDATETIME())
      ORDER BY e.fecha_inicio, e.orden, e.id_elemento;

      SELECT TOP 8
        a.id_auditoria,
        acc.nombre AS accion,
        mod.nombre AS modulo,
        a.descripcion,
        a.fecha_accion,
        adm.nombre_completo AS administrador
      FROM dbo.auditoria AS a
      INNER JOIN dbo.acciones_auditoria AS acc
        ON acc.id_accion_auditoria = a.id_accion_auditoria
      INNER JOIN dbo.modulos_sistema AS mod
        ON mod.id_modulo_sistema = a.id_modulo_sistema
      LEFT JOIN dbo.administradores AS adm
        ON adm.id_administrador = a.id_administrador
      ORDER BY a.fecha_accion DESC, a.id_auditoria DESC;
    `);

    const conteos = resultado.recordsets[0][0] || {};
    return {
      indicadores: {
        boletinesPublicados: Number(conteos.boletines_publicados || 0),
        eventosProximos: Number(conteos.eventos_proximos || 0),
        solicitudesBibliocraPendientes: Number(conteos.solicitudes_bibliocra_pendientes || 0),
        docentesPublicados: Number(conteos.docentes_publicados || 0),
        mensajesNuevos: Number(conteos.mensajes_nuevos || 0)
      },
      proximosEventos: resultado.recordsets[1].map((fila) => ({
        idElemento: Number(fila.id_elemento),
        titulo: fila.titulo,
        descripcion: fila.descripcion,
        fechaInicio: fila.fecha_inicio,
        fechaFin: fila.fecha_fin,
        categoria: fila.categoria || "Evento"
      })),
      actividadReciente: resultado.recordsets[2].map((fila) => ({
        idAuditoria: Number(fila.id_auditoria),
        accion: fila.accion,
        modulo: fila.modulo,
        descripcion: fila.descripcion,
        fechaAccion: fila.fecha_accion,
        administrador: fila.administrador
      }))
    };
  }
}

module.exports = SqlDashboardRepository;
