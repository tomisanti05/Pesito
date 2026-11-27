# Frontend — Pesito

SPA del Sistema de Gestión de Finanzas. Está hecha con React 19, TypeScript y Vite 8, usa `react-router-dom` para la navegación y `lucide-react` para los iconos. Consume la API del backend con autenticación JWT: las rutas privadas requieren sesión y el token se guarda en `localStorage`.

## Requisitos

- Node.js 24
- pnpm 12.18.0
- Backend corriendo en `http://localhost:3000`

## Instalación y desarrollo

Desde la raíz del monorepo:

```bash
pnpm install
pnpm dev
```

Eso levanta backend y frontend. El frontend queda en `http://localhost:5173`.

Para levantar solo el frontend:

```bash
pnpm --filter frontend dev
```

Las pantallas necesitan el backend en el puerto 3000 porque Vite proxya `/api` ahí (`vite.config.ts`).

La app incluye login, registro y recuperación de contraseña. Para entrar con los datos demo usá `santiago@test.com` y la contraseña `Demo1234` (requiere haber ejecutado `apps/db/seeds.sql`).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm --filter frontend dev` | Servidor de desarrollo |
| `pnpm --filter frontend build` | Typecheck y build de producción en `dist/` |
| `pnpm --filter frontend preview` | Sirve el build de `dist/` |
| `pnpm --filter frontend lint` | ESLint |
| `pnpm --filter frontend typecheck` | TypeScript |
| `pnpm --filter frontend test` | Vitest |

Desde `apps/frontend` podés usar los mismos comandos sin el `--filter`: `pnpm dev`, `pnpm build`, etc.

## Estructura

```text
src/
├── App.tsx              # rutas públicas y privadas
├── main.tsx             # BrowserRouter y AuthProvider
├── context/             # AuthContext y useAuth
├── pages/               # una página por sección
├── components/          # GraficoTorta
├── services/
│   ├── api.ts           # cliente HTTP
│   └── auth.ts          # login, registro y contraseña
├── types/               # tipos de la API
├── utils/               # formato y resumen de gastos
├── data/                # metadatos de boletas
└── *.css
```

## Rutas

| Ruta | Pantalla | Acceso |
| --- | --- | --- |
| `/` | Redirige a `/inicio` | - |
| `/login` | Iniciar sesión | público |
| `/register` | Crear cuenta | público |
| `/forgot-password` | Recuperar contraseña | público |
| `/reset-password` | Nueva contraseña | público |
| `/inicio` | Resumen | requiere sesión |
| `/midinero` | Billeteras y gráfico | requiere sesión |
| `/transacciones` | Movimientos | requiere sesión |
| `/facturacion` | Boletas | requiere sesión |
| `/tarjetas` | Tarjetas | requiere sesión |
| `/subscripciones` | Suscripciones | requiere sesión |
| `/miCuenta` | Datos del usuario | requiere sesión |
| `*` | 404 | - |

Las rutas privadas están envueltas en `RutaProtegida`, que redirige a `/login` cuando no hay sesión. Las públicas quedan fuera del layout de la app.

## Cliente HTTP

`src/services/api.ts` expone `apiGet`, `apiPost`, `apiPatch` y `apiDelete`. `construirUrl` deja igual los paths que empiezan con `/api/` y le antepone `/api/v1` al resto.

El JWT se guarda en `localStorage` bajo la clave `sgf_token`. El cliente agrega `Authorization: Bearer <token>` en cada request y elimina el token si la API responde 401. `AuthProvider` (`src/context/AuthContext.tsx`) mantiene el usuario autenticado, `useAuth()` lo expone y el layout muestra el nombre, las iniciales y el botón de cerrar sesión. El cambio de contraseña se hace desde Mi cuenta y los endpoints de autenticación están agrupados en `src/services/auth.ts`.

## Pruebas

`pnpm --filter frontend test` corre los tests de `src/utils/resumenGastos.test.ts` (9 tests). El comando completo del monorepo es `pnpm check` (lint + typecheck + test).

## Build y deploy

`pnpm --filter frontend build` genera `dist/`. En Vercel, el service `frontend` usa este paquete y Vite; las rutas `/api/*` se redirigen al backend. La configuración está en `vercel.json`, en la raíz.

## Documentación

- [README principal](../../README.md)
- [Arquitectura](../../docs/arquitectura.md)
- [API](../../docs/api.md)
- [Decisiones de diseño](../../docs/decisiones-diseño.md)
