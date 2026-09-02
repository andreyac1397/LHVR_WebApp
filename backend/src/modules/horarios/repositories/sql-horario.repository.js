const SqlContenidoRepository = require(
  "../../../shared/content-management/sql-contenido.repository"
);

/** Repositorio SQL del módulo Horario; conserva las consultas comunes del CMS. */
class SqlHorarioRepository extends SqlContenidoRepository {}

module.exports = SqlHorarioRepository;
