const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

let token: string | null = localStorage.getItem("auth_token");
let refreshToken: string | null = localStorage.getItem("auth_refresh_token");
let isRefreshing = false;

export function setTokens(access: string, refresh: string) {
  token = access;
  refreshToken = refresh;
  localStorage.setItem("auth_token", access);
  localStorage.setItem("auth_refresh_token", refresh);
}

export function clearTokens() {
  token = null;
  refreshToken = null;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_refresh_token");
}

export function getToken() {
  return token;
}

async function execute(
  method: string,
  path: string,
  authToken: string | null,
  body?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  let res = await execute(method, path, token, body);

  if (res.status === 401 && refreshToken && !isRefreshing) {
    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setTokens(data.token, data.refreshToken);
        res = await execute(method, path, data.token, body);
      } else {
        clearTokens();
        window.location.href = "/login";
        throw new Error("Session expired");
      }
    } finally {
      isRefreshing = false;
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
