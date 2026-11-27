import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../../utils/httpError.js";
import { validarPassword } from "../../utils/password.js";
import PasswordResetToken from "../models/passwordResetToken.js";
import User from "../models/user.js";
import {
  cambiarPassword,
  iniciarSesion,
  registrarUsuario,
  restablecerPassword,
  solicitarRecuperacion,
} from "./authService.js";

vi.mock("../models/user.js", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
    unscoped: vi.fn(),
  },
}));

vi.mock("../models/passwordResetToken.js", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const PASSWORD = "Secreta123";

function usuarioBase(extra: Record<string, unknown> = {}) {
  return {
    id: 7,
    nombre: "Ana Perez",
    email: "ana@mail.com",
    telefono: null,
    rol: "usuario",
    activo: true,
    passwordHash: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    save: vi.fn().mockResolvedValue(undefined),
    ...extra,
  };
}

function mockUnscoped(
  usuario: unknown,
  metodo: "findOne" | "findByPk" = "findOne",
) {
  const findOne = vi.fn().mockResolvedValue(metodo === "findOne" ? usuario : null);
  const findByPk = vi
    .fn()
    .mockResolvedValue(metodo === "findByPk" ? usuario : null);
  vi.mocked(User.unscoped).mockReturnValue({ findOne, findByPk } as never);
  return { findOne, findByPk };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(PasswordResetToken.update).mockResolvedValue([0] as never);
  vi.mocked(PasswordResetToken.create).mockResolvedValue({} as never);
});

describe("validarPassword", () => {
  it("rechaza contraseñas demasiado cortas", () => {
    expect(() => validarPassword("corta")).toThrow(HttpError);
  });

  it("acepta una contraseña válida", () => {
    expect(validarPassword(PASSWORD)).toBe(PASSWORD);
  });
});

describe("iniciarSesion", () => {
  it("devuelve token y usuario sin el hash", async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const { findOne } = mockUnscoped(usuarioBase({ passwordHash: hash }));

    const resultado = await iniciarSesion({
      email: "ANA@MAIL.COM",
      password: PASSWORD,
    });

    expect(findOne).toHaveBeenCalledWith({ where: { email: "ana@mail.com" } });
    expect(typeof resultado.token).toBe("string");
    expect(resultado.usuario).not.toHaveProperty("passwordHash");
    expect(resultado.usuario.id).toBe(7);
  });

  it("rechaza credenciales inválidas", async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    mockUnscoped(usuarioBase({ passwordHash: hash }));

    await expect(
      iniciarSesion({ email: "ana@mail.com", password: "Incorrecta123" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rechaza usuarios sin contraseña configurada", async () => {
    mockUnscoped(usuarioBase());

    await expect(
      iniciarSesion({ email: "ana@mail.com", password: PASSWORD }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rechaza cuentas deshabilitadas con credenciales correctas", async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    mockUnscoped(usuarioBase({ passwordHash: hash, activo: false }));

    await expect(
      iniciarSesion({ email: "ana@mail.com", password: PASSWORD }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("registrarUsuario", () => {
  it("crea el usuario, hashea la contraseña y devuelve token", async () => {
    const usuario = usuarioBase();
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(User.create).mockResolvedValue(usuario as never);

    const resultado = await registrarUsuario({
      nombre: "Ana Perez",
      email: "ana@mail.com",
      password: PASSWORD,
    });

    expect(usuario.save).toHaveBeenCalled();
    expect(usuario.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(typeof resultado.token).toBe("string");
    expect(resultado.usuario).not.toHaveProperty("passwordHash");
  });
});

describe("solicitarRecuperacion", () => {
  it("responde genérico y no crea token si el email no existe", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);

    const resultado = await solicitarRecuperacion("nadie@mail.com");

    expect(resultado.resetUrl).toBeUndefined();
    expect(PasswordResetToken.create).not.toHaveBeenCalled();
  });

  it("crea un token hasheado y devuelve el link en desarrollo", async () => {
    vi.mocked(User.findOne).mockResolvedValue(usuarioBase() as never);

    const resultado = await solicitarRecuperacion(
      "ana@mail.com",
      "http://localhost:5173",
    );

    expect(PasswordResetToken.update).toHaveBeenCalled();
    expect(PasswordResetToken.create).toHaveBeenCalledTimes(1);
    expect(resultado.resetUrl).toContain("/reset-password?token=");

    const creado = vi.mocked(PasswordResetToken.create).mock.calls[0]?.[0];
    expect(creado).toBeDefined();
    if (!creado) throw new Error("No se creó el token de recuperación.");
    expect(creado.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(creado.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("restablecerPassword", () => {
  it("rechaza tokens usados o vencidos", async () => {
    vi.mocked(PasswordResetToken.findOne).mockResolvedValue({
      idUsuario: 7,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    } as never);

    await expect(
      restablecerPassword({ token: "token-vencido", password: PASSWORD }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("actualiza la contraseña y consume el token", async () => {
    const token = "token-valido";
    const hashToken = createHash("sha256").update(token).digest("hex");
    const usuario = usuarioBase();
    vi.mocked(PasswordResetToken.findOne).mockResolvedValue({
      idUsuario: 7,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(User.findByPk).mockResolvedValue(usuario as never);

    const resultado = await restablecerPassword({
      token,
      password: "NuevaClave123",
    });

    expect(PasswordResetToken.findOne).toHaveBeenCalledWith({
      where: { tokenHash: hashToken },
    });
    expect(usuario.save).toHaveBeenCalled();
    expect(usuario.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(PasswordResetToken.update).toHaveBeenCalled();
    expect(resultado.mensaje).toContain("actualizada");
  });
});

describe("cambiarPassword", () => {
  it("rechaza si la contraseña actual no coincide", async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    mockUnscoped(usuarioBase({ passwordHash: hash }), "findByPk");

    await expect(
      cambiarPassword(7, {
        passwordActual: "OtraClave123",
        passwordNueva: "NuevaClave123",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("actualiza la contraseña cuando la actual es correcta", async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const usuario = usuarioBase({ passwordHash: hash });
    mockUnscoped(usuario, "findByPk");

    const resultado = await cambiarPassword(7, {
      passwordActual: PASSWORD,
      passwordNueva: "NuevaClave123",
    });

    expect(usuario.save).toHaveBeenCalled();
    expect(resultado.mensaje).toBe("Contraseña actualizada.");
  });
});
