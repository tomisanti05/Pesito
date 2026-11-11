export type SortOrder = "ASC" | "DESC";

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  order: [string, SortOrder][];
  search: string | null;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parseEntero(valor: unknown, porDefecto: number): number {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : porDefecto;
}

/**
 * Normaliza los parametros de paginado/busqueda/orden de un request.
 * Ej: ?page=2&limit=5&sortBy=nombre&order=asc&search=efe
 */
export function parsePagination(
  query: Record<string, unknown>,
  allowedSortBy: readonly string[],
  defaultSortBy = allowedSortBy[0] ?? "id",
): PaginationParams {
  const page = parseEntero(query.page, DEFAULT_PAGE);
  const limit = Math.min(parseEntero(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const offset = (page - 1) * limit;

  const sortBySolicitado = String(query.sortBy ?? "");
  const sortBy = allowedSortBy.includes(sortBySolicitado)
    ? sortBySolicitado
    : defaultSortBy;

  const orderSolicitado = String(query.order ?? "asc").toLowerCase();
  const sortOrder: SortOrder = orderSolicitado === "desc" ? "DESC" : "ASC";

  const searchBruto = String(query.search ?? "").trim();
  const search = searchBruto.length > 0 ? searchBruto : null;

  return {
    page,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    search,
  };
}
