# Pesito — Sistema de Gestión de Finanzas

Aplicación web para controlar ingresos, gastos, billeteras, tarjetas, suscripciones y boletas. Es un monorepo con un backend Express 5 + TypeScript y un frontend React 19 + Vite, desplegado como un único proyecto en Vercel.

El backend expone una API REST sobre PostgreSQL con **autenticación JWT** (registro, login, recuperación y cambio de contraseña). Todas las rutas de recursos están protegidas y con ownership por usuario; el frontend consume la API con el token guardado en `localStorage`.

Documentación específica:

- [Arquitectura](docs/arquitectura.md)
- [API](docs/api.md)
- [Decisiones de diseño](docs/decisiones-diseño.md)

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

## API REST

| Prefijo | Router |
| --- | --- |
| `/api/auth` | `authRoutes` |
| `/api/users` | `userRoutes` |
| `/api/transactions` | `transactionRoutes` |
| `/api/v1/billeteras` y `/api/billetera` | `billeteraRoutes` |
| `/api/v1/suscripciones` y `/api/suscripciones` | `suscripcionRoutes` |
| `/api/v1/boletas` | `boletaRoutes` |
| `/api/v1/tarjetas` | `tarjetaRoutes` |

Los módulos de usuarios, billeteras, boletas, suscripciones y tarjetas responden `{ mensaje }`; transacciones usa `{ error }`. El detalle de cada endpoint está en [docs/api.md](docs/api.md).

### Autenticación (`/api/auth`)

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/register` | Registrar usuario (devuelve token + usuario) |
| POST | `/api/auth/login` | Iniciar sesión (devuelve token + usuario) |
| POST | `/api/auth/forgot-password` | Enviar enlace de recuperación |
| POST | `/api/auth/reset-password` | Restablecer contraseña con el token del enlace |
| GET | `/api/auth/me` | Perfil del usuario autenticado **[auth]** |
| POST | `/api/auth/change-password` | Cambiar contraseña (con la actual) **[auth]** |

- Las contraseñas se hashean con **bcryptjs** (nunca se guardan en claro).
- El token JWT se envía como `Authorization: Bearer <token>`.
- El token de recuperación se guarda en la base como **hash SHA-256**; el crudo viaja solo en el enlace `/reset-password?token=...`. En desarrollo el backend además devuelve/imprime el enlace en la respuesta del `forgot-password`.
- El usuario demo (`santiago@test.com`) tiene la contraseña `Demo1234`.

**Protección de rutas**: todos los endpoints de recursos (`/api/users`, `/api/transactions`, `/api/v1/billeteras`, `/api/v1/suscripciones`, `/api/v1/boletas`, `/api/v1/tarjetas`) exigen token. Un usuario normal solo ve y modifica **sus propios** registros; el rol `admin` puede administrar todo. Listar y crear usuarios queda restringido a admins (el registro público vive en `/api/auth/register`).

Ejemplo de login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "santiago@test.com", "password": "Demo1234"}'
```

Reglas generales:

- En las respuestas, los montos vuelven como string (`DECIMAL(14,2)`); en los requests se aceptan números o strings.
- Las fechas viajan como `YYYY-MM-DD`.
- Los listados paginados devuelven `{ data, total, page, limit }` y aceptan `page`, `limit` (máximo 100), `search`, `sortBy` y `order`.

## Modelo de datos

| Modelo | Tabla | Campos principales |
| --- | --- | --- |
| `User` | `Usuarios` | `id`, `nombre`, `email` (único), `password_hash` (nullable), `telefono`, `rol` (`usuario`/`admin`), `activo`, timestamps |
| `PasswordResetToken` | `PasswordResetToken` | `id`, `idUsuario`, `tokenHash` (único, SHA-256), `expiresAt`, `usedAt`, `created_at` |
| `Billetera` | `Billetera` | `idBilletera` (columna `id`), `idUsuario`, `nombre`, `saldo` (`DECIMAL(14,2)`), `tipo` |
| `Transaction` | `Transaccion` | `idTransaccion` (columna `id`), `idBilletera`, `monto`, `tipo` (`ingreso`/`egreso`), `categoria`, `fecha`, `descripcion` |
| `Tarjeta` | `Tarjeta` | `id`, `idUsuario`, `tipo` (`visa`/`mastercard`/`amex`/`otra`), `ultimosCuatro`, `titular`, `vencimiento` (`MM/YY`), `activa` |
| `Suscripcion` | `Suscripcion` | `idSuscripcion` (columna `id`), `idUsuario`, `idTarjeta`, `proveedor`, `plan`, `monto`, `diaCobro`, `activa` |
| `Boleta` | `Boleta` | `idBoleta` (columna `id`), `idUsuario`, `tipoServicio`, `monto`, `fechaVencimiento`, `pagada`, `fechaPago` |

Relaciones en la base:

- `Billetera.idUsuario` → `Usuarios.id` (`ON DELETE CASCADE`).
- `Transaccion.idBilletera` → `Billetera.id` (`ON DELETE CASCADE`).
- `Tarjeta.idUsuario` → `Usuarios.id` (`ON DELETE CASCADE`).
- `Suscripcion.idUsuario` → `Usuarios.id` (`ON DELETE CASCADE`); `Suscripcion.idTarjeta` → `Tarjeta.id` (`ON DELETE SET NULL`).
- `Boleta.idUsuario` → `Usuarios.id` (`ON DELETE CASCADE`).
- `PasswordResetToken.idUsuario` → `Usuarios.id` (`ON DELETE CASCADE`). Cada token es de un solo uso y vence según `RESET_TOKEN_TTL_MIN`.

El diagrama E-R del esquema está en [docs/Diagrama E-R.png](docs/Diagrama%20E-R.png).

Los modelos usan camelCase para las columnas y `underscored: true` para los timestamps (`created_at`, `updated_at`).

## Arquitectura del backend

El flujo de una petición es **routes → controllers → services → models**:

- **routes**: definen los endpoints y delegan en el controller.
- **controllers**: extraen datos del request y traducen errores a respuestas HTTP.
- **services**: contienen la lógica de negocio y las validaciones.
- **models**: definen las entidades de Sequelize.

Puntos concretos:

- La conexión es una instancia compartida de Sequelize por proceso. `connectDatabase()` cachea la promesa de `authenticate()` y se invoca desde `index.ts` y desde el middleware `conectarBase`.
- Los saldos se calculan con `decimal.js` mediante el patrón **Strategy** (`ingresoStrategy` / `egresoStrategy`) en `billeteraService.ts`.
- Registrar una transacción es **atómico**: `registerTransaction` abre una transacción de Sequelize, aplica el movimiento con bloqueo pesimista (`LOCK.UPDATE`) y crea el registro con la misma transacción.
- Editar y eliminar siguen el mismo esquema y ajustan el saldo por la diferencia o por el movimiento inverso.

El detalle de capas, flujos y esquema está en [docs/arquitectura.md](docs/arquitectura.md).

## Frontend

SPA con React Router. Rutas definidas en `apps/frontend/src/App.tsx`:

| Ruta | Página | Acceso |
| --- | --- | --- |
| `/` | Redirige a `/inicio` | - |
| `/login` | Login | público |
| `/register` | Registro | público |
| `/forgot-password` | Recuperar contraseña | público |
| `/reset-password` | Nueva contraseña | público |
| `/inicio` | Inicio | requiere sesión |
| `/midinero` | Mi dinero | requiere sesión |
| `/transacciones` | Transacciones | requiere sesión |
| `/facturacion` | Facturación | requiere sesión |
| `/tarjetas` | Tarjetas | requiere sesión |
| `/subscripciones` | Suscripciones | requiere sesión |
| `/miCuenta` | Mi cuenta | requiere sesión |
| `*` | 404 | - |

Todas las páginas consumen la API a través de `apps/frontend/src/services/api.ts`. El cliente centraliza las llamadas y el manejo de errores, agrega automáticamente el header `Authorization: Bearer <token>` con el JWT guardado en `localStorage` y descarta el token si la API responde 401. `AuthProvider` (`apps/frontend/src/context/AuthContext.tsx`) expone el usuario autenticado vía `useAuth()`, y las rutas privadas están envueltas en `RutaProtegida` (redirige a `/login` si no hay sesión). En "Mi cuenta" se puede cambiar la contraseña.

El detalle del paquete (scripts, estructura y cómo levantarlo solo) está en [apps/frontend/README.md](apps/frontend/README.md).

## Migraciones

El esquema base vive en `apps/db/schema.sql` y los datos demo en `apps/db/seeds.sql`. Las migraciones incrementales están en `apps/db/migrations/` y se aplican a mano en el SQL Editor (por ejemplo, Supabase):

- `001_auth.sql`: agrega `password_hash` a `Usuarios` y crea la tabla `PasswordResetToken`. **Requerida para usar el login.**

## Pruebas

Hay pruebas unitarias con Vitest:

- Backend: `userServices.test.ts`, `authService.test.ts`, `billeteraService.test.ts` y `tarjetaService.test.ts` (35 tests).
- Frontend: `resumenGastos.test.ts` (9 tests).

`pnpm check` ejecuta lint, typecheck y tests. El CI de GitHub Actions corre ese comando en cada push y pull request.

## Deploy en Vercel

`vercel.json` define dos services que se despliegan juntos:

- `backend` (root `apps/backend`, framework `express`, entrypoint `src/app.ts`).
- `frontend` (root `apps/frontend`, framework `vite`).

Los rewrites mandan `/api/(.*)` al backend y `/(.*)` al frontend. El entrypoint `API/[...path].ts` reexporta el app de Express para que Vercel lo ejecute como función serverless.

```bash
pnpm deploy
```

Las variables de entorno (`DB_*` y las de autenticación: `JWT_SECRET`, `FRONTEND_URL`, etc.) se configuran en el proyecto de Vercel. El `.env` no se versiona.

## Pendientes / Roadmap

- [x] Conectar el frontend a la API real (`services/api.ts`).
- [x] Autenticación y autorización (JWT + rol `admin` con uso real).
- [ ] Unificar los nombres de tabla: `Transaction` referencia `Billeteras` mientras que `Billetera` define la tabla `wallets`.
- [ ] Enviar el email de recuperación por un servicio real (hoy solo se registra el enlace en desarrollo).
- [ ] Exportar listados en PDF/XLSX y gráfico estadístico en el home (requisitos de la entrega final).
- [ ] Revisar `.gitignore`: `.env*` también ignora `.env.example`.
