USE [BD-LHVR];
GO
SET NOCOUNT ON; SET XACT_ABORT ON;
GO
/* Encabezados editables para los tres módulos. El script de inicialización
   importa sus tarjetas desde los JSON existentes mediante los servicios. */
BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @publicado INT=(SELECT TOP(1) id_estado_publicacion FROM dbo.estados_publicacion WHERE nombre=N'Publicado' AND activo=1 ORDER BY id_estado_publicacion);
  DECLARE @admin INT=(SELECT TOP(1) id_administrador FROM dbo.administradores ORDER BY id_administrador);
  IF @publicado IS NULL OR @admin IS NULL THROW 51600,N'Se requiere un estado Publicado y un administrador.',1;

  DECLARE @paginas TABLE(nombre NVARCHAR(150),slug NVARCHAR(160),titulo NVARCHAR(200),descripcion NVARCHAR(500),ruta NVARCHAR(300),orden INT);
  INSERT @paginas VALUES
    (N'Boletines',N'boletines',N'Boletines y comunicados',N'Información institucional, circulares, noticias y comunicados para la comunidad educativa.',N'pages/boletines.html',14),
    (N'Directorio docente',N'docentes',N'Directorio docente',N'Información del equipo docente del Liceo Hernán Vargas Ramírez organizada por área académica.',N'pages/directorio-docente.html',15),
    (N'Recursos de apoyo',N'recursos-apoyo',N'Recursos digitales',N'Enlaces, plataformas y herramientas de apoyo para estudiantes, familias y docentes.',N'pages/enlaces-interes.html',16);
  INSERT @paginas VALUES
    (N'Galería',N'galeria',N'Galería institucional',N'Imágenes de actividades, espacios y experiencias de nuestra comunidad educativa.',N'pages/galeria.html',17);

  UPDATE p SET p.nombre=o.nombre,p.titulo=o.titulo,p.descripcion=o.descripcion,p.ruta=o.ruta,p.id_estado_publicacion=@publicado,p.fecha_publicacion=COALESCE(p.fecha_publicacion,SYSUTCDATETIME()),p.fecha_actualizacion=SYSUTCDATETIME(),p.id_administrador_ultima_modificacion=@admin
  FROM dbo.paginas p JOIN @paginas o ON o.slug=p.slug;
  INSERT dbo.paginas(nombre,slug,titulo,descripcion,ruta,orden_menu,mostrar_menu,id_estado_publicacion,fecha_publicacion,id_administrador_ultima_modificacion)
  SELECT o.nombre,o.slug,o.titulo,o.descripcion,o.ruta,o.orden,0,@publicado,SYSUTCDATETIME(),@admin FROM @paginas o WHERE NOT EXISTS(SELECT 1 FROM dbo.paginas p WHERE p.slug=o.slug);
  COMMIT;
  SELECT id_pagina,nombre,slug,titulo,ruta FROM dbo.paginas WHERE slug IN(N'boletines',N'docentes',N'recursos-apoyo',N'galeria');
END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
GO
