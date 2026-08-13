const SqlSolicitudRepository = require(
  "../../../shared/solicitudes-management/sql-solicitud.repository"
);

class SqlSolicitudBibliocraRepository
  extends SqlSolicitudRepository {}

module.exports = SqlSolicitudBibliocraRepository;
