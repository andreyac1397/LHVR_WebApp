const AutenticacionRepositoryContract = require(
  "../contracts/autenticacion.repository.contract"
);

const {
  sql,
  obtenerConexion
} = require("../../../config/database");

/*
 * Repositorio SQL del módulo de autenticación.
 *
 * Es la única clase de este módulo que se comunica
 * directamente con SQL Server.
 *
 * Ejecuta los procedimientos almacenados de autenticación
 * y transforma los nombres de SQL Server al formato
 * utilizado por Node.js.
 */
class SqlAutenticacionRepository
  extends AutenticacionRepositoryContract {

  /**
   * Obtiene la primera fila devuelta por un procedimiento.
   *
   * @param {object} resultado
   * @returns {object|null}
   */
  obtenerPrimeraFila(resultado) {
    if (
      !resultado ||
      !Array.isArray(resultado.recordset) ||
      resultado.recordset.length === 0
    ) {
      return null;
    }

    return resultado.recordset[0];
  }

  /**
   * Convierte un valor numérico proveniente de SQL Server.
   *
   * Evita convertir null en 0.
   *
   * @param {*} valor
   * @returns {number|null}
   */
  convertirNumero(valor) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    return Number(valor);
  }

  /**
   * Busca un administrador por correo.
   *
   * Procedimiento:
   * dbo.usp_Administrador_BuscarPorCorreo
   *
   * @param {string} correo
   * @returns {Promise<object|null>}
   */
  async buscarAdministradorPorCorreo(correo) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "correo",
        sql.NVarChar(254),
        correo
      )
      .execute(
        "dbo.usp_Administrador_BuscarPorCorreo"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    if (!fila) {
      return null;
    }

    return {
      idAdministrador: this.convertirNumero(
        fila.id_administrador
      ),

      nombreCompleto:
        fila.nombre_completo,

      correo:
        fila.correo,

      contrasenaHash:
        fila.contrasena_hash,

      idEstadoAdministrador: this.convertirNumero(
        fila.id_estado_administrador
      ),

      nombreEstado:
        fila.nombre_estado,

      descripcionEstado:
        fila.descripcion_estado,

      permiteAcceso: Boolean(
        fila.permite_acceso
      ),

      estadoActivo: Boolean(
        fila.estado_activo
      ),

      correoVerificado: Boolean(
        fila.correo_verificado
      ),

      requiereVerificacion: Boolean(
        fila.requiere_verificacion
      ),

      ultimoAcceso:
        fila.ultimo_acceso,

      fechaCreacion:
        fila.fecha_creacion,

      fechaActualizacion:
        fila.fecha_actualizacion
    };
  }

  /**
   * Registra un intento de inicio de sesión.
   *
   * Procedimiento:
   * dbo.usp_IntentoInicioSesion_Registrar
   *
   * @param {object} datosIntento
   * @returns {Promise<object>}
   */
  async registrarIntentoInicioSesion(
    datosIntento
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_administrador",
        sql.Int,
        datosIntento.idAdministrador ?? null
      )
      .input(
        "correo_ingresado",
        sql.NVarChar(254),
        datosIntento.correoIngresado
      )
      .input(
        "exitoso",
        sql.Bit,
        datosIntento.exitoso
      )
      .input(
        "motivo_resultado",
        sql.NVarChar(250),
        datosIntento.motivoResultado ?? null
      )
      .input(
        "direccion_ip",
        sql.NVarChar(45),
        datosIntento.direccionIp ?? null
      )
      .input(
        "user_agent",
        sql.NVarChar(500),
        datosIntento.userAgent ?? null
      )
      .execute(
        "dbo.usp_IntentoInicioSesion_Registrar"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    return {
      idIntentoInicioSesion:
        this.convertirNumero(
          fila.id_intento_inicio_sesion
        ),

      idAdministrador:
        this.convertirNumero(
          fila.id_administrador
        ),

      correoIngresado:
        fila.correo_ingresado,

      exitoso:
        Boolean(fila.exitoso),

      motivoResultado:
        fila.motivo_resultado,

      fechaIntento:
        fila.fecha_intento
    };
  }

  /**
   * Cuenta intentos fallidos recientes.
   *
   * Procedimiento:
   * dbo.usp_IntentosInicioSesion_ContarFallidosRecientes
   *
   * @param {object} filtros
   * @returns {Promise<object>}
   */
  async contarIntentosFallidosRecientes(
    filtros
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "correo",
        sql.NVarChar(254),
        filtros.correo
      )
      .input(
        "direccion_ip",
        sql.NVarChar(45),
        filtros.direccionIp ?? null
      )
      .input(
        "ventana_minutos",
        sql.Int,
        filtros.ventanaMinutos
      )
      .execute(
        "dbo.usp_IntentosInicioSesion_ContarFallidosRecientes"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    return {
      fallidosPorCorreo:
        this.convertirNumero(
          fila.fallidos_por_correo
        ),

      fallidosPorIp:
        this.convertirNumero(
          fila.fallidos_por_ip
        ),

      ventanaMinutos:
        this.convertirNumero(
          fila.ventana_minutos
        )
    };
  }

  /**
   * Actualiza la fecha del último acceso.
   *
   * Procedimiento:
   * dbo.usp_Administrador_ActualizarUltimoAcceso
   *
   * @param {number} idAdministrador
   * @returns {Promise<object>}
   */
  async actualizarUltimoAcceso(
    idAdministrador
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_administrador",
        sql.Int,
        idAdministrador
      )
      .execute(
        "dbo.usp_Administrador_ActualizarUltimoAcceso"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    return {
      idAdministrador:
        this.convertirNumero(
          fila.id_administrador
        ),

      ultimoAcceso:
        fila.ultimo_acceso,

      fechaActualizacion:
        fila.fecha_actualizacion
    };
  }

  /**
   * Actualiza el hash de la contraseña.
   *
   * El procedimiento también:
   * - Revoca tokens activos.
   * - Invalida códigos pendientes.
   *
   * Procedimiento:
   * dbo.usp_Administrador_ActualizarContrasena
   *
   * @param {number} idAdministrador
   * @param {string} contrasenaHashNueva
   * @returns {Promise<object>}
   */
  async actualizarContrasenaAdministrador(
    idAdministrador,
    contrasenaHashNueva
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_administrador",
        sql.Int,
        idAdministrador
      )
      .input(
        "contrasena_hash_nueva",
        sql.NVarChar(255),
        contrasenaHashNueva
      )
      .execute(
        "dbo.usp_Administrador_ActualizarContrasena"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    return {
      idAdministrador:
        this.convertirNumero(
          fila.id_administrador
        ),

      correo:
        fila.correo,

      fechaActualizacion:
        fila.fecha_actualizacion,

      tokensRevocados:
        this.convertirNumero(
          fila.tokens_revocados
        ),

      codigosInvalidados:
        this.convertirNumero(
          fila.codigos_invalidados
        )
    };
  }

  /**
   * Crea un código de verificación.
   *
   * Procedimiento:
   * dbo.usp_CodigoVerificacionAdmin_Crear
   *
   * @param {object} datosCodigo
   * @returns {Promise<object>}
   */
  async crearCodigoVerificacion(
    datosCodigo
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_administrador",
        sql.Int,
        datosCodigo.idAdministrador
      )
      .input(
        "tipo_codigo",
        sql.NVarChar(50),
        datosCodigo.tipoCodigo
      )
      .input(
        "codigo_hash",
        sql.NVarChar(255),
        datosCodigo.codigoHash
      )
      .input(
        "minutos_vigencia",
        sql.Int,
        datosCodigo.minutosVigencia
      )
      .input(
        "maximo_intentos",
        sql.Int,
        datosCodigo.maximoIntentos
      )
      .input(
        "direccion_ip",
        sql.NVarChar(45),
        datosCodigo.direccionIp ?? null
      )
      .execute(
        "dbo.usp_CodigoVerificacionAdmin_Crear"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    return {
      idCodigoVerificacionAdmin:
        this.convertirNumero(
          fila.id_codigo_verificacion_admin
        ),

      idAdministrador:
        this.convertirNumero(
          fila.id_administrador
        ),

      tipoCodigo:
        fila.tipo_codigo,

      fechaCreacion:
        fila.fecha_creacion,

      fechaExpiracion:
        fila.fecha_expiracion,

      maximoIntentos:
        this.convertirNumero(
          fila.maximo_intentos
        ),

      usado:
        Boolean(fila.usado)
    };
  }

  /**
   * Obtiene el código vigente más reciente.
   *
   * Procedimiento:
   * dbo.usp_CodigoVerificacionAdmin_ObtenerVigente
   *
   * @param {number} idAdministrador
   * @param {string} tipoCodigo
   * @returns {Promise<object|null>}
   */
  async obtenerCodigoVerificacionVigente(
    idAdministrador,
    tipoCodigo
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_administrador",
        sql.Int,
        idAdministrador
      )
      .input(
        "tipo_codigo",
        sql.NVarChar(50),
        tipoCodigo
      )
      .execute(
        "dbo.usp_CodigoVerificacionAdmin_ObtenerVigente"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    if (!fila) {
      return null;
    }

    return {
      idCodigoVerificacionAdmin:
        this.convertirNumero(
          fila.id_codigo_verificacion_admin
        ),

      idAdministrador:
        this.convertirNumero(
          fila.id_administrador
        ),

      tipoCodigo:
        fila.tipo_codigo,

      codigoHash:
        fila.codigo_hash,

      fechaCreacion:
        fila.fecha_creacion,

      fechaExpiracion:
        fila.fecha_expiracion,

      cantidadIntentos:
        this.convertirNumero(
          fila.cantidad_intentos
        ),

      maximoIntentos:
        this.convertirNumero(
          fila.maximo_intentos
        ),

      usado:
        Boolean(fila.usado),

      direccionIp:
        fila.direccion_ip
    };
  }

  /**
   * Registra un intento incorrecto de código.
   *
   * Procedimiento:
   * dbo.usp_CodigoVerificacionAdmin_RegistrarIntentoFallido
   *
   * @param {number} idCodigoVerificacionAdmin
   * @returns {Promise<object>}
   */
  async registrarIntentoFallidoCodigo(
    idCodigoVerificacionAdmin
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_codigo_verificacion_admin",
        sql.BigInt,
        idCodigoVerificacionAdmin
      )
      .execute(
        "dbo.usp_CodigoVerificacionAdmin_RegistrarIntentoFallido"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    return {
      idCodigoVerificacionAdmin:
        this.convertirNumero(
          fila.id_codigo_verificacion_admin
        ),

      cantidadIntentos:
        this.convertirNumero(
          fila.cantidad_intentos
        ),

      maximoIntentos:
        this.convertirNumero(
          fila.maximo_intentos
        ),

      usado:
        Boolean(fila.usado),

      fechaUso:
        fila.fecha_uso
    };
  }

  /**
   * Marca un código como usado.
   *
   * Procedimiento:
   * dbo.usp_CodigoVerificacionAdmin_MarcarUsado
   *
   * @param {number} idCodigoVerificacionAdmin
   * @returns {Promise<object>}
   */
  async marcarCodigoVerificacionUsado(
    idCodigoVerificacionAdmin
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_codigo_verificacion_admin",
        sql.BigInt,
        idCodigoVerificacionAdmin
      )
      .execute(
        "dbo.usp_CodigoVerificacionAdmin_MarcarUsado"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    return {
      idCodigoVerificacionAdmin:
        this.convertirNumero(
          fila.id_codigo_verificacion_admin
        ),

      idAdministrador:
        this.convertirNumero(
          fila.id_administrador
        ),

      tipoCodigo:
        fila.tipo_codigo,

      usado:
        Boolean(fila.usado),

      fechaUso:
        fila.fecha_uso
    };
  }

  /**
   * Crea un token administrativo.
   *
   * Procedimiento:
   * dbo.usp_TokenAdministrador_Crear
   *
   * @param {object} datosToken
   * @returns {Promise<object>}
   */
  async crearTokenAdministrador(
    datosToken
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "id_administrador",
        sql.Int,
        datosToken.idAdministrador
      )
      .input(
        "tipo_token",
        sql.NVarChar(50),
        datosToken.tipoToken
      )
      .input(
        "token_hash",
        sql.NVarChar(255),
        datosToken.tokenHash
      )
      .input(
        "minutos_vigencia",
        sql.Int,
        datosToken.minutosVigencia
      )
      .input(
        "direccion_ip",
        sql.NVarChar(45),
        datosToken.direccionIp ?? null
      )
      .input(
        "user_agent",
        sql.NVarChar(500),
        datosToken.userAgent ?? null
      )
      .execute(
        "dbo.usp_TokenAdministrador_Crear"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    return {
      idTokenAdministrador:
        this.convertirNumero(
          fila.id_token_administrador
        ),

      idAdministrador:
        this.convertirNumero(
          fila.id_administrador
        ),

      tipoToken:
        fila.tipo_token,

      fechaEmision:
        fila.fecha_emision,

      fechaExpiracion:
        fila.fecha_expiracion,

      fechaRevocacion:
        fila.fecha_revocacion,

      usado:
        Boolean(fila.usado)
    };
  }

  /**
   * Busca un token activo.
   *
   * Procedimiento:
   * dbo.usp_TokenAdministrador_BuscarActivo
   *
   * @param {string} tipoToken
   * @param {string} tokenHash
   * @returns {Promise<object|null>}
   */
  async buscarTokenActivo(
    tipoToken,
    tokenHash
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "tipo_token",
        sql.NVarChar(50),
        tipoToken
      )
      .input(
        "token_hash",
        sql.NVarChar(255),
        tokenHash
      )
      .execute(
        "dbo.usp_TokenAdministrador_BuscarActivo"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    if (!fila) {
      return null;
    }

    return {
      idTokenAdministrador:
        this.convertirNumero(
          fila.id_token_administrador
        ),

      idAdministrador:
        this.convertirNumero(
          fila.id_administrador
        ),

      tipoToken:
        fila.tipo_token,

      fechaEmision:
        fila.fecha_emision,

      fechaExpiracion:
        fila.fecha_expiracion,

      fechaRevocacion:
        fila.fecha_revocacion,

      usado:
        Boolean(fila.usado),

      direccionIp:
        fila.direccion_ip,

      userAgent:
        fila.user_agent,

      nombreCompleto:
        fila.nombre_completo,

      correo:
        fila.correo,

      correoVerificado:
        Boolean(
          fila.correo_verificado
        ),

      requiereVerificacion:
        Boolean(
          fila.requiere_verificacion
        ),

      idEstadoAdministrador:
        this.convertirNumero(
          fila.id_estado_administrador
        ),

      nombreEstado:
        fila.nombre_estado,

      permiteAcceso:
        Boolean(
          fila.permite_acceso
        ),

      estadoActivo:
        Boolean(
          fila.estado_activo
        )
    };
  }

  /**
   * Revoca un token administrativo.
   *
   * Procedimiento:
   * dbo.usp_TokenAdministrador_Revocar
   *
   * @param {string} tipoToken
   * @param {string} tokenHash
   * @returns {Promise<object>}
   */
  async revocarTokenAdministrador(
    tipoToken,
    tokenHash
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "tipo_token",
        sql.NVarChar(50),
        tipoToken
      )
      .input(
        "token_hash",
        sql.NVarChar(255),
        tokenHash
      )
      .execute(
        "dbo.usp_TokenAdministrador_Revocar"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    return {
      revocado:
        Boolean(fila.revocado),

      idTokenAdministrador:
        this.convertirNumero(
          fila.id_token_administrador
        ),

      idAdministrador:
        this.convertirNumero(
          fila.id_administrador
        ),

      tipoToken:
        fila.tipo_token,

      fechaRevocacion:
        fila.fecha_revocacion
    };
  }

  /**
   * Consulta los límites de solicitudes
   * de recuperación de contraseña.
   *
   * Procedimiento:
   * dbo.usp_RecuperacionContrasena_ConsultarLimites
   *
   * @param {object} filtros
   * @param {string} filtros.correoHash
   * @param {string|null} filtros.direccionIp
   * @param {number} filtros.ventanaMinutos
   * @param {number} filtros.segundosEspera
   * @returns {Promise<object>}
   */
  async consultarLimitesRecuperacion(
    filtros
  ) {
    const conexion = await obtenerConexion();

    const resultado = await conexion
      .request()
      .input(
        "correo_hash",
        sql.NVarChar(64),
        filtros.correoHash
      )
      .input(
        "direccion_ip",
        sql.NVarChar(45),
        filtros.direccionIp ?? null
      )
      .input(
        "ventana_minutos",
        sql.Int,
        filtros.ventanaMinutos
      )
      .input(
        "segundos_espera",
        sql.Int,
        filtros.segundosEspera
      )
      .execute(
        "dbo.usp_RecuperacionContrasena_ConsultarLimites"
      );

    const fila = this.obtenerPrimeraFila(resultado);

    if (!fila) {
      return {
        solicitudesPorCorreo: 0,
        solicitudesPorIp: 0,
        fechaUltimaSolicitud: null,
        segundosDesdeUltimaSolicitud: null,
        segundosRestantesEspera: 0,

        ventanaMinutos:
          this.convertirNumero(
            filtros.ventanaMinutos
          ),

        segundosEspera:
          this.convertirNumero(
            filtros.segundosEspera
          )
      };
    }

    return {
      solicitudesPorCorreo:
        this.convertirNumero(
          fila.solicitudes_por_correo
        ) ?? 0,

      solicitudesPorIp:
        this.convertirNumero(
          fila.solicitudes_por_ip
        ) ?? 0,

      fechaUltimaSolicitud:
        fila.fecha_ultima_solicitud ?? null,

      segundosDesdeUltimaSolicitud:
        this.convertirNumero(
          fila.segundos_desde_ultima_solicitud
        ),

      segundosRestantesEspera:
        this.convertirNumero(
          fila.segundos_restantes_espera
        ) ?? 0,

      ventanaMinutos:
        this.convertirNumero(
          fila.ventana_minutos
        ),

      segundosEspera:
        this.convertirNumero(
          fila.segundos_espera
        )
    };
  }
}

module.exports = SqlAutenticacionRepository;