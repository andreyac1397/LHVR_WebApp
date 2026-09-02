const SqlContenidoRepository = require(
  "../../../shared/content-management/sql-contenido.repository"
);

/** Repositorio SQL del módulo Calendario; conserva las consultas comunes del CMS. */
class SqlCalendarioRepository extends SqlContenidoRepository {}

module.exports = SqlCalendarioRepository;
