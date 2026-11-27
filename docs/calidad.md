# Calidad del Código y Pruebas

En este documento se presentan los casos de prueba seleccionados para el proyecto y la evidencia de revisión y mejora de calidad aplicada sobre el código. La selección se realizó por riesgo de negocio: se priorizaron los comportamientos donde un error impacta directamente en el saldo, la autenticación, los datos personales o la interpretación de fechas.

## Criterio de selección

Para cada regla se definieron la entrada, el resultado esperado y el tipo de caso antes de escribir el test. Se utilizaron tres categorías:

- **Normal:** el camino esperado de la regla.
- **Límite:** la frontera donde cambia la decisión (por ejemplo, gastar exactamente el saldo disponible).
- **Error:** una entrada inválida o un estado no permitido.

No todas las reglas requieren los tres tipos: se eligieron los casos que aportan evidencia sobre el comportamiento crítico. Los tests siguen la estructura Arrange → Act → Assert, se ejecutan con Vitest y usan mocks de los modelos, por lo que no dependen de la base de datos y son deterministas.

## Casos seleccionados y justificados

### Billeteras y saldo

| Caso | Tipo | Por qué se eligió |
| --- | --- | --- |
| Ingreso: 100,00 + 25,50 = 125,50 | Normal | Verifica el camino principal de acreditación y la conservación de dos decimales. |
| Egreso: 100,00 − 25,50 = 74,50 | Normal | Verifica el camino principal de débito. |
| Egreso por el saldo exacto: 50,00 − 50,00 = 0,00 | Límite | Cubre la frontera entre una operación válida y fondos insuficientes. |
| Egreso mayor al saldo: 50,01 con saldo 50,00 → 409 | Error | Impide saldos negativos y comprueba el código de conflicto. |
| Monto cero, negativo o tipo inválido → 400 | Error | Valida el contrato de entrada antes de modificar el saldo. |
| Precisión decimal: 0,10 + 0,20 = 0,30 | Límite | Protege el cálculo monetario del error clásico de punto flotante. |
| Aplicar movimiento dentro de una transacción | Normal | Comprueba que la persistencia del saldo ocurra en la misma transacción. |

### Autenticación

| Caso | Tipo | Por qué se eligió |
| --- | --- | --- |
| Login correcto devuelve token y usuario sin el hash | Normal | El contrato de sesión no debe exponer la contraseña almacenada. |
| Credenciales inválidas | Error | Rechaza el acceso sin revelar si el usuario existe. |
| Usuario sin contraseña configurada | Error | Cubre cuentas creadas sin credenciales. |
| Cuenta deshabilitada con credenciales correctas | Error | El estado de la cuenta se valida incluso con la contraseña correcta. |
| Registro hashea la contraseña y devuelve token | Normal | Asegura que la contraseña nunca se guarde en texto plano. |
| Recuperación con email inexistente responde de forma genérica | Error | Evita filtrar qué correos están registrados. |
| Token de recuperación hasheado y link en desarrollo | Normal | El token se almacena de forma segura y el flujo es utilizable. |
| Token usado o vencido | Límite temporal | El token es de un solo uso y tiene vencimiento. |
| Restablecer contraseña consume el token | Normal | Cierra el flujo de recuperación. |
| Cambio de contraseña con la actual incorrecta | Error | Valida la identidad antes de cambiar la credencial. |
| Cambio de contraseña con la actual correcta | Normal | Actualiza la credencial y confirma el camino exitoso. |
| Contraseña demasiado corta / contraseña válida | Límite | Verifica la longitud mínima aceptada. |

### Usuarios y tarjetas

| Caso | Tipo | Por qué se eligió |
| --- | --- | --- |
| Crear usuario normaliza email y teléfono | Normal | Los datos se guardan consistentes, con el email en minúsculas y sin espacios. |
| Editar los datos enviados | Normal | Comprueba la actualización parcial del usuario. |
| Edición vacía → 400 | Error | No se acepta una operación sin cambios. |
| Email ya usado por otro usuario | Error | Protege la unicidad del dato. |
| Baja lógica del usuario | Normal | Conserva el historial y evita el borrado físico. |
| Listado paginado | Normal | Verifica el contrato de paginación. |
| Crear tarjeta con datos normalizados | Normal | Los últimos cuatro se guardan sin espacios y la tarjeta queda activa por defecto. |
| Últimos cuatro numéricos → error | Error | El contrato exige un string para ese campo. |
| Usuario inactivo → error | Error | No se asignan tarjetas a cuentas deshabilitadas. |
| Editar tarjeta | Normal | Actualiza los datos enviados. |
| Cambio de propietario → error | Error | La tarjeta no puede reasignarse a otro usuario. |
| Eliminar tarjeta y listar el recurso | Normal | Cubre la baja y la consulta paginada. |

### Períodos, calendario y resumen de gastos

| Caso | Tipo | Por qué se eligió |
| --- | --- | --- |
| Mes actual, mes anterior y últimos tres meses | Normal | Verifica los rangos de período más usados. |
| Mes anterior en enero | Límite | Cubre el cruce de año. |
| Año bisiesto (29 de febrero) | Límite | Evita errores en el cálculo de días. |
| Rango personalizado y extremos inclusivos | Límite | No se pierden movimientos del primer ni del último día. |
| Rango que cruza de año | Límite | Comprueba la comparación de fechas entre años. |
| Calendario de 42 celdas que empieza lunes | Límite | Mantiene estable la grilla del calendario. |
| Etiquetas de período para atajos, mes, año y rangos | Normal | Verifica los textos que ve el usuario. |
| Meses con datos y límites de años | Normal | Alimenta los indicadores y el selector de años. |
| Mes o fecha futura | Límite | No se habilitan períodos futuros. |
| Selección de un rango con uno o dos clics | Normal | Cubre la interacción principal del calendario. |
| Inversión de extremos y rango de un solo día | Límite | Resuelve los casos particulares de selección. |
| Agrupación de egresos por categoría y billetera | Normal | Resume los gastos para el gráfico. |
| Totales de ingreso y egreso | Normal | Verifica la separación de ambos tipos de movimiento. |
| Porciones del gráfico y total cero | Límite | Evita divisiones por cero y agrupa el resto en “Otras”. |

## Evidencia de revisión y mejora de calidad

| Mejora aplicada | Qué aporta | Evidencia |
| --- | --- | --- |
| Precisión monetaria con `decimal.js` | Evita errores de punto flotante; PostgreSQL usa `DECIMAL(14,2)` y la aplicación conserva los valores como strings. | `billeteraService.ts`, `docs/decisiones-diseño.md` §4, test de `0,10 + 0,20`. |
| Registro atómico de movimientos | El saldo y el comprobante se guardan en la misma transacción; si falla un paso, se revierte todo. | `transactionServices.ts`, `docs/decisiones-diseño.md` §2. |
| Códigos de error explícitos | Las respuestas distinguen validación (400), recurso inexistente (404) y conflicto (409). | `utils/httpError.ts`, tests de billeteras, usuarios y autenticación. |
| Paginación y orden centralizados | Una sola implementación de `page`, `limit` y `offset`, con tope de 100 y lista blanca de campos de orden. | `utils/pagination.ts`, tests de listados. |
| Baja lógica de usuarios | Conserva el historial y evita el borrado físico. | `userServices.ts`, test “da de baja al usuario sin borrarlo”. |
| Normalización de datos de entrada | Emails en minúsculas, teléfonos y últimos cuatro sin espacios; menos duplicados y datos más consistentes. | Tests de usuarios y tarjetas. |
| Calidad automatizada | ESLint con `typescript-eslint`, TypeScript en modo `strict`, `pnpm check` y CI en cada push y pull request. | `apps/*/eslint.config.js`, `apps/backend/tsconfig.json`, `.github/workflows/ci.yml`. |
| Integración mediante Pull Requests | Cada cambio se integra por PR y CI valida lint, tipos y tests antes del merge. | Historial de PRs del repositorio. |
| Configuración de la suite de pruebas | Vitest ejecuta las pruebas desde `src` y excluye `dist`, de modo que cada test se ejecuta una sola vez. | `apps/backend/vitest.config.ts`; la suite reporta 4 archivos y 35 tests en backend. |
| Entorno reproducible | Node 24 y pnpm 12.18.0 fijados en `engines` y `packageManager`; CI usa las mismas versiones. | `package.json`, `.github/workflows/ci.yml`. |

## Verificación automatizada

| Área | Tests | Archivos |
| --- | --- | --- |
| Backend | 35 | 4 |
| Frontend | 47 | 2 |
| **Total** | **82** | **6** |

Los 82 tests pasan con el comando único del proyecto:

```bash
pnpm check
```

Ese comando ejecuta, en orden, `lint`, `typecheck` y `test` en todos los paquetes. El workflow de GitHub Actions (`.github/workflows/ci.yml`) ejecuta el mismo comando en cada push y pull request con Node 24 y pnpm 12.18.0.

Los tests de backend usan mocks de los modelos y los de frontend trabajan con datos en memoria; por eso la suite es rápida, determinista y no necesita una base de datos para correr.

### Comandos disponibles

| Comando | Qué hace |
| --- | --- |
| `pnpm test` | Ejecuta Vitest en backend y frontend. |
| `pnpm lint` | Ejecuta ESLint en los paquetes. |
| `pnpm typecheck` | Verifica los tipos con TypeScript. |
| `pnpm check` | Ejecuta lint, typecheck y tests. |

La suite se apoya en Vitest 5, el framework de pruebas del stack del proyecto.
