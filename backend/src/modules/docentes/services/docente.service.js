const ContenidoService = require(
  "../../../shared/content-management/contenido.service"
);
const { MODULOS_CONTENIDO } = require(
  "../../../shared/content-management/contenido-modulos"
);

/** Servicio de contenido versionado del módulo Docente. */
class DocenteService extends ContenidoService {
  constructor(repositorio, auditoriaService = null) {
    super(MODULOS_CONTENIDO.DOCENTES, repositorio, auditoriaService);
  }
}

module.exports = DocenteService;
