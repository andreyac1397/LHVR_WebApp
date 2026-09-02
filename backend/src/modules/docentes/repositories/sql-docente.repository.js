const SqlContenidoRepository = require(
  "../../../shared/content-management/sql-contenido.repository"
);

/** Repositorio SQL del módulo Docente; conserva las consultas comunes del CMS. */
class SqlDocenteRepository extends SqlContenidoRepository {}

module.exports = SqlDocenteRepository;
