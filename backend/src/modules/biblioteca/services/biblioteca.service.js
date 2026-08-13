const ContenidoService = require(
  "../../../shared/content-management/contenido.service"
);

const {
  MODULOS_CONTENIDO
} = require(
  "../../../shared/content-management/contenido-modulos"
);

class BibliotecaService extends ContenidoService {
  constructor(repositorio, auditoriaService = null) {
    super(
      MODULOS_CONTENIDO.BIBLIOTECA,
      repositorio,
      auditoriaService
    );
  }
}

module.exports = BibliotecaService;
