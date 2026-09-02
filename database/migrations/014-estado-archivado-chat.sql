USE [BD-LHVR];
GO

SET XACT_ABORT ON;
GO

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'dbo.estados_chat', N'U') IS NULL
    THROW 51440, N'No existe la tabla dbo.estados_chat.', 1;

  IF NOT EXISTS (
    SELECT 1
    FROM dbo.estados_chat
    WHERE nombre = N'Archivado'
  )
  BEGIN
    INSERT INTO dbo.estados_chat (
      nombre,
      descripcion,
      orden,
      activo
    )
    VALUES (
      N'Archivado',
      N'Conversación archivada y conservada para consulta administrativa.',
      4,
      1
    );
  END;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO
