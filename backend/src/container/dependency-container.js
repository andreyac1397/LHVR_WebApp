const SqlAutenticacionRepository = require(
  "../modules/autenticacion/repositories/sql-autenticacion.repository"
);

const SqlAuditoriaRepository = require(
  "../modules/auditoria/repositories/sql-auditoria.repository"
);

const SqlPaginaRepository = require(
  "../modules/paginas-contenido/repositories/sql-pagina.repository"
);

const SqlArchivoRepository = require(
  "../modules/archivos/repositories/sql-archivo.repository"
);

const SqlOfertaAcademicaRepository = require(
  "../modules/oferta-academica/repositories/sql-oferta-academica.repository"
);

const SqlComunidadRepository = require(
  "../modules/comunidad/repositories/sql-comunidad.repository"
);

const SqlConfiguracionRepository = require(
  "../modules/configuracion-sitio/repositories/sql-configuracion.repository"
);

const SqlBoletinRepository = require(
  "../modules/boletines/repositories/sql-boletin.repository"
);
const SqlCalendarioRepository = require(
  "../modules/calendario/repositories/sql-calendario.repository"
);
const SqlBibliotecaRepository = require(
  "../modules/biblioteca/repositories/sql-biblioteca.repository"
);
const SqlDocenteRepository = require(
  "../modules/docentes/repositories/sql-docente.repository"
);
const SqlHorarioRepository = require(
  "../modules/horarios/repositories/sql-horario.repository"
);
const SqlTramiteRepository = require(
  "../modules/tramites/repositories/sql-tramite.repository"
);
const SqlRecursoApoyoRepository = require(
  "../modules/recursos-apoyo/repositories/sql-recurso-apoyo.repository"
);
const SqlGaleriaRepository = require(
  "../modules/galeria/repositories/sql-galeria.repository"
);

const SqlContactoRepository = require(
  "../modules/contacto/repositories/sql-contacto.repository"
);

const SqlSolicitudBibliocraRepository = require(
  "../modules/biblioteca/repositories/sql-solicitud-bibliocra.repository"
);

const SqlDashboardRepository = require(
  "../modules/dashboard/repositories/sql-dashboard.repository"
);

const SqlAdministradorRepository = require(
  "../modules/administradores/repositories/sql-administrador.repository"
);

const SqlChatRepository = require(
  "../modules/chat/repositories/sql-chat.repository"
);

const AuditoriaService = require(
  "../modules/auditoria/services/auditoria.service"
);

const VerificacionAdministradorService = require(
  "../modules/autenticacion/services/verificacion-administrador.service"
);

const AutenticacionService = require(
  "../modules/autenticacion/services/autenticacion.service"
);

const RecuperacionContrasenaService = require(
  "../modules/autenticacion/services/recuperacion-contrasena.service"
);

const PaginaService = require(
  "../modules/paginas-contenido/services/pagina.service"
);

const SeccionPaginaService = require(
  "../modules/paginas-contenido/services/seccion-pagina.service"
);

const ArchivoService = require(
  "../modules/archivos/services/archivo.service"
);

const CicloEducativoService = require(
  "../modules/oferta-academica/services/ciclo-educativo.service"
);

const MateriaService = require(
  "../modules/oferta-academica/services/materia.service"
);

const ComunidadService = require(
  "../modules/comunidad/services/comunidad.service"
);

const ConfiguracionService = require(
  "../modules/configuracion-sitio/services/configuracion.service"
);

const BoletinService = require(
  "../modules/boletines/services/boletin.service"
);

const CalendarioService = require(
  "../modules/calendario/services/calendario.service"
);

const BibliotecaService = require(
  "../modules/biblioteca/services/biblioteca.service"
);

const DocenteService = require(
  "../modules/docentes/services/docente.service"
);

const HorarioService = require(
  "../modules/horarios/services/horario.service"
);

const TramiteService = require(
  "../modules/tramites/services/tramite.service"
);

const RecursoApoyoService = require(
  "../modules/recursos-apoyo/services/recurso-apoyo.service"
);

const GaleriaService = require(
  "../modules/galeria/services/galeria.service"
);

const ContactoService = require(
  "../modules/contacto/services/contacto.service"
);

const SolicitudBibliocraService = require(
  "../modules/biblioteca/services/solicitud-bibliocra.service"
);

const DashboardService = require(
  "../modules/dashboard/services/dashboard.service"
);

const AdministradorService = require(
  "../modules/administradores/services/administrador.service"
);

const ChatService = require(
  "../modules/chat/services/chat.service"
);

const correoService = require(
  "../shared/services/correo.service"
);


/*
 * =============================================================
 * REPOSITORIOS
 * =============================================================
 */

const repositorioAutenticacion =
  new SqlAutenticacionRepository();

const repositorioAuditoria =
  new SqlAuditoriaRepository();

const repositorioPagina =
  new SqlPaginaRepository();

const repositorioArchivo =
  new SqlArchivoRepository();

const repositorioOfertaAcademica =
  new SqlOfertaAcademicaRepository();

const repositorioComunidad =
  new SqlComunidadRepository();

const repositorioConfiguracion =
  new SqlConfiguracionRepository();

const repositorioBoletin = new SqlBoletinRepository();
const repositorioCalendario = new SqlCalendarioRepository();
const repositorioBiblioteca = new SqlBibliotecaRepository();
const repositorioDocente = new SqlDocenteRepository();
const repositorioHorario = new SqlHorarioRepository();
const repositorioTramite = new SqlTramiteRepository();
const repositorioRecursoApoyo = new SqlRecursoApoyoRepository();
const repositorioGaleria = new SqlGaleriaRepository();

const repositorioContacto =
  new SqlContactoRepository();

const repositorioSolicitudBibliocra =
  new SqlSolicitudBibliocraRepository();

const repositorioDashboard =
  new SqlDashboardRepository();

const repositorioAdministrador =
  new SqlAdministradorRepository();

const repositorioChat =
  new SqlChatRepository();


/*
 * =============================================================
 * SERVICIO DE AUDITORÍA
 * =============================================================
 */

const auditoriaService =
  new AuditoriaService(
    repositorioAuditoria
  );


/*
 * Mantiene el contexto interno de correoService
 * cuando se envía como función a otro servicio.
 */
const enviarCodigo =
  correoService.enviarCodigoVerificacion.bind(
    correoService
  );

const enviarCodigoRecuperacion =
  correoService.enviarCodigoRecuperacion.bind(
    correoService
  );


/*
 * =============================================================
 * SERVICIOS DE AUTENTICACIÓN
 * =============================================================
 */

const servicioVerificacion =
  new VerificacionAdministradorService(
    repositorioAutenticacion,
    auditoriaService
  );

const autenticacionService =
  new AutenticacionService(
    repositorioAutenticacion,
    servicioVerificacion,
    enviarCodigo,
    auditoriaService
  );

const recuperacionContrasenaService =
  new RecuperacionContrasenaService(
    repositorioAutenticacion,
    enviarCodigoRecuperacion,
    auditoriaService
  );


/*
 * =============================================================
 * SERVICIOS DE PÁGINAS Y CONTENIDO
 * =============================================================
 */

const paginaService =
  new PaginaService(
    repositorioPagina,
    auditoriaService
  );

const seccionPaginaService =
  new SeccionPaginaService(
    repositorioPagina,
    auditoriaService
  );


/*
 * =============================================================
 * SERVICIOS DE ARCHIVOS
 * =============================================================
 */

const archivoService =
  new ArchivoService(
    repositorioArchivo,
    auditoriaService
  );


/*
 * =============================================================
 * SERVICIOS DE OFERTA ACADÉMICA
 * =============================================================
 */

const cicloEducativoService =
  new CicloEducativoService(
    repositorioOfertaAcademica
  );

const materiaService =
  new MateriaService(
    repositorioOfertaAcademica
  );


/*
 * =============================================================
 * SERVICIOS DE COMUNIDAD
 * =============================================================
 */

const comunidadService =
  new ComunidadService(
    repositorioComunidad
  );


/*
 * =============================================================
 * SERVICIOS DE CONFIGURACIÓN DEL SITIO
 * =============================================================
 */

const configuracionService =
  new ConfiguracionService(
    repositorioConfiguracion
  );


/*
 * =============================================================
 * CONTENIDO VERSIONADO REUTILIZABLE
 * =============================================================
 */

const contenidoServices = {
  boletines: new BoletinService(
    repositorioBoletin,
    auditoriaService,
    correoService
  ),
  calendario: new CalendarioService(
    repositorioCalendario,
    auditoriaService
  ),
  biblioteca: new BibliotecaService(
    repositorioBiblioteca,
    auditoriaService
  ),
  docentes: new DocenteService(
    repositorioDocente,
    auditoriaService
  ),
  horarios: new HorarioService(
    repositorioHorario,
    auditoriaService
  ),
  tramites: new TramiteService(
    repositorioTramite,
    auditoriaService
  ),
  "recursos-apoyo": new RecursoApoyoService(
    repositorioRecursoApoyo,
    auditoriaService
  ),
  galeria: new GaleriaService(
    repositorioGaleria,
    auditoriaService
  )
};

const contactoService = new ContactoService(
  repositorioContacto,
  auditoriaService
);

const solicitudBibliocraService = new SolicitudBibliocraService(
  repositorioSolicitudBibliocra,
  auditoriaService,
  correoService
);

const dashboardService = new DashboardService(
  repositorioDashboard
);

const administradorService = new AdministradorService(
  repositorioAdministrador,
  auditoriaService,
  correoService,
  recuperacionContrasenaService
);

const chatService = new ChatService(
  repositorioChat,
  auditoriaService
);


/*
 * =============================================================
 * EXPORTACIONES
 * =============================================================
 */

module.exports = {
  repositorioAutenticacion,
  repositorioAuditoria,
  repositorioPagina,
  repositorioArchivo,
  repositorioOfertaAcademica,
  repositorioComunidad,
  repositorioConfiguracion,
  repositorioBoletin,
  repositorioCalendario,
  repositorioBiblioteca,
  repositorioDocente,
  repositorioHorario,
  repositorioTramite,
  repositorioRecursoApoyo,
  repositorioGaleria,
  repositorioContacto,
  repositorioSolicitudBibliocra,
  repositorioDashboard,
  repositorioAdministrador,
  repositorioChat,
  auditoriaService,
  servicioVerificacion,
  autenticacionService,
  recuperacionContrasenaService,
  paginaService,
  seccionPaginaService,
  archivoService,
  cicloEducativoService,
  materiaService,
  comunidadService,
  configuracionService,
  contenidoServices,
  contactoService,
  solicitudBibliocraService,
  dashboardService,
  administradorService,
  chatService,
  enviarCodigo,
  enviarCodigoRecuperacion
};
