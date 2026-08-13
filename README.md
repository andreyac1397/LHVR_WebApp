# Web institucional LHVR

Aplicación del Liceo Hernán Vargas Ramírez compuesta por:

- `frontend-publico`: sitio público.
- `panel-administrativo`: panel protegido.
- `backend`: API Express y acceso a SQL Server.
- `database`: migraciones históricas y consultas de verificación.

## Ejecución

1. Configure `backend/.env` a partir de `backend/.env.example`.
2. Desde `backend`, ejecute `npm run test` y `npm run test:db`.
3. Inicie la API con `npm start`.
4. Sirva `frontend-publico` y `panel-administrativo` mediante HTTP en un origen incluido en `CORS_ORIGINS` (por ejemplo, puerto 5500).

La entrega técnica y el estado real de cada módulo están en [INFORME-FINAL.md](INFORME-FINAL.md). Las instrucciones de base de datos están en [database/README-CAMBIOS-BD.md](database/README-CAMBIOS-BD.md).
