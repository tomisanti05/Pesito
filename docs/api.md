# API

Referencia de los endpoints del backend. Está basada en las rutas, controllers, services y modelos de `apps/backend`.

Cada endpoint se documenta con tres partes:

1. **Operación:** método, ruta y objetivo.
2. **Contrato de entrada:** headers, path params, query params, body y validaciones.
3. **Contrato de salida:** código HTTP, JSON de respuesta y códigos alternativos.

## 1. Convenciones

### 1.1 Base, prefijos y acceso

En desarrollo el backend escucha en `http://localhost:3000` y Vite hace proxy de `/api` hacia ese puerto. En producción, Vercel enruta `/api/*` al service del backend.

| Módulo | Prefijo |
| --- | --- |
| Autenticación | `/api/auth` |
| Usuarios | `/api/users` |
| Transacciones | `/api/transactions` |
| Billeteras | `/api/v1/billeteras` y `/api/billetera` |
| Suscripciones | `/api/v1/suscripciones` y `/api/suscripciones` |
| Boletas | `/api/v1/boletas` |
| Tarjetas | `/api/v1/tarjetas` |

Los alias apuntan al mismo router: `GET /api/billetera` y `GET /api/v1/billeteras` devuelven lo mismo. Lo mismo pasa con suscripciones.

| Tipo de ruta | Acceso |
| --- | --- |
| `POST /api/auth/register`, `login`, `forgot-password` y `reset-password` | Público |
| `GET /api/auth/me` y `POST /api/auth/change-password` | Sesión |
| Rutas de usuarios, billeteras, transacciones, boletas, suscripciones y tarjetas | Sesión |
| `POST /api/users` y `GET /api/users` | Solo `admin` |
| `GET`, `PUT`, `PATCH` y `DELETE` de `/api/users/:id` | El propio usuario o `admin` |

Las rutas de recursos exigen un JWT válido. El usuario autenticado se deduce del token. En los listados que lo admiten, un `admin` puede filtrar por `idUsuario`; un usuario común solo ve sus propios registros.

### 1.2 Formato y headers

- Request y response: `application/json`.
- Montos: las respuestas los devuelven como `string` con dos decimales (`"1500.00"`). En los requests se aceptan números o strings. En PostgreSQL son `DECIMAL(14,2)`.
- Fechas de dominio: `YYYY-MM-DD` (`DATEONLY`).
- Timestamps: ISO 8601 (`createdAt`, `updatedAt`).
- IDs numéricos.

| Header | Cuándo se envía | Valor |
| --- | --- | --- |
| `Content-Type` | Requests con body (`POST`, `PUT`, `PATCH`) | `application/json` |
| `Authorization` | Rutas protegidas | `Bearer <token>` |

### 1.3 Paginación

Los listados de usuarios, billeteras, suscripciones y tarjetas aceptan:

| Parámetro | Default | Reglas |
| --- | --- | --- |
| `page` | `1` | Entero positivo; si es inválido vuelve a 1 |
| `limit` | `10` | Entero positivo; máximo 100 |
| `search` | — | Texto libre; se aplica con `ILIKE` sobre los campos del módulo |
| `sortBy` | Según el módulo | Solo se acepta si está en la lista blanca |
| `order` | `asc` | `asc` o `desc` |

La respuesta es `{ data, total, page, limit }`. Transacciones y boletas devuelven el array completo.

### 1.4 Respuestas y códigos

| Código | Cuándo se usa |
| --- | --- |
| `200` | Consulta, edición o baja exitosa |
| `201` | Creación exitosa |
| `400` | Datos incompletos o que no cumplen una validación |
| `401` | Falta el token, el token es inválido o las credenciales no son correctas |
| `403` | La cuenta está deshabilitada o el usuario no tiene permisos |
| `404` | El recurso solicitado no existe |
| `409` | Conflicto de unicidad o de fondos |

Cuando la respuesta no es un modelo, los módulos de autenticación, usuarios, billeteras, boletas, suscripciones y tarjetas usan `{ mensaje }`; transacciones usa `{ error }`.

### 1.5 Modelos de respuesta

#### Usuario

```json
{
  "id": 1,
  "nombre": "Santiago Perez",
  "email": "santiago@test.com",
  "telefono": "+54 11 5555-1234",
  "rol": "usuario",
  "activo": true,
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

`passwordHash` no se devuelve: el `defaultScope` del modelo lo excluye.

#### AuthResponse

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombre": "Santiago Perez",
    "email": "santiago@test.com",
    "telefono": "+54 11 5555-1234",
    "rol": "usuario",
    "activo": true,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  }
}
```

#### Billetera

```json
{
  "idBilletera": 1,
  "idUsuario": 1,
  "nombre": "Cuenta principal",
  "saldo": "1500.00",
  "tipo": "ahorro",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

#### Transaccion

```json
{
  "idTransaccion": 1,
  "idBilletera": 1,
  "monto": "1500.00",
  "tipo": "ingreso",
  "categoria": "Sueldo",
  "fecha": "2026-01-15",
  "descripcion": "Sueldo de enero",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

#### Boleta

```json
{
  "idBoleta": 1,
  "idUsuario": 1,
  "tipoServicio": "luz",
  "monto": "120.50",
  "fechaVencimiento": "2026-02-10",
  "pagada": false,
  "fechaPago": null,
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

#### Suscripcion

```json
{
  "idSuscripcion": 1,
  "idUsuario": 1,
  "idTarjeta": null,
  "proveedor": "Netflix",
  "plan": "Premium",
  "monto": "15.00",
  "diaCobro": 10,
  "activa": true,
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

#### Tarjeta

```json
{
  "id": 1,
  "idUsuario": 1,
  "tipo": "visa",
  "ultimosCuatro": "1234",
  "titular": "Santiago Perez",
  "vencimiento": "12/28",
  "activa": true,
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

#### Paginated

```json
{
  "data": [
    {
      "idBilletera": 1,
      "idUsuario": 1,
      "nombre": "Cuenta sueldo",
      "saldo": "1500.00",
      "tipo": "ahorro",
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

El arreglo `data` contiene los modelos del módulo (`Usuario`, `Billetera`, `Suscripcion` o `Tarjeta`) y los metadatos acompañan la paginación.

#### Mensaje

```json
{
  "mensaje": "Operación realizada correctamente."
}
```

### 1.6 Lectura de los contratos

En las tablas de cada módulo, **Entrada** resume path params, query params y body; **Salida** indica el código y el modelo de respuesta. Los detalles de validación y los ejemplos se desarrollan en las subsecciones.

## 2. Autenticación

Base: `/api/auth`. Las respuestas usan `{ mensaje }`.

| Método | Ruta | Objetivo | Acceso | Entrada | Salida |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Registrar una cuenta | Público | Body: `nombre`, `email`, `password`, `telefono` | `201` `AuthResponse` |
| `POST` | `/api/auth/login` | Iniciar sesión | Público | Body: `email`, `password` | `200` `AuthResponse` |
| `POST` | `/api/auth/forgot-password` | Solicitar enlace de recuperación | Público | Body: `email` | `200` `Mensaje` (`resetUrl` en desarrollo) |
| `POST` | `/api/auth/reset-password` | Restablecer la contraseña | Público | Body: `token`, `password` | `200` `Mensaje` |
| `GET` | `/api/auth/me` | Obtener el perfil autenticado | Sesión | Header: `Authorization` | `200` `Usuario` |
| `POST` | `/api/auth/change-password` | Cambiar la contraseña | Sesión | Header: `Authorization`; Body: `passwordActual`, `passwordNueva` | `200` `Mensaje` |

Las contraseñas se hashean con **bcryptjs** usando `PASSWORD_SALT_ROUNDS` (10 por defecto) y nunca se guardan ni se devuelven en claro. El token es un JWT firmado con `JWT_SECRET`; el payload lleva el `rol` y el `id` del usuario en `sub`, y vence según `JWT_EXPIRES_IN` (7 días por defecto).

### 2.1 Registro

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `nombre` | string | Sí | Máximo 100; solo letras y espacios simples |
| `email` | string | Sí | Máximo 150; formato válido; se normaliza a minúsculas; único |
| `password` | string | Sí | Mínimo 8 caracteres; máximo 72 bytes UTF-8 |
| `telefono` | string o `null` | No | Máximo 30; admite números, espacios y `+`, `-`, `(`, `)` |

**Ejemplo de request**

```json
{
  "nombre": "Santiago Perez",
  "email": "santiago@test.com",
  "password": "Demo1234",
  "telefono": "+54 11 5555-1234"
}
```

Crea el usuario con `rol: "usuario"` y `activo: true`. La respuesta `201` es un `AuthResponse` con el token y el usuario público.

**Códigos:** `201` creado · `400` validación · `409` email ya registrado.

### 2.2 Login

Body: `{ "email": "...", "password": "..." }`. Devuelve `200` con un `AuthResponse`.

**Ejemplo de request**

```json
{
  "email": "santiago@test.com",
  "password": "Demo1234"
}
```

**Códigos:** `200` sesión iniciada · `400` email inválido o faltante · `401` credenciales incorrectas · `403` cuenta deshabilitada.

### 2.3 Recuperación de contraseña

`POST /api/auth/forgot-password` recibe `{ email }` y, con un email válido, responde siempre `200` con el mismo mensaje, exista o no la cuenta:

```json
{ "mensaje": "Si el email está registrado, te enviamos un enlace para restablecer la contraseña." }
```

En desarrollo (`NODE_ENV !== "production"`) la respuesta agrega `resetUrl` y el backend imprime el enlace en consola. El token crudo viaja en `/reset-password?token=...`; en la base solo se guarda su hash SHA-256 en `PasswordResetToken`, con vencimiento de `RESET_TOKEN_TTL_MIN` minutos (30 por defecto). Generar uno nuevo invalida los anteriores.

`POST /api/auth/reset-password` recibe `{ token, password }`. Al completarse, invalida todos los tokens pendientes del usuario y responde `200`:

```json
{ "mensaje": "Contraseña actualizada. Ya podés iniciar sesión." }
```

**Códigos:** `200` contraseña actualizada · `400` token inválido, vencido o contraseña fuera de rango · `403` cuenta deshabilitada.

### 2.4 Perfil y cambio de contraseña

`GET /api/auth/me` requiere `Authorization: Bearer <token>` y devuelve el `Usuario` autenticado sin `passwordHash`.

`POST /api/auth/change-password` recibe `{ passwordActual, passwordNueva }`. Valida la contraseña actual, exige que la nueva cumpla las reglas y sea distinta, y responde `200`:

```json
{ "mensaje": "Contraseña actualizada." }
```

**Códigos:** `200` contraseña actualizada · `400` contraseña actual incorrecta o nueva inválida · `401` sin sesión · `404` usuario inexistente.

### 2.5 Uso del token

- Enviar `Authorization: Bearer <token>` en todas las rutas de recursos.
- Sin token: `401 { "mensaje": "Necesitás iniciar sesión para continuar." }`.
- Token inválido o expirado: `401 { "mensaje": "Sesión inválida o expirada." }`.
- Sin permisos: `403 { "mensaje": "No tenés permisos para realizar esta acción." }`.
- El rol `admin` puede operar sobre cualquier usuario; el rol `usuario` queda limitado a sus propios registros.

**Ejemplo de request autenticado**

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/auth/me
```

**Usuario demo:** `santiago@test.com` / `Demo1234` (lo crea `seeds.sql`).

## 3. Usuarios

Base: `/api/users`. Requiere sesión. `POST /api/users` y `GET /api/users` son solo para `admin`; el registro público vive en `/api/auth/register`.

| Método | Ruta | Objetivo | Acceso | Entrada | Salida |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/users` | Crear un usuario | `admin` | Body: `nombre`, `email`, `telefono` | `201` `Usuario` |
| `GET` | `/api/users` | Listar usuarios | `admin` | Query: paginación, `rol`, `activo` | `200` `Paginated<Usuario>` |
| `GET` | `/api/users/:id` | Obtener un usuario | Dueño o `admin` | Path: `id` | `200` `Usuario` |
| `PUT` | `/api/users/:id` | Editar un usuario | Dueño o `admin` | Path: `id`; Body: campos editables | `200` `Usuario` |
| `PATCH` | `/api/users/:id` | Editar un usuario | Dueño o `admin` | Path: `id`; Body: campos editables | `200` `Usuario` |
| `DELETE` | `/api/users/:id` | Dar de baja lógica | Dueño o `admin` | Path: `id` | `200` `{ mensaje, data }` |

### 3.1 Crear

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `nombre` | string | Sí | Máximo 100; solo letras y espacios simples |
| `email` | string | Sí | Máximo 150; formato `algo@algo.algo`; se guarda en minúsculas; único |
| `telefono` | string o `null` | No | Máximo 30; admite números, espacios y `+`, `-`, `(`, `)` |

El usuario se crea con `rol: "usuario"` y `activo: true`. El alta administrativa no define contraseña: el usuario puede establecerla con el flujo de recuperación.

**Ejemplo de request**

```json
{
  "nombre": "Ana Gomez",
  "email": "ana@test.com",
  "telefono": "+54 11 4444-5678"
}
```

**Códigos:** `201` creado · `400` validación · `401` sin sesión · `403` sin rol admin · `409` email ya registrado.

### 3.2 Listar

Parámetros: `page`, `limit`, `search`, `sortBy`, `order`, `rol` y `activo`.

`search` busca en `nombre`, `email` y `telefono`. `sortBy` acepta `id`, `nombre`, `email`, `rol`, `activo`, `createdAt` y `updatedAt`; el default es `id`. `rol` acepta `usuario` o `admin`; `activo` acepta `true` o `false`.

**Ejemplo de request**

```http
GET /api/users?page=1&limit=10&search=ana&sortBy=nombre&order=asc&rol=usuario
Authorization: Bearer <token>
```

La respuesta es un `Paginated<Usuario>`.

**Códigos:** `200` listado · `400` filtro inválido · `401` sin sesión · `403` sin rol admin.

### 3.3 Obtener, editar y eliminar

`GET /api/users/:id` devuelve el `Usuario` o `404` si no existe. Un `id` no entero o menor a 1 responde `400`.

`PUT` y `PATCH` aceptan `nombre`, `email`, `telefono`, `rol` y `activo`. Un body vacío o una clave desconocida responde `400`. Si el email nuevo ya pertenece a otro usuario, responde `409`. `rol` solo acepta `usuario` o `admin`; `activo` solo acepta boolean. Un usuario común edita sus datos de contacto; un `admin` además puede cambiar `rol` y `activo`.

**Ejemplo de request**

```json
{
  "nombre": "Ana Gomez",
  "telefono": "+54 11 4444-5678"
}
```

`DELETE` hace baja lógica: si el usuario está activo, lo pasa a `activo: false`. Responde `200`:

```json
{
  "mensaje": "Usuario dado de baja correctamente.",
  "data": { "id": 1, "nombre": "Ana Gomez", "activo": false }
}
```

Un usuario común solo puede consultar, editar o darse de baja a sí mismo; un `admin` puede operar sobre cualquier usuario.

**Códigos:** `200` consulta, edición o baja · `400` id o body inválido · `401` sin sesión · `403` fuera del alcance del usuario · `404` inexistente · `409` email duplicado.

## 4. Billeteras

Base: `/api/v1/billeteras` (alias `/api/billetera`). Requiere sesión: un usuario ve y administra solo sus billeteras; un `admin` ve todas.

| Método | Ruta | Objetivo | Acceso | Entrada | Salida |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/billeteras` | Listar billeteras | Sesión | Query: paginación | `200` `Paginated<Billetera>` |
| `POST` | `/api/v1/billeteras` | Crear una billetera | Sesión | Body: `nombre`, `tipo`, `idUsuario` (solo `admin`) | `201` `Billetera` |
| `GET` | `/api/v1/billeteras/:id` | Obtener una billetera | Dueño o `admin` | Path: `id` | `200` `Billetera` |
| `PUT` | `/api/v1/billeteras/:id` | Editar una billetera | Dueño o `admin` | Path: `id`; Body: `nombre`, `tipo` | `200` `Billetera` |
| `PATCH` | `/api/v1/billeteras/:id` | Editar una billetera | Dueño o `admin` | Path: `id`; Body: `nombre`, `tipo` | `200` `Billetera` |
| `DELETE` | `/api/v1/billeteras/:id` | Eliminar una billetera | Dueño o `admin` | Path: `id` | `200` `{ mensaje, data }` |

El alias sin versión es `/api/billetera` (singular): por ejemplo, `GET /api/billetera` y `GET /api/billetera/:id`.

### 4.1 Crear

`nombre` y `tipo` son obligatorios. El dueño sale del token; un `admin` puede enviar `idUsuario` para crear la billetera a nombre de otro usuario. El usuario debe existir y estar activo. La billetera se crea con `saldo: "0.00"`.

**Ejemplo de request**

```json
{
  "nombre": "Cuenta principal",
  "tipo": "ahorro"
}
```

**Códigos:** `201` creada · `400` datos faltantes o usuario inactivo · `401` sin sesión · `404` usuario inexistente.

### 4.2 Listar

Parámetros: `page`, `limit`, `search`, `sortBy` y `order`.

`search` busca en `nombre` y `tipo`. `sortBy` acepta `idBilletera`, `nombre`, `tipo`, `saldo`, `createdAt` y `updatedAt`; el default es `idBilletera`.

La respuesta es un `Paginated<Billetera>`.

**Códigos:** `200` listado · `401` sin sesión.

### 4.3 Obtener, editar y eliminar

`GET /api/v1/billeteras/:id` devuelve la `Billetera` o `404` si no existe. Un id inválido responde `400`.

`PUT` y `PATCH` aceptan `nombre` y `tipo`. `saldo` e `idUsuario` son de solo lectura: enviarlos responde `400`. Los strings no vacíos se recortan con `trim()`.

**Ejemplo de request**

```json
{
  "nombre": "Cuenta sueldo",
  "tipo": "corriente"
}
```

`DELETE` borra físicamente. Las transacciones asociadas se eliminan por `ON DELETE CASCADE`. Responde `200`:

```json
{
  "mensaje": "Billetera eliminada correctamente.",
  "data": { "idBilletera": 1, "nombre": "Cuenta sueldo", "saldo": "1500.00" }
}
```

Un usuario común solo puede operar sobre sus propias billeteras; un `admin`, sobre cualquiera.

**Códigos:** `200` consulta, edición o baja · `400` id o body inválido · `401` sin sesión · `404` inexistente.

## 5. Transacciones

Base: `/api/transactions`. Requiere sesión y sus respuestas usan `{ error }`. Un usuario solo opera sobre movimientos de sus propias billeteras; un `admin` sobre todos.

| Método | Ruta | Objetivo | Acceso | Entrada | Salida |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/transactions` | Registrar un movimiento | Sesión | Body: `idBilletera`, `monto`, `tipo`, `categoria`, `fecha`, `descripcion` | `201` `Transaccion` |
| `GET` | `/api/transactions` | Listar movimientos | Sesión | Query: `idBilletera` (opcional) | `200` `Transaccion[]` |
| `GET` | `/api/transactions/:id` | Obtener un movimiento | Dueño o `admin` | Path: `id` | `200` `Transaccion` |
| `PUT` | `/api/transactions/:id` | Editar un movimiento | Dueño o `admin` | Path: `id`; Body: campos editables | `200` `Transaccion` |
| `PATCH` | `/api/transactions/:id` | Editar un movimiento | Dueño o `admin` | Path: `id`; Body: campos editables | `200` `Transaccion` |
| `DELETE` | `/api/transactions/:id` | Eliminar y revertir el saldo | Dueño o `admin` | Path: `id` | `200` `Transaccion` |

### 5.1 Registrar

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `idBilletera` | integer | Sí | Entero positivo y existente; debe pertenecer al usuario (un `admin` puede usar cualquiera) |
| `monto` | number o string | Sí | Positivo, hasta dos decimales, sin signo |
| `tipo` | string | Sí | `ingreso` o `egreso` |
| `categoria` | string | Sí | Máximo 100 |
| `fecha` | string | Sí | `YYYY-MM-DD` |
| `descripcion` | string | No | Máximo 255 |

**Ejemplo de request**

```json
{
  "idBilletera": 1,
  "monto": "1500.00",
  "tipo": "ingreso",
  "categoria": "Sueldo",
  "fecha": "2026-01-15",
  "descripcion": "Sueldo de enero"
}
```

El registro es atómico: actualiza el saldo de la billetera y crea la fila en `Transaccion` dentro de la misma transacción de Sequelize, con bloqueo pesimista de la billetera. Un egreso sin fondos responde `409 { "error": "fondos insuficientes" }`.

**Códigos:** `201` registrada · `400` validación · `401` sin sesión · `404` billetera inexistente o ajena · `409` fondos insuficientes.

### 5.2 Listar

`GET /api/transactions` devuelve las transacciones del usuario ordenadas por `fecha DESC` (un `admin` ve todas). Acepta `?idBilletera=N` para filtrar.

**Ejemplo de request**

```http
GET /api/transactions?idBilletera=1
Authorization: Bearer <token>
```

**Códigos:** `200` listado · `401` sin sesión.

### 5.3 Obtener, editar y eliminar

`GET /api/transactions/:id` devuelve la `Transaccion` o `404` si no existe.

`PUT` y `PATCH` aceptan `monto`, `tipo`, `categoria`, `fecha` y `descripcion`. No se puede cambiar `idBilletera`: si viene en el body, responde `400`. El service combina los campos nuevos con los actuales, valida el resultado y ajusta el saldo por la diferencia entre el efecto firmado nuevo y el viejo. Todo ocurre en una transacción con lock de la fila.

**Ejemplo de request**

```json
{
  "monto": "1600.00",
  "categoria": "Sueldo ajustado"
}
```

`DELETE` aplica el movimiento inverso y borra la fila. Si el inverso no tiene fondos suficientes, responde `409` y no borra nada. Devuelve la `Transaccion` eliminada.

**Códigos:** `200` consulta, edición o baja · `400` id o body inválido · `401` sin sesión · `404` inexistente o ajena · `409` fondos insuficientes.

## 6. Boletas

Base: `/api/v1/boletas`. Requiere sesión: un usuario ve y administra solo sus boletas; un `admin` ve todas.

| Método | Ruta | Objetivo | Acceso | Entrada | Salida |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/boletas` | Listar boletas | Sesión | — | `200` `Boleta[]` |
| `POST` | `/api/v1/boletas` | Crear una boleta | Sesión | Body: `tipoServicio`, `monto`, `fechaVencimiento`, `pagada`, `fechaPago` | `201` `Boleta` |
| `GET` | `/api/v1/boletas/:id` | Obtener una boleta | Dueño o `admin` | Path: `id` | `200` `Boleta` |
| `PUT` | `/api/v1/boletas/:id` | Editar una boleta | Dueño o `admin` | Path: `id`; Body: campos editables | `200` `Boleta` |
| `PATCH` | `/api/v1/boletas/:id` | Editar una boleta | Dueño o `admin` | Path: `id`; Body: campos editables | `200` `Boleta` |
| `DELETE` | `/api/v1/boletas/:id` | Eliminar una boleta | Dueño o `admin` | Path: `id` | `200` `{ mensaje }` |

### 6.1 Listar

Devuelve las boletas del usuario ordenadas por `fechaVencimiento ASC` (un `admin` ve todas).

**Códigos:** `200` listado · `401` sin sesión.

### 6.2 Crear

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `tipoServicio` | string | Sí | `luz`, `agua`, `gas`, `internet` u `otro` |
| `monto` | number o string | Sí | Mayor a 0 |
| `fechaVencimiento` | string | Sí | `YYYY-MM-DD` |
| `pagada` | boolean | No | Default `false` |
| `fechaPago` | string o `null` | No | `YYYY-MM-DD`; se completa cuando `pagada` es `true` |

El dueño sale del token. El esquema de la base restringe `tipoServicio` a los valores indicados.

**Ejemplo de request**

```json
{
  "tipoServicio": "luz",
  "monto": "120.50",
  "fechaVencimiento": "2026-02-10",
  "pagada": false
}
```

**Códigos:** `201` creada · `400` monto o fecha inválidos · `401` sin sesión.

### 6.3 Obtener, editar y eliminar

`GET /api/v1/boletas/:id` devuelve la `Boleta` o `404` si no existe.

`PUT` y `PATCH` actualizan los campos enviados: `tipoServicio`, `monto`, `fechaVencimiento`, `pagada` y `fechaPago`.

**Ejemplo de request**

```json
{
  "pagada": true,
  "fechaPago": "2026-02-05"
}
```

`DELETE` borra físicamente y responde `200`:

```json
{ "mensaje": "Boleta eliminada" }
```

Un usuario común solo puede operar sobre sus propias boletas; un `admin`, sobre cualquiera.

**Códigos:** `200` consulta, edición o baja · `401` sin sesión · `404` inexistente.

## 7. Suscripciones

Base: `/api/v1/suscripciones` (alias `/api/suscripciones`). Requiere sesión: un usuario ve y administra solo sus suscripciones; un `admin` ve todas.

| Método | Ruta | Objetivo | Acceso | Entrada | Salida |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/suscripciones` | Listar suscripciones | Sesión | Query: paginación, `idUsuario`, `activa` | `200` `Paginated<Suscripcion>` |
| `POST` | `/api/v1/suscripciones` | Crear una suscripción | Sesión | Body: `proveedor`, `plan`, `monto`, `diaCobro`, `idTarjeta`, `idUsuario` (solo `admin`) | `201` `Suscripcion` |
| `GET` | `/api/v1/suscripciones/:id` | Obtener una suscripción | Dueño o `admin` | Path: `id` | `200` `Suscripcion` |
| `PUT` | `/api/v1/suscripciones/:id` | Editar una suscripción | Dueño o `admin` | Path: `id`; Body: campos editables | `200` `Suscripcion` |
| `PATCH` | `/api/v1/suscripciones/:id` | Editar una suscripción | Dueño o `admin` | Path: `id`; Body: campos editables | `200` `Suscripcion` |
| `DELETE` | `/api/v1/suscripciones/:id` | Eliminar una suscripción | Dueño o `admin` | Path: `id` | `200` `{ mensaje, data }` |

### 7.1 Crear

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `proveedor` | string | Sí | Máximo 100 |
| `plan` | string | Sí | Máximo 100 |
| `monto` | number o string | Sí | Positivo, hasta dos decimales; se normaliza a dos decimales |
| `diaCobro` | integer | Sí | Entre 1 y 31 |
| `activa` | boolean | No | Default `true` |
| `idTarjeta` | integer o `null` | No | Si viene, debe existir, estar activa y pertenecer al mismo usuario |
| `idUsuario` | integer | No | Solo `admin`; si no viene, se toma del token |

**Ejemplo de request**

```json
{
  "proveedor": "Netflix",
  "plan": "Premium",
  "monto": "15.00",
  "diaCobro": 10,
  "activa": true
}
```

**Códigos:** `201` creada · `400` validación o usuario inactivo · `401` sin sesión · `404` usuario inexistente.

### 7.2 Listar

Parámetros: `page`, `limit`, `search`, `sortBy`, `order`, `idUsuario` y `activa`.

`search` busca en `proveedor` y `plan`. `sortBy` acepta `idSuscripcion`, `proveedor`, `plan`, `monto`, `diaCobro`, `activa`, `createdAt` y `updatedAt`; el default es `idSuscripcion`. `idUsuario` debe ser entero positivo y solo lo aprovecha un `admin`; un usuario común queda acotado a sus propias suscripciones. `activa` debe ser `true` o `false`.

La respuesta es un `Paginated<Suscripcion>`.

**Códigos:** `200` listado · `400` filtro inválido · `401` sin sesión.

### 7.3 Obtener, editar y eliminar

`GET` devuelve la `Suscripcion` o `404` si no existe.

`PUT` y `PATCH` aceptan `idTarjeta`, `proveedor`, `plan`, `monto`, `diaCobro` y `activa`. No se puede cambiar `idUsuario`. `idTarjeta: null` desasocia la tarjeta.

**Ejemplo de request**

```json
{
  "plan": "Familiar",
  "monto": "20.00"
}
```

`DELETE` borra físicamente y responde `200`:

```json
{
  "mensaje": "Suscripción eliminada correctamente.",
  "data": { "idSuscripcion": 1, "proveedor": "Netflix" }
}
```

Un usuario común solo puede operar sobre sus propias suscripciones; un `admin`, sobre cualquiera.

**Códigos:** `200` consulta, edición o baja · `400` datos de edición inválidos · `401` sin sesión · `404` inexistente.

## 8. Tarjetas

Base: `/api/v1/tarjetas`. Requiere sesión: un usuario ve y administra solo sus tarjetas; un `admin` ve todas.

| Método | Ruta | Objetivo | Acceso | Entrada | Salida |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/tarjetas` | Listar tarjetas | Sesión | Query: paginación, `idUsuario`, `activa`, `tipo` | `200` `Paginated<Tarjeta>` |
| `POST` | `/api/v1/tarjetas` | Crear una tarjeta | Sesión | Body: `tipo`, `ultimosCuatro`, `titular`, `vencimiento`, `activa`, `idUsuario` (solo `admin`) | `201` `Tarjeta` |
| `GET` | `/api/v1/tarjetas/:id` | Obtener una tarjeta | Dueño o `admin` | Path: `id` | `200` `Tarjeta` |
| `PUT` | `/api/v1/tarjetas/:id` | Editar una tarjeta | Dueño o `admin` | Path: `id`; Body: campos editables | `200` `Tarjeta` |
| `PATCH` | `/api/v1/tarjetas/:id` | Editar una tarjeta | Dueño o `admin` | Path: `id`; Body: campos editables | `200` `Tarjeta` |
| `DELETE` | `/api/v1/tarjetas/:id` | Eliminar una tarjeta | Dueño o `admin` | Path: `id` | `200` `{ mensaje, data }` |

### 8.1 Crear

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `tipo` | string | Sí | `visa`, `mastercard`, `amex` u `otra` |
| `ultimosCuatro` | string | Sí | Exactamente 4 dígitos |
| `titular` | string | Sí | Letras y espacios; máximo 100 |
| `vencimiento` | string | Sí | `MM/YY` |
| `activa` | boolean | No | Default `true` |
| `idUsuario` | integer | No | Solo `admin`; si no viene, se toma del token |

**Ejemplo de request**

```json
{
  "tipo": "visa",
  "ultimosCuatro": "1234",
  "titular": "Santiago Perez",
  "vencimiento": "12/28",
  "activa": true
}
```

Solo se guardan los últimos cuatro dígitos; no se almacena el número completo ni el CVV.

**Códigos:** `201` creada · `400` validación o usuario inactivo · `401` sin sesión · `404` usuario inexistente.

### 8.2 Listar

Parámetros: `page`, `limit`, `search`, `sortBy`, `order`, `idUsuario`, `activa` y `tipo`.

`search` busca en `titular`, `ultimosCuatro` y `tipo`. `sortBy` acepta `id`, `tipo`, `ultimosCuatro`, `titular`, `vencimiento`, `activa`, `createdAt` y `updatedAt`; el default es `id`. `idUsuario` debe ser entero positivo y solo lo aprovecha un `admin`; un usuario común queda acotado a sus propias tarjetas. `activa` debe ser `true` o `false` y `tipo` debe ser uno de los cuatro valores.

La respuesta es un `Paginated<Tarjeta>`.

**Códigos:** `200` listado · `400` filtro inválido · `401` sin sesión.

### 8.3 Obtener, editar y eliminar

`GET` devuelve la `Tarjeta` o `404` si no existe.

`PUT` y `PATCH` aceptan `tipo`, `ultimosCuatro`, `titular`, `vencimiento` y `activa`. `idUsuario` en el body responde `400`. Una clave desconocida o un body vacío también responden `400`.

**Ejemplo de request**

```json
{
  "titular": "Santiago Perez",
  "activa": false
}
```

`DELETE` borra físicamente y responde `200`:

```json
{
  "mensaje": "Tarjeta eliminada correctamente.",
  "data": { "id": 1, "tipo": "visa", "ultimosCuatro": "1234" }
}
```

Un usuario común solo puede operar sobre sus propias tarjetas; un `admin`, sobre cualquiera.

**Códigos:** `200` consulta, edición o baja · `400` id o body inválido · `401` sin sesión · `404` inexistente.
