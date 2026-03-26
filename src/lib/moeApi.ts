const DEFAULT_BASE_URL = "https://api.moe-africa.com";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class MoeApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "MoeApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getBaseUrl() {
  // Prefer Vite env, fall back to the documented base URL.
  const envBaseUrl = import.meta.env?.VITE_MOE_API_BASE_URL as string | undefined;
  return envBaseUrl || DEFAULT_BASE_URL;
}

const ACCESS_TOKEN_KEY = "moe_access_token";
const REFRESH_TOKEN_KEY = "moe_refresh_token";

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function getAuthHeaderValue(accessToken: string) {
  // We don't know the original header convention from the base docs,
  // so default to the common JWT format and allow override.
  const prefix = (import.meta.env?.VITE_MOE_AUTH_PREFIX as string | undefined) || "Bearer";
  return `${prefix} ${accessToken}`;
}

function buildUrl(path: string, query?: Record<string, unknown>) {
  const baseUrl = getBaseUrl();
  const url = new URL(path.startsWith("/") ? path : `/${path}`, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      // Support passing arrays to be encoded as repeated query params.
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, String(v));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function parseErrorBody(res: Response) {
  try {
    const json = await res.json();
    return json;
  } catch {
    return undefined;
  }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const url = buildUrl("/auth/refresh-token");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const json = await res.json();
  if (typeof json?.token !== "string" || typeof json?.refreshToken !== "string") return null;

  setTokens(json.token, json.refreshToken);
  return json.token as string;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  {
    query,
    body,
    retryOn401 = true,
  }: { query?: Record<string, unknown>; body?: unknown; retryOn401?: boolean } = {}
): Promise<T> {
  const accessToken = getAccessToken();

  const url = buildUrl(path, query);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    // Common convention: Authorization: Bearer <token>
    headers.Authorization = getAuthHeaderValue(accessToken);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && retryOn401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(method, path, { query, body, retryOn401: false });
    }
  }

  if (!res.ok) {
    const errJson = await parseErrorBody(res);
    const message =
      (typeof errJson?.message === "string" && errJson.message) ||
      (typeof errJson?.error === "string" && errJson.error) ||
      `Request failed with status ${res.status}`;
    const code = typeof errJson?.code === "string" ? errJson.code : undefined;
    throw new MoeApiError(message, res.status, code, errJson);
  }

  return (await res.json()) as T;
}

export async function apiGet<T>(path: string, query?: Record<string, unknown>) {
  return request<T>("GET", path, { query });
}

export async function apiPost<T>(path: string, body?: unknown, query?: Record<string, unknown>) {
  return request<T>("POST", path, { query, body });
}

export async function apiPatch<T>(path: string, body?: unknown, query?: Record<string, unknown>) {
  return request<T>("PATCH", path, { query, body });
}

export async function apiDelete<T = void>(path: string, query?: Record<string, unknown>) {
  return request<T>("DELETE", path, { query });
}

