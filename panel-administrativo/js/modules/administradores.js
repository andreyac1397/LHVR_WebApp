(function iniciarAdministradores(global) {
  "use strict";

  const api = global.API_ADMIN_CLIENT;
  const autenticacion = global.AUTENTICACION_ADMIN;
  const alertas = global.AlertasAdmin;
  const modal = global.ModalAdmin;

  const cuerpo =
    document.getElementById(
      "cuerpoAdministradores"
    );

  const busqueda =
    document.getElementById(
      "busquedaAdministradores"
    );

  const filtroEstado =
    document.getElementById(
      "filtroEstadoAdministradores"
    );

  const estadoVista =
    document.getElementById(
      "estadoAdministradores"
    );

  const panelNuevo =
    document.getElementById(
      "panelNuevoAdministrador"
    );

  const panelEditar =
    document.getElementById(
      "panelEditarAdministrador"
    );

  const modalCambiarContrasena =
    document.getElementById(
      "modalCambiarContrasena"
    );

  const formulario =
    document.getElementById(
      "formularioAdministrador"
    );

  const formularioEditar =
    document.getElementById(
      "formularioEditarAdministrador"
    );

  const formularioCambiarContrasena =
    document.getElementById(
      "formularioCambiarContrasena"
    );

  const bloqueCambioActual =
    document.getElementById(
      "bloqueCambioContrasenaActual"
    );

  const bloqueCambioCodigo =
    document.getElementById(
      "bloqueCambioContrasenaCodigo"
    );

  const pasoCodigoRecuperacion =
    document.getElementById(
      "pasoCodigoRecuperacion"
    );

  const pasoNuevaContrasenaCodigo =
    document.getElementById(
      "pasoNuevaContrasenaCodigo"
    );

  const botonGuardarCambioContrasena =
    document.getElementById(
      "botonGuardarCambioContrasena"
    );

  const botonEnviarCodigoContrasena =
    document.getElementById(
      "botonEnviarCodigoContrasena"
    );

  const botonVerificarCodigoContrasena =
    document.getElementById(
      "botonVerificarCodigoContrasena"
    );

  const estadoCodigoContrasena =
    document.getElementById(
      "estadoCodigoContrasena"
    );

  let estados = [];
  let administradores = [];
  let idSesionActual = null;
  let correoSesionActual = "";

  let tokenRecuperacionCambio = null;
  let tokenRestablecimientoCambio = null;

  const paginacion = {
    paginaActual: 1,
    limite: 20,
    totalRegistros: 0,
    totalPaginas: 1,
    tieneAnterior: false,
    tieneSiguiente: false
  };


  const escapar = (valor) =>
    String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");


  const fecha = (valor) =>
    valor
      ? new Intl.DateTimeFormat(
          "es-CR",
          {
            dateStyle: "medium",
            timeStyle: "short"
          }
        ).format(
          new Date(valor)
        )
      : "Nunca";


  function mostrar(
    mensaje,
    tipo = "informacion"
  ) {
    estadoVista.textContent =
      mensaje;

    estadoVista.className =
      `gestion-contenido__mensaje gestion-contenido__mensaje--${tipo}`;
  }


  function notificar(
    tipo,
    titulo,
    mensaje
  ) {
    alertas?.mostrar({
      tipo,
      titulo,
      mensaje
    });
  }


  function opcionesEstado(
    idActual
  ) {
    return estados.map(
      (item) => `
        <option
          value="${item.idEstadoAdministrador}"
          ${
            Number(
              item.idEstadoAdministrador
            ) ===
            Number(idActual)
              ? "selected"
              : ""
          }
        >
          ${escapar(item.nombre)}
        </option>
      `
    ).join("");
  }


  function cargarSelectores() {
    const actual =
      filtroEstado.value;

    filtroEstado.innerHTML =
      '<option value="">Todos</option>' +
      opcionesEstado(actual);

    filtroEstado.value =
      actual;

    document.getElementById(
      "estadoEditarAdmin"
    ).innerHTML =
      opcionesEstado();
  }


  function etiqueta(
    texto,
    tipo
  ) {
    return `
      <span
        class="admin-etiqueta admin-etiqueta--${tipo}"
      >
        ${escapar(texto)}
      </span>
    `;
  }


  function abrirModalGestion(
    elemento
  ) {
    if (!elemento) {
      return;
    }

    [
      panelNuevo,
      panelEditar,
      modalCambiarContrasena
    ].forEach(
      (otro) => {
        if (
          otro &&
          otro !== elemento
        ) {
          otro.hidden = true;
        }
      }
    );

    elemento.hidden = false;

    document.body.classList.add(
      "admin-modal-gestion-abierto"
    );

    global.requestAnimationFrame(
      () => {
        const enfocable =
          elemento.querySelector(
            [
              "input:not([disabled])",
              "select:not([disabled])",
              "button:not([disabled])",
              "textarea:not([disabled])"
            ].join(",")
          );

        enfocable?.focus();
      }
    );
  }


  function cerrarModalGestion(
    elemento
  ) {
    if (!elemento) {
      return;
    }

    elemento.hidden = true;

    const algunoAbierto = [
      panelNuevo,
      panelEditar,
      modalCambiarContrasena
    ].some(
      (item) =>
        item &&
        !item.hidden
    );

    if (!algunoAbierto) {
      document.body.classList.remove(
        "admin-modal-gestion-abierto"
      );
    }
  }


  function renderizar() {
    cuerpo.innerHTML =
      administradores.map(
        (item) => {
          const propia =
            Number(
              item.idAdministrador
            ) ===
            Number(
              idSesionActual
            );

          const accionEstado =
            item.permiteAcceso
              ? "desactivar"
              : "activar";

          const acciones =
            propia
              ? `
                <button
                  class="
                    admin-boton
                    admin-boton--primario
                    admin-boton--pequeno
                  "
                  type="button"
                  data-accion="cambiar-contrasena"
                >
                  Cambiar contraseña
                </button>
              `
              : `
                <button
                  class="
                    admin-boton
                    admin-boton--secundario
                    admin-boton--pequeno
                  "
                  type="button"
                  data-accion="editar"
                >
                  Editar
                </button>

                <button
                  class="
                    admin-boton
                    admin-boton--secundario
                    admin-boton--pequeno
                  "
                  type="button"
                  data-accion="recuperacion"
                >
                  Enviar recuperación
                </button>

                <button
                  class="
                    admin-boton
                    admin-boton--secundario
                    admin-boton--pequeno
                  "
                  type="button"
                  data-accion="reenviar"
                >
                  Reenviar acceso
                </button>

                <button
                  class="
                    admin-boton
                    ${
                      item.permiteAcceso
                        ? "admin-boton--peligro"
                        : "admin-boton--primario"
                    }
                    admin-boton--pequeno
                  "
                  type="button"
                  data-accion="${accionEstado}"
                >
                  ${
                    item.permiteAcceso
                      ? "Desactivar"
                      : "Activar"
                  }
                </button>
              `;

          return `
            <tr
              data-id="${item.idAdministrador}"
            >

              <td>
                <strong>
                  ${escapar(
                    item.nombreCompleto
                  )}
                </strong>

                ${
                  propia
                    ? "<br>" +
                      etiqueta(
                        "Cuenta actual",
                        "informacion"
                      )
                    : ""
                }

                <br>

                <small>
                  ${escapar(
                    item.correo
                  )}
                </small>
              </td>

              <td>
                ${
                  etiqueta(
                    item.nombreEstado ||
                    (
                      item.permiteAcceso
                        ? "Activo"
                        : "Inactivo"
                    ),
                    item.permiteAcceso
                      ? "activo"
                      : "inactivo"
                  )
                }
              </td>

              <td>
                ${
                  etiqueta(
                    item.correoVerificado
                      ? "Correo verificado"
                      : "Correo pendiente",
                    item.correoVerificado
                      ? "exito"
                      : "advertencia"
                  )
                }

                <br>

                <small>
                  ${
                    item.requiereVerificacion
                      ? "Segundo factor activo"
                      : "Segundo factor desactivado"
                  }
                </small>
              </td>

              <td>
                ${
                  item.requiereCambioContrasena
                    ? etiqueta(
                        "Cambio obligatorio pendiente",
                        "advertencia"
                      )
                    : etiqueta(
                        "Contraseña definitiva",
                        "exito"
                      )
                }
              </td>

              <td>
                ${
                  escapar(
                    fecha(
                      item.ultimoAcceso
                    )
                  )
                }
              </td>

              <td>
                <div
                  class="administradores-acciones"
                >
                  ${acciones}
                </div>
              </td>

            </tr>
          `;
        }
      ).join("");

    mostrar(
      administradores.length
        ? `${administradores.length} cuenta(s) en esta página.`
        : "No se encontraron cuentas."
    );
  }


  function actualizarPaginacion(
    datos
  ) {
    Object.assign(
      paginacion,
      {
        paginaActual:
          Number(
            datos.paginaActual
          ) || 1,

        limite:
          Number(
            datos.limite
          ) || 20,

        totalRegistros:
          Number(
            datos.totalRegistros
          ) || 0,

        totalPaginas:
          Number(
            datos.totalPaginas
          ) || 1,

        tieneAnterior:
          Boolean(
            datos.tieneAnterior
          ),

        tieneSiguiente:
          Boolean(
            datos.tieneSiguiente
          )
      }
    );

    const inicio =
      paginacion.totalRegistros
        ? (
            (
              paginacion.paginaActual -
              1
            ) *
            paginacion.limite
          ) + 1
        : 0;

    const fin =
      Math.min(
        paginacion.paginaActual *
        paginacion.limite,
        paginacion.totalRegistros
      );

    document.getElementById(
      "resumenPaginacionAdministradores"
    ).textContent =
      paginacion.totalRegistros
        ? `Mostrando ${inicio}–${fin} de ${paginacion.totalRegistros} registros`
        : "Mostrando 0 de 0 registros";

    document.getElementById(
      "paginaAdministradores"
    ).textContent =
      `Página ${paginacion.paginaActual} de ${paginacion.totalPaginas}`;

    document.getElementById(
      "limiteAdministradores"
    ).value =
      String(
        paginacion.limite
      );

    document.getElementById(
      "anteriorAdministradores"
    ).disabled =
      !paginacion.tieneAnterior;

    document.getElementById(
      "siguienteAdministradores"
    ).disabled =
      !paginacion.tieneSiguiente;
  }


  async function cargar(
    {
      reiniciarPagina = false
    } = {}
  ) {
    if (reiniciarPagina) {
      paginacion.paginaActual = 1;
    }

    const parametros =
      new URLSearchParams({
        pagina:
          paginacion.paginaActual,

        limite:
          paginacion.limite
      });

    if (
      busqueda.value.trim()
    ) {
      parametros.set(
        "busqueda",
        busqueda.value.trim()
      );
    }

    if (
      filtroEstado.value
    ) {
      parametros.set(
        "idEstado",
        filtroEstado.value
      );
    }

    mostrar(
      "Cargando cuentas..."
    );

    const respuesta =
      await api.get(
        `/administradores?${parametros}`
      );

    administradores =
      respuesta?.datos
        ?.administradores ||
      [];

    estados =
      respuesta?.datos
        ?.estados ||
      [];

    cargarSelectores();
    renderizar();

    actualizarPaginacion(
      respuesta?.datos ||
      {}
    );
  }


  function buscarAdministrador(
    fila
  ) {
    return administradores.find(
      (item) =>
        Number(
          item.idAdministrador
        ) ===
        Number(
          fila.dataset.id
        )
    );
  }


  async function cambiarEstado(
    item,
    activar
  ) {
    const estadoDestino =
      estados.find(
        (estado) =>
          Boolean(
            estado.permiteAcceso
          ) ===
          activar
      );

    if (!estadoDestino) {
      throw new Error(
        `No existe un estado disponible para ${
          activar
            ? "activar"
            : "desactivar"
        } la cuenta.`
      );
    }

    const confirmado =
      await modal.confirmar({
        tipo:
          activar
            ? "advertencia"
            : "peligro",

        titulo:
          activar
            ? "Activar administrador"
            : "Desactivar administrador",

        mensaje:
          activar
            ? "La cuenta recuperará el acceso al panel administrativo."
            : "La cuenta perderá el acceso y sus sesiones activas serán revocadas.",

        detalle:
          `${item.nombreCompleto} · ${item.correo}`,

        textoConfirmar:
          activar
            ? "Activar"
            : "Desactivar",

        textoCancelar:
          "Cancelar"
      });

    if (!confirmado) {
      return;
    }

    await api.patch(
      `/administradores/${item.idAdministrador}/estado`,
      {
        idEstadoAdministrador:
          estadoDestino.idEstadoAdministrador
      }
    );

    await cargar();

    notificar(
      "exito",
      "Estado actualizado",
      `La cuenta fue ${
        activar
          ? "activada"
          : "desactivada"
      } correctamente.`
    );
  }


  async function crear(
    evento
  ) {
    evento.preventDefault();

    const nombreCompleto =
      document.getElementById(
        "nombreNuevoAdmin"
      ).value.trim();

    const correo =
      document.getElementById(
        "correoNuevoAdmin"
      ).value.trim();

    const confirmado =
      await modal.confirmar({
        tipo:
          "advertencia",

        titulo:
          "Crear administrador",

        mensaje:
          "Se generará una contraseña temporal y se enviará una sola vez al correo indicado.",

        detalle:
          `${nombreCompleto} · ${correo}`,

        textoConfirmar:
          "Crear administrador",

        textoCancelar:
          "Cancelar"
      });

    if (!confirmado) {
      return;
    }

    const boton =
      formulario.querySelector(
        '[type="submit"]'
      );

    boton.disabled = true;

    try {
      const respuesta =
        await api.post(
          "/administradores",
          {
            nombreCompleto,
            correo
          }
        );

      formulario.reset();

      cerrarModalGestion(
        panelNuevo
      );

      await cargar({
        reiniciarPagina:
          true
      });

      const enviado =
        respuesta?.datos
          ?.correoAccesoEnviado;

      notificar(
        enviado
          ? "exito"
          : "advertencia",

        enviado
          ? "Administrador creado"
          : "Cuenta creada con advertencia",

        enviado
          ? "La contraseña temporal fue enviada por correo. El nuevo administrador deberá cambiarla después de iniciar sesión."
          : respuesta?.datos
              ?.advertencia
      );
    } catch (error) {
      notificar(
        "error",
        "No fue posible crear la cuenta",
        error.message
      );
    } finally {
      boton.disabled =
        false;
    }
  }


  function abrirEdicion(
    item
  ) {
    formularioEditar.reset();

    document.getElementById(
      "idEditarAdmin"
    ).value =
      item.idAdministrador;

    document.getElementById(
      "nombreEditarAdmin"
    ).value =
      item.nombreCompleto;

    document.getElementById(
      "correoEditarAdmin"
    ).value =
      item.correo;

    document.getElementById(
      "estadoEditarAdmin"
    ).innerHTML =
      opcionesEstado(
        item.idEstadoAdministrador
      );

    abrirModalGestion(
      panelEditar
    );
  }


  async function guardarEdicion(
    evento
  ) {
    evento.preventDefault();

    const datos = {
      nombreCompleto:
        document.getElementById(
          "nombreEditarAdmin"
        ).value.trim(),

      correo:
        document.getElementById(
          "correoEditarAdmin"
        ).value.trim(),

      idEstadoAdministrador:
        Number(
          document.getElementById(
            "estadoEditarAdmin"
          ).value
        )
    };

    const id =
      Number(
        document.getElementById(
          "idEditarAdmin"
        ).value
      );

    const confirmado =
      await modal.confirmar({
        tipo:
          "advertencia",

        titulo:
          "Guardar cambios",

        mensaje:
          "Se actualizarán los datos y el estado de esta cuenta administrativa.",

        detalle:
          `${datos.nombreCompleto} · ${datos.correo}`,

        textoConfirmar:
          "Guardar cambios"
      });

    if (!confirmado) {
      return;
    }

    const boton =
      formularioEditar.querySelector(
        '[type="submit"]'
      );

    boton.disabled = true;

    try {
      await api.put(
        `/administradores/${id}`,
        datos
      );

      cerrarModalGestion(
        panelEditar
      );

      formularioEditar.reset();

      await cargar();

      notificar(
        "exito",
        "Administrador actualizado",
        "Los cambios se guardaron correctamente."
      );
    } catch (error) {
      notificar(
        "error",
        "No fue posible actualizar",
        error.message
      );
    } finally {
      boton.disabled =
        false;
    }
  }


  async function enviarRecuperacion(
    item
  ) {
    const confirmado =
      await modal.confirmar({
        tipo:
          "advertencia",

        titulo:
          "Enviar recuperación",

        mensaje:
          "Se enviará al propietario un código y enlace seguro para restablecer su propia contraseña.",

        detalle:
          `${item.nombreCompleto} · ${item.correo}`,

        textoConfirmar:
          "Enviar recuperación"
      });

    if (!confirmado) {
      return;
    }

    await api.post(
      `/administradores/${item.idAdministrador}/recuperacion`
    );

    notificar(
      "exito",
      "Recuperación enviada",
      "El propietario recibió las instrucciones en su correo."
    );
  }


  async function reenviarAcceso(
    item
  ) {
    const confirmado =
      await modal.confirmar({
        tipo:
          "peligro",

        titulo:
          "Generar un acceso temporal nuevo",

        mensaje:
          "La contraseña actual dejará de funcionar, se cerrarán sus sesiones y volverá a ser obligatorio cambiar la contraseña.",

        detalle:
          `${item.nombreCompleto} · ${item.correo}`,

        textoConfirmar:
          "Reenviar acceso"
      });

    if (!confirmado) {
      return;
    }

    const respuesta =
      await api.post(
        `/administradores/${item.idAdministrador}/reenviar-acceso`
      );

    await cargar();

    const enviado =
      respuesta?.datos
        ?.correoAccesoEnviado;

    notificar(
      enviado
        ? "exito"
        : "advertencia",

      enviado
        ? "Acceso temporal enviado"
        : "Acceso renovado con advertencia",

      enviado
        ? "La contraseña temporal anterior fue reemplazada y la nueva se envió por correo."
        : respuesta?.datos
            ?.advertencia
    );
  }


  function metodoCambioContrasena() {
    return (
      document.querySelector(
        'input[name="metodoCambioContrasena"]:checked'
      )?.value ||
      "actual"
    );
  }


  function reiniciarFlujoCodigo() {
    tokenRecuperacionCambio =
      null;

    tokenRestablecimientoCambio =
      null;

    pasoCodigoRecuperacion.hidden =
      true;

    pasoNuevaContrasenaCodigo.hidden =
      true;

    document.getElementById(
      "codigoCambioContrasena"
    ).value = "";

    document.getElementById(
      "contrasenaNuevaCambioCodigo"
    ).value = "";

    document.getElementById(
      "confirmarContrasenaCambioCodigo"
    ).value = "";

    botonEnviarCodigoContrasena.disabled =
      false;

    botonEnviarCodigoContrasena.textContent =
      "Enviar código";

    botonVerificarCodigoContrasena.disabled =
      false;

    estadoCodigoContrasena.textContent =
      "";
  }


  function actualizarVistaMetodoCambio() {
    const esActual =
      metodoCambioContrasena() ===
      "actual";

    bloqueCambioActual.hidden =
      !esActual;

    bloqueCambioCodigo.hidden =
      esActual;

    const contrasenaActual =
      document.getElementById(
        "contrasenaActualCambio"
      );

    const nuevaActual =
      document.getElementById(
        "contrasenaNuevaCambioActual"
      );

    const confirmarActual =
      document.getElementById(
        "confirmarContrasenaCambioActual"
      );

    const codigo =
      document.getElementById(
        "codigoCambioContrasena"
      );

    const nuevaCodigo =
      document.getElementById(
        "contrasenaNuevaCambioCodigo"
      );

    const confirmarCodigo =
      document.getElementById(
        "confirmarContrasenaCambioCodigo"
      );

    contrasenaActual.required =
      esActual;

    nuevaActual.required =
      esActual;

    confirmarActual.required =
      esActual;

    codigo.required =
      !esActual &&
      Boolean(
        tokenRecuperacionCambio
      ) &&
      !tokenRestablecimientoCambio;

    nuevaCodigo.required =
      !esActual &&
      Boolean(
        tokenRestablecimientoCambio
      );

    confirmarCodigo.required =
      !esActual &&
      Boolean(
        tokenRestablecimientoCambio
      );

    botonGuardarCambioContrasena.hidden =
      !esActual &&
      !tokenRestablecimientoCambio;
  }


  function abrirCambioContrasena() {
    formularioCambiarContrasena.reset();

    reiniciarFlujoCodigo();

    document.getElementById(
      "correoCambioContrasena"
    ).value =
      correoSesionActual;

    actualizarVistaMetodoCambio();

    abrirModalGestion(
      modalCambiarContrasena
    );
  }


  function cerrarCambioContrasena() {
    cerrarModalGestion(
      modalCambiarContrasena
    );

    formularioCambiarContrasena.reset();

    reiniciarFlujoCodigo();

    actualizarVistaMetodoCambio();
  }


  async function enviarCodigoCambioContrasena() {
    if (!correoSesionActual) {
      throw new Error(
        "No fue posible identificar el correo de la sesión actual."
      );
    }

    botonEnviarCodigoContrasena.disabled =
      true;

    estadoCodigoContrasena.textContent =
      "Enviando código...";

    try {
      const respuesta =
        await api.post(
          "/autenticacion/recuperar-contrasena/solicitar",
          {
            correo:
              correoSesionActual
          }
        );

      tokenRecuperacionCambio =
        respuesta?.datos
          ?.tokenRecuperacion ||
        null;

      tokenRestablecimientoCambio =
        null;

      if (
        !tokenRecuperacionCambio
      ) {
        throw new Error(
          "No fue posible iniciar la verificación por correo."
        );
      }

      pasoCodigoRecuperacion.hidden =
        false;

      pasoNuevaContrasenaCodigo.hidden =
        true;

      botonVerificarCodigoContrasena.disabled =
        false;

      botonGuardarCambioContrasena.hidden =
        true;

      botonEnviarCodigoContrasena.textContent =
        "Reenviar código";

      estadoCodigoContrasena.textContent =
        "Código enviado. Revise su correo.";

      document.getElementById(
        "codigoCambioContrasena"
      ).focus();

      actualizarVistaMetodoCambio();

    } finally {
      botonEnviarCodigoContrasena.disabled =
        false;
    }
  }


  async function verificarCodigoCambioContrasena() {
    const codigo =
      document.getElementById(
        "codigoCambioContrasena"
      ).value.trim();

    if (
      !tokenRecuperacionCambio
    ) {
      throw new Error(
        "Primero debe solicitar un código por correo."
      );
    }

    if (
      !/^\d{6}$/.test(
        codigo
      )
    ) {
      throw new Error(
        "El código debe contener exactamente seis números."
      );
    }

    botonVerificarCodigoContrasena.disabled =
      true;

    estadoCodigoContrasena.textContent =
      "Verificando código...";

    try {
      const respuesta =
        await api.post(
          "/autenticacion/recuperar-contrasena/verificar",
          {
            tokenRecuperacion:
              tokenRecuperacionCambio,

            codigo
          }
        );

      tokenRestablecimientoCambio =
        respuesta?.datos
          ?.tokenRestablecimiento ||
        null;

      if (
        !tokenRestablecimientoCambio
      ) {
        throw new Error(
          "No fue posible autorizar el cambio de contraseña."
        );
      }

      pasoNuevaContrasenaCodigo.hidden =
        false;

      botonGuardarCambioContrasena.hidden =
        false;

      estadoCodigoContrasena.textContent =
        "Código verificado correctamente.";

      document.getElementById(
        "contrasenaNuevaCambioCodigo"
      ).focus();

      actualizarVistaMetodoCambio();

    } catch (error) {
      botonVerificarCodigoContrasena.disabled =
        false;

      throw error;
    }
  }


  function redirigirAlInicioSesion() {
    const ruta =
      global.AdminLayout
        ?.obtenerRutaPanel
        ?.(
          "pages/autenticacion/iniciar-sesion.html"
        ) ||
      "../autenticacion/iniciar-sesion.html";

    global.location.href =
      ruta;
  }


  async function informarCambioContrasenaExitoso() {
    cerrarModalGestion(
      modalCambiarContrasena
    );

    if (
      typeof modal?.informar ===
      "function"
    ) {
      await modal.informar({
        tipo:
          "exito",

        titulo:
          "Contraseña actualizada",

        mensaje:
          "La contraseña fue cambiada correctamente. Por seguridad debe iniciar sesión nuevamente.",

        textoConfirmar:
          "Ir al inicio de sesión",

        mostrarCerrar:
          false,

        cerrarAlPresionarFuera:
          false,

        cerrarConEscape:
          false
      });
    } else {
      notificar(
        "exito",
        "Contraseña actualizada",
        "La contraseña fue cambiada correctamente. Debe iniciar sesión nuevamente."
      );
    }

    redirigirAlInicioSesion();
  }


  async function guardarCambioContrasena(
    evento
  ) {
    evento.preventDefault();

    const metodo =
      metodoCambioContrasena();

    const boton =
      botonGuardarCambioContrasena;

    boton.disabled =
      true;

    try {

      if (
        metodo ===
        "actual"
      ) {
        const datos = {
          contrasenaActual:
            document.getElementById(
              "contrasenaActualCambio"
            ).value,

          contrasenaNueva:
            document.getElementById(
              "contrasenaNuevaCambioActual"
            ).value,

          confirmarContrasenaNueva:
            document.getElementById(
              "confirmarContrasenaCambioActual"
            ).value
        };

        if (
          !datos.contrasenaActual ||
          !datos.contrasenaNueva ||
          !datos.confirmarContrasenaNueva
        ) {
          throw new Error(
            "Complete los tres campos de contraseña."
          );
        }

        await api.patch(
          "/autenticacion/cambiar-contrasena",
          datos
        );

      } else {

        if (
          !tokenRestablecimientoCambio
        ) {
          throw new Error(
            "Primero debe enviar y verificar el código recibido por correo."
          );
        }

        const datos = {
          tokenRestablecimiento:
            tokenRestablecimientoCambio,

          contrasenaNueva:
            document.getElementById(
              "contrasenaNuevaCambioCodigo"
            ).value,

          confirmarContrasenaNueva:
            document.getElementById(
              "confirmarContrasenaCambioCodigo"
            ).value
        };

        if (
          !datos.contrasenaNueva ||
          !datos.confirmarContrasenaNueva
        ) {
          throw new Error(
            "Ingrese y confirme la contraseña nueva."
          );
        }

        await api.post(
          "/autenticacion/recuperar-contrasena/restablecer",
          datos
        );
      }

      await informarCambioContrasenaExitoso();

    } catch (error) {
      notificar(
        "error",
        "No fue posible cambiar la contraseña",
        error.message
      );
    } finally {
      boton.disabled =
        false;
    }
  }


  function configurarCierreModal(
    elemento,
    cerrar
  ) {
    if (!elemento) {
      return;
    }

    elemento.addEventListener(
      "mousedown",
      (evento) => {
        if (
          evento.target ===
            elemento &&
          !modal
            ?.estaAbierto
            ?.()
        ) {
          cerrar();
        }
      }
    );
  }


  document.addEventListener(
    "DOMContentLoaded",
    async () => {

      if (
        typeof autenticacion
          ?.obtenerSesion ===
        "function"
      ) {
        try {
          const sesion =
            await autenticacion
              .obtenerSesion();

          const administradorSesion =
            sesion?.datos
              ?.administrador;

          idSesionActual =
            Number(
              administradorSesion
                ?.idAdministrador
            ) ||
            null;

          correoSesionActual =
            String(
              administradorSesion
                ?.correo ||
              ""
            )
              .trim()
              .toLowerCase();

        } catch (_error) {
          return;
        }
      }


      let temporizador;


      document.getElementById(
        "botonMostrarNuevoAdmin"
      ).addEventListener(
        "click",
        () => {
          formulario.reset();

          abrirModalGestion(
            panelNuevo
          );
        }
      );


      document.getElementById(
        "botonCancelarNuevoAdmin"
      ).addEventListener(
        "click",
        () => {
          cerrarModalGestion(
            panelNuevo
          );

          formulario.reset();
        }
      );


      document.getElementById(
        "botonCerrarNuevoAdmin"
      ).addEventListener(
        "click",
        () => {
          cerrarModalGestion(
            panelNuevo
          );

          formulario.reset();
        }
      );


      document.getElementById(
        "botonCancelarEditarAdmin"
      ).addEventListener(
        "click",
        () => {
          cerrarModalGestion(
            panelEditar
          );

          formularioEditar.reset();
        }
      );


      document.getElementById(
        "botonCerrarEditarAdmin"
      ).addEventListener(
        "click",
        () => {
          cerrarModalGestion(
            panelEditar
          );

          formularioEditar.reset();
        }
      );


      document.getElementById(
        "botonCancelarCambioContrasena"
      ).addEventListener(
        "click",
        cerrarCambioContrasena
      );


      document.getElementById(
        "botonCerrarCambioContrasena"
      ).addEventListener(
        "click",
        cerrarCambioContrasena
      );


      formulario.addEventListener(
        "submit",
        crear
      );


      formularioEditar.addEventListener(
        "submit",
        guardarEdicion
      );


      formularioCambiarContrasena
        .addEventListener(
          "submit",
          guardarCambioContrasena
        );


      document.querySelectorAll(
        'input[name="metodoCambioContrasena"]'
      ).forEach(
        (control) => {
          control.addEventListener(
            "change",
            actualizarVistaMetodoCambio
          );
        }
      );


      botonEnviarCodigoContrasena
        .addEventListener(
          "click",
          () => {
            enviarCodigoCambioContrasena()
              .catch(
                (error) => {
                  estadoCodigoContrasena
                    .textContent =
                      "";

                  notificar(
                    "error",
                    "No fue posible enviar el código",
                    error.message
                  );
                }
              );
          }
        );


      botonVerificarCodigoContrasena
        .addEventListener(
          "click",
          () => {
            verificarCodigoCambioContrasena()
              .catch(
                (error) => {
                  estadoCodigoContrasena
                    .textContent =
                      "";

                  notificar(
                    "error",
                    "No fue posible verificar el código",
                    error.message
                  );
                }
              );
          }
        );


      filtroEstado.addEventListener(
        "change",
        () => {
          cargar({
            reiniciarPagina:
              true
          }).catch(
            (error) =>
              mostrar(
                error.message,
                "error"
              )
          );
        }
      );


      busqueda.addEventListener(
        "input",
        () => {
          clearTimeout(
            temporizador
          );

          temporizador =
            setTimeout(
              () => {
                cargar({
                  reiniciarPagina:
                    true
                }).catch(
                  (error) =>
                    mostrar(
                      error.message,
                      "error"
                    )
                );
              },
              350
            );
        }
      );


      document.getElementById(
        "limiteAdministradores"
      ).addEventListener(
        "change",
        (evento) => {
          paginacion.limite =
            Number(
              evento.currentTarget
                .value
            ) ||
            20;

          cargar({
            reiniciarPagina:
              true
          }).catch(
            (error) =>
              mostrar(
                error.message,
                "error"
              )
          );
        }
      );


      document.getElementById(
        "anteriorAdministradores"
      ).addEventListener(
        "click",
        () => {
          if (
            !paginacion
              .tieneAnterior
          ) {
            return;
          }

          paginacion.paginaActual -=
            1;

          cargar().catch(
            (error) =>
              mostrar(
                error.message,
                "error"
              )
          );
        }
      );


      document.getElementById(
        "siguienteAdministradores"
      ).addEventListener(
        "click",
        () => {
          if (
            !paginacion
              .tieneSiguiente
          ) {
            return;
          }

          paginacion.paginaActual +=
            1;

          cargar().catch(
            (error) =>
              mostrar(
                error.message,
                "error"
              )
          );
        }
      );


      cuerpo.addEventListener(
        "click",
        async (evento) => {
          const botonAccion =
            evento.target.closest(
              "[data-accion]"
            );

          if (
            !botonAccion ||
            botonAccion.disabled
          ) {
            return;
          }

          const fila =
            botonAccion.closest(
              "tr"
            );

          const item =
            buscarAdministrador(
              fila
            );

          if (!item) {
            return;
          }

          botonAccion.disabled =
            true;

          try {

            if (
              botonAccion
                .dataset
                .accion ===
              "editar"
            ) {
              abrirEdicion(
                item
              );
            }

            if (
              botonAccion
                .dataset
                .accion ===
              "activar"
            ) {
              await cambiarEstado(
                item,
                true
              );
            }

            if (
              botonAccion
                .dataset
                .accion ===
              "desactivar"
            ) {
              await cambiarEstado(
                item,
                false
              );
            }

            if (
              botonAccion
                .dataset
                .accion ===
              "recuperacion"
            ) {
              await enviarRecuperacion(
                item
              );
            }

            if (
              botonAccion
                .dataset
                .accion ===
              "reenviar"
            ) {
              await reenviarAcceso(
                item
              );
            }

            if (
              botonAccion
                .dataset
                .accion ===
              "cambiar-contrasena"
            ) {
              abrirCambioContrasena();
            }

          } catch (error) {
            notificar(
              "error",
              "No fue posible completar la acción",
              error.message
            );
          } finally {
            if (
              document.body.contains(
                botonAccion
              )
            ) {
              botonAccion.disabled =
                false;
            }
          }
        }
      );


      configurarCierreModal(
        panelNuevo,
        () => {
          cerrarModalGestion(
            panelNuevo
          );

          formulario.reset();
        }
      );


      configurarCierreModal(
        panelEditar,
        () => {
          cerrarModalGestion(
            panelEditar
          );

          formularioEditar.reset();
        }
      );


      configurarCierreModal(
        modalCambiarContrasena,
        cerrarCambioContrasena
      );


      document.addEventListener(
        "keydown",
        (evento) => {

          if (
            evento.key !==
              "Escape" ||
            modal
              ?.estaAbierto
              ?.()
          ) {
            return;
          }

          if (
            !modalCambiarContrasena
              .hidden
          ) {
            cerrarCambioContrasena();

            return;
          }

          if (
            !panelEditar.hidden
          ) {
            cerrarModalGestion(
              panelEditar
            );

            formularioEditar.reset();

            return;
          }

          if (
            !panelNuevo.hidden
          ) {
            cerrarModalGestion(
              panelNuevo
            );

            formulario.reset();
          }
        }
      );


      actualizarVistaMetodoCambio();


      cargar().catch(
        (error) =>
          mostrar(
            error.message,
            "error"
          )
      );

    }
  );

})(window);