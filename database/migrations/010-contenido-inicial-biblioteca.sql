USE [BD-LHVR];
GO
SET NOCOUNT ON; SET XACT_ABORT ON;
GO
/* Página y contenido inicial editable de Biblioteca. Reejecutable sin duplicar datos. */
BEGIN TRY
 BEGIN TRANSACTION;
 IF OBJECT_ID(N'dbo.paginas',N'U') IS NULL OR OBJECT_ID(N'dbo.cms_colecciones',N'U') IS NULL OR OBJECT_ID(N'dbo.cms_elementos',N'U') IS NULL THROW 51500,N'Faltan las tablas base del CMS.',1;
 DECLARE @publicado INT=(SELECT TOP(1) id_estado_publicacion FROM dbo.estados_publicacion WHERE nombre=N'Publicado' AND activo=1 ORDER BY id_estado_publicacion);
 DECLARE @admin INT=(SELECT TOP(1) id_administrador FROM dbo.administradores ORDER BY id_administrador);
 DECLARE @coleccion INT;
 IF @publicado IS NULL OR @admin IS NULL THROW 51501,N'Se requiere un estado Publicado y un administrador.',1;
 IF NOT EXISTS(SELECT 1 FROM dbo.paginas WHERE slug=N'biblioteca')
  INSERT dbo.paginas(nombre,slug,titulo,descripcion,ruta,orden_menu,mostrar_menu,id_estado_publicacion,fecha_publicacion,id_administrador_ultima_modificacion)
  VALUES(N'Biblioteca BiblioCRA',N'biblioteca',N'Biblioteca BiblioCRA',N'Espacio de apoyo para la lectura, el estudio, la investigación, el uso de recursos tecnológicos y el desarrollo de actividades educativas.',N'pages/biblioteca-recursos.html',6,1,@publicado,SYSUTCDATETIME(),@admin);
 ELSE UPDATE dbo.paginas SET nombre=N'Biblioteca BiblioCRA',ruta=N'pages/biblioteca-recursos.html',id_estado_publicacion=@publicado,fecha_publicacion=COALESCE(fecha_publicacion,SYSUTCDATETIME()),fecha_actualizacion=SYSUTCDATETIME(),id_administrador_ultima_modificacion=@admin WHERE slug=N'biblioteca';
 SELECT @coleccion=id_coleccion FROM dbo.cms_colecciones WHERE modulo=N'BIBLIOTECA' AND clave=N'biblioteca-contenido-inicial-2026';
 IF @coleccion IS NULL BEGIN INSERT dbo.cms_colecciones(modulo,clave,nombre,anio,estado,publicada,metadatos_json,id_administrador_ultima_modificacion) VALUES(N'BIBLIOTECA',N'biblioteca-contenido-inicial-2026',N'Contenido inicial de Biblioteca',2026,N'PUBLICADO',1,N'{"estructura":"biblioteca-secciones-v1"}',@admin); SET @coleccion=SCOPE_IDENTITY(); END
 ELSE UPDATE dbo.cms_colecciones SET estado=N'PUBLICADO',publicada=1,fecha_actualizacion=SYSUTCDATETIME(),id_administrador_ultima_modificacion=@admin WHERE id_coleccion=@coleccion;
 UPDATE dbo.cms_colecciones SET publicada=0,estado=CASE WHEN estado=N'PUBLICADO' THEN N'BORRADOR' ELSE estado END WHERE modulo=N'BIBLIOTECA' AND id_coleccion<>@coleccion AND publicada=1;
 DECLARE @items TABLE(clave NVARCHAR(180),grupo NVARCHAR(80),tipo NVARCHAR(20),etiqueta NVARCHAR(80),titulo NVARCHAR(500),descripcion NVARCHAR(MAX),url NVARCHAR(2048),imagen NVARCHAR(1000),imagenes NVARCHAR(MAX),orden INT);
 INSERT @items VALUES
 (N'bi-rapida-1',N'informacion-rapida',N'tarjeta',N'Horario',N'Atención semanal',N'Lunes, miércoles y viernes: 7:00 a.m. a 3:00 p.m.'+CHAR(10)+N'Martes y jueves: 8:00 a.m. a 4:00 p.m.',NULL,NULL,NULL,1),
 (N'bi-rapida-2',N'informacion-rapida',N'tarjeta',N'Préstamo',N'Libros a hogar',N'Se permite el préstamo de libros por 8 días, con opción a renovación.',NULL,NULL,NULL,2),
 (N'bi-rapida-3',N'informacion-rapida',N'tarjeta',N'Tecnología',N'Computadoras e internet',N'La biblioteca cuenta con computadoras con acceso a internet para estudiantes.',NULL,NULL,NULL,3),
 (N'bi-rapida-4',N'informacion-rapida',N'tarjeta',N'Espacios',N'Estudio y actividades',N'Espacio para estudio individual, estudio grupal, ludoteca y aula de audiovisuales.',NULL,NULL,NULL,4),
 (N'bi-nuestra-texto',N'nuestra-biblioteca',N'texto',NULL,N'Nuestra biblioteca',N'La Biblioteca BiblioCRA del Liceo Hernán Vargas Ramírez brinda apoyo al proceso educativo mediante recursos de lectura, préstamo de materiales, espacios de estudio, tecnología, actividades de aprendizaje y recursos digitales.',NULL,NULL,NULL,1),
 (N'bi-nuestra-card',N'nuestra-biblioteca',N'tarjeta',N'BiblioCRA',N'Recursos para la comunidad educativa',N'La biblioteca apoya a estudiantes y docentes con materiales físicos, recursos digitales, recomendaciones de lectura y actividades educativas.',N'https://sites.google.com/view/sitesbibliocra/inicio?authuser=1',N'../assets/img/08-Biblioteca-Logo.png',NULL,2),
 (N'bi-historia-texto',N'historia',N'texto',NULL,N'Historia de la Biblioteca',N'La Biblioteca fue construida junto con las instalaciones del centro educativo entre 1969 y 1970.'+CHAR(10)+CHAR(10)+N'A partir de 1979 se registra la presencia de diferentes personas encargadas de la biblioteca.'+CHAR(10)+CHAR(10)+N'En 2008 se pasó del préstamo por ventanilla a una modalidad de estante abierto.'+CHAR(10)+CHAR(10)+N'En 2013 se incorporó al proyecto de Centros de Recursos para el Aprendizaje del MEP.',NULL,NULL,NULL,1),
 (N'bi-historia-1',N'historia',N'tarjeta',N'1969 - 1970',N'Construcción',N'La biblioteca fue construida junto con las instalaciones del Liceo.',NULL,NULL,NULL,2),
 (N'bi-historia-2',N'historia',N'tarjeta',N'1979',N'Primeros registros',N'Se registra a Patricia Quirós García como encargada de la Biblioteca.',NULL,NULL,NULL,3),
 (N'bi-historia-3',N'historia',N'tarjeta',N'2008',N'Estante abierto',N'Se moderniza el servicio y se fortalece la relación bibliotecólogo-usuario.',NULL,NULL,NULL,4),
 (N'bi-historia-4',N'historia',N'tarjeta',N'2013',N'Proyecto BiblioCRA',N'La biblioteca entra al proyecto de Centros de Recursos para el Aprendizaje del MEP.',NULL,NULL,NULL,5),
 (N'bi-servicio-1',N'servicios',N'tarjeta',N'Servicio',N'Préstamo de literatura',N'Préstamo de libros y materiales para uso en sala, aula y hogar.',NULL,NULL,NULL,1),
 (N'bi-servicio-2',N'servicios',N'tarjeta',N'Servicio',N'Computadoras con internet',N'Acceso a equipo tecnológico para consultas, trabajos y actividades educativas.',NULL,NULL,NULL,2),
 (N'bi-servicio-3',N'servicios',N'tarjeta',N'Servicio',N'Estudio individual y grupal',N'Espacios para estudiar y realizar trabajos escolares.',NULL,NULL,NULL,3),
 (N'bi-servicio-4',N'servicios',N'tarjeta',N'Servicio',N'Ludoteca',N'Juegos de mesa y recursos recreativos para fortalecer la convivencia y el aprendizaje.',NULL,NULL,NULL,4),
 (N'bi-servicio-5',N'servicios',N'tarjeta',N'Servicio',N'Aula de audiovisuales',N'Espacio para presentaciones, videos y actividades guiadas.',NULL,NULL,NULL,5),
 (N'bi-servicio-6',N'servicios',N'tarjeta',N'Servicio',N'Actividades de lectura',N'Talleres y proyectos relacionados con la lectura y el aprendizaje.',NULL,NULL,NULL,6),
 (N'bi-area-1',N'areas',N'tarjeta',N'Área',N'Colección abierta',N'Espacio de consulta y préstamo.',NULL,N'../assets/img/01-Biblioteca.jpg',NULL,1),
 (N'bi-area-2',N'areas',N'tarjeta',N'Área',N'Área de cómputo',N'Equipo para consultas y trabajos.',NULL,N'../assets/img/02-Biblioteca.jpg',NULL,2),
 (N'bi-area-3',N'areas',N'tarjeta',N'Área',N'Rincón de lectura',N'Espacio cómodo para leer.',NULL,N'../assets/img/03-Biblioteca.jpg',NULL,3),
 (N'bi-area-4',N'areas',N'tarjeta',N'Área',N'Área de estudio grupal',N'Espacio para trabajo colaborativo.',NULL,N'../assets/img/04-Biblioteca.jpg',NULL,4),
 (N'bi-area-5',N'areas',N'tarjeta',N'Área',N'Sala de audiovisuales',N'Espacio para recursos audiovisuales.',NULL,N'../assets/img/05-Biblioteca.jpg',NULL,5),
 (N'bi-prestamo-1',N'prestamo',N'tarjeta',N'Requisitos',N'¿Cómo solicitar un préstamo?',N'Llenar la boleta de préstamo. Presentar identificación y devolver el material en el tiempo establecido.',NULL,NULL,NULL,1),
 (N'bi-prestamo-2',N'prestamo',N'tarjeta',N'Condiciones',N'Tiempo de préstamo',N'El préstamo a hogar es por 8 días y puede renovarse si el material está disponible.',NULL,NULL,NULL,2),
 (N'bi-prestamo-3',N'prestamo',N'tarjeta',N'Guía',N'Guía de llenado de boleta de préstamo',N'Imagen de apoyo para completar la boleta de préstamo de materiales.',N'FormularioBibliocra.html',N'../assets/img/06-Biblioteca.png',NULL,3),
 (N'bi-material-1',N'materiales',N'tarjeta',N'Material',N'Libros',N'Material bibliográfico para lectura y consulta.',NULL,NULL,NULL,1),
 (N'bi-material-2',N'materiales',N'tarjeta',N'Material',N'Diccionarios',N'Apoyo para vocabulario, ortografía y comprensión de textos.',NULL,NULL,NULL,2),
 (N'bi-material-3',N'materiales',N'tarjeta',N'Material',N'Revistas',N'Publicaciones para lectura, consulta e investigación.',NULL,NULL,NULL,3),
 (N'bi-material-4',N'materiales',N'tarjeta',N'Material',N'Enciclopedias',N'Material de referencia para trabajos y tareas.',NULL,NULL,NULL,4),
 (N'bi-material-5',N'materiales',N'tarjeta',N'Material',N'Novela gráfica',N'Lecturas visuales y narrativas para fomentar el hábito lector.',NULL,NULL,NULL,5),
 (N'bi-material-6',N'materiales',N'tarjeta',N'Material',N'Manga',N'Material de lectura recreativa para estudiantes.',NULL,NULL,NULL,6),
 (N'bi-material-7',N'materiales',N'tarjeta',N'Material',N'Juegos de mesa',N'Recursos lúdicos para aprendizaje, convivencia y recreación.',NULL,NULL,NULL,7),
 (N'bi-material-8',N'materiales',N'tarjeta',N'Material',N'Material de apoyo',N'Recursos recomendados para materias y actividades escolares.',NULL,NULL,NULL,8),
 (N'bi-recurso-1',N'reglamento-recursos',N'tarjeta',N'Reglamento',N'Reglamento de la Biblioteca',N'Normas para el uso adecuado de la biblioteca, el cuidado de los libros y el respeto a los usuarios.',NULL,N'../assets/img/07-Biblioteca.png',NULL,1),
 (N'bi-recurso-2',N'reglamento-recursos',N'tarjeta',N'Recursos',N'Recursos digitales BiblioCRA',N'Acceda al Site BiblioCRA, revistas digitales, material de apoyo y literatura recomendada.',N'https://sites.google.com/view/sitesbibliocra/inicio?authuser=1',N'../assets/img/09-Bibliocra-50.png',N'["../assets/img/10-Bibliocra-2021.png","../assets/img/11-Bibliocra-2022.png","../assets/img/12-Bibliocra-2023.png","../assets/img/13-Bibliocra-2024.png","../assets/img/14-Bibliocra-2025.png","../assets/img/15-Bibliocra-2026.png"]',2);
 UPDATE e SET titulo=i.titulo,descripcion=i.descripcion,url=i.url,orden=i.orden,estado=N'PUBLICADO',datos_json=N'{"grupo":"'+i.grupo+N'","tipo":"'+i.tipo+N'","etiqueta":"'+ISNULL(i.etiqueta,N'')+N'","imagen":"'+ISNULL(i.imagen,N'')+N'","imagenes":'+ISNULL(i.imagenes,N'[]')+N'}',fecha_actualizacion=SYSUTCDATETIME(),id_administrador_ultima_modificacion=@admin FROM dbo.cms_elementos e JOIN @items i ON i.clave=e.clave_externa WHERE e.id_coleccion=@coleccion AND e.modulo=N'BIBLIOTECA';
 INSERT dbo.cms_elementos(id_coleccion,modulo,clave_externa,titulo,descripcion,orden,estado,destacado,url,datos_json,id_administrador_ultima_modificacion)
 SELECT @coleccion,N'BIBLIOTECA',i.clave,i.titulo,i.descripcion,i.orden,N'PUBLICADO',0,i.url,N'{"grupo":"'+i.grupo+N'","tipo":"'+i.tipo+N'","etiqueta":"'+ISNULL(i.etiqueta,N'')+N'","imagen":"'+ISNULL(i.imagen,N'')+N'","imagenes":'+ISNULL(i.imagenes,N'[]')+N'}',@admin FROM @items i WHERE NOT EXISTS(SELECT 1 FROM dbo.cms_elementos e WHERE e.id_coleccion=@coleccion AND e.modulo=N'BIBLIOTECA' AND e.clave_externa=i.clave);
 COMMIT;
 SELECT p.id_pagina,p.slug,p.titulo,p.ruta FROM dbo.paginas p WHERE p.slug=N'biblioteca';
 SELECT c.id_coleccion,c.nombre,c.publicada,COUNT(e.id_elemento) cantidad_elementos FROM dbo.cms_colecciones c LEFT JOIN dbo.cms_elementos e ON e.id_coleccion=c.id_coleccion AND e.modulo=N'BIBLIOTECA' WHERE c.id_coleccion=@coleccion GROUP BY c.id_coleccion,c.nombre,c.publicada;
END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
GO
