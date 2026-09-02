const ContenidoService = require(
  "../../../shared/content-management/contenido.service"
);
const { MODULOS_CONTENIDO } = require(
  "../../../shared/content-management/contenido-modulos"
);

/** Servicio de contenido versionado del módulo RecursoApoyo. */
class RecursoApoyoService extends ContenidoService {
  constructor(repositorio, auditoriaService = null) {
    super(MODULOS_CONTENIDO.RECURSOS_APOYO, repositorio, auditoriaService);
  }
}

module.exports = RecursoApoyoService;
