USE [BD-LHVR];
GO

SET XACT_ABORT ON;
GO

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'dbo.cms_elementos', N'U') IS NULL
    THROW 51430, N'No existe la tabla dbo.cms_elementos. Ejecute primero la migración 006.', 1;

  UPDATE dbo.cms_elementos
  SET
    datos_json = JSON_MODIFY(
      CASE
        WHEN ISJSON(datos_json) = 1 THEN datos_json
        ELSE N'{}'
      END,
      N'$.categoria',
      N'recordatorio'
    ),
    fecha_actualizacion = SYSUTCDATETIME()
  WHERE modulo = N'BOLETINES'
    AND titulo LIKE N'Recordatorio:%'
    AND COALESCE(
      JSON_VALUE(
        CASE
          WHEN ISJSON(datos_json) = 1 THEN datos_json
          ELSE N'{}'
        END,
        N'$.categoria'
      ),
      N''
    ) <> N'recordatorio';

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO
