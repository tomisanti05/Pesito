# Frontend — Pesito

SPA del Sistema de Gestión de Finanzas. Está hecha con React 19, TypeScript y Vite 8, usa `react-router-dom` para la navegación y `lucide-react` para los iconos. Consume la API del backend.

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
├── App.tsx              # rutas
├── main.tsx             # BrowserRouter
├── pages/               # una página por sección
├── components/          # GraficoTorta
├── services/api.ts      # cliente HTTP
├── types/               # tipos de la API
├── utils/               # formato y resumen de gastos
├── data/                # metadatos de boletas
└── *.css
```

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` | Redirige a `/inicio` |
| `/inicio` | Resumen |
| `/midinero` | Billeteras y gráfico |
| `/transacciones` | Movimientos |
| `/facturacion` | Boletas |
| `/tarjetas` | Tarjetas |
| `/subscripciones` | Suscripciones |
| `/miCuenta` | Datos del usuario |
| `*` | 404 |

## Cliente HTTP

`src/services/api.ts` expone `apiGet`, `apiPost`, `apiPatch` y `apiDelete`. `construirUrl` deja igual los paths que empiezan con `/api/` y le antepone `/api/v1` al resto. El usuario de demostración está fijo en `ID_USUARIO = 1`.

## Pruebas

`pnpm --filter frontend test` corre los tests de `src/utils/resumenGastos.test.ts` (9 tests). El comando completo del monorepo es `pnpm check` (lint + typecheck + test).

## Build y deploy

`pnpm --filter frontend build` genera `dist/`. En Vercel, el service `frontend` usa este paquete y Vite; las rutas `/api/*` se redirigen al backend. La configuración está en `vercel.json`, en la raíz.

## Documentación

- [README principal](../../README.md)
- [Arquitectura](../../docs/arquitectura.md)
- [API](../../docs/api.md)
- [Decisiones de diseño](../../docs/decisiones-diseño.md)
