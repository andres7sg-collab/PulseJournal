# Pulso Journal

Registro calórico personal con integración Oura Ring.

## Deploy en Vercel

### 1. Sube a GitHub
- Crea un repo nuevo en github.com (ej: `pulso-journal`)
- Sube todos estos archivos al repo

### 2. Conecta con Vercel
- En vercel.com → "New Project"
- Importa el repo de GitHub
- Framework: **Create React App**
- Build command: `npm run build`
- Output directory: `build`

### 3. Configura el token de Oura
- En Vercel → tu proyecto → Settings → Environment Variables
- Añade: `OURA_TOKEN` = tu token de Oura Ring
- Redeploy el proyecto

### 4. PWA en iPhone
- Abre la URL en Safari
- Compartir → "Añadir a pantalla de inicio"
- Ya tienes el ícono en el home screen

## Estructura
```
pulso-journal/
├── api/
│   └── oura.js          # Proxy serverless para Oura API
├── public/
│   ├── index.html
│   └── manifest.json    # PWA config
├── src/
│   ├── index.js
│   └── App.jsx          # App principal
├── package.json
└── vercel.json
```
