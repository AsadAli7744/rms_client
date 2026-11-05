export type Option<T = string> = { label: string; value: T; disabled?: boolean };

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type ApiErrorBody = {
  message?: string | string[];
  statusCode?: number;
  error?: string;
};

export type DateRangeValue = { from: string; to: string };

export type SortParams = { sortBy?: string; sortDir?: "asc" | "desc" };

export type TableQueryParams = {
  page: number;
  limit: number;
  q?: string;
} & SortParams;
