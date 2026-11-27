# Pesito — Sistema de Gestión de Finanzas

Aplicación web para controlar ingresos, gastos, billeteras, tarjetas, suscripciones y boletas. Es un monorepo con un backend Express 5 + TypeScript y un frontend React 19 + Vite, desplegado como un único proyecto en Vercel.

El backend expone una API REST sobre PostgreSQL con **autenticación JWT** (login, recuperación y cambio de contraseña). Todas las rutas de recursos están protegidas y con ownership por usuario; el frontend consume la API con el token guardado en `localStorage`.

Documentación específica:

- [Arquitectura](docs/arquitectura.md)
- [API](docs/api.md)
- [Decisiones de diseño](docs/decisiones-diseño.md)
- [Calidad y pruebas](docs/calidad.md)
- [Frontend](apps/frontend/README.md)
- [Diagrama E-R](docs/Diagrama%20E-R.png)

## Autores

- Tomas Mertian
- Ian Manfredi
- Santiago De Dios

## Stack

| Capa | Tecnología |
| --- | --- |
| Runtime | Node.js 24+ |
| Gestor de paquetes | pnpm 12.18.0 (vía corepack) |
| Backend | Express 5 + TypeScript (ESM) |
| Base de datos | PostgreSQL + Sequelize 6 |
| Cálculos monetarios | decimal.js |
| Frontend | React 19 + Vite 8 + TypeScript |
| Ruteo del frontend | react-router-dom 7 |
| Pruebas | Vitest 5 |
| Deploy | Vercel (services + rewrites) |

## Estructura del monorepo

```
.
├── API/
│   └── [...path].ts          # entrada serverless de Vercel
├── apps/
│   ├── backend/              # API REST
│   │   ├── src/
│   │   │   ├── app.ts        # Express y montaje de rutas
│   │   │   ├── index.ts      # arranque del servidor
│   │   │   ├── config/
│   │   │   │   └── database.ts
│   │   │   ├── modules/
│   │   │   │   ├── models/       # entidades de Sequelize
│   │   │   │   ├── controllers/  # request y response
│   │   │   │   ├── services/     # lógica de negocio
│   │   │   │   └── routes/       # endpoints
│   │   │   └── utils/
│   │   │       └── pagination.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── db/                   # scripts SQL
│   │   ├── schema.sql        # crea las tablas
│   │   └── seeds.sql         # datos de prueba
│   └── frontend/             # SPA React
│       ├── README.md         # guía del paquete
│       ├── public/           # imágenes y favicon
│       └── src/
│           ├── App.tsx       # rutas de la SPA
│           ├── context/      # AuthProvider y useAuth
│           ├── pages/        # Inicio, Mi dinero, etc.
│           ├── components/   # GraficoTorta
│           ├── services/     # cliente HTTP y auth
│           ├── types/
│           ├── utils/
│           └── data/
├── docs/                     # arquitectura, API y decisiones
├── .github/workflows/ci.yml  # lint + typecheck + tests
├── package.json              # scripts del monorepo
├── pnpm-workspace.yaml
├── vercel.json
└── .env.example
```

## Puesta en marcha

### Requisitos

- Node.js 24 o superior (`node -v`).
- pnpm 12.18.0; se habilita con `corepack enable`.
- Una base PostgreSQL. El proyecto está pensado para Supabase y la conexión exige SSL.

Si usás Supabase no hace falta instalar PostgreSQL en tu máquina.

### 1. Clonar e instalar

```bash
git clone https://github.com/tomisanti05/Pesito.git
cd Pesito
corepack enable
pnpm install
```

### 2. Configurar el entorno

```bash
cp .env.example .env
```

Completá `.env` con el host, el puerto, el nombre de la base, el usuario y la contraseña. El archivo va en la raíz del repositorio; el backend lo carga desde ahí.

### 3. Crear la base

En Supabase, creá un proyecto o usá uno existente y abrí el SQL Editor. Ejecutá `apps/db/schema.sql`. Si querés datos de ejemplo, ejecutá también `apps/db/seeds.sql`. Si usás `psql`, podés correr los mismos archivos con los datos de conexión que pusiste en `.env`.

`seeds.sql` crea el usuario `santiago@test.com` (contraseña `Demo1234`), tres billeteras, una tarjeta, tres suscripciones, tres boletas y cinco movimientos. Si la base ya existía antes de incorporar el login, ejecutá también `apps/db/migrations/001_auth.sql`; el `schema.sql` actual ya incluye las tablas de autenticación.

### 4. Levantar la aplicación

```bash
pnpm dev
```

Esto inicia el backend en `http://localhost:3000` y el frontend en `http://localhost:5173` (el puerto por defecto de Vite). Abrí `http://localhost:5173` en el navegador para usar la app. Para comprobar que el backend responde, abrí `http://localhost:3000`: tiene que devolver `servidor corriendo`.

El frontend proxya `/api` a `http://localhost:3000`. Si cambiás `PORT`, actualizá también el proxy en `vite.config.ts`.

Para verificar que todo compila y pasa las pruebas:

```bash
pnpm check
```

## Variables de entorno

El backend carga el `.env` de la raíz del repositorio. La conexión usa SSL y un pool de 3 conexiones.

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `PORT` | Puerto HTTP del backend | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `DB_HOST` | Host de PostgreSQL | `aws-0-<region>.pooler.supabase.com` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base | `postgres` |
| `DB_USER` | Usuario de PostgreSQL | `postgres.<project-ref>` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `tu-password-de-supabase` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | *(aleatorio)* |
| `JWT_EXPIRES_IN` | Vigencia del token JWT | `7d` |
| `PASSWORD_SALT_ROUNDS` | Rondas de bcrypt para hashear contraseñas | `10` |
| `RESET_TOKEN_TTL_MIN` | Vigencia del enlace de recuperación (min) | `30` |
| `FRONTEND_URL` | URL del frontend (para enlaces de reset) | `http://localhost:5173` |

## Scripts

Desde la raíz:

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Levanta backend y frontend en paralelo |
| `pnpm build` | Compila ambos paquetes |
| `pnpm lint` | ESLint en los paquetes |
| `pnpm typecheck` | Chequeo de tipos |
| `pnpm test` | Vitest en backend y frontend |
| `pnpm check` | `lint` + `typecheck` + `test` |
| `pnpm deploy` | Despliega en Vercel (`vercel`) |

Cada aplicación tiene `dev`, `build`, `lint`, `typecheck` y `test`. El backend agrega `start` y el frontend `preview`.
