const SqlContenidoRepository = require(
  "../../../shared/content-management/sql-contenido.repository"
);

/** Repositorio SQL del módulo Tramite; conserva las consultas comunes del CMS. */
class SqlTramiteRepository extends SqlContenidoRepository {}

module.exports = SqlTramiteRepository;
