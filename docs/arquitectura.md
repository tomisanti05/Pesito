# Arquitectura

Este documento describe cómo está armado el sistema, qué hace cada capa y por dónde pasa una petición.

## 1. Vista general

El proyecto es un monorepo pnpm con dos aplicaciones y una carpeta de scripts de base de datos:

- `apps/backend`: API REST con Express 5, TypeScript en modo ESM y Sequelize 6 sobre PostgreSQL.
- `apps/frontend`: SPA con React 19, Vite 8 y react-router-dom 7.
- `apps/db`: `schema.sql` y `seeds.sql` para crear el esquema y cargar datos de prueba.

En desarrollo se levantan los dos procesos con `pnpm dev`: el backend escucha en `PORT` (3000 por defecto) y Vite proxya `/api` a `http://localhost:3000`. En producción, `vercel.json` despliega ambos como services separados y enruta `/api/*` al backend y el resto al frontend.

La API está protegida con JWT: el frontend guarda el token en `localStorage` y lo envía como `Authorization: Bearer`; las rutas privadas redirigen a `/login` cuando no hay sesión.

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

`apps/backend/src/config/auth.ts` centraliza la configuración de autenticación: `JWT_SECRET`, `JWT_EXPIRES_IN` (7 días por defecto), `RESET_TOKEN_TTL_MIN` (30 minutos), `FRONTEND_URL` y `PASSWORD_SALT_ROUNDS` (10 por defecto). `validarConfigAuth()` se ejecuta al importar `app.ts` y falla si falta el secreto en producción.

### 2.3 Montaje de rutas

| Montaje | Router | Observación |
| --- | --- | --- |
| `GET /` | inline | Responde el texto `servidor corriendo` |
| `/api/auth` | `authRoutes` | Registro, login y recuperación; `/me` y cambio de contraseña usan `authMiddleware` |
| `/api/users` | `userRoutes` | CRUD completo; listar y crear son solo para `admin` |
| `/api/transactions` | `transactionRoutes` | CRUD completo |
| `/api/v1/billeteras` | `billeteraRoutes` | Prefijo versionado |
| `/api/billetera` | `billeteraRoutes` | Alias sin versión, mismo router |
| `/api/v1/suscripciones` | `suscripcionRoutes` | Prefijo versionado |
| `/api/suscripciones` | `suscripcionRoutes` | Alias sin versión, mismo router |
| `/api/v1/boletas` | `boletaRoutes` | Solo prefijo versionado |
| `/api/v1/tarjetas` | `tarjetaRoutes` | Solo prefijo versionado |

Los routers tienen CRUD completo: `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `PATCH /:id` y `DELETE /:id`. En todos los módulos `PUT` y `PATCH` apuntan al mismo handler.

Todos los routers de recursos aplican `authMiddleware` con `router.use(...)`: sin un JWT válido responden 401. `userRoutes` además usa `requireAdmin` en `POST /` y `GET /`; en el resto de las rutas de usuarios se compara el id pedido con el del token (un `admin` puede acceder a cualquiera). Los controllers de billeteras, transacciones, boletas, suscripciones y tarjetas acotan las consultas al `id` del token salvo que el rol sea `admin`.

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

### 2.6 Autenticación y autorización

`POST /api/auth/register` y `POST /api/auth/login` devuelven `{ token, usuario }`. El token es un JWT firmado con `JWT_SECRET`; el payload guarda el `rol` y el `id` del usuario en `sub`. El middleware `authMiddleware` valida el header `Authorization: Bearer <token>`, deja `req.usuario = { id, rol }` y responde 401 si falta o es inválido. `requireAdmin` responde 403 cuando el rol no es `admin`.

Las contraseñas se hashean con bcryptjs (`PASSWORD_SALT_ROUNDS`, 10 por defecto) y se guardan en `Usuarios.password_hash`. El modelo `User` define un `defaultScope` que excluye `passwordHash`; las consultas que necesitan el hash (login y cambio de contraseña) usan `User.unscoped()`.

La recuperación usa `PasswordResetToken`: se genera un token aleatorio de 32 bytes, se guarda solo su hash SHA-256 y vence a los `RESET_TOKEN_TTL_MIN` minutos. Al usarlo o al generar uno nuevo se marcan como usados los anteriores. En desarrollo, `forgot-password` devuelve `resetUrl` y lo imprime en consola; en producción solo devuelve el mensaje genérico.

La autorización por ownership se resuelve en los controllers: los servicios reciben un `idUsuario` opcional (`undefined` para admin) y agregan ese filtro a las consultas y operaciones.

## 3. Modelo de datos

### 3.1 Tablas

| Tabla | Clave primaria | Campos | Restricciones relevantes |
| --- | --- | --- | --- |
| `Usuarios` | `id` | `nombre`, `email`, `telefono`, `password_hash`, `rol`, `activo`, timestamps | `email` único; `rol` en `usuario`/`admin`; `password_hash` nullable |
| `Billetera` | `id` | `idUsuario`, `nombre`, `saldo`, `tipo`, timestamps | `saldo >= 0` |
| `Transaccion` | `id` | `idBilletera`, `monto`, `tipo`, `categoria`, `fecha`, `descripcion`, timestamps | `monto > 0`; `tipo` en `ingreso`/`egreso` |
| `Tarjeta` | `id` | `idUsuario`, `tipo`, `ultimosCuatro`, `titular`, `vencimiento`, `activa`, timestamps | `tipo` entre 4 valores; `ultimosCuatro` de 4 dígitos; `vencimiento` `MM/YY` |
| `Suscripcion` | `id` | `idUsuario`, `idTarjeta`, `proveedor`, `plan`, `monto`, `diaCobro`, `activa`, timestamps | `monto > 0`; `diaCobro` entre 1 y 31 |
| `Boleta` | `id` | `idUsuario`, `tipoServicio`, `monto`, `fechaVencimiento`, `pagada`, `fechaPago`, timestamps | `tipoServicio` entre 5 valores; `monto > 0`; si `pagada = true`, `fechaPago` no puede ser null |
| `PasswordResetToken` | `id` | `idUsuario`, `tokenHash`, `expiresAt`, `usedAt`, `created_at` | `tokenHash` único; FK a `Usuarios` con `ON DELETE CASCADE`; índices por usuario y vencimiento |

![Diagrama E-R del esquema](Diagrama%20E-R.png)

Los modelos usan camelCase para las columnas (`idUsuario`, `idBilletera`, `fechaVencimiento`, `diaCobro`) y `underscored: true` para los timestamps (`created_at`, `updated_at`). Las claves primarias se llaman `id` en `User`, `Tarjeta` y `Suscripcion`; `idBilletera`, `idTransaccion` y `idBoleta` en los demás, mapeadas a la columna `id`.

`User` define `defaultScope` con `attributes: { exclude: ["passwordHash"] }`; las consultas que necesitan el hash usan `User.unscoped()`.

### 3.2 Relaciones

- `Usuarios` 1—N `Billetera` por `idUsuario`, `ON DELETE CASCADE`.
- `Billetera` 1—N `Transaccion` por `idBilletera`, `ON DELETE CASCADE`.
- `Usuarios` 1—N `Tarjeta` por `idUsuario`, `ON DELETE CASCADE`.
- `Usuarios` 1—N `Suscripcion` por `idUsuario`, `ON DELETE CASCADE`.
- `Tarjeta` 1—N `Suscripcion` por `idTarjeta`, `ON DELETE SET NULL`.
- `Usuarios` 1—N `Boleta` por `idUsuario`, `ON DELETE CASCADE`.
- `Usuarios` 1—N `PasswordResetToken` por `idUsuario`, `ON DELETE CASCADE`.

En Sequelize están declaradas las asociaciones de `Transaction` con `Billetera` y de `Tarjeta`, `Suscripcion` y `Boleta` con `User`.

## 4. Flujos

### 4.1 Registrar una transacción

1. `POST /api/transactions` entra a `crearTransaccion`.
2. El controller resuelve el alcance del usuario (`undefined` para `admin`, el id del token para un usuario común) y llama a `registerTransaction(req.body, idUsuario)`.
3. `registerTransaction` valida `idBilletera`, `monto`, `tipo`, `fecha`, `categoria` y `descripcion`.
4. Si hay alcance de usuario, verifica que la billetera pertenezca al usuario autenticado.
5. Abre `sequelize.transaction(async t => ...)`.
6. Llama a `billeteraService.aplicarMovimiento(idBilletera, tipo, monto, t)`.
7. `aplicarMovimiento` hace `findByPk` con `{ transaction: t, lock: t.LOCK.UPDATE }`, calcula el nuevo saldo con `calcularNuevoSaldo` y guarda con `save({ transaction: t })`.
8. Con el saldo actualizado, `Transaction.create(..., { transaction: t })` inserta la fila.
9. Si todo sale bien, commit. Si algo falla, rollback completo.

`calcularNuevoSaldo` delega en `ingresoStrategy` o `egresoStrategy` según el tipo. Un egreso mayor al saldo lanza `{ status: 409, message: "fondos insuficientes" }`.

### 4.2 Editar y eliminar una transacción

`editTransaction` no permite cambiar `idBilletera`. Abre una transacción, bloquea la fila de `Transaccion`, combina los datos nuevos con los actuales, valida y calcula:

```
diferencia = efectoFirmado(nuevo tipo, nuevo monto) - efectoFirmado(tipo actual, monto actual)
```

Si la diferencia es positiva, aplica un ingreso por la diferencia; si es negativa, aplica un egreso por el valor absoluto. Después actualiza la fila. Todo bajo la misma `t`.

`deleteTransaction` bloquea la fila, aplica el movimiento inverso por el monto original y destruye el registro. Si el inverso no tiene fondos suficientes, responde 409 y no borra nada.

### 4.3 Billeteras

- `CrearBilletera` toma el dueño del token; un `admin` puede enviar `idUsuario` para crearla a nombre de otro usuario. Exige `nombre` y `tipo`, verifica que el usuario exista y esté activo, y crea con `saldo: "0.00"`.
- `editarBilletera` permite modificar `nombre` y `tipo`; rechaza `saldo` e `idUsuario`. Un usuario común solo puede editar sus propias billeteras.
- `eliminarBilletera` borra físicamente y respeta el mismo alcance por usuario. Las transacciones asociadas se van por `ON DELETE CASCADE`.
- `listarBilleteras` busca por `nombre` y `tipo` con `iLike`, pagina y ordena con la lista blanca. Un usuario común solo ve las suyas; un `admin` puede filtrar por `idUsuario`.

### 4.4 Suscripciones

- `crearSuscripcion` toma el dueño del token (un `admin` puede enviar `idUsuario`) y valida `proveedor`, `plan`, `monto`, `diaCobro` y `activa`.
- Verifica que el usuario exista y esté activo.
- Si viene `idTarjeta`, comprueba que exista, esté activa y pertenezca al mismo usuario.
- `editarSuscripcion` no permite cambiar `idUsuario`; permite `idTarjeta: null` para desasociar la tarjeta. Un usuario común solo puede editar las suyas.
- `eliminarSuscripcion` borra físicamente.

### 4.5 Boletas

- `listarBoletas` devuelve las boletas ordenadas por `fechaVencimiento ASC`.
- `crearBoleta` toma siempre el dueño del token y valida `monto > 0`, `fechaVencimiento` y `tipoServicio` contra el `CHECK` de la tabla. Un usuario común solo ve y modifica sus propias boletas.
- `editarBoleta` actualiza los campos enviados.
- `eliminarBoleta` borra físicamente y devuelve `{ mensaje: "Boleta eliminada" }`.

## 5. Frontend

### 5.1 Router y layout

`main.tsx` monta `BrowserRouter` y `App.tsx` define las rutas. `Layout` es el sidebar fijo:

- Links a Inicio, Mi dinero, Transacciones, Facturación, Tarjetas, Subscripciones y Mi cuenta.
- Estado colapsado persistido en `localStorage` con la clave `sidebar-abierta`.
- En mobile se superpone un overlay y se cierra con Escape.
- Muestra el nombre y las iniciales del usuario de `useAuth()` y ofrece cerrar sesión, que borra el token y vuelve a `/login`.

### 5.2 Cliente HTTP y sesión

`src/services/api.ts`:

- `API_V1 = "/api/v1"`.
- `construirUrl(path)`: si el path empieza con `/api/`, lo deja igual; si no, le antepone `/api/v1`.
- `request<T>` agrega `Content-Type: application/json` y `Authorization: Bearer <token>` si hay token guardado, parsea la respuesta solo si el content-type es JSON y, si `!ok`, arma un `ApiError`. Ante un 401 borra el token.
- El token se guarda en `localStorage` bajo la clave `sgf_token` mediante `guardarToken`, `leerToken` y `borrarToken`.
- Expone `apiGet`, `apiPost`, `apiPatch` y `apiDelete`.

`src/services/auth.ts` envuelve los endpoints de `/api/auth` (`login`, `register`, `obtenerPerfil`, `forgotPassword`, `resetPassword`, `changePassword`, `logout`). `AuthProvider` (`context/AuthContext.tsx`) carga el perfil al iniciar, expone `usuario`, `cargando`, `recargar` y `cerrarSesion` por `useAuth()`, y `RutaProtegida` en `App.tsx` redirige a `/login` cuando no hay usuario. Las páginas privadas obtienen el usuario del contexto y ya no envían un id fijo.

Cada página pide lo que necesita al montarse y maneja su propio `loading` y `error`.

### 5.3 Páginas

Las páginas públicas (`login.tsx`, `register.tsx`, `forgot-password.tsx` y `reset-password.tsx`) se renderizan sin `Layout` y no están envueltas en `RutaProtegida`; usan `services/auth.ts`.

| Página | Archivo | Qué consume | Particularidades |
| --- | --- | --- | --- |
| Inicio | `pages/inicio.tsx` | `/billeteras?limit=100&sortBy=nombre&order=asc`, `/api/transactions` | Calcula saldo total, ingresos, egresos y ahorro del mes; muestra los últimos 5 movimientos; el nombre sale de `useAuth()` |
| Mi dinero | `pages/midinero.tsx` | `/billeteras?limit=100&sortBy=nombre&order=asc`, `/api/transactions` | CRUD de billeteras; gráfico de torta por categoría, cuenta o balance; períodos mes actual, mes anterior y últimos 3 meses |
| Transacciones | `pages/transacciones.tsx` | `/billeteras?limit=100...`, `/api/transactions` | Búsqueda y paginación en el cliente; CRUD de movimientos |
| Facturación | `pages/facturacion.tsx` | `/boletas` | Lista las boletas; crea, marca como pagada y elimina; pestañas Vencimientos/Comprobantes |
| Tarjetas | `pages/tarjetas.tsx` | `/tarjetas?limit=100&sortBy=id&order=desc` | Carrusel, CRUD y pausar/reactivar con `PATCH` |
| Subscripciones | `pages/subscripciones.tsx` | `/suscripciones?page&limit=5&sortBy=proveedor&order=asc&search=...` y una consulta de activas | Búsqueda con debounce de 300 ms, paginación, total mensual y próximo cobro |
| Mi cuenta | `pages/account.tsx` | `PATCH /api/users/:id` (id del contexto) | Edita `nombre`, `email` y `telefono`; muestra rol, estado y fecha de alta; permite cambiar la contraseña |

### 5.4 Utilidades y componentes

- `utils/formato.ts`: `formatearFecha` (es-AR, día/mes), `formatearMonto` (`$` + `toLocaleString("es-AR")`) y `fechaDeHoy` (`en-CA`, `YYYY-MM-DD`).
- `utils/resumenGastos.ts`: períodos, filtrado por mes, agrupación de egresos por categoría y por billetera, totales y construcción de porciones. Suma en centavos.
- `components/GraficoTorta.tsx`: dona SVG de 120×120, radio 45, grosor 18, leyenda con porcentaje y monto.
- `data/boletas.ts`: metadatos e iconos de los servicios de facturación.

El detalle del paquete está en [apps/frontend/README.md](../apps/frontend/README.md).

## 6. Pruebas y CI

Las pruebas son unitarias y mockean los modelos:

| Archivo | Qué cubre |
| --- | --- |
| `userServices.test.ts` | Normalización, edición, email duplicado, baja lógica y listado paginado |
| `billeteraService.test.ts` | Ingreso, egreso, saldo exacto, fondos insuficientes, monto inválido, tipo inválido, precisión decimal y lock |
| `tarjetaService.test.ts` | Normalización, `ultimosCuatro` numérico, usuario inactivo, cambio de dueño, borrado y listado |
| `authService.test.ts` | Registro, login, recuperación de contraseña, cambio de contraseña y perfil |
| `resumenGastos.test.ts` | Períodos, filtros, agrupaciones, totales y porciones del gráfico |

Son 35 tests de backend y 9 de frontend, 44 en total. `pnpm check` (lint + typecheck + test) pasa completo.

`.github/workflows/ci.yml` corre en cada push y pull request: instala con `pnpm install --frozen-lockfile` y ejecuta `pnpm check` con Node 24 y pnpm 12.18.0.

## 7. Despliegue

`vercel.json` define:

- Service `backend`: root `apps/backend`, framework `express`, entrypoint `src/app.ts`, output `.`.
- Service `frontend`: root `apps/frontend`, framework `vite`.
- Rewrite `/api/(.*)` → backend.
- Rewrite `/(.*)` → frontend.

`API/[...path].ts` importa `app` desde `apps/backend/src/app.js` y lo exporta como default. Es el puente entre Vercel y Express.

Las variables de entorno (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT` y las de autenticación: `JWT_SECRET`, `JWT_EXPIRES_IN`, `RESET_TOKEN_TTL_MIN`, `FRONTEND_URL` y, opcional, `PASSWORD_SALT_ROUNDS`) se configuran en Vercel. El `.env` local no se versiona.

## 8. Documentación relacionada

El detalle de las decisiones y los patrones aplicados está en [decisiones-diseño.md](decisiones-diseño.md).
