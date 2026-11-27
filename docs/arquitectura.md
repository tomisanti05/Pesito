# Arquitectura

Este documento describe cómo está armado el sistema, qué hace cada capa y por dónde pasa una petición.

## 1. Vista general

El proyecto es un monorepo pnpm con dos aplicaciones y una carpeta de scripts de base de datos:

- `apps/backend`: API REST con Express 5, TypeScript en modo ESM y Sequelize 6 sobre PostgreSQL.
- `apps/frontend`: SPA con React 19, Vite 8 y react-router-dom 7.
- `apps/db`: `schema.sql` y `seeds.sql` para crear el esquema y cargar datos de prueba.

En desarrollo se levantan los dos procesos con `pnpm dev`: el backend escucha en `PORT` (3000 por defecto) y Vite proxya `/api` a `http://localhost:3000`. En producción, `vercel.json` despliega ambos como services separados y enruta `/api/*` al backend y el resto al frontend.

El frontend usa `ID_USUARIO = 1` como usuario de demostración para los flujos del MVP.

## 2. Backend

### 2.1 Capas

El flujo es **routes → controllers → services → models**:

| Capa | Responsabilidad | Ejemplo |
| --- | --- | --- |
| `routes` | Declaran método y path; delegan en el controller | `billeteraRoutes.ts` |
| `controllers` | Leen `req`, arman filtros de query y traducen errores a HTTP | `billeteraController.ts` |
| `services` | Reglas de negocio, validaciones de dominio, acceso a modelos | `billeteraService.ts` |
| `models` | Entidades de Sequelize, mapeo a tablas y asociaciones | `models/billetera.ts` |

Los controllers no arman SQL ni abren transacciones. Los services no conocen `req` ni `res`.

### 2.2 Arranque y conexión

`apps/backend/src/index.ts`:

1. Importa `app` y `connectDatabase`.
2. Ejecuta `await connectDatabase()` en el nivel superior.
3. Llama a `app.listen(PORT)` y loguea `Servidor escuchando en el puerto ${PORT}`.

`apps/backend/src/config/database.ts` crea una única instancia de Sequelize por proceso:

- Carga el `.env` de la raíz del repo con `dotenv.config({ path: path.resolve(import.meta.dirname, "../../../../.env") })`.
- Configura `dialect: "postgres"`, `logging: false`, `define: { underscored: true }`.
- Pool: `max: 3`, `min: 0`, `idle: 10000`.
- SSL: `{ require: true, rejectUnauthorized: false }`.
- Exporta `connectDatabase()`, que cachea la promesa de `sequelize.authenticate()` y la limpia si falla.

`app.ts` monta el middleware `conectarBase` en cada router. Ese middleware vuelve a llamar a `connectDatabase()` antes de entrar a la ruta. En un proceso largo la promesa ya está resuelta; en serverless, donde `index.ts` no se ejecuta, es lo que garantiza la conexión. El esquema se administra con `apps/db/schema.sql`.

### 2.3 Montaje de rutas

| Montaje | Router | Observación |
| --- | --- | --- |
| `GET /` | inline | Responde el texto `servidor corriendo` |
| `/api/users` | `userRoutes` | CRUD completo |
| `/api/transactions` | `transactionRoutes` | CRUD completo |
| `/api/v1/billeteras` | `billeteraRoutes` | Prefijo versionado |
| `/api/billetera` | `billeteraRoutes` | Alias sin versión, mismo router |
| `/api/v1/suscripciones` | `suscripcionRoutes` | Prefijo versionado |
| `/api/suscripciones` | `suscripcionRoutes` | Alias sin versión, mismo router |
| `/api/v1/boletas` | `boletaRoutes` | Solo prefijo versionado |
| `/api/v1/tarjetas` | `tarjetaRoutes` | Solo prefijo versionado |

Los routers tienen CRUD completo: `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `PATCH /:id` y `DELETE /:id`. En todos los módulos `PUT` y `PATCH` apuntan al mismo handler.

### 2.4 Errores

Cada módulo traduce sus errores a HTTP. El formato de respuesta es:

| Módulos | Clave |
| --- | --- |
| Usuarios, billeteras, boletas, suscripciones y tarjetas | `{ mensaje }` |
| Transacciones | `{ error }` |

En general, los errores de validación responden 400, los recursos inexistentes 404 y los conflictos 409. El middleware final de `app.ts` responde `500 { mensaje: "Error interno del servidor." }` si un error no fue capturado.

### 2.5 Paginación

`apps/backend/src/utils/pagination.ts` centraliza el paginado de usuarios, billeteras, suscripciones y tarjetas:

- `page` y `limit` se parsean como enteros positivos; si no son válidos, vuelven a 1 y 10.
- `limit` se recorta a 100.
- `offset = (page - 1) * limit`.
- `sortBy` solo se acepta si está en la lista blanca `CAMPOS_ORDEN_*` del módulo.
- `order` acepta `asc` o `desc`.
- `search` se recorta y queda en `null` si está vacío.

La respuesta es `{ data, total, page, limit }`. `data` son las filas de la página y `total` es el `count` de `findAndCountAll`. Transacciones y boletas devuelven el listado completo.

## 3. Modelo de datos

### 3.1 Tablas

| Tabla | Clave primaria | Campos | Restricciones relevantes |
| --- | --- | --- | --- |
| `Usuarios` | `id` | `nombre`, `email`, `telefono`, `rol`, `activo`, timestamps | `email` único; `rol` en `usuario`/`admin` |
| `Billetera` | `id` | `idUsuario`, `nombre`, `saldo`, `tipo`, timestamps | `saldo >= 0` |
| `Transaccion` | `id` | `idBilletera`, `monto`, `tipo`, `categoria`, `fecha`, `descripcion`, timestamps | `monto > 0`; `tipo` en `ingreso`/`egreso` |
| `Tarjeta` | `id` | `idUsuario`, `tipo`, `ultimosCuatro`, `titular`, `vencimiento`, `activa`, timestamps | `tipo` entre 4 valores; `ultimosCuatro` de 4 dígitos; `vencimiento` `MM/YY` |
| `Suscripcion` | `id` | `idUsuario`, `idTarjeta`, `proveedor`, `plan`, `monto`, `diaCobro`, `activa`, timestamps | `monto > 0`; `diaCobro` entre 1 y 31 |
| `Boleta` | `id` | `idUsuario`, `tipoServicio`, `monto`, `fechaVencimiento`, `pagada`, `fechaPago`, timestamps | `tipoServicio` entre 5 valores; `monto > 0`; si `pagada = true`, `fechaPago` no puede ser null |

Los modelos usan camelCase para las columnas (`idUsuario`, `idBilletera`, `fechaVencimiento`, `diaCobro`) y `underscored: true` para los timestamps (`created_at`, `updated_at`). Las claves primarias se llaman `id` en `User`, `Tarjeta` y `Suscripcion`; `idBilletera`, `idTransaccion` y `idBoleta` en los demás, mapeadas a la columna `id`.

### 3.2 Relaciones

- `Usuarios` 1—N `Billetera` por `idUsuario`, `ON DELETE CASCADE`.
- `Billetera` 1—N `Transaccion` por `idBilletera`, `ON DELETE CASCADE`.
- `Usuarios` 1—N `Tarjeta` por `idUsuario`, `ON DELETE CASCADE`.
- `Usuarios` 1—N `Suscripcion` por `idUsuario`, `ON DELETE CASCADE`.
- `Tarjeta` 1—N `Suscripcion` por `idTarjeta`, `ON DELETE SET NULL`.
- `Usuarios` 1—N `Boleta` por `idUsuario`, `ON DELETE CASCADE`.

En Sequelize están declaradas las asociaciones de `Transaction` con `Billetera` y de `Tarjeta`, `Suscripcion` y `Boleta` con `User`.

## 4. Flujos

### 4.1 Registrar una transacción

1. `POST /api/transactions` entra a `crearTransaccion`.
2. El controller llama a `registerTransaction(req.body)`.
3. `registerTransaction` valida `idBilletera`, `monto`, `tipo`, `fecha`, `categoria` y `descripcion`.
4. Abre `sequelize.transaction(async t => ...)`.
5. Llama a `billeteraService.aplicarMovimiento(idBilletera, tipo, monto, t)`.
6. `aplicarMovimiento` hace `findByPk` con `{ transaction: t, lock: t.LOCK.UPDATE }`, calcula el nuevo saldo con `calcularNuevoSaldo` y guarda con `save({ transaction: t })`.
7. Con el saldo actualizado, `Transaction.create(..., { transaction: t })` inserta la fila.
8. Si todo sale bien, commit. Si algo falla, rollback completo.

`calcularNuevoSaldo` delega en `ingresoStrategy` o `egresoStrategy` según el tipo. Un egreso mayor al saldo lanza `{ status: 409, message: "fondos insuficientes" }`.

### 4.2 Editar y eliminar una transacción

`editTransaction` no permite cambiar `idBilletera`. Abre una transacción, bloquea la fila de `Transaccion`, combina los datos nuevos con los actuales, valida y calcula:

```
diferencia = efectoFirmado(nuevo tipo, nuevo monto) - efectoFirmado(tipo actual, monto actual)
```

Si la diferencia es positiva, aplica un ingreso por la diferencia; si es negativa, aplica un egreso por el valor absoluto. Después actualiza la fila. Todo bajo la misma `t`.

`deleteTransaction` bloquea la fila, aplica el movimiento inverso por el monto original y destruye el registro. Si el inverso no tiene fondos suficientes, responde 409 y no borra nada.

### 4.3 Billeteras

- `CrearBilletera` exige `idUsuario`, `nombre` y `tipo`, verifica que el usuario exista y esté activo, y crea con `saldo: "0.00"`.
- `editarBilletera` permite modificar `nombre` y `tipo`; rechaza `saldo` e `idUsuario`.
- `eliminarBilletera` borra físicamente. Las transacciones asociadas se van por `ON DELETE CASCADE`.
- `listarBilleteras` busca por `nombre` y `tipo` con `iLike`, pagina y ordena con la lista blanca.

### 4.4 Suscripciones

- `crearSuscripcion` valida `idUsuario`, `proveedor`, `plan`, `monto`, `diaCobro` y `activa`.
- Verifica que el usuario exista y esté activo.
- Si viene `idTarjeta`, comprueba que exista, esté activa y pertenezca al usuario.
- `editarSuscripcion` no permite cambiar `idUsuario`; permite `idTarjeta: null` para desasociar la tarjeta.
- `eliminarSuscripcion` borra físicamente.

### 4.5 Boletas

- `listarBoletas` devuelve las boletas ordenadas por `fechaVencimiento ASC`.
- `crearBoleta` valida `monto > 0` y `fechaVencimiento`; si no viene `idUsuario`, usa el usuario de demostración. `tipoServicio` se valida contra el `CHECK` de la tabla.
- `editarBoleta` actualiza los campos enviados.
- `eliminarBoleta` borra físicamente y devuelve `{ mensaje: "Boleta eliminada" }`.

## 5. Frontend

### 5.1 Router y layout

`main.tsx` monta `BrowserRouter` y `App.tsx` define las rutas. `Layout` es el sidebar fijo:

- Links a Inicio, Mi dinero, Transacciones, Facturación, Tarjetas, Subscripciones y Mi cuenta.
- Estado colapsado persistido en `localStorage` con la clave `sidebar-abierta`.
- En mobile se superpone un overlay y se cierra con Escape.
- Pide `/api/users/1` para mostrar nombre e iniciales.

### 5.2 Cliente HTTP

`src/services/api.ts`:

- `API_V1 = "/api/v1"`.
- `ID_USUARIO = 1`.
- `construirUrl(path)`: si el path empieza con `/api/`, lo deja igual; si no, le antepone `/api/v1`.
- `request<T>` manda `Content-Type: application/json`, parsea la respuesta solo si el content-type es JSON y, si `!ok`, arma un `ApiError`.
- Expone `apiGet`, `apiPost`, `apiPatch` y `apiDelete`.

Cada página pide lo que necesita al montarse y maneja su propio `loading` y `error`.

### 5.3 Páginas

| Página | Archivo | Qué consume | Particularidades |
| --- | --- | --- | --- |
| Inicio | `pages/inicio.tsx` | `/api/users/1`, `/billeteras?limit=100&sortBy=nombre&order=asc`, `/api/transactions` | Calcula saldo total, ingresos, egresos y ahorro del mes; muestra los últimos 5 movimientos |
| Mi dinero | `pages/midinero.tsx` | `/billeteras?limit=100&sortBy=nombre&order=asc`, `/api/transactions` | CRUD de billeteras; gráfico de torta por categoría, cuenta o balance; períodos mes actual, mes anterior y últimos 3 meses |
| Transacciones | `pages/transacciones.tsx` | `/billeteras?limit=100...`, `/api/transactions` | Búsqueda y paginación en el cliente; CRUD de movimientos |
| Facturación | `pages/facturacion.tsx` | `/boletas` | Lista las boletas; crea, marca como pagada y elimina; pestañas Vencimientos/Comprobantes |
| Tarjetas | `pages/tarjetas.tsx` | `/tarjetas?limit=100&sortBy=id&order=desc&idUsuario=1` | Carrusel, CRUD y pausar/reactivar con `PATCH` |
| Subscripciones | `pages/subscripciones.tsx` | `/suscripciones?page&limit=5&sortBy=proveedor&order=asc&idUsuario=1&search=...` y una consulta de activas | Búsqueda con debounce de 300 ms, paginación, total mensual y próximo cobro |
| Mi cuenta | `pages/account.tsx` | `/api/users/1` | Edita `nombre`, `email` y `telefono`; muestra rol, estado y fecha de alta |

### 5.4 Utilidades y componentes

- `utils/formato.ts`: `formatearFecha` (es-AR, día/mes), `formatearMonto` (`$` + `toLocaleString("es-AR")`) y `fechaDeHoy` (`en-CA`, `YYYY-MM-DD`).
- `utils/resumenGastos.ts`: períodos, filtrado por mes, agrupación de egresos por categoría y por billetera, totales y construcción de porciones. Suma en centavos.
- `components/GraficoTorta.tsx`: dona SVG de 120×120, radio 45, grosor 18, leyenda con porcentaje y monto.
- `data/boletas.ts`: metadatos e iconos de los servicios de facturación.

## 6. Pruebas y CI

Las pruebas son unitarias y mockean los modelos:

| Archivo | Qué cubre |
| --- | --- |
| `userServices.test.ts` | Normalización, edición, email duplicado, baja lógica y listado paginado |
| `billeteraService.test.ts` | Ingreso, egreso, saldo exacto, fondos insuficientes, monto inválido, tipo inválido, precisión decimal y lock |
| `tarjetaService.test.ts` | Normalización, `ultimosCuatro` numérico, usuario inactivo, cambio de dueño, borrado y listado |
| `resumenGastos.test.ts` | Períodos, filtros, agrupaciones, totales y porciones del gráfico |

Son 22 tests de backend y 9 de frontend, 31 en total. `pnpm check` (lint + typecheck + test) pasa completo.

`.github/workflows/ci.yml` corre en cada push y pull request: instala con `pnpm install --frozen-lockfile` y ejecuta `pnpm check` con Node 24 y pnpm 12.18.0.

## 7. Despliegue

`vercel.json` define:

- Service `backend`: root `apps/backend`, framework `express`, entrypoint `src/app.ts`, output `.`.
- Service `frontend`: root `apps/frontend`, framework `vite`.
- Rewrite `/api/(.*)` → backend.
- Rewrite `/(.*)` → frontend.

`API/[...path].ts` importa `app` desde `apps/backend/src/app.js` y lo exporta como default. Es el puente entre Vercel y Express.

Las variables de entorno (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`) se configuran en Vercel. El `.env` local no se versiona.

## 8. Documentación relacionada

El detalle de las decisiones y los patrones aplicados está en [decisiones-diseño.md](decisiones-diseño.md).
