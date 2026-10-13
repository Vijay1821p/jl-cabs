const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || "Request failed.", response.status);
  return data;
}

export const adminToken = {
  get: () => sessionStorage.getItem("jc_admin"),
  set: (value) => sessionStorage.setItem("jc_admin", value),
  clear: () => sessionStorage.removeItem("jc_admin"),
};
