const {
  respuestaExitosa
} = require("../../shared/utils/response.util");

class ContenidoController {
  constructor(servicio) {
    this.servicio = servicio;

    this.listarPublico = this.listarPublico.bind(this);
    this.obtenerAdministracion =
      this.obtenerAdministracion.bind(this);
    this.guardarColeccion = this.guardarColeccion.bind(this);
    this.guardarElemento = this.guardarElemento.bind(this);
    this.actualizarElemento = this.actualizarElemento.bind(this);
    this.archivarElemento = this.archivarElemento.bind(this);
    this.eliminarElemento = this.eliminarElemento.bind(this);
    this.eliminarColeccion = this.eliminarColeccion.bind(this);
    this.crearSeccion = this.crearSeccion.bind(this);
    this.eliminarSeccion = this.eliminarSeccion.bind(this);
    this.guardarCambios = this.guardarCambios.bind(this);
    this.importar = this.importar.bind(this);
    this.publicarColeccion = this.publicarColeccion.bind(this);
    this.listarImportaciones =
      this.listarImportaciones.bind(this);
  }

  obtenerContexto(req) {
    return {
      idAdministrador:
        req.sesionAdministrador?.idAdministrador ?? null,
      direccionIp:
        req.ip || req.socket?.remoteAddress || null,
      userAgent: req.get("user-agent") || null
    };
  }

  async listarPublico(req, res, next) {
    try {
      const datos = await this.servicio.listarPublico(req.query);

      return respuestaExitosa(
        res,
        "Contenido público obtenido correctamente.",
        datos
      );
    } catch (error) {
      return next(error);
    }
  }

  async obtenerAdministracion(req, res, next) {
    try {
      const datos = await this.servicio.obtenerAdministracion(
        req.query
      );

      return respuestaExitosa(
        res,
        "Contenido administrativo obtenido correctamente.",
        datos
      );
    } catch (error) {
      return next(error);
    }
  }

  async guardarColeccion(req, res, next) {
    try {
      const datos = await this.servicio.guardarColeccion(
        req.body,
        this.obtenerContexto(req)
      );

      return respuestaExitosa(
        res,
        "La colección se guardó correctamente.",
        datos,
        req.body.idColeccion ? 200 : 201
      );
    } catch (error) {
      return next(error);
    }
  }

  async guardarElemento(req, res, next) {
    try {
      const datos = await this.servicio.guardarElemento(
        req.body,
        this.obtenerContexto(req)
      );

      return respuestaExitosa(
        res,
        "El elemento se guardó correctamente.",
        datos,
        201
      );
    } catch (error) {
      return next(error);
    }
  }

  async actualizarElemento(req, res, next) {
    try {
      const datos = await this.servicio.guardarElemento(
        {
          ...req.body,
          idElemento: req.params.idElemento
        },
        this.obtenerContexto(req)
      );

      return respuestaExitosa(
        res,
        "El elemento se actualizó correctamente.",
        datos
      );
    } catch (error) {
      return next(error);
    }
  }

  async archivarElemento(req, res, next) {
    try {
      const datos = await this.servicio.archivarElemento(
        req.params.idElemento,
        this.obtenerContexto(req)
      );

      return respuestaExitosa(
        res,
        "El elemento se archivó correctamente.",
        datos
      );
    } catch (error) {
      return next(error);
    }
  }

  async eliminarElemento(req, res, next) {
    try {
      const datos = await this.servicio.eliminarElemento(
        req.params.idElemento,
        this.obtenerContexto(req)
      );

      return respuestaExitosa(
        res,
        "El elemento se eliminó definitivamente.",
        datos
      );
    } catch (error) {
      return next(error);
    }
  }

  async eliminarColeccion(req, res, next) {
    try {
      const datos = await this.servicio.eliminarColeccion(
        req.params.idColeccion,
        this.obtenerContexto(req)
      );

      return respuestaExitosa(
        res,
        "La versión se eliminó definitivamente.",
        datos
      );
    } catch (error) {
      return next(error);
    }
  }

  async crearSeccion(req, res, next) {
    try {
      if (typeof this.servicio.crearSeccion !== "function") {
        const error = new Error("Esta operación no está disponible.");
        error.statusCode = 404;
        throw error;
      }

      const datos = await this.servicio.crearSeccion(
        {
          ...req.body,
          idColeccion: req.params.idColeccion
        },
        this.obtenerContexto(req)
      );

      return respuestaExitosa(
        res,
        "La plantilla de la sección se preparó correctamente.",
        datos,
        200
      );
    } catch (error) {
      return next(error);
    }
  }

  async eliminarSeccion(req, res, next) {
    try {
      if (typeof this.servicio.eliminarSeccion !== "function") {
        const error = new Error("Esta operación no está disponible.");
        error.statusCode = 404;
        throw error;
      }

      const datos = await this.servicio.eliminarSeccion(
        req.params.idColeccion,
        req.params.seccion,
        this.obtenerContexto(req)
      );

      return respuestaExitosa(
        res,
        "La sección se eliminó definitivamente.",
        datos
      );
    } catch (error) {
      return next(error);
    }
  }

  async guardarCambios(req, res, next) {
    try {
      if (typeof this.servicio.guardarCambios !== "function") {
        const error = new Error("Esta operación no está disponible.");
        error.statusCode = 404;
        throw error;
      }

      const datos = await this.servicio.guardarCambios(
        req.params.idColeccion,
        req.body,
        this.obtenerContexto(req)
      );

      return respuestaExitosa(
        res,
        "Los cambios del horario se guardaron correctamente.",
        datos
      );
    } catch (error) {
      return next(error);
    }
  }

  async importar(req, res, next) {
    try {
      const datos = await this.servicio.importar(
        req.body,
        this.obtenerContexto(req)
      );

      return respuestaExitosa(
        res,
        "La importación se completó correctamente.",
        datos,
        201
      );
    } catch (error) {
      return next(error);
    }
  }

  async publicarColeccion(req, res, next) {
    try {
      const datos = await this.servicio.publicarColeccion(
        req.params.idColeccion,
        this.obtenerContexto(req)
      );

      return respuestaExitosa(
        res,
        "La colección se publicó correctamente.",
        datos
      );
    } catch (error) {
      return next(error);
    }
  }

  async listarImportaciones(req, res, next) {
    try {
      const datos = await this.servicio.listarImportaciones();

      return respuestaExitosa(
        res,
        "Historial de importaciones obtenido correctamente.",
        { importaciones: datos }
      );
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = ContenidoController;
