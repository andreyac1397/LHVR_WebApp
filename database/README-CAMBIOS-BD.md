# Base de datos: acciones manuales

## Resultado de la auditoría

El script suministrado de `BD-LHVR` ya contiene las tablas, relaciones, catálogos y procedimientos necesarios para esta integración. Esta entrega **no requiere crear tablas ni procedimientos almacenados nuevos**.

No se ejecutó nada contra SQL Server porque el entorno de trabajo no tiene acceso a la base real.

## Antes de iniciar

1. Haga un respaldo de `BD-LHVR`.
2. Confirme que la base corresponde al script entregado el 12 de agosto de 2026.
3. No ejecute automáticamente las migraciones `006`, `007` u `008`: sus objetos y datos ya aparecen dentro del script suministrado.
4. Ejecute manualmente `queries/verificar-integracion-final.sql`; es una consulta de solo lectura.
5. Configure `backend/.env` y ejecute `npm run test:db`.

## Cambios requeridos

- Tablas nuevas: ninguna.
- Columnas nuevas: ninguna.
- Relaciones nuevas: ninguna.
- Índices obligatorios nuevos: ninguno.
- Stored procedures nuevos: ninguno.
- Datos que deban cargarse manualmente: ninguno para conservar el calendario actual; el script ya contiene 369 eventos y 5 boletines en la capa `cms_*`.

La API usa los SP existentes para autenticación, configuración, páginas, oferta, comunidad, archivos y auditoría. Para los módulos versionados y las bandejas de solicitudes utiliza consultas parametrizadas y transacciones sobre las tablas existentes.

## Fuente única de configuración

La tabla válida es `dbo.configuracion_sitio`. `dbo.cms_configuracion` contiene datos anteriores y no se usa como fuente institucional para evitar valores duplicados o contradictorios.
