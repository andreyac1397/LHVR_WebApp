/*
 * Consulta los límites de solicitudes
 * de recuperación de contraseña.
 *
 * Utiliza la tabla dbo.auditoria.
 *
 * Reglas que permitirá aplicar:
 * - Esperar 60 segundos entre solicitudes
 *   para el mismo correo.
 * - Máximo de 3 solicitudes por correo
 *   dentro de una ventana de 15 minutos.
 * - Máximo de 10 solicitudes por IP
 *   dentro de una ventana de 15 minutos.
 *
 * El correo nunca se recibe directamente.
 * Se recibe únicamente su hash SHA-256.
 */

CREATE OR ALTER PROCEDURE
  dbo.usp_RecuperacionContrasena_ConsultarLimites

  @correo_hash NVARCHAR(64),
  @direccion_ip NVARCHAR(45) = NULL,
  @ventana_minutos INT = 15,
  @segundos_espera INT = 60
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  /*
   * Normalizar parámetros.
   */
  SET @correo_hash =
    LOWER(
      LTRIM(
        RTRIM(@correo_hash)
      )
    );

  SET @direccion_ip =
    NULLIF(
      LTRIM(
        RTRIM(@direccion_ip)
      ),
      N''
    );

  /*
   * Validar el hash SHA-256.
   *
   * Un hash SHA-256 hexadecimal
   * contiene exactamente 64 caracteres.
   */
  IF (
    @correo_hash IS NULL OR
    LEN(@correo_hash) <> 64 OR
    @correo_hash LIKE N'%[^0-9a-f]%'
  )
  BEGIN
    THROW 51000,
      N'El hash del correo no es válido.',
      1;
  END;

  IF (
    @ventana_minutos IS NULL OR
    @ventana_minutos < 1 OR
    @ventana_minutos > 1440
  )
  BEGIN
    THROW 51001,
      N'La ventana de minutos no es válida.',
      1;
  END;

  IF (
    @segundos_espera IS NULL OR
    @segundos_espera < 1 OR
    @segundos_espera > 3600
  )
  BEGIN
    THROW 51002,
      N'El tiempo mínimo entre solicitudes no es válido.',
      1;
  END;

  DECLARE
    @id_accion_auditoria INT,
    @id_modulo_sistema INT,
    @fecha_actual DATETIME2(0),
    @fecha_inicio_ventana DATETIME2(0),
    @fecha_ultima_solicitud DATETIME2(0),
    @solicitudes_por_correo INT,
    @solicitudes_por_ip INT,
    @segundos_desde_ultima_solicitud INT,
    @segundos_restantes_espera INT;

  /*
   * Obtener la acción de auditoría.
   */
  SELECT
    @id_accion_auditoria =
      aa.id_accion_auditoria
  FROM dbo.acciones_auditoria AS aa
  WHERE
    aa.codigo = N'SOLICITAR_RECUPERACION'
    AND aa.activo = 1;

  IF @id_accion_auditoria IS NULL
  BEGIN
    THROW 51003,
      N'La acción SOLICITAR_RECUPERACION no existe o está inactiva.',
      1;
  END;

  /*
   * Obtener el módulo de seguridad.
   */
  SELECT
    @id_modulo_sistema =
      ms.id_modulo_sistema
  FROM dbo.modulos_sistema AS ms
  WHERE
    ms.codigo = N'SEGURIDAD'
    AND ms.activo = 1;

  IF @id_modulo_sistema IS NULL
  BEGIN
    THROW 51004,
      N'El módulo SEGURIDAD no existe o está inactivo.',
      1;
  END;

  SET @fecha_actual =
    SYSUTCDATETIME();

  SET @fecha_inicio_ventana =
    DATEADD(
      MINUTE,
      -@ventana_minutos,
      @fecha_actual
    );

  /*
   * Contar solicitudes permitidas para
   * el mismo hash de correo.
   *
   * El hash se almacena en:
   * id_registro_afectado
   */
  SELECT
    @solicitudes_por_correo =
      COUNT(*)
  FROM dbo.auditoria AS a
  WHERE
    a.id_accion_auditoria =
      @id_accion_auditoria

    AND a.id_modulo_sistema =
      @id_modulo_sistema

    AND a.tabla_afectada =
      N'administradores'

    AND a.id_registro_afectado =
      @correo_hash

    AND a.fecha_accion >=
      @fecha_inicio_ventana

    AND JSON_VALUE(
      a.datos_nuevos,
      N'$.resultado'
    ) = N'PERMITIDA';

  /*
   * Contar solicitudes permitidas desde
   * la misma dirección IP.
   */
  IF @direccion_ip IS NULL
  BEGIN
    SET @solicitudes_por_ip = 0;
  END;
  ELSE
  BEGIN
    SELECT
      @solicitudes_por_ip =
        COUNT(*)
    FROM dbo.auditoria AS a
    WHERE
      a.id_accion_auditoria =
        @id_accion_auditoria

      AND a.id_modulo_sistema =
        @id_modulo_sistema

      AND a.tabla_afectada =
        N'administradores'

      AND a.direccion_ip =
        @direccion_ip

      AND a.fecha_accion >=
        @fecha_inicio_ventana

      AND JSON_VALUE(
        a.datos_nuevos,
        N'$.resultado'
      ) = N'PERMITIDA';
  END;

  /*
   * Obtener la última solicitud permitida
   * para el mismo correo.
   */
  SELECT
    @fecha_ultima_solicitud =
      MAX(a.fecha_accion)
  FROM dbo.auditoria AS a
  WHERE
    a.id_accion_auditoria =
      @id_accion_auditoria

    AND a.id_modulo_sistema =
      @id_modulo_sistema

    AND a.tabla_afectada =
      N'administradores'

    AND a.id_registro_afectado =
      @correo_hash

    AND JSON_VALUE(
      a.datos_nuevos,
      N'$.resultado'
    ) = N'PERMITIDA';

  /*
   * Calcular el tiempo transcurrido desde
   * la última solicitud del correo.
   */
  IF @fecha_ultima_solicitud IS NULL
  BEGIN
    SET @segundos_desde_ultima_solicitud =
      NULL;

    SET @segundos_restantes_espera = 0;
  END;
  ELSE
  BEGIN
    SET @segundos_desde_ultima_solicitud =
      DATEDIFF(
        SECOND,
        @fecha_ultima_solicitud,
        @fecha_actual
      );

    SET @segundos_restantes_espera =
      CASE
        WHEN
          @segundos_desde_ultima_solicitud
          >= @segundos_espera
        THEN 0

        ELSE
          @segundos_espera -
          @segundos_desde_ultima_solicitud
      END;
  END;

  /*
   * Resultado utilizado por el backend.
   */
  SELECT
    @solicitudes_por_correo
      AS solicitudes_por_correo,

    @solicitudes_por_ip
      AS solicitudes_por_ip,

    @fecha_ultima_solicitud
      AS fecha_ultima_solicitud,

    @segundos_desde_ultima_solicitud
      AS segundos_desde_ultima_solicitud,

    @segundos_restantes_espera
      AS segundos_restantes_espera,

    @ventana_minutos
      AS ventana_minutos,

    @segundos_espera
      AS segundos_espera;
END;
GO  