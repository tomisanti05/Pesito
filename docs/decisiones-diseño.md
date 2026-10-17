# Decisiones de Diseño y Arquitectura - Taller II (Grupo 23)

En este documento explicamos las dos decisiones de diseño aplicadas sobre el backend del MVP financiero: el patron Strategy para el calculo de saldos en billeteras y el patron Facade para coordinar el registro atomico de las transacciones.

## 1. Modulo Billeteras: Patron de Comportamiento (Strategy)
**Archivos involucrados:**
- `routes/billeteraRoutes.ts`
- `controllers/billeteraController.ts`
- `services/billeteraService.ts`
- `models/billetera.ts`

### 1. Estructura de Defensa para el Coloquio
- **El Problema (Code Smell):**
  - *Contexto:* Sumar un ingreso (validando límites de almacenamiento) y restar un egreso (verificando fondos disponibles y lanzando error 409 si el saldo no alcanza) tienen reglas de negocio muy distintas.
  - *Falla:* Resolver todo en una misma función usando condicionales (if / else if) acumula responsabilidades y rompe el principio Open/Closed (OCP).
- **La Alternativa Descartada:**
  - *Opción:* Usar una función simple con un if/else, como contempla el documento del MVP para dos ramas.
  - *Por qué se descartó:* Acopla toda la lógica en un solo bloque y obliga a modificar esa misma función cada vez que cambie o se agregue una regla financiera.
- **La Solución (Patrón Strategy - Clase 6):**
  - *Contrato común:* Se creó la interfaz `CalculoSaldoStrategy` con el método `calcularSaldo(saldo, monto)`.
  - *Estrategias aisladas:* `IngresoStrategy` y `EgresoStrategy` encapsulan sus propias reglas por separado.
  - *Contexto:* La función `calcularNuevoSaldo` recibe la operación y delega el cálculo en tiempo de ejecución (runtime) sin hacer la cuenta directamente.
- **Costo vs. Beneficio (Trade-off):**
  - *Costo asumido:* Mayor cantidad de archivos e indirección para un MVP de solo dos operaciones.
  - *Beneficio:* Permite hacer tests unitarios en memoria (sin tocar la base de datos) y prepara el sistema para agregar reglas futuras (retenciones, tarjetas, etc.) sin tocar el flujo transaccional ni el consumidor.

### 2. Posibles Preguntas de los Docentes
- **¿Por qué la estrategia no consulta ni guarda en la base de datos?**
  - *Idea clave:* Strategy solo aísla el algoritmo matemático para que sea exacto y esté desacoplado de la persistencia.
  - *Quién lo hace:* `walletServices.ts` (dentro de `aplicarMovimiento`) es quien busca la fila, la bloquea (`lock: t.LOCK.UPDATE`) y guarda los cambios usando la transacción `t`.
- **¿Quién y cómo elige la estrategia en tiempo de ejecución?**
  - *Idea clave:* Se elige en runtime según el campo `tipo` ("ingreso" o "egreso") que envía el usuario en la petición HTTP.
  - *Cómo funciona:* Ese valor busca la estrategia en un diccionario (`Record<string, CalculoSaldoStrategy>`). Si el tipo no existe en el mapa, se rechaza con un error 400.

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