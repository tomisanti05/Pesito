import { describe, it, expect, vi, beforeEach } from "vitest";
import Billetera from "../models/billetera.js";
import { calcularNuevoSaldo, aplicarMovimiento } from "./billeteraService.js";

vi.mock("../models/user.js", () => ({ default: { findByPk: vi.fn() } }));
vi.mock("../models/billetera.js", () => ({ default: { findByPk: vi.fn() } }));

function capturar(accion: () => unknown) {
  try {
    accion();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("calcularNuevoSaldo", () => {
  it("el ingreso suma", () => {
    expect(calcularNuevoSaldo("100.00", "ingreso", "25.50")).toBe("125.50");
  });

  it("el egreso resta", () => {
    expect(calcularNuevoSaldo("100.00", "egreso", "25.50")).toBe("74.50");
  });

  it("permite gastar exactamente el saldo", () => {
    expect(calcularNuevoSaldo("50.00", "egreso", "50.00")).toBe("0.00");
  });

  it("rechaza un egreso mayor al saldo con 409", () => {
    const error = capturar(() => calcularNuevoSaldo("50.00", "egreso", "50.01"));
    expect(error).toMatchObject({ status: 409 });
  });

  it("rechaza monto cero con 400", () => {
    const error = capturar(() => calcularNuevoSaldo("50.00", "ingreso", "0"));
    expect(error).toMatchObject({ status: 400 });
  });

  it("rechaza monto negativo con 400", () => {
    const error = capturar(() => calcularNuevoSaldo("50.00", "ingreso", "-5"));
    expect(error).toMatchObject({ status: 400 });
  });

  it("rechaza un tipo invalido con 400", () => {
    const error = capturar(() => calcularNuevoSaldo("50.00", "transferencia", "10"));
    expect(error).toMatchObject({ status: 400 });
  });

  it("no pierde precision decimal", () => {
    expect(calcularNuevoSaldo("0.10", "ingreso", "0.20")).toBe("0.30");
  });
});

describe("aplicarMovimiento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("actualiza el saldo y lo guarda dentro de la transaccion", async () => {
    const save = vi.fn();
    vi.mocked(Billetera.findByPk).mockResolvedValue({ saldo: "100.00", save } as never);
    const t = { LOCK: { UPDATE: "UPDATE" } } as never;

    const resultado = await aplicarMovimiento(1, "ingreso", "25.50", t);

    expect(resultado.saldo).toBe("125.50");
    expect(save).toHaveBeenCalledWith({ transaction: t });
  });
});
