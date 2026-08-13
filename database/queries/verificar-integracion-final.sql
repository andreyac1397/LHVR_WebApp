/*
  Verificación de solo lectura para BD-LHVR.
  No crea, modifica ni elimina datos.
*/
SET NOCOUNT ON;

SELECT DB_NAME() AS base_actual;

SELECT
  t.name AS tabla_requerida,
  CASE WHEN OBJECT_ID(N'dbo.' + t.name, N'U') IS NULL THEN 0 ELSE 1 END AS existe
FROM (VALUES
  (N'configuracion_sitio'), (N'cms_colecciones'), (N'cms_elementos'),
  (N'cms_importaciones'), (N'solicitudes_contacto'),
  (N'estados_solicitud_contacto'), (N'solicitudes_bibliocra'),
  (N'detalle_solicitud_bibliocra'), (N'estados_solicitud'),
  (N'administradores'), (N'estados_administrador'), (N'auditoria')
) AS t(name)
ORDER BY t.name;

SELECT clave, valor, tipo_dato, grupo, es_publico
FROM dbo.configuracion_sitio
ORDER BY grupo, clave;

SELECT modulo, anio, estado, publicada, COUNT(*) OVER (PARTITION BY modulo) AS versiones_modulo
FROM dbo.cms_colecciones
ORDER BY modulo, fecha_actualizacion DESC;

SELECT modulo, estado, COUNT(*) AS cantidad
FROM dbo.cms_elementos
GROUP BY modulo, estado
ORDER BY modulo, estado;

SELECT
  (SELECT COUNT(*) FROM dbo.cms_elementos WHERE modulo = N'CALENDARIO') AS eventos_calendario,
  (SELECT COUNT(*) FROM dbo.cms_elementos WHERE modulo = N'BOLETINES') AS boletines,
  (SELECT COUNT(*) FROM dbo.solicitudes_contacto) AS mensajes_contacto,
  (SELECT COUNT(*) FROM dbo.solicitudes_bibliocra) AS solicitudes_bibliocra;

SELECT name AS procedimiento_requerido,
       CASE WHEN OBJECT_ID(N'dbo.' + name, N'P') IS NULL THEN 0 ELSE 1 END AS existe
FROM (VALUES
  (N'sp_guardar_configuracion_sitio'),
  (N'sp_obtener_configuracion_sitio_administracion'),
  (N'sp_obtener_configuracion_sitio_publica'),
  (N'sp_obtener_contenido_pagina_por_slug'),
  (N'sp_registrar_auditoria'),
  (N'usp_Administrador_BuscarPorCorreo'),
  (N'usp_TokenAdministrador_BuscarActivo')
) AS p(name)
ORDER BY name;
