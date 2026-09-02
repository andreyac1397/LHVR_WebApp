const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const raiz = path.resolve(__dirname, "../../..");
const leer = (ruta) => fs.readFileSync(path.join(raiz, ruta), "utf8");

test("Chat utiliza la arquitectura modular y las tablas existentes", () => {
  const repositorio = leer(
    "backend/src/modules/chat/repositories/sql-chat.repository.js"
  );
  const servicio = leer("backend/src/modules/chat/services/chat.service.js");
  const controlador = leer(
    "backend/src/modules/chat/controllers/chat.controller.js"
  );
  const rutas = leer("backend/src/modules/chat/routes/chat.routes.js");

  [
    "dbo.estados_chat",
    "dbo.chat_conversaciones",
    "dbo.chat_mensajes",
    "dbo.administradores"
  ].forEach((tabla) => assert.match(repositorio, new RegExp(tabla.replace(".", "\\."))));
  assert.doesNotMatch(repositorio, /solicitudes_contacto|cms_solicitudes/);
  assert.match(repositorio, /\.input\("token_hash", sql\.VarChar\(64\)/);
  assert.match(repositorio, /m\.tipo_remitente = N'EXTERNO'/);
  assert.match(repositorio, /m\.tipo_remitente = N'ADMINISTRADOR'/);
  assert.match(repositorio, /fecha_ultima_actividad = SYSUTCDATETIME\(\)/);
  assert.match(servicio, /crypto\.randomBytes\(BYTES_TOKEN\)/);
  assert.match(servicio, /createHash\("sha256"\)/);
  assert.doesNotMatch(controlador, /SELECT|INSERT INTO|UPDATE dbo\./);
  assert.doesNotMatch(rutas, /SELECT|INSERT INTO|UPDATE dbo\./);
  assert.match(rutas, /router\.use\(authenticationMiddleware\)/);
  assert.match(rutas, /\/:idConversacion\/archivar/);
  assert.match(rutas, /router\.delete\(/);
  assert.match(servicio, /async archivarConversacion\(/);
  assert.match(servicio, /async eliminarConversacion\(/);
  assert.match(repositorio, /DELETE FROM dbo\.chat_mensajes/);
  assert.match(repositorio, /DELETE FROM dbo\.chat_conversaciones/);
});

test("Chat agrega solo el estado Archivado y se monta una vez en ambos frontends", () => {
  const migraciones = fs.readdirSync(path.join(raiz, "database/migrations"));
  const migracionesChat = migraciones.filter((archivo) =>
    archivo.toLowerCase().includes("chat")
  );
  assert.deepEqual(migracionesChat, ["014-estado-archivado-chat.sql"]);
  const migracionChat = leer(
    "database/migrations/014-estado-archivado-chat.sql"
  );
  assert.match(migracionChat, /INSERT INTO dbo\.estados_chat/);
  assert.doesNotMatch(migracionChat, /CREATE TABLE|ALTER TABLE/);

  const main = leer("frontend-publico/js/main.js");
  const widget = leer("frontend-publico/js/chat-publico.js");
  const menu = leer("panel-administrativo/js/components/barra-lateral.js");
  const pagina = leer("panel-administrativo/pages/chat/chat.html");

  assert.match(main, /function cargarChatPublico\(/);
  assert.match(main, /js\/chat-publico\.js/);
  assert.match(widget, /lhvr_chat_token/);
  assert.match(widget, /INTERVALO_POLLING = 4000/);
  assert.match(widget, /textContent = item\.mensaje/);
  assert.match(menu, /ruta: "pages\/chat\/chat\.html"/);
  assert.match(pagina, /id="listaConversacionesChat"/);
  assert.match(pagina, /id="mensajesConversacionChat"/);
  assert.match(pagina, /id="accionArchivarChat"/);
  assert.match(pagina, /id="accionEliminarChat"/);
});

test("el panel integra notificaciones y chats flotantes reutilizables", () => {
  const layout = leer("panel-administrativo/js/components/layout-admin.js");
  const componente = leer(
    "panel-administrativo/js/components/chat-flotante-admin.js"
  );
  const estilos = leer(
    "panel-administrativo/css/chat-flotante-admin.css"
  );

  assert.match(layout, /css\/chat-flotante-admin\.css/);
  assert.match(layout, /chat-flotante-admin\.js/);
  assert.match(componente, /INTERVALO_POLLING = 5000/);
  assert.match(componente, /\/chat\/administracion\/conversaciones/);
  assert.match(componente, /marcar-leidos/);
  assert.match(componente, /global\.Notification\.requestPermission/);
  assert.match(componente, /ChatNotificacionesAdmin/);
  assert.match(estilos, /chat-notificaciones-admin__badge-menu/);
  assert.match(estilos, /chat-flotante-admin--minimizado/);
  assert.match(estilos, /@media \(max-width: 700px\)/);
  assert.doesNotMatch(componente, /innerHTML\s*=\s*.*nombreCompleto/);
});
