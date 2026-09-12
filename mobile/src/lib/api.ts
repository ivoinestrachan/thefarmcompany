import * as SecureStore from "expo-secure-store";

/* Tiny API client for the farmOS backend. The base URL comes from
   EXPO_PUBLIC_API_URL (your machine's LAN IP so a phone can reach it). */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const TOKEN_KEY = "fos_token";
let cached: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cached) return cached;
  cached = await SecureStore.getItemAsync(TOKEN_KEY);
  return cached;
}

export async function setToken(token: string | null): Promise<void> {
  cached = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function api<T = unknown>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Something went wrong.");
  return data as T;
}
