# Decisiones de Diseño y Arquitectura - Taller II (Grupo 23)

En este documento explicamos las dos decisiones de diseño aplicadas sobre el backend del MVP financiero: el patrón Strategy para el cálculo de saldos en billeteras y el patrón Facade para coordinar el registro atómico de las transacciones. Sobre esa base se apoyan la precisión monetaria y las pruebas automatizadas.

## 1. Módulo Billeteras: Patrón de Comportamiento (Strategy)

**Archivos involucrados:**
- `routes/billeteraRoutes.ts`
- `controllers/billeteraController.ts`
- `services/billeteraService.ts`
- `models/billetera.ts`

### 1. Estructura de Defensa para el Coloquio

- **El Problema (Code Smell):**
  - *Contexto:* Sumar un ingreso (validando límites de almacenamiento) y restar un egreso (verificando fondos disponibles y lanzando error 409 si el saldo no alcanza) tienen reglas de negocio muy distintas.
  - *Falla:* Resolver todo en una misma función usando condicionales (`if` / `else if`) acumula responsabilidades y rompe el principio Open/Closed (OCP).
- **La Alternativa Descartada:**
  - *Opción:* Usar una función simple con un `if/else`, como contempla el documento del MVP para dos ramas.
  - *Por qué se descartó:* Acopla toda la lógica en un solo bloque y obliga a modificar esa misma función cada vez que cambie o se agregue una regla financiera.
- **La Solución (Patrón Strategy - Clase 6):**
  - *Contrato común:* Se creó la interfaz `calculoSaldoStrategy` con el método `calcularSaldo(saldo, monto)`.
  - *Estrategias aisladas:* `ingresoStrategy` y `egresoStrategy` encapsulan sus propias reglas por separado.
  - *Contexto:* La función `calcularNuevoSaldo` recibe la operación y delega el cálculo en tiempo de ejecución (runtime) sin hacer la cuenta directamente.
- **Costo vs. Beneficio (Trade-off):**
  - *Costo asumido:* Mayor cantidad de archivos e indirección para un MVP de solo dos operaciones.
  - *Beneficio:* Permite hacer tests unitarios en memoria (sin tocar la base de datos) y prepara el sistema para agregar reglas futuras (retenciones, tarjetas, etc.) sin tocar el flujo transaccional ni el consumidor.

### 2. Posibles Preguntas de los Docentes

- **¿Por qué la estrategia no consulta ni guarda en la base de datos?**
  - *Idea clave:* Strategy solo aísla el algoritmo matemático para que sea exacto y esté desacoplado de la persistencia.
  - *Quién lo hace:* `billeteraService.ts` (dentro de `aplicarMovimiento`) es quien busca la fila, la bloquea (`lock: t.LOCK.UPDATE`) y guarda los cambios usando la transacción `t`.
- **¿Quién y cómo elige la estrategia en tiempo de ejecución?**
  - *Idea clave:* Se elige en runtime según el campo `tipo` (`"ingreso"` o `"egreso"`) que envía el usuario en la petición HTTP.
  - *Cómo funciona:* Ese valor busca la estrategia en un diccionario (`Record<string, calculoSaldoStrategy>`). Si el tipo no existe en el mapa, se rechaza con un error 400.

---

## 2. Módulo Transacciones: Patrón Estructural (Facade)

**Archivos involucrados:**
- `routes/transactionRoutes.ts`
- `controllers/transactionController.ts`
- `services/transactionServices.ts`
- `models/transaction.ts`

### 1. Código analizado

La función `registerTransaction` en `transactionServices.ts` y `crearTransaccion` en `transactionController.ts`.

### 2. Diagnóstico (Problema detectado y Code Smell)

El registro de un movimiento de dinero puede tener complicaciones:

1. Validar que los montos sean correctos y operar con aritmética decimal exacta (`decimal.js`).
2. Iniciar una transacción atómica de base de datos (`sequelize.transaction(async t => ...)`).
3. Invocar al módulo de billeteras pasándole esa `t` para que aplique el bloqueo pesimista de fila (`lock: t.LOCK.UPDATE`) y actualice el saldo de forma segura contra concurrencia.
4. Persistir el comprobante del movimiento en la tabla `Transaccion` bajo la misma `t`.

Si el controlador (`transactionController`) coordinaba estos pasos directamente, violaba el Principio de Responsabilidad Única (SRP) mezclando HTTP con Sequelize, ORM y locks. Además, existía un riesgo crítico de inconsistencia: si fallaba el guardado del movimiento luego de haber actualizado el saldo, la base de datos quedaba rota, con plata en el aire.

### 3. Alternativas evaluadas

- **Opción A - Coordinar todo desde el controlador:** Descartada. Ensuciaba al controlador con llamadas a la base de datos, locks de Sequelize y transacciones atómicas que no le corresponden a la capa web.
- **Opción B - Crear una clase separada `TransactionFacade`:** Descartada por overengineering. Crear un archivo y una clase extra solo para eso agregaba complejidad innecesaria.
- **Opción C - Usar el servicio existente como Facade:** Opción elegida. Resolver la operación unificada directamente en `transactionServices.registerTransaction`.

### 4. Decisión tomada

Implementamos el patrón **Facade** en la función `registerTransaction`:

- El controlador solo le pasa los datos limpios recibidos del cliente y se desentiende de la complejidad interna.
- Adentro, el facade administra el ciclo de vida de la transacción atómica `t`, llama a `billeteraService.aplicarMovimiento(..., t)` y registra la fila en `Transaction.create(..., { transaction: t })`.
- Si todo sale bien, Sequelize confirma los cambios. Si cualquier paso falla, se ejecuta un `rollback` automático y se cancela todo, garantizando consistencia absoluta (todo o nada).

### 5. Evidencia y Trade-offs

- **Evidencia en el código:** `registerTransaction` abre el bloque `sequelize.transaction`, coordina la billetera con el lock pesimista y guarda la transacción bajo la misma variable `t`.
- **Lo que ganamos:** El controlador queda corto y enfocado únicamente en el protocolo HTTP. Se blinda el sistema impidiendo que cualquier parte registre movimientos salteándose la transacción atómica o el bloqueo de fila.
- **El precio que pagamos:** Agregamos un paso intermedio para seguir el camino del código, hay que navegar entre controlador, servicio de transacciones y servicio de billeteras. Además, debemos cuidar que el facade no absorba lógica de negocio ajena (por eso delega el cálculo y descuento de fondos en `billeteraService`).

---

## 3. Cómo colaboran ambos patrones en el flujo real

Ambos patrones resuelven tensiones distintas pero colaboran durante una operación:

1. **Facade (`registerTransaction` - Estructural):** Recibe el pedido desde el controlador, abre la transacción atómica `t` en la base de datos y selecciona el flujo general. No calcula saldos por su cuenta, llama a `billeteraService.aplicarMovimiento(..., t)`.
2. **Strategy (`calculoSaldoStrategy` - Comportamiento):** Adentro de la billetera, bajo el bloqueo de fila, se busca la estrategia correspondiente (`ingresoStrategy` o `egresoStrategy`) para resolver la cuenta matemática con precisión exacta de centavos.
3. **Cierre Atómico:** Con el saldo actualizado y persistido bajo `t`, el Facade guarda el comprobante en la tabla `Transaccion` y confirma la transacción completa. Si la estrategia detecta saldo insuficiente (409) o falla la base, la transacción del Facade revierte todo.

---

## 4. Precisión monetaria de punta a punta

La aplicación trata el dinero como un valor exacto, no como un `number` genérico:

- PostgreSQL guarda `saldo` y `monto` como `DECIMAL(14,2)`.
- Sequelize los devuelve como `string` y así se mantienen en la capa de aplicación.
- El backend calcula con `decimal.js` (`new Decimal(saldo).plus(monto)` o `.minus(monto)`) y serializa con `toFixed(2)`.
- El frontend suma en centavos (`Math.round(Number(monto) * 100)`) y formatea al final con `toLocaleString("es-AR")`.

Así se evita el error clásico de punto flotante (`0.10 + 0.20`) y el saldo coincide con lo que muestra la interfaz. La prueba `billeteraService.test.ts` cubre ese caso.

---

## 5. Pruebas automatizadas y CI

La lógica crítica está cubierta con Vitest:

- 35 tests de backend: Strategy (ingreso, egreso, saldo exacto, fondos insuficientes, precisión decimal), validaciones de usuarios y tarjetas, baja lógica y paginación, y autenticación (registro, login, recuperación y cambio de contraseña).
- 47 tests de frontend: períodos, filtros, calendario, agrupaciones y porciones del gráfico de gastos.

En total son 82 tests. El comando `pnpm check` ejecuta lint, typecheck y tests, y el workflow de GitHub Actions lo corre en cada push y pull request con Node 24 y pnpm 12.18.0. Eso permite detectar regresiones antes de integrar cambios. El detalle de los casos y la evidencia de calidad está en [Calidad y pruebas](calidad.md).

Además, las estrategias se prueban en memoria, sin base de datos, porque el patrón las mantiene desacopladas de la persistencia.
