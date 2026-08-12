# (gas)TITOS

App de control de gastos compartidos entre Wilson y Yanina. Frontend en React + Vite, backend en Google Apps Script (Web App) atado a un Google Sheet que actúa como base de datos. Login exclusivo con Google (whitelist de 2 emails validada server-side).

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar VITE_SCRIPT_URL y VITE_GOOGLE_CLIENT_ID
npm run dev
```

## Backend (`apps-script/`)

Ver el encabezado de `apps-script/Code.gs` para el setup completo: Script Properties (`GOOGLE_CLIENT_ID`, `WILSON_EMAIL`, `YANINA_EMAIL`), `forceAuth()` una vez desde el editor, y deploy como Web App (Execute as: Me, Who has access: Anyone).

## Deploy

Push a `main` dispara `.github/workflows/deploy.yml`, que buildea con Vite y publica a GitHub Pages. Requiere los secrets del repo `VITE_SCRIPT_URL` y `VITE_GOOGLE_CLIENT_ID`.
