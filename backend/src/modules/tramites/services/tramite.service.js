const ContenidoService = require(
  "../../../shared/content-management/contenido.service"
);
const { MODULOS_CONTENIDO } = require(
  "../../../shared/content-management/contenido-modulos"
);

/** Servicio de contenido versionado del módulo Tramite. */
class TramiteService extends ContenidoService {
  constructor(repositorio, auditoriaService = null) {
    super(MODULOS_CONTENIDO.TRAMITES, repositorio, auditoriaService);
  }
}

module.exports = TramiteService;
