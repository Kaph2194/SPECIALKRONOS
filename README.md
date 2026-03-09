# ⏰ Kronos — Agenda Inteligente

Aplicación de calendario que se conecta a **Google Calendar** usando OAuth2. Permite crear, editar y eliminar reuniones, tareas, eventos y citas directamente sincronizados con tu Google Calendar real.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Google Calendar](https://img.shields.io/badge/Google%20Calendar-API%20v3-4285F4?logo=googlecalendar) ![GitHub](https://img.shields.io/badge/Deploy-GitHub%20Pages-181717?logo=github)

---

## ✨ Funcionalidades

- 🔐 **Login con Google** — OAuth2 real, sin contraseñas
- 📅 **4 vistas** — Mes, Semana, Día, Lista
- 🎨 **4 tipos de evento** — Reunión 🤝, Tarea ✅, Evento 🎉, Cita 🩺
- ⚠️ **Detección de conflictos** — Alerta si el horario ya está ocupado
- 👥 **Invitar participantes** — Valida disponibilidad via Google Freebusy API
- 🔔 **Notificaciones** — 1 día antes y 4 horas antes (Google Calendar + navegador)
- 🔄 **Sincronización real** — Todo se guarda/lee de Google Calendar
- 🔗 **Link directo** — Cada evento tiene enlace a Google Calendar

---

## 🛠️ Requisitos previos

- **Node.js** v18 o superior → [nodejs.org](https://nodejs.org)
- **VS Code** → [code.visualstudio.com](https://code.visualstudio.com)
- Cuenta de **Google** (Gmail)
- Cuenta en **GitHub** (para el repositorio)

---

## 🚀 Paso 1 — Configurar Google Cloud Console

Esta es la parte más importante. Sigue estos pasos exactamente:

### 1.1 Crear el proyecto

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Haz clic en el selector de proyecto (arriba) → **"Nuevo proyecto"**
3. Nombre: `Kronos Calendar` → **Crear**

### 1.2 Habilitar APIs

1. En el menú izquierdo: **APIs y servicios** → **Biblioteca**
2. Busca **"Google Calendar API"** → **Habilitar**
3. Busca **"Google People API"** → **Habilitar** (para foto de perfil)

### 1.3 Configurar pantalla de consentimiento OAuth

1. **APIs y servicios** → **Pantalla de consentimiento de OAuth**
2. Tipo de usuario: **Externo** → **Crear**
3. Rellena:
   - Nombre de la app: `Kronos`
   - Correo de soporte: tu Gmail
   - Correo del desarrollador: tu Gmail
4. **Guardar y continuar**
5. En **Permisos**, haz clic en **"Agregar o quitar permisos"** y añade:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
6. **Guardar y continuar** hasta el final

### 1.4 Crear credenciales OAuth

1. **APIs y servicios** → **Credenciales** → **+ Crear credenciales** → **ID de cliente de OAuth**
2. Tipo: **Aplicación web**
3. Nombre: `Kronos Web`
4. **Orígenes de JavaScript autorizados** — agrega:
   ```
   http://localhost:3000
   https://TU_USUARIO.github.io
   ```
   *(reemplaza TU_USUARIO con tu usuario de GitHub)*
5. **URIs de redireccionamiento autorizados** — agrega:
   ```
   http://localhost:3000
   https://TU_USUARIO.github.io/kronos-calendar
   ```
6. **Crear** → Copia el **Client ID** (lo necesitarás pronto)

---

## 💻 Paso 2 — Configurar el proyecto localmente

### 2.1 Clonar / abrir en VS Code

```bash
# Opción A: Si ya tienes el proyecto
cd kronos-calendar
code .

# Opción B: Crear desde cero y copiar archivos
mkdir kronos-calendar
cd kronos-calendar
code .
```

### 2.2 Instalar dependencias

En la terminal de VS Code (`Ctrl+Ñ` o `Ctrl+backtick`):

```bash
npm install
```

### 2.3 Crear el archivo .env

```bash
# En la raíz del proyecto, crea el archivo .env:
cp .env.example .env
```

Luego abre `.env` y reemplaza el Client ID:

```env
REACT_APP_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
REACT_APP_GOOGLE_API_KEY=AIzaSy...  # Opcional
```

> ⚠️ **IMPORTANTE**: `.env` ya está en `.gitignore`. Nunca lo subas a GitHub.

### 2.4 Ejecutar en desarrollo

```bash
npm start
```

Se abrirá en `http://localhost:3000` 🎉

---

## 📁 Estructura del proyecto

```
kronos-calendar/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── views/
│   │   │   ├── MonthView.js      # Vista mes
│   │   │   ├── WeekView.js       # Vista semana
│   │   │   ├── DayView.js        # Vista día
│   │   │   └── ListView.js       # Vista lista
│   │   ├── EventModal.js         # Modal crear/editar
│   │   ├── EventDetailModal.js   # Modal detalle
│   │   ├── Sidebar.js            # Panel lateral
│   │   └── Toast.js              # Notificaciones UI
│   ├── hooks/
│   │   ├── useAuth.js            # Google OAuth
│   │   └── useCalendar.js        # CRUD Google Calendar
│   ├── pages/
│   │   ├── LoginPage.js          # Pantalla de login
│   │   └── CalendarPage.js       # App principal
│   ├── services/
│   │   └── googleCalendar.js     # API calls Google Calendar
│   ├── styles/
│   │   └── global.css            # Todos los estilos
│   ├── utils/
│   │   └── dateUtils.js          # Helpers de fecha
│   ├── App.js
│   └── index.js
├── .env.example                  # Plantilla de variables
├── .env                          # ← TU archivo local (no commitear)
├── .gitignore
└── README.md
```

---

## 🐙 Paso 3 — Subir a GitHub

### 3.1 Crear repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `kronos-calendar`
3. Visibilidad: **Público** (requerido para GitHub Pages gratis)
4. **NO** marques "Initialize this repository"
5. **Create repository**

### 3.2 Inicializar Git y hacer push

```bash
git init
git add .
git commit -m "feat: Kronos Calendar con Google Calendar API"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/kronos-calendar.git
git push -u origin main
```

---

## 🌐 Paso 4 — Deploy en GitHub Pages (opcional)

### 4.1 Instalar gh-pages

```bash
npm install --save-dev gh-pages
```

### 4.2 Agregar a package.json

Abre `package.json` y agrega:

```json
{
  "homepage": "https://TU_USUARIO.github.io/kronos-calendar",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

### 4.3 Configurar variables en GitHub

Para que el deploy funcione con el Client ID:

1. En tu repo: **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**:
   - Name: `REACT_APP_GOOGLE_CLIENT_ID`
   - Value: tu Client ID real

### 4.4 Crear GitHub Action para deploy automático

Crea el archivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
        env:
          REACT_APP_GOOGLE_CLIENT_ID: ${{ secrets.REACT_APP_GOOGLE_CLIENT_ID }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

### 4.5 Hacer deploy

```bash
npm run deploy
```

Tu app estará en: `https://TU_USUARIO.github.io/kronos-calendar` 🚀

---

## 🔧 Extensiones VS Code recomendadas

El proyecto incluye `.vscode/extensions.json`. Al abrir VS Code, te sugerirá instalar:

| Extensión | Uso |
|-----------|-----|
| Prettier | Formateo automático |
| ESLint | Errores de código |
| Auto Rename Tag | HTML/JSX |
| Path Intellisense | Rutas de archivos |

---

## ❓ Solución de problemas

### "redirect_uri_mismatch"
→ Agrega `http://localhost:3000` en los orígenes autorizados de Google Cloud Console

### "Access blocked: This app's request is invalid"
→ Verifica que habilitaste las APIs de Google Calendar en la consola

### Los eventos no aparecen
→ Asegúrate de que el token no expiró (sesión dura 1 hora). Cierra sesión y vuelve a entrar.

### Error al invitar participantes
→ La API Freebusy solo funciona con calendarios públicos o dentro del mismo Google Workspace

---

## 📄 Licencia

MIT — Úsalo libremente para proyectos personales y comerciales.
