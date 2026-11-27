# Sistema de Gestion de Finanzas

Aplicacion web para el control de ingresos, gastos, billeteras y presupuestos.

Monorepo con un backend (API REST) y un frontend (SPA), desplegado como un unico
proyecto en Vercel.

> Estado actual: el backend expone una API REST funcional contra PostgreSQL con
> **autenticacion JWT** (registro, login, recuperacion y cambio de contrasena). Todas
> las rutas de recursos estan protegidas y con ownership por usuario. El frontend
> consume la API real con el token guardado en `localStorage`.

## Autores

- Tomas Mertian
- Ian Manfredi
- Santiago De Dios

## Tecnologias

| Capa          | Tecnologia                                  |
| ------------- | ------------------------------------------- |
| Runtime       | Node.js 24+                                 |
| Gestor        | pnpm 12.3.4 (via corepack)                  |
| Backend       | Express 5 + TypeScript                      |
| Base de datos | PostgreSQL + Sequelize 6 (ORM)              |
| Calculos      | decimal.js (montos monetarios)              |
| Frontend      | React 19 + Vite 8 + TypeScript              |
| Ruteo         | react-router-dom 7                          |
| Deploy        | Vercel (services + rewrites)                |

## Estructura del monorepo

```
sis-ges-fin/
├── API/
│   └── [...path].ts          # Entrypoint serverless de Vercel (reexporta el app)
├── apps/
│   ├── backend/
│   │   └── src/
│   │       ├── app.ts             # Configuracion de Express y montaje de rutas
│   │       ├── index.ts           # Arranque del servidor
│   │       ├── config/
│   │       │   └── database.ts    # Conexion Sequelize
│   │       └── modules/
│   │           ├── models/        # User, Billetera, Transaction
│   │           ├── controllers/   # Manejo de request/response
│   │           ├── services/      # Logica de negocio
│   │           └── routes/        # Definicion de endpoints
│   └── frontend/
│       └── src/
│           ├── App.tsx            # Definicion de rutas
│           ├── pages/             # Vistas (inicio, midinero, facturacion, ...)
│           ├── services/api.ts    # Cliente HTTP (pendiente de implementar)
│           ├── data/  types/  utils/
│           └── main.tsx
├── pnpm-workspace.yaml
├── vercel.json
└── .env.example
```

## Requisitos previos

- Node.js 24 o superior
- pnpm (se habilita con corepack)
- Una instancia de PostgreSQL en ejecucion

## Clonar e instalar

```bash
# 1. Clonar el repositorio
git clone https://github.com/tomisanti05/Pesito.git
cd Pesito

# 2. Habilitar pnpm via corepack
corepack enable

# 3. Instalar todas las dependencias del workspace
pnpm install

# 4. Crear el archivo de entorno a partir del ejemplo
cp .env.example .env
```

Luego edita `.env` con los datos reales de tu base de datos.

## Variables de entorno

El backend carga el `.env` ubicado en la **raiz** del repositorio
(`apps/backend/src/config/database.ts` resuelve la ruta hacia `../../../.env`).

| Variable      | Descripcion                          | Ejemplo        |
| ------------- | ------------------------------------ | -------------- |
| `PORT`        | Puerto HTTP del backend             | `3000`         |
| `NODE_ENV`    | Entorno de ejecucion                 | `development`  |
| `DB_HOST`     | Host de PostgreSQL                   | `localhost`    |
| `DB_PORT`     | Puerto de PostgreSQL                 | `5432`         |
| `DB_NAME`     | Nombre de la base de datos           | `finanzas_db`  |
| `DB_USER`     | Usuario de PostgreSQL                | `postgres`     |
| `DB_PASSWORD` | Contrasena de PostgreSQL             | *(vacio)*      |
| `JWT_SECRET`  | Secreto para firmar tokens JWT       | *(aleatorio)*  |
| `JWT_EXPIRES_IN` | Vigencia del token JWT            | `7d`           |
| `RESET_TOKEN_TTL_MIN` | Vigencia del enlace de recuperacion (min) | `30` |
| `FRONTEND_URL` | URL del frontend (para enlaces de reset) | `http://localhost:5173` |

> La conexion usa SSL con `rejectUnauthorized: false`. Para entornos de produccion
> (por ejemplo un proveedor gestionado) esto es correcto; tenlo en cuenta si
> trabajas con un PostgreSQL local sin SSL.

## Uso y scripts

Scripts de la **raiz** (ejecutan en todo el workspace):

| Comando        | Descripcion                                            |
| -------------- | ------------------------------------------------------ |
| `pnpm dev`     | Levanta backend y frontend en paralelo                 |
| `pnpm build`   | Compila ambos paquetes                                 |
| `pnpm deploy`  | Despliega en Vercel (`vercel`)                         |

Scripts del **backend** (`apps/backend`):

| Comando        | Descripcion                                  |
| -------------- | -------------------------------------------- |
| `pnpm dev`     | Desarrollo con recarga (`tsx watch`)         |
| `pnpm build`   | Compila TypeScript a `dist/`                 |
| `pnpm start`   | Ejecuta el build (`node dist/index.js`)      |

Scripts del **frontend** (`apps/frontend`):

| Comando          | Descripcion                            |
| ---------------- | -------------------------------------- |
| `pnpm dev`       | Servidor de desarrollo de Vite         |
| `pnpm build`     | Type-check + build de produccion       |
| `pnpm lint`      | Analisis estatico con ESLint           |
| `pnpm preview`   | Previsualiza el build de produccion    |

## API REST

Todas las rutas se montan bajo `/api` y comparten conexion a la base de datos.
El formato de error es `{ "mensaje": "..." }` (usuarios) o `{ "error": "..." }`
(billeteras y transacciones).

### Autenticacion (`/api/auth`)

| Metodo | Ruta                        | Descripcion                                        |
| ------ | --------------------------- | -------------------------------------------------- |
| POST   | `/api/auth/register`        | Registrar usuario (devuelve token + usuario)       |
| POST   | `/api/auth/login`           | Iniciar sesion (devuelve token + usuario)          |
| POST   | `/api/auth/forgot-password` | Enviar enlace de recuperacion                      |
| POST   | `/api/auth/reset-password`  | Restablecer contrasena con el token del enlace     |
| GET    | `/api/auth/me`              | Perfil del usuario autenticado **[auth]**          |
| POST   | `/api/auth/change-password` | Cambiar contrasena (con la actual) **[auth]**     |

- Las contrasenas se hashean con **bcryptjs** (nunca se guardan en claro).
- El token JWT se envia como `Authorization: Bearer <token>`.
- El token de recuperacion se guarda en la base como **hash SHA-256**; el crudo
  viaja solo en el enlace `/reset-password?token=...`. En desarrollo el backend
  ademas devuelve/imprime el enlace en la respuesta del `forgot-password`.
- Los recursos del usuario demo (`santiago@test.com`) tienen la contrasena `Demo1234`.

**Proteccion de rutas**: todos los endpoints de recursos (`/api/users`,
`/api/transactions`, `/api/v1/billeteras`, `/api/v1/suscripciones`,
`/api/v1/boletas`, `/api/v1/tarjetas`) exigen token. Un usuario normal solo ve y
modifica **sus propios** registros; el rol `admin` puede administrar todo.
Listar y crear usuarios queda restringido a admins (el registro publico vive en
`/api/auth/register`).

Ejemplo de login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "santiago@test.com", "password": "Demo1234"}'
```

### Usuarios (`/api/users`) **[admin]**

| Metodo | Ruta            | Descripcion                                      |
| ------ | --------------- | ------------------------------------------------ |
| POST   | `/api/users`    | Crear usuario                                    |
| GET    | `/api/users`    | Listar usuarios paginados                        |
| GET    | `/api/users/:id`| Obtener usuario por ID                           |
| PUT    | `/api/users/:id`| Editar usuario                                   |
| PATCH  | `/api/users/:id`| Editar usuario parcialmente                      |
| DELETE | `/api/users/:id`| Dar de baja logica (`activo = false`)            |

El listado acepta `page`, `limit`, `search`, `rol`, `activo`, `sortBy` y `order`.
Devuelve `{ "data": [], "total": 0, "page": 1, "limit": 10 }`.

Ejemplo de creacion:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Ana Perez", "email": "ana@example.com", "telefono": "11 5555 1234"}'
```

Reglas de validacion: `nombre` y `email` obligatorios; `nombre` solo letras y espacios
(max 100); `email` con formato valido (max 150) y unico (409 si ya existe); `telefono`
opcional (max 30). En la edicion se pueden cambiar `nombre`, `email`, `telefono`, `rol`
y `activo`; un body vacio devuelve 400.

### Billeteras (`/api/billetera`)

| Metodo | Ruta                 | Descripcion                                  |
| ------ | -------------------- | -------------------------------------------- |
| POST   | `/api/billetera`     | Crear billetera (saldo inicial `0.00`)       |
| GET    | `/api/billetera/:id` | Obtener detalle y saldo actual               |
| PUT    | `/api/billetera/:id` | Editar solo `nombre` y `tipo`                |

Ejemplo de creacion:

```bash
curl -X POST http://localhost:3000/api/billetera \
  -H "Content-Type: application/json" \
  -d '{"idUsuario": 1, "nombre": "Efectivo", "tipo": "cash"}'
```

El saldo y el propietario no pueden modificarse mediante `PUT`. El usuario debe existir
y estar activo.

### Transacciones (`/api/transactions`)

| Metodo | Ruta                     | Descripcion                                  |
| ------ | ------------------------ | -------------------------------------------- |
| POST   | `/api/transactions`      | Registrar transaccion (actualiza el saldo)   |
| GET    | `/api/transactions`      | Listar (filtro opcional `?idBilletera=`)     |
| GET    | `/api/transactions/:id`  | Obtener transaccion por ID                   |

Ejemplo de registro:

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "idBilletera": 1,
    "monto": "1500.00",
    "tipo": "egreso",
    "categoria": "supermercado",
    "fecha": "2026-01-15",
    "descripcion": "Compra semanal"
  }'
```

Reglas: `monto` positivo con hasta 2 decimales; `tipo` `ingreso` o `egreso`;
`fecha` en formato `YYYY-MM-DD`. Un `egreso` mayor al saldo disponible responde `409`
(fondos insuficientes).

## Modelo de datos

| Modelo        | Tabla          | Campos principales                                                              |
| ------------- | -------------- | ------------------------------------------------------------------------------- |
| `User`        | `users`        | `id`, `nombre`, `email` (unico), `rol` (`usuario`/`admin`), `activo`, timestamps |
| `Billetera`   | `wallets`      | `idBilletera`, `idUsuario`, `nombre`, `saldo` (`DECIMAL(14,2)`), `tipo`         |
| `Transaction` | `Transacciones`| `idTransaccion`, `idBilletera`, `monto`, `tipo`, `categoria`, `fecha`, `descripcion` |

Relaciones: una `Billetera` pertenece a un `User` (`idUsuario`) y tiene muchas
`Transaction` (`idBilletera`).

### Arquitectura del backend

El flujo de una peticion es **routes → controllers → services → models**:

- **routes**: definen los endpoints y delegan en el controller.
- **controllers**: extraen datos del request y traducen errores a respuestas HTTP.
- **services**: contienen la logica de negocio y las validaciones.
- **models**: definen las entidades de Sequelize.

Detalles relevantes:

- Los saldos se calculan con `decimal.js` mediante el **patron Strategy**
  (`ingresoStrategy` / `egresoStrategy`) en `apps/backend/src/modules/services/billeteraService.ts`.
- Registrar una transaccion es **atomico**: `registerTransaction` abre una transaccion de
  Sequelize, aplica el movimiento al saldo y crea el registro, todo con **bloqueo pesimista**
  (`LOCK.UPDATE`) para evitar condiciones de carrera en egresos simultaneos.
- `saldo` y `monto` se manejan como `string` en la capa de aplicacion para no perder
  precision en operaciones con decimales.

## Frontend

SPA con React Router. Rutas definidas en `apps/frontend/src/App.tsx`:

| Ruta                | Pagina          | Acceso            |
| ------------------- | --------------- | ----------------- |
| `/`                 | redirige a `/inicio` | -             |
| `/login`            | Login           | publico          |
| `/register`         | Registro        | publico          |
| `/forgot-password`  | Recuperar contrasena | publico     |
| `/reset-password`   | Nueva contrasena | publico          |
| `/inicio`           | Inicio          | requiere sesion  |
| `/midinero`         | Mi dinero       | requiere sesion  |
| `/transacciones`    | Transacciones   | requiere sesion  |
| `/facturacion`      | Facturacion     | requiere sesion  |
| `/tarjetas`         | Tarjetas        | requiere sesion  |
| `/subscripciones`   | Subscripciones  | requiere sesion  |
| `/miCuenta`         | Mi cuenta       | requiere sesion  |
| `*`                 | 404             | -                 |

El token JWT se guarda en `localStorage` y el cliente HTTP
(`apps/frontend/src/services/api.ts`) lo agrega automaticamente como header
`Authorization: Bearer <token>`. Si la API responde 401, el token se descarta.
`AuthProvider` (`apps/frontend/src/context/AuthContext.tsx`) expone el usuario
autenticado via `useAuth()`, y las rutas privadas estan envueltas en
`RutaProtegida` (redirige a `/login` si no hay sesion). En "Mi cuenta" se puede
cambiar la contrasena iniciando sesion con la actual.

## Migraciones

El esquema base vive en `apps/db/schema.sql` y los datos demo en `apps/db/seeds.sql`.
Las migraciones incrementales estan en `apps/db/migrations/` y se aplican a mano en el
SQL Editor (por ejemplo, Supabase):

- `001_auth.sql`: agrega `password_hash` a `Usuarios` y crea la tabla
  `PasswordResetToken`. **Requerida para usar el login.**

## Deploy en Vercel

`vercel.json` define dos **services** que se despliegan juntos desde el mismo proyecto:

- `backend` (root `apps/backend`, framework `express`)
- `frontend` (root `apps/frontend`, framework `vite`)

Y enruta las peticiones con `rewrites`:

- `/api/(.*)` → service `backend`
- `/(.*)` → service `frontend`

El entrypoint `API/[...path].ts` reexporta el app de Express para que Vercel lo ejecute
como funcion serverless.

```bash
pnpm deploy
```

## Pendientes / Roadmap

- [x] Conectar el frontend a la API real (`services/api.ts`).
- [x] Autenticacion y autorizacion (JWT + rol `admin` con uso real).
- [ ] Unificar los nombres de tabla: `Transaction` referencia `Billeteras` mientras que
      `Billetera` define la tabla `wallets`.
- [ ] Enviar el email de recuperacion por un servicio real (hoy solo se registra el
      enlace en desarrollo).
- [ ] Tests automatizados del frontend (el backend ya tiene Vitest configurado).
- [ ] Revisar `.gitignore`: `.env*` tambien ignora `.env.example`.


