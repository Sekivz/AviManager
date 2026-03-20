Características

Dashboard con KPIs en tiempo real: inversión total, ganancia estimada, mortalidad promedio y aves vivas
Gestión completa de lotes: crear, editar, eliminar e importar desde CSV
Registro de bajas con causa, cantidad, fecha y notas
Alertas automáticas cuando la mortalidad supera el 3% (aviso) o el 5% (crítico)
Proyección de rentabilidad con slider de días y cálculo de ROI por galpón
Gráficos interactivos con Chart.js: mortalidad, peso promedio, bajas por causa e inversión vs ganancia
Exportación de reportes en PDF profesional y CSV
Historial completo de todas las operaciones
Modo oscuro y modo claro con persistencia
6 idiomas: español, inglés, portugués, francés, alemán y chino
Tour de onboarding para nuevos usuarios
Instalable como PWA en móvil y escritorio
Todos los datos persisten en localStorage, sin necesidad de backend


Tecnologías

Angular 17+ con Standalone Components y Signals
TypeScript 5.4
Chart.js 4 para gráficos interactivos
Angular PWA con Service Worker
CSS custom properties para theming
Docker con Nginx para deploy


Instalación
bashgit clone https://github.com/tu-usuario/avimanager.git
cd avimanager
npm install
ng serve
Abrir en http://localhost:4200
Build de producción
bashng build --configuration production
Con Docker
bashdocker compose up --build
La app queda disponible en http://localhost

Estructura
src/
├── app/
│   ├── app.component.ts         # Lógica principal, signals, KPIs, modales
│   ├── app.component.html       # 5 secciones + 4 modales
│   ├── app.component.css        # Estilos con theming claro/oscuro
│   ├── charts/
│   │   └── avi-charts.component.ts   # Gráficos Chart.js
│   ├── login/
│   │   └── login.component.ts        # Autenticación
│   └── services/
│       └── api.service.ts            # HTTP para backend opcional
└── manifest.webmanifest              # Configuración PWA

Backend opcional
El frontend funciona completamente sin backend usando localStorage. Si en el futuro querés conectar una base de datos real, el proyecto incluye un backend en Node.js + Express + TypeScript con SQLite que corre localmente y es accesible desde cualquier dispositivo en la misma red WiFi.
bashcd avi-backend
npm install
mkdir data
npx prisma migrate dev --name init
npm run db:seed
npm run dev

Secciones de la app

Dashboard: KPIs, gráficos y tabla resumen de lotes
Lotes: CRUD completo, importar CSV, registrar bajas, historial
Alertas: monitoreo automático, gráfico por causa, historial
Reportes: proyección de ROI, slider de días, exportar PDF y CSV
Configuración: tema, idioma, nombre de usuario, tour, backup
