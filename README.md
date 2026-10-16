# Sistema de Gestion de Finanzas

Aplicacion web para el control de ingresos, gastos, billeteras y presupuestos.

Monorepo con un backend (API REST) y un frontend (SPA), desplegado como un unico
proyecto en Vercel.

> Estado actual: el backend expone una API REST funcional contra PostgreSQL (usuarios,
> billeteras y transacciones). El frontend esta implementado como interfaz, pero aun
> consume **datos mock** y no esta conectado a la API (`apps/frontend/src/services/api.ts`
> esta vacio).

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

### Usuarios (`/api/users`)

| Metodo | Ruta            | Descripcion             |
| ------ | --------------- | ----------------------- |
| POST   | `/api/users`    | Crear usuario           |
| GET    | `/api/users`    | Listar usuarios         |
| GET    | `/api/users/:id`| Obtener usuario por ID  |

Ejemplo de creacion:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Ana Perez", "email": "ana@example.com"}'
```

Reglas de validacion: `nombre` y `email` obligatorios; `nombre` solo letras y espacios
(max 100); `email` con formato valido (max 150) y unico (409 si ya existe).

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

| Ruta             | Pagina          |
| ---------------- | --------------- |
| `/`              | redirige a `/inicio` |
| `/inicio`        | Inicio          |
| `/midinero`      | Mi dinero       |
| `/facturacion`   | Facturacion     |
| `/tarjetas`      | Tarjetas        |
| `/subscripciones`| Subscripciones  |
| `/miCuenta`      | Mi cuenta       |
| `*`              | 404             |

Actualmente las paginas usan datos de ejemplo en memoria. La integracion con el backend
debe implementarse en `apps/frontend/src/services/api.ts`.

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

- [ ] Conectar el frontend a la API real (`services/api.ts`).
- [ ] Unificar los nombres de tabla: `Transaction` referencia `Billeteras` mientras que
      `Billetera` define la tabla `wallets`.
- [ ] Agregar migraciones/sincronizacion de esquema (hoy los modelos no llaman a `sync`).
- [ ] Autenticacion y autorizacion (existe el rol `admin` en `User` pero sin uso).
- [ ] Tests automatizados (no hay configuracion de testing en el repo).
- [ ] Revisar `.gitignore`: `.env*` tambien ignora `.env.example`.
