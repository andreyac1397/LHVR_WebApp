const { respuestaExitosa } = require(
  "../../../shared/utils/response.util"
);
const { contenidoServices } = require(
  "../../../container/dependency-container"
);

class DocenteController {
  constructor(servicio) {
    this.servicio = servicio;
    ["listarPublico", "obtenerAdministracion", "guardarColeccion",
      "guardarElemento", "actualizarElemento", "archivarElemento",
      "eliminarElemento", "eliminarColeccion", "crearSeccion",
      "eliminarSeccion", "guardarCambios", "importar",
      "publicarColeccion", "listarImportaciones"]
      .forEach((metodo) => { this[metodo] = this[metodo].bind(this); });
  }

  contexto(req) {
    return {
      idAdministrador: req.sesionAdministrador?.idAdministrador ?? null,
      direccionIp: req.ip || req.socket?.remoteAddress || null,
      userAgent: req.get("user-agent") || null
    };
  }

  async listarPublico(req, res, next) {
    try { return respuestaExitosa(res, "Contenido público obtenido correctamente.", await this.servicio.listarPublico(req.query)); }
    catch (error) { return next(error); }
  }

  async obtenerAdministracion(req, res, next) {
    try { return respuestaExitosa(res, "Contenido administrativo obtenido correctamente.", await this.servicio.obtenerAdministracion(req.query)); }
    catch (error) { return next(error); }
  }

  async guardarColeccion(req, res, next) {
    try { return respuestaExitosa(res, "La colección se guardó correctamente.", await this.servicio.guardarColeccion(req.body, this.contexto(req)), req.body.idColeccion ? 200 : 201); }
    catch (error) { return next(error); }
  }

  async guardarElemento(req, res, next) {
    try { return respuestaExitosa(res, "El elemento se guardó correctamente.", await this.servicio.guardarElemento(req.body, this.contexto(req)), 201); }
    catch (error) { return next(error); }
  }

  async actualizarElemento(req, res, next) {
    try { return respuestaExitosa(res, "El elemento se actualizó correctamente.", await this.servicio.guardarElemento({ ...req.body, idElemento: req.params.idElemento }, this.contexto(req))); }
    catch (error) { return next(error); }
  }

  async archivarElemento(req, res, next) {
    try { return respuestaExitosa(res, "El elemento se archivó correctamente.", await this.servicio.archivarElemento(req.params.idElemento, this.contexto(req))); }
    catch (error) { return next(error); }
  }

  async eliminarElemento(req, res, next) {
    try { return respuestaExitosa(res, "El elemento se eliminó definitivamente.", await this.servicio.eliminarElemento(req.params.idElemento, this.contexto(req))); }
    catch (error) { return next(error); }
  }

  async eliminarColeccion(req, res, next) {
    try { return respuestaExitosa(res, "La versión se eliminó definitivamente.", await this.servicio.eliminarColeccion(req.params.idColeccion, this.contexto(req))); }
    catch (error) { return next(error); }
  }

  async crearSeccion(req, res, next) {
    try {
      if (typeof this.servicio.crearSeccion !== "function") { const error = new Error("Esta operación no está disponible."); error.statusCode = 404; throw error; }
      return respuestaExitosa(res, "La plantilla de la sección se preparó correctamente.", await this.servicio.crearSeccion({ ...req.body, idColeccion: req.params.idColeccion }, this.contexto(req)));
    } catch (error) { return next(error); }
  }

  async eliminarSeccion(req, res, next) {
    try {
      if (typeof this.servicio.eliminarSeccion !== "function") { const error = new Error("Esta operación no está disponible."); error.statusCode = 404; throw error; }
      return respuestaExitosa(res, "La sección se eliminó definitivamente.", await this.servicio.eliminarSeccion(req.params.idColeccion, req.params.seccion, this.contexto(req)));
    } catch (error) { return next(error); }
  }

  async guardarCambios(req, res, next) {
    try {
      if (typeof this.servicio.guardarCambios !== "function") { const error = new Error("Esta operación no está disponible."); error.statusCode = 404; throw error; }
      return respuestaExitosa(res, "Los cambios del horario se guardaron correctamente.", await this.servicio.guardarCambios(req.params.idColeccion, req.body, this.contexto(req)));
    } catch (error) { return next(error); }
  }

  async importar(req, res, next) {
    try { return respuestaExitosa(res, "La importación se completó correctamente.", await this.servicio.importar(req.body, this.contexto(req)), 201); }
    catch (error) { return next(error); }
  }

  async publicarColeccion(req, res, next) {
    try { return respuestaExitosa(res, "La colección se publicó correctamente.", await this.servicio.publicarColeccion(req.params.idColeccion, this.contexto(req))); }
    catch (error) { return next(error); }
  }

  async listarImportaciones(_req, res, next) {
    try { return respuestaExitosa(res, "Historial de importaciones obtenido correctamente.", { importaciones: await this.servicio.listarImportaciones() }); }
    catch (error) { return next(error); }
  }
}

module.exports = new DocenteController(contenidoServices["docentes"]);
