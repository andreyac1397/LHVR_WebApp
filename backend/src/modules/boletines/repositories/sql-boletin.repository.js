const SqlContenidoRepository = require(
  "../../../shared/content-management/sql-contenido.repository"
);
const {
  sql,
  obtenerConexion
} = require("../../../config/database");

/** Persistencia SQL propia de Boletines y de sus correos. */
class SqlBoletinRepository extends SqlContenidoRepository {
  async listarElementos(filtros) {
    const elementos = await super.listarElementos(filtros);
    return elementos.sort((a, b) => {
      const fechaA = new Date(a.fechaInicio || a.fechaCreacion || 0).getTime();
      const fechaB = new Date(b.fechaInicio || b.fechaCreacion || 0).getTime();
      return fechaB - fechaA || Number(a.orden || 0) - Number(b.orden || 0);
    });
  }

  normalizarCategoriaCorreo(fila) {
    return {
      idCategoria: Number(fila.id_categoria_destinatario),
      nombre: fila.nombre,
      slug: fila.slug,
      descripcion: fila.descripcion,
      orden: Number(fila.orden || 0),
      activo: Boolean(fila.activo)
    };
  }

  normalizarDestinatario(fila) {
    return {
      idDestinatario: Number(fila.id_destinatario),
      nombreCompleto: fila.nombre_completo,
      correo: fila.correo,
      activo: Boolean(fila.activo),
      origen: fila.origen,
      idReferencia: fila.id_referencia === null
        ? null
        : Number(fila.id_referencia),
      categorias: this.leerJson(fila.categorias_json, []).map((categoria) => ({
        idCategoria: Number(categoria.idCategoria),
        nombre: categoria.nombre,
        slug: categoria.slug
      })),
      porCategoria: Boolean(fila.por_categoria),
      porIndividual: Boolean(fila.por_individual),
      porBusqueda: Boolean(fila.por_busqueda),
      fechaCreacion: fila.fecha_creacion,
      fechaActualizacion: fila.fecha_actualizacion
    };
  }

  normalizarEnvio(fila) {
    if (!fila) return null;
    return {
      idEnvio: Number(fila.id_envio),
      idElementoBoletin: Number(fila.id_elemento_boletin),
      idAdministrador: Number(fila.id_administrador),
      tituloBoletin: fila.titulo_boletin,
      asunto: fila.asunto,
      estado: fila.estado,
      cantidadDestinatarios: Number(fila.cantidad_destinatarios || 0),
      cantidadEnviados: Number(fila.cantidad_enviados || 0),
      cantidadFallidos: Number(fila.cantidad_fallidos || 0),
      fechaCreacion: fila.fecha_creacion,
      fechaEnvio: fila.fecha_envio
    };
  }

  async listarCategoriasCorreo({ soloActivas = true } = {}) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("solo_activas", sql.Bit, Boolean(soloActivas))
      .query(`
        SELECT id_categoria_destinatario, nombre, slug, descripcion, orden, activo
        FROM dbo.categorias_destinatario_correo
        WHERE @solo_activas = 0 OR activo = 1
        ORDER BY orden, nombre, id_categoria_destinatario;
      `);
    return resultado.recordset.map((fila) =>
      this.normalizarCategoriaCorreo(fila)
    );
  }

  async listarDestinatariosCorreo(filtros = {}) {
    const conexion = await obtenerConexion();
    const pagina = Math.max(1, Number(filtros.pagina || 1));
    const limite = Math.min(100, Math.max(1, Number(filtros.limite || 20)));
    const resultado = await conexion.request()
      .input("busqueda", sql.NVarChar(250), filtros.busqueda || null)
      .input("id_categoria", sql.Int, filtros.idCategoria || null)
      .input(
        "activo",
        sql.Bit,
        filtros.activo === null || filtros.activo === undefined
          ? null
          : Boolean(filtros.activo)
      )
      .input("desplazamiento", sql.Int, (pagina - 1) * limite)
      .input("limite", sql.Int, limite)
      .query(`
        WITH filtrados AS (
          SELECT d.id_destinatario
          FROM dbo.destinatarios_correo AS d
          WHERE (@busqueda IS NULL
              OR d.nombre_completo LIKE N'%' + @busqueda + N'%'
              OR d.correo LIKE N'%' + @busqueda + N'%')
            AND (@activo IS NULL OR d.activo = @activo)
            AND (@id_categoria IS NULL OR EXISTS (
              SELECT 1 FROM dbo.destinatario_correo_categoria AS dc
              WHERE dc.id_destinatario = d.id_destinatario
                AND dc.id_categoria_destinatario = @id_categoria
            ))
        )
        SELECT COUNT_BIG(*) AS total FROM filtrados;

        WITH filtrados AS (
          SELECT d.*
          FROM dbo.destinatarios_correo AS d
          WHERE (@busqueda IS NULL
              OR d.nombre_completo LIKE N'%' + @busqueda + N'%'
              OR d.correo LIKE N'%' + @busqueda + N'%')
            AND (@activo IS NULL OR d.activo = @activo)
            AND (@id_categoria IS NULL OR EXISTS (
              SELECT 1 FROM dbo.destinatario_correo_categoria AS dc
              WHERE dc.id_destinatario = d.id_destinatario
                AND dc.id_categoria_destinatario = @id_categoria
            ))
        )
        SELECT
          d.*,
          categorias_json = JSON_QUERY((
            SELECT c.id_categoria_destinatario AS idCategoria, c.nombre, c.slug
            FROM dbo.destinatario_correo_categoria AS dc
            INNER JOIN dbo.categorias_destinatario_correo AS c
              ON c.id_categoria_destinatario = dc.id_categoria_destinatario
            WHERE dc.id_destinatario = d.id_destinatario
            ORDER BY c.orden, c.nombre
            FOR JSON PATH
          ))
        FROM filtrados AS d
        ORDER BY d.nombre_completo, d.correo, d.id_destinatario
        OFFSET @desplazamiento ROWS FETCH NEXT @limite ROWS ONLY;
      `);
    const total = Number(resultado.recordsets[0][0]?.total || 0);
    return {
      destinatarios: resultado.recordsets[1].map((fila) =>
        this.normalizarDestinatario(fila)
      ),
      paginacion: {
        pagina,
        limite,
        total,
        paginas: Math.max(1, Math.ceil(total / limite))
      }
    };
  }

  async obtenerDestinatarioCorreo(idDestinatario) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id_destinatario", sql.BigInt, idDestinatario)
      .query(`
        SELECT
          d.*,
          categorias_json = JSON_QUERY((
            SELECT c.id_categoria_destinatario AS idCategoria, c.nombre, c.slug
            FROM dbo.destinatario_correo_categoria AS dc
            INNER JOIN dbo.categorias_destinatario_correo AS c
              ON c.id_categoria_destinatario = dc.id_categoria_destinatario
            WHERE dc.id_destinatario = d.id_destinatario
            ORDER BY c.orden, c.nombre
            FOR JSON PATH
          ))
        FROM dbo.destinatarios_correo AS d
        WHERE d.id_destinatario = @id_destinatario;
      `);
    return resultado.recordset[0]
      ? this.normalizarDestinatario(resultado.recordset[0])
      : null;
  }

  async guardarDestinatarioCorreo(datos) {
    const conexion = await obtenerConexion();
    const transaccion = new sql.Transaction(conexion);
    await transaccion.begin();
    try {
      const resultado = await new sql.Request(transaccion)
        .input("id_destinatario", sql.BigInt, datos.idDestinatario || null)
        .input("nombre", sql.NVarChar(180), datos.nombreCompleto)
        .input("correo", sql.NVarChar(254), datos.correo)
        .input("activo", sql.Bit, datos.activo)
        .input("categorias_json", sql.NVarChar(sql.MAX), JSON.stringify(datos.idsCategorias))
        .input("id_administrador", sql.Int, datos.idAdministrador || null)
        .query(`
          SET XACT_ABORT ON;
          DECLARE @id_resultado BIGINT = @id_destinatario;

          IF EXISTS (
            SELECT 1 FROM dbo.destinatarios_correo WITH (UPDLOCK, HOLDLOCK)
            WHERE LOWER(LTRIM(RTRIM(correo))) = @correo
              AND (@id_destinatario IS NULL OR id_destinatario <> @id_destinatario)
          ) THROW 51050, N'Ya existe un destinatario con ese correo.', 1;

          IF EXISTS (
            SELECT 1
            FROM OPENJSON(@categorias_json) AS entrada
            LEFT JOIN dbo.categorias_destinatario_correo AS c
              ON c.id_categoria_destinatario = TRY_CONVERT(INT, entrada.[value])
             AND c.activo = 1
            WHERE c.id_categoria_destinatario IS NULL
          ) THROW 51051, N'Una categoría no existe o está inactiva.', 1;

          IF @id_resultado IS NULL
          BEGIN
            INSERT INTO dbo.destinatarios_correo (
              nombre_completo, correo, activo, origen, id_referencia,
              fecha_creacion, fecha_actualizacion,
              id_administrador_ultima_modificacion
            ) VALUES (
              @nombre, @correo, @activo, N'MANUAL', NULL,
              SYSUTCDATETIME(), SYSUTCDATETIME(), @id_administrador
            );
            SET @id_resultado = SCOPE_IDENTITY();
          END
          ELSE
          BEGIN
            UPDATE dbo.destinatarios_correo
            SET nombre_completo = @nombre,
                correo = @correo,
                activo = @activo,
                fecha_actualizacion = SYSUTCDATETIME(),
                id_administrador_ultima_modificacion = @id_administrador
            WHERE id_destinatario = @id_resultado;
            IF @@ROWCOUNT = 0
              THROW 51052, N'No se encontró el destinatario.', 1;
          END;

          DELETE FROM dbo.destinatario_correo_categoria
          WHERE id_destinatario = @id_resultado;

          INSERT INTO dbo.destinatario_correo_categoria (
            id_destinatario, id_categoria_destinatario, fecha_creacion
          )
          SELECT DISTINCT @id_resultado, TRY_CONVERT(INT, entrada.[value]), SYSUTCDATETIME()
          FROM OPENJSON(@categorias_json) AS entrada;

          SELECT @id_resultado AS id_destinatario;
        `);
      const idDestinatario = Number(resultado.recordset[0].id_destinatario);
      await transaccion.commit();
      return this.obtenerDestinatarioCorreo(idDestinatario);
    } catch (error) {
      await transaccion.rollback();
      const numero = Number(error?.number ?? error?.originalError?.info?.number);
      if ([51050, 2601, 2627].includes(numero)) {
        error.statusCode = 409;
        error.codigo = "DESTINATARIO_CORREO_DUPLICADO";
      } else if (numero === 51051) {
        error.statusCode = 400;
        error.codigo = "CATEGORIA_DESTINATARIO_INVALIDA";
      } else if (numero === 51052) {
        error.statusCode = 404;
        error.codigo = "DESTINATARIO_CORREO_NO_ENCONTRADO";
      }
      throw error;
    }
  }

  async cambiarEstadoDestinatarioCorreo(datos) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id_destinatario", sql.BigInt, datos.idDestinatario)
      .input("activo", sql.Bit, datos.activo)
      .input("id_administrador", sql.Int, datos.idAdministrador || null)
      .query(`
        UPDATE dbo.destinatarios_correo
        SET activo = @activo,
            fecha_actualizacion = SYSUTCDATETIME(),
            id_administrador_ultima_modificacion = @id_administrador
        WHERE id_destinatario = @id_destinatario;
        SELECT @@ROWCOUNT AS filas_afectadas;
      `);
    return Number(resultado.recordset[0]?.filas_afectadas || 0) > 0;
  }

  async resolverSeleccionCorreo(seleccion = {}) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("categorias_json", sql.NVarChar(sql.MAX), JSON.stringify(seleccion.idsCategorias || []))
      .input("destinatarios_json", sql.NVarChar(sql.MAX), JSON.stringify(seleccion.idsDestinatarios || []))
      .input("busquedas_json", sql.NVarChar(sql.MAX), JSON.stringify(seleccion.criteriosBusqueda || []))
      .input("excluidos_json", sql.NVarChar(sql.MAX), JSON.stringify(seleccion.idsExcluidos || []))
      .query(`
        WITH categorias AS (
          SELECT DISTINCT TRY_CONVERT(INT, [value]) AS id FROM OPENJSON(@categorias_json)
          WHERE TRY_CONVERT(INT, [value]) IS NOT NULL
        ), individuales AS (
          SELECT DISTINCT TRY_CONVERT(BIGINT, [value]) AS id FROM OPENJSON(@destinatarios_json)
          WHERE TRY_CONVERT(BIGINT, [value]) IS NOT NULL
        ), busquedas AS (
          SELECT DISTINCT LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(250), [value])))) AS criterio
          FROM OPENJSON(@busquedas_json)
          WHERE LTRIM(RTRIM(CONVERT(NVARCHAR(250), [value]))) <> N''
        ), excluidos AS (
          SELECT DISTINCT TRY_CONVERT(BIGINT, [value]) AS id FROM OPENJSON(@excluidos_json)
          WHERE TRY_CONVERT(BIGINT, [value]) IS NOT NULL
        ), candidatos AS (
          SELECT d.*,
            CAST(CASE WHEN EXISTS (
              SELECT 1 FROM dbo.destinatario_correo_categoria AS dc
              INNER JOIN categorias AS c ON c.id = dc.id_categoria_destinatario
              WHERE dc.id_destinatario = d.id_destinatario
            ) THEN 1 ELSE 0 END AS BIT) AS por_categoria,
            CAST(CASE WHEN EXISTS (
              SELECT 1 FROM individuales AS i WHERE i.id = d.id_destinatario
            ) THEN 1 ELSE 0 END AS BIT) AS por_individual,
            CAST(CASE WHEN EXISTS (
              SELECT 1 FROM busquedas AS b
              WHERE LOWER(d.nombre_completo) LIKE N'%' + b.criterio + N'%'
                 OR LOWER(d.correo) LIKE N'%' + b.criterio + N'%'
            ) THEN 1 ELSE 0 END AS BIT) AS por_busqueda
          FROM dbo.destinatarios_correo AS d
          WHERE d.activo = 1
            AND NOT EXISTS (SELECT 1 FROM excluidos AS x WHERE x.id = d.id_destinatario)
        )
        SELECT
          d.id_destinatario,
          d.nombre_completo,
          LOWER(LTRIM(RTRIM(d.correo))) AS correo,
          d.activo,
          d.origen,
          d.id_referencia,
          d.fecha_creacion,
          d.fecha_actualizacion,
          d.por_categoria,
          d.por_individual,
          d.por_busqueda,
          categorias_json = JSON_QUERY((
            SELECT c.id_categoria_destinatario AS idCategoria, c.nombre, c.slug
            FROM dbo.destinatario_correo_categoria AS dc
            INNER JOIN dbo.categorias_destinatario_correo AS c
              ON c.id_categoria_destinatario = dc.id_categoria_destinatario
            WHERE dc.id_destinatario = d.id_destinatario
            ORDER BY c.orden, c.nombre FOR JSON PATH
          ))
        FROM candidatos AS d
        WHERE d.por_categoria = 1 OR d.por_individual = 1 OR d.por_busqueda = 1
        ORDER BY d.nombre_completo, d.correo, d.id_destinatario;
      `);
    const porCorreo = new Map();
    resultado.recordset.forEach((fila) => {
      const destinatario = this.normalizarDestinatario(fila);
      const clave = destinatario.correo.trim().toLowerCase();
      if (!porCorreo.has(clave)) porCorreo.set(clave, destinatario);
    });
    return [...porCorreo.values()];
  }

  async obtenerBoletinCorreo(idElementoBoletin) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id_elemento", sql.Int, idElementoBoletin)
      .query(`
        SELECT TOP 1 id_elemento, titulo, descripcion, fecha_inicio,
          fecha_creacion, url, url_secundaria,
          JSON_VALUE(datos_json, '$.categoria') AS categoria,
          JSON_VALUE(datos_json, '$.edicion') AS edicion
        FROM dbo.cms_elementos
        WHERE id_elemento = @id_elemento AND modulo = N'BOLETINES';
      `);
    const fila = resultado.recordset[0];
    return fila ? {
      idElemento: Number(fila.id_elemento),
      titulo: fila.titulo,
      descripcion: fila.descripcion,
      fechaInicio: fila.fecha_inicio || fila.fecha_creacion,
      categoria: fila.categoria,
      edicion: fila.edicion,
      url: fila.url_secundaria || fila.url
    } : null;
  }

  async obtenerUltimoEnvioBoletin(idElementoBoletin) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id_elemento", sql.Int, idElementoBoletin)
      .query(`
        SELECT TOP 1 e.*, b.titulo AS titulo_boletin
        FROM dbo.boletin_envios AS e
        INNER JOIN dbo.cms_elementos AS b
          ON b.id_elemento = e.id_elemento_boletin AND b.modulo = N'BOLETINES'
        WHERE e.id_elemento_boletin = @id_elemento
        ORDER BY e.fecha_creacion DESC, e.id_envio DESC;
      `);
    return this.normalizarEnvio(resultado.recordset[0]);
  }

  async crearEnvioBoletin(datos) {
    const conexion = await obtenerConexion();
    const transaccion = new sql.Transaction(conexion);
    await transaccion.begin();
    try {
      const resultado = await new sql.Request(transaccion)
        .input("id_elemento", sql.Int, datos.idElementoBoletin)
        .input("id_administrador", sql.Int, datos.idAdministrador)
        .input("asunto", sql.NVarChar(250), datos.asunto)
        .input("destinatarios_json", sql.NVarChar(sql.MAX), JSON.stringify(datos.destinatarios))
        .query(`
          SET XACT_ABORT ON;
          IF NOT EXISTS (
            SELECT 1 FROM dbo.cms_elementos
            WHERE id_elemento = @id_elemento AND modulo = N'BOLETINES'
          ) THROW 51053, N'No se encontró el boletín.', 1;

          IF EXISTS (
            SELECT 1 FROM dbo.boletin_envios WITH (UPDLOCK, HOLDLOCK)
            WHERE id_elemento_boletin = @id_elemento
          ) THROW 51054, N'Este boletín ya tiene un envío registrado.', 1;

          INSERT INTO dbo.boletin_envios (
            id_elemento_boletin, id_administrador, asunto, estado,
            cantidad_destinatarios, cantidad_enviados, cantidad_fallidos,
            fecha_creacion, fecha_envio
          )
          SELECT @id_elemento, @id_administrador, @asunto, N'PENDIENTE',
            COUNT(*), 0, 0, SYSUTCDATETIME(), NULL
          FROM OPENJSON(@destinatarios_json);

          DECLARE @id_envio BIGINT = SCOPE_IDENTITY();
          INSERT INTO dbo.boletin_envio_destinatarios (
            id_envio, id_destinatario, nombre_destinatario,
            correo_destinatario, estado, fecha_envio, mensaje_error
          )
          SELECT DISTINCT @id_envio, d.idDestinatario, d.nombreCompleto,
            LOWER(LTRIM(RTRIM(d.correo))), N'PENDIENTE', NULL, NULL
          FROM OPENJSON(@destinatarios_json)
          WITH (
            idDestinatario BIGINT '$.idDestinatario',
            nombreCompleto NVARCHAR(180) '$.nombreCompleto',
            correo NVARCHAR(254) '$.correo'
          ) AS d;
          SELECT @id_envio AS id_envio;
        `);
      const idEnvio = Number(resultado.recordset[0].id_envio);
      await transaccion.commit();
      return idEnvio;
    } catch (error) {
      await transaccion.rollback();
      const numero = Number(error?.number ?? error?.originalError?.info?.number);
      if (numero === 51053) {
        error.statusCode = 404;
        error.codigo = "BOLETIN_NO_ENCONTRADO";
      } else if ([51054, 2601, 2627].includes(numero)) {
        error.statusCode = 409;
        error.codigo = "BOLETIN_YA_ENVIADO";
      }
      throw error;
    }
  }

  async cambiarEstadoEnvio(idEnvio, estado) {
    const conexion = await obtenerConexion();
    await conexion.request()
      .input("id_envio", sql.BigInt, idEnvio)
      .input("estado", sql.NVarChar(30), estado)
      .query(`UPDATE dbo.boletin_envios SET estado = @estado WHERE id_envio = @id_envio;`);
  }

  async registrarResultadoDestinatario(datos) {
    const conexion = await obtenerConexion();
    await conexion.request()
      .input("id_envio", sql.BigInt, datos.idEnvio)
      .input("correo", sql.NVarChar(254), datos.correo)
      .input("estado", sql.NVarChar(30), datos.estado)
      .input("mensaje_error", sql.NVarChar(1000), datos.mensajeError || null)
      .query(`
        UPDATE dbo.boletin_envio_destinatarios
        SET estado = @estado,
            fecha_envio = CASE WHEN @estado = N'ENVIADO' THEN SYSUTCDATETIME() ELSE NULL END,
            mensaje_error = @mensaje_error
        WHERE id_envio = @id_envio AND correo_destinatario = @correo;
      `);
  }

  async finalizarEnvio(idEnvio) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id_envio", sql.BigInt, idEnvio)
      .query(`
        DECLARE @total INT, @enviados INT, @fallidos INT, @estado NVARCHAR(30);
        SELECT @total = COUNT(*),
          @enviados = SUM(CASE WHEN estado = N'ENVIADO' THEN 1 ELSE 0 END),
          @fallidos = SUM(CASE WHEN estado = N'FALLIDO' THEN 1 ELSE 0 END)
        FROM dbo.boletin_envio_destinatarios WHERE id_envio = @id_envio;
        SET @enviados = ISNULL(@enviados, 0);
        SET @fallidos = ISNULL(@fallidos, 0);
        SET @estado = CASE
          WHEN @total > 0 AND @enviados = @total THEN N'ENVIADO'
          WHEN @enviados > 0 AND @fallidos > 0 THEN N'PARCIAL'
          ELSE N'FALLIDO' END;
        UPDATE dbo.boletin_envios
        SET estado = @estado, cantidad_destinatarios = @total,
          cantidad_enviados = @enviados, cantidad_fallidos = @fallidos,
          fecha_envio = SYSUTCDATETIME()
        WHERE id_envio = @id_envio;
        SELECT e.*, b.titulo AS titulo_boletin
        FROM dbo.boletin_envios AS e
        INNER JOIN dbo.cms_elementos AS b ON b.id_elemento = e.id_elemento_boletin
        WHERE e.id_envio = @id_envio;
      `);
    return this.normalizarEnvio(resultado.recordset[0]);
  }

  async listarEnviosCorreo({ pagina = 1, limite = 20 } = {}) {
    const conexion = await obtenerConexion();
    const paginaSegura = Math.max(1, Number(pagina || 1));
    const limiteSeguro = Math.min(100, Math.max(1, Number(limite || 20)));
    const resultado = await conexion.request()
      .input("desplazamiento", sql.Int, (paginaSegura - 1) * limiteSeguro)
      .input("limite", sql.Int, limiteSeguro)
      .query(`
        SELECT COUNT_BIG(*) AS total FROM dbo.boletin_envios;
        SELECT e.*, b.titulo AS titulo_boletin
        FROM dbo.boletin_envios AS e
        INNER JOIN dbo.cms_elementos AS b
          ON b.id_elemento = e.id_elemento_boletin AND b.modulo = N'BOLETINES'
        ORDER BY e.fecha_creacion DESC, e.id_envio DESC
        OFFSET @desplazamiento ROWS FETCH NEXT @limite ROWS ONLY;
      `);
    const total = Number(resultado.recordsets[0][0]?.total || 0);
    return {
      envios: resultado.recordsets[1].map((fila) => this.normalizarEnvio(fila)),
      paginacion: {
        pagina: paginaSegura,
        limite: limiteSeguro,
        total,
        paginas: Math.max(1, Math.ceil(total / limiteSeguro))
      }
    };
  }

  async obtenerDetalleEnvioCorreo(idEnvio) {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
      .input("id_envio", sql.BigInt, idEnvio)
      .query(`
        SELECT e.*, b.titulo AS titulo_boletin
        FROM dbo.boletin_envios AS e
        INNER JOIN dbo.cms_elementos AS b
          ON b.id_elemento = e.id_elemento_boletin AND b.modulo = N'BOLETINES'
        WHERE e.id_envio = @id_envio;
        SELECT id_envio_destinatario, id_envio, id_destinatario,
          nombre_destinatario, correo_destinatario, estado,
          fecha_envio, mensaje_error
        FROM dbo.boletin_envio_destinatarios
        WHERE id_envio = @id_envio
        ORDER BY nombre_destinatario, correo_destinatario;
      `);
    const envio = this.normalizarEnvio(resultado.recordsets[0][0]);
    return envio ? {
      ...envio,
      destinatarios: resultado.recordsets[1].map((fila) => ({
        idEnvioDestinatario: Number(fila.id_envio_destinatario),
        idDestinatario: fila.id_destinatario === null ? null : Number(fila.id_destinatario),
        nombreCompleto: fila.nombre_destinatario,
        correo: fila.correo_destinatario,
        estado: fila.estado,
        fechaEnvio: fila.fecha_envio,
        mensajeError: fila.mensaje_error
      }))
    } : null;
  }
}

module.exports = SqlBoletinRepository;
