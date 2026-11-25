import { beforeEach, describe, expect, it, vi } from "vitest";
import User from "../models/user.js";
import {
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
  listarUsuarios,
} from "./userServices.js";

vi.mock("../models/user.js", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
    findAndCountAll: vi.fn(),
  },
}));

describe("crearUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("guarda el telefono cuando se envia", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(User.create).mockResolvedValue({ id: 1 } as never);

    await crearUsuario({
      nombre: "Ana",
      email: "ANA@MAIL.COM",
      telefono: " 123 456 ",
    } as never);

    expect(User.create).toHaveBeenCalledWith({
      nombre: "Ana",
      email: "ana@mail.com",
      telefono: "123 456",
    });
  });
});

describe("editarUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("actualiza los datos enviados", async () => {
    const usuario = {
      id: 1,
      nombre: "Ana",
      email: "ana@mail.com",
      telefono: null,
      rol: "usuario",
      activo: true,
      save: vi.fn(),
    };
    vi.mocked(User.findByPk).mockResolvedValue(usuario as never);
    vi.mocked(User.findOne).mockResolvedValue(null);

    const actualizado = await editarUsuario(1, {
      nombre: "Ana Gomez",
      telefono: "123 456",
    });

    expect(actualizado.nombre).toBe("Ana Gomez");
    expect(actualizado.telefono).toBe("123 456");
    expect(usuario.save).toHaveBeenCalled();
  });

  it("rechaza una edicion vacia", async () => {
    await expect(editarUsuario(1, {})).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rechaza un email ya usado por otro usuario", async () => {
    vi.mocked(User.findByPk).mockResolvedValue({
      id: 1,
      save: vi.fn(),
    } as never);
    vi.mocked(User.findOne).mockResolvedValue({ id: 2 } as never);

    await expect(
      editarUsuario(1, { email: "otro@mail.com" }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("eliminarUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("da de baja al usuario sin borrarlo", async () => {
    const usuario = {
      id: 1,
      activo: true,
      save: vi.fn(),
    };
    vi.mocked(User.findByPk).mockResolvedValue(usuario as never);

    const resultado = await eliminarUsuario(1);

    expect(resultado.activo).toBe(false);
    expect(usuario.save).toHaveBeenCalled();
  });
});

describe("listarUsuarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve el listado paginado", async () => {
    vi.mocked(User.findAndCountAll).mockResolvedValue({
      rows: [{ id: 1 }],
      count: 1,
    } as never);

    const resultado = await listarUsuarios(
      {
        page: 2,
        limit: 5,
        offset: 5,
        order: [["id", "ASC"]],
        search: "ana",
      },
      { rol: "admin", activo: true },
    );

    expect(resultado).toEqual({
      data: [{ id: 1 }],
      total: 1,
      page: 2,
      limit: 5,
    });
    expect(User.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5, offset: 5, order: [["id", "ASC"]] }),
    );
  });
});
