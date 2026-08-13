# Backend LHVR

API Express conectada a SQL Server mediante autenticación integrada de Windows.

## Inicio local

1. Copie `.env.example` como `.env` y complete los valores de su equipo.
2. Verifique que el servicio SQL Server y `BD-LHVR` estén disponibles.
3. Ejecute `npm install` si aún no existen las dependencias.
4. Ejecute `npm run test`.
5. Ejecute `npm run test:db`.
6. Inicie con `npm start`.

La API queda por defecto en `http://127.0.0.1:3001/api`. El servidor solo inicia si logra conectarse a la base de datos.

## Comandos

- `npm start`: inicia la API.
- `npm run dev`: inicia con recarga automática.
- `npm test`: pruebas unitarias, seguridad HTTP e integridad de rutas.
- `npm run test:db`: comprobación real de SQL Server; requiere `.env` y acceso a la BD.

No incluya el archivo `.env` ni contraseñas en Git.
