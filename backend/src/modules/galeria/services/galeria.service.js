const ContenidoService = require(
  "../../../shared/content-management/contenido.service"
);
const { MODULOS_CONTENIDO } = require(
  "../../../shared/content-management/contenido-modulos"
);

/** Servicio de contenido versionado del módulo Galeria. */
class GaleriaService extends ContenidoService {
  constructor(repositorio, auditoriaService = null) {
    super(MODULOS_CONTENIDO.GALERIA, repositorio, auditoriaService);
  }
}

module.exports = GaleriaService;
