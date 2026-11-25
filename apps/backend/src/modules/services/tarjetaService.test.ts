import { beforeEach, describe, expect, it, vi } from "vitest";
import User from "../models/user.js";
import Tarjeta from "../models/tarjeta.js";
import {
  crearTarjeta,
  editarTarjeta,
  eliminarTarjeta,
  listarTarjetas,
} from "./tarjetaService.js";

vi.mock("../models/user.js", () => ({
  default: { findByPk: vi.fn() },
}));

vi.mock("../models/tarjeta.js", () => ({
  default: {
    findByPk: vi.fn(),
    create: vi.fn(),
    findAndCountAll: vi.fn(),
  },
}));

describe("crearTarjeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea una tarjeta con los datos normalizados", async () => {
    vi.mocked(User.findByPk).mockResolvedValue({ id: 1, activo: true } as never);
    vi.mocked(Tarjeta.create).mockResolvedValue({ id: 1 } as never);

    await crearTarjeta({
      idUsuario: 1,
      tipo: "visa",
      ultimosCuatro: " 1234 ",
      titular: "Ana Perez",
      vencimiento: "12/30",
    });

    expect(Tarjeta.create).toHaveBeenCalledWith({
      idUsuario: 1,
      tipo: "visa",
      ultimosCuatro: "1234",
      titular: "Ana Perez",
      vencimiento: "12/30",
      activa: true,
    });
  });

  it("rechaza los ultimos cuatro numericos", async () => {
    vi.mocked(User.findByPk).mockResolvedValue({ id: 1, activo: true } as never);

    await expect(
      crearTarjeta({
        idUsuario: 1,
        tipo: "visa",
        ultimosCuatro: 1234 as never,
        titular: "Ana Perez",
        vencimiento: "12/30",
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rechaza un usuario inactivo", async () => {
    vi.mocked(User.findByPk).mockResolvedValue({ id: 1, activo: false } as never);

    await expect(
      crearTarjeta({
        idUsuario: 1,
        tipo: "visa",
        ultimosCuatro: "1234",
        titular: "Ana Perez",
        vencimiento: "12/30",
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("editarTarjeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("actualiza los datos enviados", async () => {
    const tarjeta = {
      id: 1,
      tipo: "visa",
      ultimosCuatro: "1234",
      titular: "Ana Perez",
      vencimiento: "12/30",
      activa: true,
      save: vi.fn(),
    };
    vi.mocked(Tarjeta.findByPk).mockResolvedValue(tarjeta as never);

    const actualizada = await editarTarjeta(1, {
      titular: "Ana Gomez",
      activa: false,
    });

    expect(actualizada.titular).toBe("Ana Gomez");
    expect(actualizada.activa).toBe(false);
    expect(tarjeta.save).toHaveBeenCalled();
  });

  it("no permite cambiar el propietario", async () => {
    vi.mocked(Tarjeta.findByPk).mockResolvedValue({
      id: 1,
      save: vi.fn(),
    } as never);

    await expect(
      editarTarjeta(1, { idUsuario: 2 } as never),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("eliminarTarjeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("elimina la tarjeta", async () => {
    const destroy = vi.fn();
    vi.mocked(Tarjeta.findByPk).mockResolvedValue({ id: 1, destroy } as never);

    await eliminarTarjeta(1);

    expect(destroy).toHaveBeenCalled();
  });
});

describe("listarTarjetas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve el listado paginado", async () => {
    vi.mocked(Tarjeta.findAndCountAll).mockResolvedValue({
      rows: [{ id: 1 }],
      count: 1,
    } as never);

    const resultado = await listarTarjetas(
      {
        page: 1,
        limit: 10,
        offset: 0,
        order: [["id", "ASC"]],
        search: null,
      },
      { idUsuario: 1, activa: true, tipo: "visa" },
    );

    expect(resultado).toEqual({
      data: [{ id: 1 }],
      total: 1,
      page: 1,
      limit: 10,
    });
    expect(Tarjeta.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 0, order: [["id", "ASC"]] }),
    );
  });
});
