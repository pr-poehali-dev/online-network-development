const API_URL = "https://functions.poehali.dev/ab8f38fc-6e22-4c72-a526-19a0dd46020e";

function getToken(): string | null {
  return localStorage.getItem("buzzy_token");
}

function getUserId(): string | null {
  return localStorage.getItem("buzzy_user_id");
}

function setAuth(token: string, userId: string) {
  localStorage.setItem("buzzy_token", token);
  localStorage.setItem("buzzy_user_id", userId);
}

function clearAuth() {
  localStorage.removeItem("buzzy_token");
  localStorage.removeItem("buzzy_user_id");
}

async function apiGet<T = any>(path: string): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Network error" }));
    throw new Error(err.detail || err.message || `Error ${res.status}`);
  }
  return res.json();
}

async function apiPost<T = any>(path: string, body?: any): Promise<T> {
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
    const err = await res.json().catch(() => ({ detail: "Network error" }));
    throw new Error(err.detail || err.message || `Error ${res.status}`);
  }
  return res.json();
}

async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
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
    const err = await res.json().catch(() => ({ detail: "Network error" }));
    throw new Error(err.detail || err.message || `Error ${res.status}`);
  }
  return res.json();
}

export {
  API_URL,
  getToken,
  getUserId,
  setAuth,
  clearAuth,
  apiGet,
  apiPost,
  apiUpload,
};
