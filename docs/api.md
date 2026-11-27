# API

Referencia de los endpoints del backend. Está basada en las rutas, controllers, services y modelos de `apps/backend`.

## 1. Convenciones

### 1.1 Base y prefijos

En desarrollo el backend escucha en `http://localhost:3000` y Vite proxya `/api` hacia ese puerto. En producción, Vercel enruta `/api/*` al service del backend.

| Módulo | Prefijo |
| --- | --- |
| Usuarios | `/api/users` |
| Transacciones | `/api/transactions` |
| Billeteras | `/api/v1/billeteras` y `/api/billetera` |
| Suscripciones | `/api/v1/suscripciones` y `/api/suscripciones` |
| Boletas | `/api/v1/boletas` |
| Tarjetas | `/api/v1/tarjetas` |

Los alias apuntan al mismo router: `GET /api/billetera` y `GET /api/v1/billeteras` devuelven lo mismo. Lo mismo pasa con suscripciones. El frontend usa `ID_USUARIO = 1` para los flujos del MVP.

### 1.2 Formato

- Request y response: `application/json`.
- Montos: las respuestas los devuelven como `string` con dos decimales (`"1500.00"`). En los requests se aceptan números o strings. En PostgreSQL son `DECIMAL(14,2)`.
- Fechas de dominio: `YYYY-MM-DD` (`DATEONLY`).
- Timestamps: ISO 8601 (`createdAt`, `updatedAt`).
- IDs numéricos.

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

### 1.4 Errores

| Módulos | Clave |
| --- | --- |
| Usuarios, billeteras, boletas, suscripciones y tarjetas | `{ mensaje }` |
| Transacciones | `{ error }` |

En general, los errores de validación de los services responden 400, los recursos inexistentes 404 y los conflictos 409. Los `POST` exitosos responden 201 y el resto de las operaciones 200. El middleware final de `app.ts` responde `500 { "mensaje": "Error interno del servidor." }` si un error no fue capturado.

## 2. Usuarios

Base: `/api/users`.

| Método | Ruta | Descripción | Éxito |
| --- | --- | --- | --- |
| `POST` | `/api/users` | Crear usuario | `201` usuario |
| `GET` | `/api/users` | Listar paginado | `200` `{ data, total, page, limit }` |
| `GET` | `/api/users/:id` | Obtener por id | `200` usuario |
| `PUT` | `/api/users/:id` | Editar | `200` usuario |
| `PATCH` | `/api/users/:id` | Editar | `200` usuario |
| `DELETE` | `/api/users/:id` | Baja lógica | `200` `{ mensaje, data }` |

### 2.1 Crear

- `nombre`: obligatorio, máximo 100, solo letras y espacios simples.
- `email`: obligatorio, máximo 150, formato `algo@algo.algo`, se guarda en minúsculas. Es único.
- `telefono`: opcional, máximo 30, admite números, espacios y `+`, `-`, `(`, `)`. Si viene vacío o `null`, se guarda `null`.

El usuario se crea con `rol: "usuario"` y `activo: true`. Si el email ya existe, responde `409 { "mensaje": "Ya existe un usuario con ese email." }`.

### 2.2 Listar

Parámetros: `page`, `limit`, `search`, `sortBy`, `order`, `rol` y `activo`.

`search` busca en `nombre`, `email` y `telefono`. `sortBy` acepta `id`, `nombre`, `email`, `rol`, `activo`, `createdAt` y `updatedAt`; el default es `id`. `rol` acepta `usuario` o `admin`; `activo` acepta `true` o `false`.

### 2.3 Obtener, editar y eliminar

`GET /api/users/:id` devuelve el usuario o `404 { "mensaje": "Usuario no encontrado." }`. Un id no entero o menor a 1 responde 400.

`PUT` y `PATCH` aceptan `nombre`, `email`, `telefono`, `rol` y `activo`. Un body vacío o una clave desconocida responde 400. Si el email nuevo ya pertenece a otro usuario, responde 409. `rol` solo acepta `usuario` o `admin`; `activo` solo acepta boolean.

`DELETE` hace baja lógica: si el usuario está activo, lo pasa a `activo: false`. Responde `{ mensaje: "Usuario dado de baja correctamente.", data: usuario }`.

## 3. Billeteras

Base: `/api/v1/billeteras` (alias `/api/billetera`).

| Método | Ruta | Descripción | Éxito |
| --- | --- | --- | --- |
| `GET` | `/api/v1/billeteras` | Listar paginado | `200` `{ data, total, page, limit }` |
| `POST` | `/api/v1/billeteras` | Crear | `201` billetera |
| `GET` | `/api/v1/billeteras/:id` | Obtener | `200` billetera |
| `PUT` | `/api/v1/billeteras/:id` | Editar | `200` billetera |
| `PATCH` | `/api/v1/billeteras/:id` | Editar | `200` billetera |
| `DELETE` | `/api/v1/billeteras/:id` | Eliminar | `200` `{ mensaje, data }` |

El alias sin versión es `/api/billetera` (singular): por ejemplo, `GET /api/billetera` y `GET /api/billetera/:id`.

### 3.1 Crear

`idUsuario`, `nombre` y `tipo` son obligatorios. El usuario debe existir y estar activo. La billetera se crea con `saldo: "0.00"`.

### 3.2 Listar

Parámetros: `page`, `limit`, `search`, `sortBy` y `order`.

`search` busca en `nombre` y `tipo`. `sortBy` acepta `idBilletera`, `nombre`, `tipo`, `saldo`, `createdAt` y `updatedAt`; el default es `idBilletera`.

### 3.3 Obtener, editar y eliminar

`GET /api/v1/billeteras/:id` devuelve la billetera o `404 { "mensaje": "la billetera no existe" }`. Un id inválido responde 400.

`PUT` y `PATCH` aceptan `nombre` y `tipo`. Si el body trae `saldo` o `idUsuario`, responde 400. Los strings no vacíos se recortan con `trim()`.

`DELETE` borra físicamente. Las transacciones asociadas se eliminan por `ON DELETE CASCADE`. Responde `{ mensaje: "Billetera eliminada correctamente.", data: billetera }`.

## 4. Transacciones

Base: `/api/transactions`. Este módulo usa `{ error }` en sus respuestas de error.

| Método | Ruta | Descripción | Éxito |
| --- | --- | --- | --- |
| `POST` | `/api/transactions` | Registrar movimiento | `201` transacción |
| `GET` | `/api/transactions` | Listar | `200` array |
| `GET` | `/api/transactions/:id` | Obtener | `200` transacción |
| `PUT` | `/api/transactions/:id` | Editar | `200` transacción |
| `PATCH` | `/api/transactions/:id` | Editar | `200` transacción |
| `DELETE` | `/api/transactions/:id` | Eliminar y revertir saldo | `200` transacción |

### 4.1 Registrar

Campos:

- `idBilletera`: entero positivo y existente.
- `monto`: número o string numérico positivo, hasta dos decimales, sin signo.
- `tipo`: `ingreso` o `egreso`.
- `categoria`: obligatoria, máximo 100.
- `fecha`: `YYYY-MM-DD`.
- `descripcion`: opcional, máximo 255.

El registro es atómico: actualiza el saldo de la billetera y crea la fila en `Transaccion` dentro de la misma transacción de Sequelize, con bloqueo pesimista de la billetera. Un egreso sin fondos responde `409 { "error": "fondos insuficientes" }`.

### 4.2 Listar

`GET /api/transactions` devuelve todas las transacciones ordenadas por `fecha DESC`. Acepta `?idBilletera=N` para filtrar.

### 4.3 Obtener, editar y eliminar

`GET /api/transactions/:id` devuelve la transacción o `404 { "error": "Movimiento no encontrado" }`.

`PUT` y `PATCH` aceptan `monto`, `tipo`, `categoria`, `fecha` y `descripcion`. No se puede cambiar `idBilletera`: si viene en el body, responde 400. El service combina los campos nuevos con los actuales, valida el resultado y ajusta el saldo por la diferencia entre el efecto firmado nuevo y el viejo. Todo ocurre en una transacción con lock de la fila.

`DELETE` aplica el movimiento inverso y borra la fila. Si el inverso no tiene fondos suficientes, responde 409 y no borra nada. Devuelve la transacción eliminada.

## 5. Boletas

Base: `/api/v1/boletas`.

| Método | Ruta | Descripción | Éxito |
| --- | --- | --- | --- |
| `GET` | `/api/v1/boletas` | Listar | `200` array |
| `POST` | `/api/v1/boletas` | Crear | `201` boleta |
| `GET` | `/api/v1/boletas/:id` | Obtener | `200` boleta |
| `PUT` | `/api/v1/boletas/:id` | Editar | `200` boleta |
| `PATCH` | `/api/v1/boletas/:id` | Editar | `200` boleta |
| `DELETE` | `/api/v1/boletas/:id` | Eliminar | `200` `{ mensaje }` |

### 5.1 Listar

Devuelve las boletas ordenadas por `fechaVencimiento ASC`.

### 5.2 Crear

- `tipoServicio`: obligatorio; `luz`, `agua`, `gas`, `internet` u `otro`.
- `monto`: obligatorio, mayor a 0.
- `fechaVencimiento`: obligatoria.
- `pagada`: opcional, default `false`.
- `fechaPago`: obligatoria cuando `pagada` es `true`.
- `idUsuario`: opcional; si no viene, se usa el usuario de demostración.

`tipoServicio` se valida contra el `CHECK` de la tabla.

### 5.3 Obtener, editar y eliminar

`GET /api/v1/boletas/:id` devuelve la boleta o `404 { "mensaje": "Boleta no encontrada" }`.

`PUT` y `PATCH` actualizan los campos enviados de la boleta.

`DELETE` borra físicamente y responde `200 { "mensaje": "Boleta eliminada" }`.

## 6. Suscripciones

Base: `/api/v1/suscripciones` (alias `/api/suscripciones`).

| Método | Ruta | Descripción | Éxito |
| --- | --- | --- | --- |
| `GET` | `/api/v1/suscripciones` | Listar paginado | `200` `{ data, total, page, limit }` |
| `POST` | `/api/v1/suscripciones` | Crear | `201` suscripción |
| `GET` | `/api/v1/suscripciones/:id` | Obtener | `200` suscripción |
| `PUT` | `/api/v1/suscripciones/:id` | Editar | `200` suscripción |
| `PATCH` | `/api/v1/suscripciones/:id` | Editar | `200` suscripción |
| `DELETE` | `/api/v1/suscripciones/:id` | Eliminar | `200` `{ mensaje, data }` |

### 6.1 Crear

- `idUsuario`: entero positivo; el usuario debe existir y estar activo.
- `proveedor` y `plan`: strings obligatorios, máximo 100.
- `monto`: número o string numérico positivo con hasta dos decimales; se normaliza a dos decimales.
- `diaCobro`: entero entre 1 y 31.
- `activa`: booleano opcional, default `true`.
- `idTarjeta`: opcional. Si viene, debe existir, estar activa y pertenecer al mismo `idUsuario`.

### 6.2 Listar

Parámetros: `page`, `limit`, `search`, `sortBy`, `order`, `idUsuario` y `activa`.

`search` busca en `proveedor` y `plan`. `sortBy` acepta `idSuscripcion`, `proveedor`, `plan`, `monto`, `diaCobro`, `activa`, `createdAt` y `updatedAt`; el default es `idSuscripcion`. `idUsuario` debe ser entero positivo y `activa` debe ser `true` o `false`.

### 6.3 Obtener, editar y eliminar

`GET` devuelve la suscripción o `404 { "mensaje": "La suscripción no existe." }`.

`PUT` y `PATCH` aceptan `idTarjeta`, `proveedor`, `plan`, `monto`, `diaCobro` y `activa`. No se puede cambiar `idUsuario`. `idTarjeta: null` desasocia la tarjeta.

`DELETE` borra físicamente y responde `{ mensaje: "Suscripción eliminada correctamente.", data: suscripción }`.

## 7. Tarjetas

Base: `/api/v1/tarjetas`.

| Método | Ruta | Descripción | Éxito |
| --- | --- | --- | --- |
| `GET` | `/api/v1/tarjetas` | Listar paginado | `200` `{ data, total, page, limit }` |
| `POST` | `/api/v1/tarjetas` | Crear | `201` tarjeta |
| `GET` | `/api/v1/tarjetas/:id` | Obtener | `200` tarjeta |
| `PUT` | `/api/v1/tarjetas/:id` | Editar | `200` tarjeta |
| `PATCH` | `/api/v1/tarjetas/:id` | Editar | `200` tarjeta |
| `DELETE` | `/api/v1/tarjetas/:id` | Eliminar | `200` `{ mensaje, data }` |

### 7.1 Crear

- `idUsuario`: entero positivo; el usuario debe existir y estar activo.
- `tipo`: `visa`, `mastercard`, `amex` u `otra`.
- `ultimosCuatro`: string de exactamente 4 dígitos.
- `titular`: string de letras y espacios, máximo 100.
- `vencimiento`: `MM/YY`.
- `activa`: booleano opcional, default `true`.

Solo se guardan los últimos cuatro dígitos; no se almacena el número completo ni el CVV.

### 7.2 Listar

Parámetros: `page`, `limit`, `search`, `sortBy`, `order`, `idUsuario`, `activa` y `tipo`.

`search` busca en `titular`, `ultimosCuatro` y `tipo`. `sortBy` acepta `id`, `tipo`, `ultimosCuatro`, `titular`, `vencimiento`, `activa`, `createdAt` y `updatedAt`; el default es `id`. `idUsuario` debe ser entero positivo, `activa` debe ser `true` o `false` y `tipo` debe ser uno de los cuatro valores.

### 7.3 Obtener, editar y eliminar

`GET` devuelve la tarjeta o `404 { "mensaje": "La tarjeta no existe." }`.

`PUT` y `PATCH` aceptan `tipo`, `ultimosCuatro`, `titular`, `vencimiento` y `activa`. `idUsuario` en el body responde 400. Una clave desconocida o un body vacío también responden 400.

`DELETE` borra físicamente y responde `{ mensaje: "Tarjeta eliminada correctamente.", data: tarjeta }`.
