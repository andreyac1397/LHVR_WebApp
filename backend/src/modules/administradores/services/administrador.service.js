const bcrypt = require("bcryptjs");
const SqlAdministradorRepository = require(
  "../repositories/sql-administrador.repository"
);

class AdministradorService {
  constructor(repositorio = new SqlAdministradorRepository(), auditoriaService = null) {
    this.repositorio = repositorio;
    this.auditoriaService = auditoriaService;
  }

  error(mensaje, statusCode, codigo) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    error.codigo = codigo;
    return error;
  }

  id(valor, campo = "identificador") {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero <= 0) {
      throw this.error(`El ${campo} no es válido.`, 400, "IDENTIFICADOR_INVALIDO");
    }
    return numero;
  }

  async listar(filtros = {}) {
    const idEstado = filtros.idEstado ? this.id(filtros.idEstado, "estado") : null;
    const busqueda = String(filtros.busqueda || "").trim().slice(0, 180) || null;
    return this.repositorio.listar({ idEstado, busqueda });
  }

  async crear(entrada, contexto = {}) {
    const nombreCompleto = String(entrada?.nombreCompleto || "").trim();
    const correo = String(entrada?.correo || "").trim().toLowerCase();
    const contrasena = String(entrada?.contrasena || "");
    const idEstadoAdministrador = this.id(entrada?.idEstadoAdministrador, "estado");

    if (nombreCompleto.length < 3 || nombreCompleto.length > 150) {
      throw this.error("El nombre debe tener entre 3 y 150 caracteres.", 400, "NOMBRE_ADMIN_INVALIDO");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 254) {
      throw this.error("El correo electrónico no es válido.", 400, "CORREO_ADMIN_INVALIDO");
    }
    if (contrasena.length < 12 || !/[a-z]/.test(contrasena) || !/[A-Z]/.test(contrasena) || !/\d/.test(contrasena) || !/[^A-Za-z0-9]/.test(contrasena)) {
      throw this.error("La contraseña debe tener al menos 12 caracteres, mayúscula, minúscula, número y símbolo.", 400, "CONTRASENA_ADMIN_DEBIL");
    }
    if (!(await this.repositorio.obtenerEstado(idEstadoAdministrador))) {
      throw this.error("El estado seleccionado no existe.", 400, "ESTADO_ADMIN_INVALIDO");
    }
    if (await this.repositorio.buscarPorCorreo(correo)) {
      throw this.error("Ya existe un administrador con ese correo.", 409, "CORREO_ADMIN_DUPLICADO");
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 12);
    const idAdministrador = await this.repositorio.crear({
      nombreCompleto, correo, contrasenaHash, idEstadoAdministrador
    });
    await this.auditar({
      idAdministrador: contexto.idAdministrador,
      codigoAccion: "CREAR",
      codigoModulo: "SEGURIDAD",
      tablaAfectada: "administradores",
      idRegistroAfectado: String(idAdministrador),
      datosNuevos: { nombreCompleto, correo, idEstadoAdministrador },
      descripcion: "Se creó una cuenta administrativa.",
      direccionIp: contexto.direccionIp,
      userAgent: contexto.userAgent
    });
    return this.repositorio.obtenerPorId(idAdministrador);
  }

  async cambiarEstado(idRecibido, entrada, contexto = {}) {
    const idAdministrador = this.id(idRecibido, "administrador");
    const idEstadoAdministrador = this.id(entrada?.idEstadoAdministrador, "estado");
    const actual = await this.repositorio.obtenerPorId(idAdministrador);
    const estado = await this.repositorio.obtenerEstado(idEstadoAdministrador);
    if (!actual) throw this.error("El administrador no existe.", 404, "ADMINISTRADOR_NO_ENCONTRADO");
    if (!estado) throw this.error("El estado seleccionado no existe.", 400, "ESTADO_ADMIN_INVALIDO");
    if (Number(contexto.idAdministrador) === idAdministrador && !estado.permiteAcceso) {
      throw this.error("No puede deshabilitar su propia cuenta mientras la utiliza.", 409, "AUTO_DESACTIVACION_NO_PERMITIDA");
    }
    const actualizado = await this.repositorio.cambiarEstado(idAdministrador, idEstadoAdministrador);
    await this.auditar({
      idAdministrador: contexto.idAdministrador,
      codigoAccion: "CAMBIAR_ESTADO",
      codigoModulo: "SEGURIDAD",
      tablaAfectada: "administradores",
      idRegistroAfectado: String(idAdministrador),
      datosAnteriores: { idEstadoAdministrador: actual.idEstadoAdministrador },
      datosNuevos: { idEstadoAdministrador, nombreEstado: estado.nombre },
      descripcion: "Se actualizó el estado de una cuenta administrativa.",
      direccionIp: contexto.direccionIp,
      userAgent: contexto.userAgent
    });
    return actualizado;
  }

  async auditar(datos) {
    if (this.auditoriaService?.registrarAuditoriaSegura) {
      await this.auditoriaService.registrarAuditoriaSegura(datos);
    }
  }
}

module.exports = AdministradorService;
