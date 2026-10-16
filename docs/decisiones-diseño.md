# Decisiones de Diseño y Arquitectura - Taller II (Grupo 23)

En este documento explicamos las dos decisiones de diseño aplicadas sobre el backend del MVP financiero: el patron Strategy para el calculo de saldos en billeteras y el patron Facade para coordinar el registro atomico de las transacciones.

## 1. Modulo Billeteras: Patron de Comportamiento (Strategy)
**Archivos involucrados:**
- `routes/billeteraRoutes.ts`
- `controllers/billeteraController.ts`
- `services/billeteraService.ts`
- `models/billetera.ts`

### 1. Codigo analizado
La logica de negocio encargada de tomar el saldo actual de la billetera, el monto de la operacion y el tipo de movimiento (`ingreso` o `egreso`) para determinar el nuevo saldo antes de persistirlo.

### 2. Diagnostico (Problema detectado y Code Smell)
Al procesar un movimiento financiero, las reglas de negocio varian segun la operacion:
- Un **ingreso** suma dinero y valida que no se superen topes permitidos.
- Un **egreso** debe verificar primero que la billetera cuente con fondos suficientes y restar el monto, devolviendo un error de conflicto de negocio (409) si el saldo no alcanza.

Si resolviamos esto dentro de una misma funcion acumulando condicionales (`if (tipo === 'ingreso') ... else if (tipo === 'egreso') ...`), juntabamos responsabilidades distintas en un solo bloque. Cada nueva regla financiera nos obligaria a entrar a modificar la misma funcion, violando el principio OCP y generando un punto de cambio fragil ante futuros cambios.

### 3. Alternativas evaluadas
- **Opcion A - Dejar un condicional simple (if/else):** Para dos ramas fijas era la opcion mas corta. La descartamos porque acoplaba calculos diferentes en un unico lugar y obligaba a tocar codigo existente cada vez que apareciera una regla nueva.
- **Opcion B - Implementar el patron Strategy:** Opcion elegida. Permite aislar cada variante matematica en clases independientes y puras en memoria.

### 4. Decision tomada
Implementamos el patron **Strategy**:
- Se definio un contrato comun a traves de la interfaz `CalculoSaldoStrategy` con el metodo `calcularSaldo(saldo, monto)`.
- Se crearon dos estrategias concretas: `IngresoStrategy` y `EgresoStrategy`. Cada una resuelve su calculo exclusivo en memoria utilizando precision decimal exacta (`decimal.js`).
- La funcion `calcularNuevoSaldo` en `billeteraService.ts` funciona como el contexto: recibe el tipo enviado por el cliente en runtime, selecciona la estrategia correspondiente de un mapa de estrategias y le delega el calculo.
- **Aclaracion clave de diseno:** La estrategia no consulta la base de datos ni aplica bloqueos. Es un algoritmo puro en memoria. La busqueda en la tabla `wallets`, el bloqueo pesimista de fila (`lock: t.LOCK.UPDATE`) y el guardado con la transaccion `t` quedan a cargo del servicio dentro de `aplicarMovimiento`.

### 5. Evidencia y Trade-offs
- **Evidencia en el codigo:** En `billeteraService.ts`, el mapa de estrategias selecciona la instancia correspondiente segun el parametro `tipo` recibido en la peticion HTTP.
- **Lo que ganamos:** Codigo cerrado a la modificacion y abierto a la extension (OCP). Se facilita el testing unitario de cada calculo matematico en memoria sin necesidad de levantar una base de datos real. Si el dia de mañana se suman transferencias, comisiones o retenciones, solo se agrega un archivo nuevo sin tocar los existentes.
- **El precio que pagamos:** Para un MVP de solo dos operaciones fijas (ingreso y egreso), crear interfaces y clases separadas suma mas archivos, rozando el overengineering.

---

## 2. Modulo Transacciones: Patron Estructural (Facade)
**Archivos involucrados:**
- `routes/transactionRoutes.ts`
- `controllers/transactionController.ts`
- `services/transactionServices.ts`
- `models/transaction.ts`

### 1. Codigo analizado
La funcion `registerTransaction` en `transactionServices.ts` y `crearTransaccion` en `transactionController.ts`.

### 2. Diagnostico (Problema detectado y Code Smell)
El registro de un movimiento de dinero puede tener complicaciones:
1. Validar que los montos sean correctos y operar con aritmetica decimal exacta (`decimal.js`).
2. Iniciar una transaccion atomica de base de datos (`sequelize.transaction(async t => ...)`).
3. Invocar al modulo de billeteras pasandole esa `t` para que aplique el bloqueo pesimista de fila (`lock: t.LOCK.UPDATE`) y actualice el saldo de forma segura contra concurrencia.
4. Persistir el comprobante del movimiento en la tabla de transacciones bajo la misma `t`.

Si el controlador (`transactionController`) coordinaba estos pasos directamente, violaba el Principio de Responsabilidad Unica (SRP) mezclando HTTP con Sequelize, ORM y locks. Ademas, existia un riesgo critico de inconsistencia: si fallaba el guardado del movimiento luego de haber actualizado el saldo, la base de datos quedaba rota con plata en el aire.

### 3. Alternativas evaluadas
- **Opcion A - Coordinar todo desde el controlador:** Descartada. Ensuciaba al controlador con llamadas a la base de datos, locks de Sequelize y transacciones atomicas que no le corresponden a la capa web.
- **Opcion B - Crear una clase separada TransactionFacade:** Descartada por overengineering. Crear un archivo y una clase extra solo para eso agregaba complejidad innecesaria.
- **Opcion C - Usar el servicio existente como Facade:** Opcion elegida. Resolver la operacion unificada directamente en `transactionServices.registerTransaction`.

### 4. Decision tomada
Implementamos el patron **Facade** en la funcion `registerTransaction`:
- El controlador solo le pasa los datos limpios recibidos del cliente y se desentiende de la complejidad interna.
- Adentro, el facade administra el ciclo de vida de la transaccion atomica `t`, llama a `billeteraService.aplicarMovimiento(..., t)` y registra la fila en `Transaction.create(..., { transaction: t })`.
- Si todo sale bien, Sequelize confirma los cambios. Si cualquier paso falla, se ejecuta un `rollback` automatico y se cancela todo, garantizando consistencia absoluta (todo o nada).

### 5. Evidencia y Trade-offs
- **Evidencia en el codigo:** `registerTransaction` abre el bloque `sequelize.transaction`, coordina la billetera con el lock pesimista y guarda la transaccion bajo la misma variable `t`.
- **Lo que ganamos:** El controlador queda corto y enfocado unicamente en el protocolo HTTP. Se blinda el sistema impidiendo que cualquier parte registre movimientos salteandose la transaccion atomica o el bloqueo de fila.
- **El precio que pagamos:** Agregamos un paso intermedio para seguir el camino del codigo, hay que navegar entre controlador, servicio de transacciones y servicio de billeteras. Ademas, debemos cuidar que el facade no absorba logica de negocio ajena (por eso delega el calculo y descuento de fondos en `billeteraService`).

---

## 3. Como colaboran ambos patrones en el flujo real

Ambos patrones resuelven tensiones distintas pero colaboran durante una operacion:

1. **Facade (`registerTransaction` - Estructural):** Recibe el pedido desde el controlador, abre la transaccion atomica `t` en la base de datos y seleccioa el flujo general. No calcula saldos por su cuenta, llama a `billeteraService.aplicarMovimiento(..., t)`.
2. **Strategy (`CalculoSaldoStrategy` - Comportamiento):** Adentro de la billetera, bajo el bloqueo de fila, se busca la estrategia correspondiente (`IngresoStrategy` o `EgresoStrategy`) para resolver la cuenta matematica con precision exacta de centavos.
3. **Cierre Atomico:** Con el saldo actualizado y persistido bajo `t`, el Facade guarda el comprobante en la tabla `transactions` y confirma la transaccion completa. Si la estrategia detecta saldo insuficiente (409) o falla la base, la transaccion de la Fachada revierte todo.