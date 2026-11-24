const API_V1 = "/api/v1";

// Usuario fijo mientras el login sea mock.
export const ID_USUARIO = 1;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
  }
}

function construirUrl(path: string): string {
  return path.startsWith("/api/") ? path : `${API_V1}${path}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(construirUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const esJson = respuesta.headers
    .get("content-type")
    ?.includes("application/json");
  const cuerpo = esJson ? await respuesta.json() : null;

  if (!respuesta.ok) {
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
