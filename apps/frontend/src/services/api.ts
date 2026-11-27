const API_V1 = "/api/v1";

// Clave bajo la que se guarda el token JWT en localStorage.
const CLAVE_TOKEN = "sgf_token";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
  }
}

export function guardarToken(token: string): void {
  localStorage.setItem(CLAVE_TOKEN, token);
}

export function leerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function borrarToken(): void {
  localStorage.removeItem(CLAVE_TOKEN);
}

function construirUrl(path: string): string {
  return path.startsWith("/api/") ? path : `${API_V1}${path}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = leerToken();

  const respuesta = await fetch(construirUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const esJson = respuesta.headers
    .get("content-type")
    ?.includes("application/json");
  const cuerpo = esJson ? await respuesta.json() : null;

  if (!respuesta.ok) {
    // Sesión inválida o expirada: limpiamos el token guardado.
    if (respuesta.status === 401 && leerToken()) {
      borrarToken();
    }

    const mensaje =
      cuerpo && typeof cuerpo.mensaje === "string"
        ? cuerpo.mensaje
        : cuerpo && typeof cuerpo.error === "string"
          ? cuerpo.error
          : `Error ${respuesta.status}`;
    throw new ApiError(respuesta.status, mensaje);
  }

  return cuerpo as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T>(path: string, data: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function apiPatch<T>(path: string, data: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}
