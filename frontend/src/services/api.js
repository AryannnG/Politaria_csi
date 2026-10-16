import { API_BASE_URL } from "../config/env.js";

const TOKEN_KEY = "mayor_token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path, { body, headers = {}, ...options } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(payload.error || "Something went wrong. Please try again.", response.status);
  }
  return payload;
}

export const authApi = {
  login: (credentials) => apiRequest("/auth/login", { method: "POST", body: credentials }),
  register: (details) => apiRequest("/auth/register", { method: "POST", body: details }),
};

export const citiesApi = {
  list: () => apiRequest("/cities"),
  create: (name, difficulty = "normal") => apiRequest("/cities", { method: "POST", body: { name, difficulty } }),
  get: (cityId) => apiRequest(`/cities/${cityId}`),
  delete: (cityId) => apiRequest(`/cities/${cityId}`, { method: "DELETE" }),
  build: (cityId, buildingId) => apiRequest(`/cities/${cityId}/buildings`, { method: "POST", body: { buildingId } }),
  enactPolicy: (cityId, policyId) => apiRequest(`/cities/${cityId}/policies`, { method: "POST", body: { policyId } }),
  revokePolicy: (cityId, policyId) => apiRequest(`/cities/${cityId}/policies/${policyId}`, { method: "DELETE" }),
  advanceMonth: (cityId) => apiRequest(`/cities/${cityId}/advance-month`, { method: "POST" }),
  resolveEvent: (cityId, eventId, choiceId) => apiRequest(`/cities/${cityId}/resolve-event`, { method: "POST", body: { eventId, choiceId } }),
  updateTaxRate: (cityId, taxRate) => apiRequest(`/cities/${cityId}/tax-rate`, { method: "PATCH", body: { taxRate } }),
  restart: (cityId) => apiRequest(`/cities/${cityId}/restart`, { method: "POST" }),
};

export const catalogApi = {
  buildings: () => apiRequest("/catalog/buildings"),
  policies: () => apiRequest("/catalog/policies"),
  missions: () => apiRequest("/catalog/missions"),
};

export { TOKEN_KEY };
