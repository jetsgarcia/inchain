const AUTH_TOKEN_STORAGE_KEY = "inchain:authToken:v1";
const AUTH_REFRESH_TOKEN_STORAGE_KEY = "inchain:refreshToken:v1";
const AUTH_REMEMBER_ME_STORAGE_KEY = "inchain:rememberMe:v1";

export type AuthTokenPersistence = "session" | "local";

function getLocalStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

function getSessionStorage(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

function getStoredItem(storage: Storage | null, key: string): string | null {
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredItem(storage: Storage | null, key: string, value: string): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage failures; callers can still keep auth state in memory later.
  }
}

function removeStoredItem(storage: Storage | null, key: string): void {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

function clearTokenPair(storage: Storage | null): void {
  removeStoredItem(storage, AUTH_TOKEN_STORAGE_KEY);
  removeStoredItem(storage, AUTH_REFRESH_TOKEN_STORAGE_KEY);
}

function hasStoredTokenPair(storage: Storage | null): boolean {
  return Boolean(
    getStoredItem(storage, AUTH_TOKEN_STORAGE_KEY) ||
      getStoredItem(storage, AUTH_REFRESH_TOKEN_STORAGE_KEY),
  );
}

function hasRememberedTokens(local: Storage | null): boolean {
  return getStoredItem(local, AUTH_REMEMBER_ME_STORAGE_KEY) === "true";
}

function clearLegacyPersistentTokens(local: Storage | null): void {
  if (local && !hasRememberedTokens(local) && hasStoredTokenPair(local)) {
    clearTokenPair(local);
  }
}

function getCurrentPersistence(): AuthTokenPersistence | null {
  const session = getSessionStorage();

  if (hasStoredTokenPair(session)) {
    return "session";
  }

  const local = getLocalStorage();

  if (hasRememberedTokens(local) && hasStoredTokenPair(local)) {
    return "local";
  }

  clearLegacyPersistentTokens(local);
  return null;
}

function getReadableStorage(): Storage | null {
  const persistence = getCurrentPersistence();

  if (persistence === "session") {
    return getSessionStorage();
  }

  if (persistence === "local") {
    return getLocalStorage();
  }

  return null;
}

function getWritableStorage(persistence: AuthTokenPersistence): Storage | null {
  return persistence === "local" ? getLocalStorage() : getSessionStorage();
}

export function getAuthToken(): string | null {
  return getStoredItem(getReadableStorage(), AUTH_TOKEN_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  return getStoredItem(getReadableStorage(), AUTH_REFRESH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(
  token: string,
  persistence?: AuthTokenPersistence,
): void {
  setAuthTokens(token, getRefreshToken() ?? undefined, persistence);
}

export function setAuthTokens(
  accessToken: string,
  refreshToken?: string,
  persistence: AuthTokenPersistence = getCurrentPersistence() ?? "session",
): void {
  const local = getLocalStorage();
  const session = getSessionStorage();
  const targetStorage = getWritableStorage(persistence);

  if (persistence === "local") {
    clearTokenPair(session);
    setStoredItem(local, AUTH_REMEMBER_ME_STORAGE_KEY, "true");
  } else {
    clearTokenPair(local);
    removeStoredItem(local, AUTH_REMEMBER_ME_STORAGE_KEY);
  }

  setStoredItem(targetStorage, AUTH_TOKEN_STORAGE_KEY, accessToken);

  if (refreshToken) {
    setStoredItem(targetStorage, AUTH_REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  } else {
    removeStoredItem(targetStorage, AUTH_REFRESH_TOKEN_STORAGE_KEY);
  }
}

export function clearAuthToken(): void {
  const local = getLocalStorage();

  clearTokenPair(local);
  clearTokenPair(getSessionStorage());
  removeStoredItem(local, AUTH_REMEMBER_ME_STORAGE_KEY);
}
