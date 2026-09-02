const bcrypt =
  require(
    "bcryptjs"
  );

const crypto =
  require(
    "node:crypto"
  );

const SqlAdministradorRepository =
  require(
    "../repositories/sql-administrador.repository"
  );


class AdministradorService {

  constructor(
    repositorio =
      new SqlAdministradorRepository(),

    auditoriaService =
      null,

    correoService =
      null,

    recuperacionContrasenaService =
      null
  ) {
    this.repositorio =
      repositorio;

    this.auditoriaService =
      auditoriaService;

    this.correoService =
      correoService;

    this.recuperacionContrasenaService =
      recuperacionContrasenaService;
  }


  error(
    mensaje,
    statusCode,
    codigo
  ) {
    const error =
      new Error(
        mensaje
      );

    error.statusCode =
      statusCode;

    error.codigo =
      codigo;

    return error;
  }


  id(
    valor,
    campo = "identificador"
  ) {
    const numero =
      Number(valor);

    if (
      !Number.isInteger(
        numero
      ) ||
      numero <= 0
    ) {
      throw this.error(
        `El ${campo} no es válido.`,
        400,
        "IDENTIFICADOR_INVALIDO"
      );
    }

    return numero;
  }


  async listar(
    filtros = {}
  ) {
    const idEstado =
      filtros.idEstado
        ? this.id(
            filtros.idEstado,
            "estado"
          )
        : null;

    const busqueda =
      String(
        filtros.busqueda ||
        ""
      )
        .trim()
        .slice(
          0,
          180
        ) ||
      null;

    const paginaRecibida =
      Number(
        filtros.pagina
      );

    const limiteRecibido =
      Number(
        filtros.limite
      );

    const pagina =
      Number.isInteger(
        paginaRecibida
      ) &&
      paginaRecibida > 0
        ? paginaRecibida
        : 1;

    const limite =
      Number.isInteger(
        limiteRecibido
      ) &&
      limiteRecibido > 0
        ? Math.min(
            100,
            limiteRecibido
          )
        : 20;

    return this.repositorio
      .listar({
        idEstado,
        busqueda,
        pagina,
        limite
      });
  }


  validarIdentidad(
    entrada
  ) {
    const nombreCompleto =
      String(
        entrada
          ?.nombreCompleto ||
        ""
      ).trim();

    const correo =
      String(
        entrada
          ?.correo ||
        ""
      )
        .trim()
        .toLowerCase();

    if (
      nombreCompleto.length <
        3 ||
      nombreCompleto.length >
        150
    ) {
      throw this.error(
        "El nombre debe tener entre 3 y 150 caracteres.",
        400,
        "NOMBRE_ADMIN_INVALIDO"
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        correo
      ) ||
      correo.length >
        254
    ) {
      throw this.error(
        "El correo electrónico no es válido.",
        400,
        "CORREO_ADMIN_INVALIDO"
      );
    }

    return {
      nombreCompleto,
      correo
    };
  }


  generarContrasenaTemporal() {
    const grupos = [
      "ABCDEFGHJKLMNPQRSTUVWXYZ",
      "abcdefghijkmnopqrstuvwxyz",
      "23456789",
      "!@#$%&*+-_?"
    ];

    const caracteres =
      grupos.map(
        (grupo) =>
          grupo[
            crypto.randomInt(
              grupo.length
            )
          ]
      );

    const todos =
      grupos.join("");

    while (
      caracteres.length <
      18
    ) {
      caracteres.push(
        todos[
          crypto.randomInt(
            todos.length
          )
        ]
      );
    }

    for (
      let indice =
        caracteres.length - 1;

      indice > 0;

      indice -= 1
    ) {
      const destino =
        crypto.randomInt(
          indice + 1
        );

      [
        caracteres[indice],
        caracteres[destino]
      ] = [
        caracteres[destino],
        caracteres[indice]
      ];
    }

    return caracteres.join("");
  }


  async enviarAccesoTemporal(
    administrador,
    contrasenaTemporal
  ) {
    if (
      typeof this
        .correoService
        ?.enviarAccesoTemporalAdministrador !==
      "function"
    ) {
      throw this.error(
        "El servicio de correo no está configurado.",
        503,
        "SERVICIO_CORREO_NO_CONFIGURADO"
      );
    }

    return this.correoService
      .enviarAccesoTemporalAdministrador({
        destinatario:
          administrador.correo,

        nombreCompleto:
          administrador.nombreCompleto,

        contrasenaTemporal
      });
  }


  async crear(
    entrada,
    contexto = {}
  ) {
    const {
      nombreCompleto,
      correo
    } =
      this.validarIdentidad(
        entrada
      );

    const estado =
      await this.repositorio
        .obtenerEstadoAccesoPredeterminado();

    if (!estado) {
      throw this.error(
        "No existe un estado activo disponible para crear la cuenta.",
        500,
        "ESTADO_ADMIN_ACTIVO_NO_CONFIGURADO"
      );
    }

    if (
      await this.repositorio
        .buscarPorCorreo(
          correo
        )
    ) {
      throw this.error(
        "Ya existe un administrador con ese correo.",
        409,
        "CORREO_ADMIN_DUPLICADO"
      );
    }


    const contrasenaTemporal =
      this.generarContrasenaTemporal();

    const contrasenaHash =
      await bcrypt.hash(
        contrasenaTemporal,
        12
      );

    const idAdministrador =
      await this.repositorio
        .crear({
          nombreCompleto,
          correo,
          contrasenaHash,

          idEstadoAdministrador:
            estado.idEstadoAdministrador
        });


    const administrador =
      await this.repositorio
        .obtenerPorId(
          idAdministrador
        );


    let correoAccesoEnviado =
      true;

    let advertencia =
      null;


    try {
      await this
        .enviarAccesoTemporal(
          administrador,
          contrasenaTemporal
        );
    } catch (_error) {
      correoAccesoEnviado =
        false;

      advertencia =
        "La cuenta fue creada, pero el correo de acceso no pudo enviarse. Use Reenviar acceso para generar uno nuevo.";
    }


    await this.auditar({
      idAdministrador:
        contexto.idAdministrador,

      codigoAccion:
        "CREAR",

      codigoModulo:
        "SEGURIDAD",

      tablaAfectada:
        "administradores",

      idRegistroAfectado:
        String(
          idAdministrador
        ),

      datosNuevos: {
        nombreCompleto,
        correo,

        idEstadoAdministrador:
          estado.idEstadoAdministrador,

        requiereCambioContrasena:
          true,

        correoAccesoEnviado
      },

      descripcion:
        "Se creó una cuenta administrativa.",

      direccionIp:
        contexto.direccionIp,

      userAgent:
        contexto.userAgent
    });


    return {
      administrador,
      correoAccesoEnviado,
      advertencia
    };
  }


  async actualizar(
    idRecibido,
    entrada,
    contexto = {}
  ) {
    const idAdministrador =
      this.id(
        idRecibido,
        "administrador"
      );


    if (
      Number(
        contexto.idAdministrador
      ) ===
      idAdministrador
    ) {
      throw this.error(
        "No puede editar su propia cuenta desde la administración de usuarios.",
        409,
        "AUTO_EDICION_ADMIN_NO_PERMITIDA"
      );
    }


    const actual =
      await this.repositorio
        .obtenerPorId(
          idAdministrador
        );


    if (!actual) {
      throw this.error(
        "El administrador no existe.",
        404,
        "ADMINISTRADOR_NO_ENCONTRADO"
      );
    }


    const {
      nombreCompleto,
      correo
    } =
      this.validarIdentidad(
        entrada
      );


    const idEstadoAdministrador =
      this.id(
        entrada
          ?.idEstadoAdministrador,
        "estado"
      );


    const estado =
      await this.repositorio
        .obtenerEstado(
          idEstadoAdministrador
        );


    if (!estado) {
      throw this.error(
        "El estado seleccionado no existe.",
        400,
        "ESTADO_ADMIN_INVALIDO"
      );
    }


    if (
      await this.repositorio
        .buscarPorCorreo(
          correo,
          idAdministrador
        )
    ) {
      throw this.error(
        "Ya existe un administrador con ese correo.",
        409,
        "CORREO_ADMIN_DUPLICADO"
      );
    }


    const actualizado =
      await this.repositorio
        .actualizar(
          idAdministrador,
          {
            nombreCompleto,
            correo,
            idEstadoAdministrador
          }
        );


    await this.auditar({
      idAdministrador:
        contexto.idAdministrador,

      codigoAccion:
        "ACTUALIZAR",

      codigoModulo:
        "SEGURIDAD",

      tablaAfectada:
        "administradores",

      idRegistroAfectado:
        String(
          idAdministrador
        ),

      datosAnteriores: {
        nombreCompleto:
          actual.nombreCompleto,

        correo:
          actual.correo,

        idEstadoAdministrador:
          actual.idEstadoAdministrador
      },

      datosNuevos: {
        nombreCompleto,
        correo,
        idEstadoAdministrador
      },

      descripcion:
        "Se actualizaron los datos de una cuenta administrativa.",

      direccionIp:
        contexto.direccionIp,

      userAgent:
        contexto.userAgent
    });


    return actualizado;
  }


  async reenviarAcceso(
    idRecibido,
    contexto = {}
  ) {
    const idAdministrador =
      this.id(
        idRecibido,
        "administrador"
      );


    if (
      Number(
        contexto.idAdministrador
      ) ===
      idAdministrador
    ) {
      throw this.error(
        "No puede generar un acceso temporal para su propia cuenta. Use Cambiar contraseña.",
        409,
        "AUTO_REENVIO_ACCESO_NO_PERMITIDO"
      );
    }


    const actual =
      await this.repositorio
        .obtenerPorId(
          idAdministrador
        );


    if (!actual) {
      throw this.error(
        "El administrador no existe.",
        404,
        "ADMINISTRADOR_NO_ENCONTRADO"
      );
    }


    if (
      !actual.permiteAcceso
    ) {
      throw this.error(
        "Active la cuenta antes de reenviar el acceso.",
        409,
        "CUENTA_ADMIN_INACTIVA"
      );
    }


    const contrasenaTemporal =
      this.generarContrasenaTemporal();


    const contrasenaHash =
      await bcrypt.hash(
        contrasenaTemporal,
        12
      );


    const actualizado =
      await this.repositorio
        .establecerAccesoTemporal(
          idAdministrador,
          contrasenaHash
        );


    let correoAccesoEnviado =
      true;

    let advertencia =
      null;


    try {
      await this
        .enviarAccesoTemporal(
          actualizado,
          contrasenaTemporal
        );
    } catch (_error) {
      correoAccesoEnviado =
        false;

      advertencia =
        "El acceso anterior fue invalidado, pero el correo nuevo no pudo enviarse. Intente Reenviar acceso nuevamente.";
    }


    await this.auditar({
      idAdministrador:
        contexto.idAdministrador,

      codigoAccion:
        "REENVIAR_ACCESO",

      codigoModulo:
        "SEGURIDAD",

      tablaAfectada:
        "administradores",

      idRegistroAfectado:
        String(
          idAdministrador
        ),

      datosAnteriores: {
        requiereCambioContrasena:
          actual.requiereCambioContrasena
      },

      datosNuevos: {
        requiereCambioContrasena:
          true,

        correoAccesoEnviado
      },

      descripcion:
        "Se generó un nuevo acceso temporal para una cuenta administrativa.",

      direccionIp:
        contexto.direccionIp,

      userAgent:
        contexto.userAgent
    });


    return {
      administrador:
        actualizado,

      correoAccesoEnviado,
      advertencia
    };
  }


  async enviarRecuperacion(
    idRecibido,
    contexto = {}
  ) {
    const idAdministrador =
      this.id(
        idRecibido,
        "administrador"
      );


    if (
      Number(
        contexto.idAdministrador
      ) ===
      idAdministrador
    ) {
      throw this.error(
        "Para su propia cuenta utilice Cambiar contraseña.",
        409,
        "AUTO_RECUPERACION_ADMIN_NO_PERMITIDA"
      );
    }


    const administrador =
      await this.repositorio
        .obtenerPorId(
          idAdministrador
        );


    if (!administrador) {
      throw this.error(
        "El administrador no existe.",
        404,
        "ADMINISTRADOR_NO_ENCONTRADO"
      );
    }


    if (
      !administrador.permiteAcceso ||
      !administrador.correoVerificado
    ) {
      throw this.error(
        "La cuenta debe estar activa y tener el correo verificado.",
        409,
        "CUENTA_ADMIN_NO_RECUPERABLE"
      );
    }


    if (
      typeof this
        .recuperacionContrasenaService
        ?.solicitarRecuperacion !==
      "function"
    ) {
      throw this.error(
        "El servicio de recuperación no está disponible.",
        503,
        "SERVICIO_RECUPERACION_NO_DISPONIBLE"
      );
    }


    await this
      .recuperacionContrasenaService
      .solicitarRecuperacion(
        {
          correo:
            administrador.correo
        },
        {
          direccionIp:
            contexto.direccionIp,

          userAgent:
            contexto.userAgent
        }
      );


    await this.auditar({
      idAdministrador:
        contexto.idAdministrador,

      codigoAccion:
        "ENVIAR_RECUPERACION",

      codigoModulo:
        "SEGURIDAD",

      tablaAfectada:
        "administradores",

      idRegistroAfectado:
        String(
          idAdministrador
        ),

      datosNuevos: {
        recuperacionEnviada:
          true
      },

      descripcion:
        "Se envió un proceso de recuperación a otra cuenta administrativa.",

      direccionIp:
        contexto.direccionIp,

      userAgent:
        contexto.userAgent
    });


    return {
      recuperacionEnviada:
        true,

      correoDestino:
        administrador.correo
    };
  }


  async cambiarEstado(
    idRecibido,
    entrada,
    contexto = {}
  ) {
    const idAdministrador =
      this.id(
        idRecibido,
        "administrador"
      );


    const idEstadoAdministrador =
      this.id(
        entrada
          ?.idEstadoAdministrador,
        "estado"
      );


    const actual =
      await this.repositorio
        .obtenerPorId(
          idAdministrador
        );


    const estado =
      await this.repositorio
        .obtenerEstado(
          idEstadoAdministrador
        );


    if (!actual) {
      throw this.error(
        "El administrador no existe.",
        404,
        "ADMINISTRADOR_NO_ENCONTRADO"
      );
    }


    if (!estado) {
      throw this.error(
        "El estado seleccionado no existe.",
        400,
        "ESTADO_ADMIN_INVALIDO"
      );
    }


    if (
      Number(
        contexto.idAdministrador
      ) ===
        idAdministrador &&
      !estado.permiteAcceso
    ) {
      throw this.error(
        "No puede deshabilitar su propia cuenta mientras la utiliza.",
        409,
        "AUTO_DESACTIVACION_NO_PERMITIDA"
      );
    }


    const actualizado =
      await this.repositorio
        .cambiarEstado(
          idAdministrador,
          idEstadoAdministrador
        );


    await this.auditar({
      idAdministrador:
        contexto.idAdministrador,

      codigoAccion:
        "CAMBIAR_ESTADO",

      codigoModulo:
        "SEGURIDAD",

      tablaAfectada:
        "administradores",

      idRegistroAfectado:
        String(
          idAdministrador
        ),

      datosAnteriores: {
        idEstadoAdministrador:
          actual.idEstadoAdministrador
      },

      datosNuevos: {
        idEstadoAdministrador,

        nombreEstado:
          estado.nombre
      },

      descripcion:
        "Se actualizó el estado de una cuenta administrativa.",

      direccionIp:
        contexto.direccionIp,

      userAgent:
        contexto.userAgent
    });


    return actualizado;
  }


  async auditar(
    datos
  ) {
    if (
      this.auditoriaService
        ?.registrarAuditoriaSegura
    ) {
      await this
        .auditoriaService
        .registrarAuditoriaSegura(
          datos
        );
    }
  }

}


module.exports =
  AdministradorService;