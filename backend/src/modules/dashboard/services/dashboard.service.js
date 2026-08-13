class DashboardService {
  constructor(repositorio) {
    this.repositorio = repositorio;
  }

  obtenerResumen() {
    return this.repositorio.obtenerResumen();
  }
}

module.exports = DashboardService;
