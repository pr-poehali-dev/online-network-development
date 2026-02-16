export const API_URL = "https://functions.poehali.dev/ab8f38fc-6e22-4c72-a526-19a0dd46020e";

export function getToken(): string | null {
  return localStorage.getItem("buzzy_token");
}

export function getUserId(): string | null {
  return localStorage.getItem("buzzy_user_id");
}

export function setAuth(token: string, userId: string) {
  localStorage.setItem("buzzy_token", token);
  localStorage.setItem("buzzy_user_id", userId);
}

export function clearAuth() {
  localStorage.removeItem("buzzy_token");
  localStorage.removeItem("buzzy_user_id");
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { method: "GET", headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || err.detail || err.message || `Error ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T = unknown>(path: string, body?: Record<string, unknown>): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || err.detail || err.message || `Error ${res.status}`);
  }
  return res.json();
}

export async function apiUpload<T = unknown>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || err.detail || err.message || `Error ${res.status}`);
  }
  return res.json();
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
