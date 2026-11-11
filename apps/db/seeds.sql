-- ============================================================
-- Datos de prueba
-- Ejecutar en el SQL Editor de Supabase, después de schema.sql
-- ============================================================

-- Usuario demo
INSERT INTO "Usuarios" ("nombre", "email", "telefono")
VALUES ('Santiago De Dios', 'santiago@test.com', '2915555555')
ON CONFLICT ("email") DO NOTHING;

-- Categorías
INSERT INTO "Categoria" ("nombre", "descripcion")
VALUES
  ('sueldo',       'Ingreso por trabajo'),
  ('supermercado', 'Compras de comida'),
  ('transporte',   'Viajes y combustible'),
  ('ahorro',       'Dinero guardado'),
  ('otros',        'Sin categoría')
ON CONFLICT ("nombre") DO NOTHING;

-- Billeteras (saldo se calcula al final)
INSERT INTO "Billetera" ("idUsuario", "nombre", "tipo", "saldo")
SELECT u."id", v.nombre, v.tipo, 0
FROM "Usuarios" u
CROSS JOIN (VALUES
  ('Efectivo',         'cash'),
  ('Cuenta corriente', 'bank'),
  ('Caja de ahorro',   'savings')
) AS v(nombre, tipo)
WHERE u."email" = 'santiago@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM "Billetera" b
    WHERE b."idUsuario" = u."id" AND b."nombre" = v.nombre
  );

-- Tarjeta
INSERT INTO "Tarjeta" ("idUsuario", "tipo", "ultimosCuatro", "titular", "vencimiento")
SELECT u."id", 'visa', '5978', 'Santiago De Dios', '10/31'
FROM "Usuarios" u
WHERE u."email" = 'santiago@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM "Tarjeta" t
    WHERE t."idUsuario" = u."id" AND t."ultimosCuatro" = '5978'
  );

-- Suscripciones
INSERT INTO "Suscripcion" ("idUsuario", "idTarjeta", "proveedor", "plan", "monto", "diaCobro")
SELECT u."id", t."id", v.proveedor, v.plan, v.monto, v.diaCobro
FROM "Usuarios" u
LEFT JOIN "Tarjeta" t
  ON t."idUsuario" = u."id" AND t."ultimosCuatro" = '5978'
CROSS JOIN (VALUES
  ('Spotify',   'Spotify Premium', 4200.00, 10),
  ('Netflix',   'Netflix Estándar', 11500.00, 12),
  ('Anthropic', 'Claude Pro',      22000.00, 25)
) AS v(proveedor, plan, monto, diaCobro)
WHERE u."email" = 'santiago@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM "Suscripcion" s
    WHERE s."idUsuario" = u."id" AND s."proveedor" = v.proveedor
  );

-- Boletas (para Inicio)
INSERT INTO "Boleta" ("idUsuario", "tipoServicio", "monto", "fechaVencimiento", "pagada", "fechaPago")
SELECT u."id", v.tipoServicio, v.monto, v.fechaVencimiento::date, v.pagada, v.fechaPago::date
FROM "Usuarios" u
CROSS JOIN (VALUES
  ('luz',   5000.00, '2026-11-30', false, NULL),
  ('agua', 10000.00, '2026-11-30', false, NULL),
  ('gas',   3000.00, '2026-10-30', true,  '2026-10-28')
) AS v(tipoServicio, monto, fechaVencimiento, pagada, fechaPago)
WHERE u."email" = 'santiago@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM "Boleta" b
    WHERE b."idUsuario" = u."id"
      AND b."tipoServicio" = v.tipoServicio
      AND b."fechaVencimiento" = v.fechaVencimiento::date
  );

-- Transacciones
INSERT INTO "Transaccion" ("idBilletera", "monto", "tipo", "categoria", "fecha", "descripcion")
SELECT b."id", v.monto, v.tipo, v.categoria, v.fecha::date, v.descripcion
FROM "Billetera" b
JOIN "Usuarios" u ON u."id" = b."idUsuario"
CROSS JOIN (VALUES
  ('Efectivo',         'ingreso',  50000.00, 'otros',        '2026-09-01', 'Saldo inicial efectivo'),
  ('Cuenta corriente', 'ingreso', 250000.00, 'sueldo',       '2026-09-01', 'Sueldo septiembre'),
  ('Cuenta corriente', 'egreso',   25000.00, 'supermercado', '2026-09-03', 'Compra semanal'),
  ('Cuenta corriente', 'egreso',   12000.00, 'transporte',   '2026-09-05', 'Transporte'),
  ('Caja de ahorro',   'ingreso', 100000.00, 'ahorro',       '2026-09-02', 'Ahorro mensual')
) AS v(billetera, tipo, monto, categoria, fecha, descripcion)
WHERE u."email" = 'santiago@test.com'
  AND b."nombre" = v.billetera
  AND NOT EXISTS (
    SELECT 1 FROM "Transaccion" t
    WHERE t."idBilletera" = b."id" AND t."descripcion" = v.descripcion
  );

-- Recalcular saldo de las billeteras según sus transacciones
UPDATE "Billetera" b
SET "saldo" = COALESCE((
  SELECT SUM(CASE WHEN t."tipo" = 'ingreso' THEN t."monto" ELSE -t."monto" END)
  FROM "Transaccion" t
  WHERE t."idBilletera" = b."id"
), 0)
WHERE b."idUsuario" = (
  SELECT "id" FROM "Usuarios" WHERE "email" = 'santiago@test.com'
);