const SqlContenidoRepository = require(
  "../../../shared/content-management/sql-contenido.repository"
);

/** Repositorio SQL del módulo RecursoApoyo; conserva las consultas comunes del CMS. */
class SqlRecursoApoyoRepository extends SqlContenidoRepository {}

module.exports = SqlRecursoApoyoRepository;
