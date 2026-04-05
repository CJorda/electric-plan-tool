const decodeJwtPayload = (token) => {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const isTokenExpired = (token, skewSeconds = 30) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 < Date.now() + skewSeconds * 1000;
};

const getAuthHeaders = (token) => {
  const fallbackToken =
    !token && typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : "";
  const finalToken = token || fallbackToken;
  return finalToken ? { Authorization: `Bearer ${finalToken}` } : {};
};

const shouldSkipRefresh = (url = "") =>
  url.includes("/api/auth/login") ||
  url.includes("/api/auth/refresh") ||
  url.includes("/api/auth/logout");

const REFRESH_RETRY_BLOCK_MS = 8000;
let refreshInFlight = null;
let refreshBlockedUntil = 0;

const readStoredAccessToken = () => {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("accessToken") || "";
  } catch {
    return "";
  }
};

const persistAuthSession = (token, user) => {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem("accessToken", token);
    }
    if (user) {
      localStorage.setItem("authUser", JSON.stringify(user));
    }
  } catch {
    // ignore
  }
};

const clearAuthSession = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  } catch {
    // ignore
  }
};

const resolveApiBaseUrl = () => {
  const envBase = import.meta.env?.VITE_API_BASE_URL;
  if (envBase) return String(envBase).replace(/\/$/, "");
  return "";
};

const withApiBase = (url = "") => {
  if (!url.startsWith("/api")) return url;
  const base = resolveApiBaseUrl();
  return base ? `${base}${url}` : url;
};

const tryRefreshToken = async () => {
  if (Date.now() < refreshBlockedUntil) {
    return null;
  }
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshResponse = await fetch(withApiBase("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });
    if (!refreshResponse.ok) {
      if (refreshResponse.status === 401 || refreshResponse.status === 403) {
        refreshBlockedUntil = Date.now() + REFRESH_RETRY_BLOCK_MS;
      }
      return null;
    }

    refreshBlockedUntil = 0;
    const refreshData = await refreshResponse.json().catch(() => ({}));
    const nextToken = refreshData.accessToken || refreshData.access_token || refreshData.token;
    persistAuthSession(nextToken, refreshData.user);
    return nextToken || null;
  })()
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
};

export const apiFetch = async (url, options = {}, token) => {
  const finalUrl = withApiBase(url);
  const skipAuth = shouldSkipRefresh(finalUrl);
  const storedToken = readStoredAccessToken();
  let resolvedToken = token || storedToken || "";

  if (resolvedToken && !skipAuth && isTokenExpired(resolvedToken)) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      resolvedToken = refreshed;
    }
  }

  const headers = {
    ...(options.headers || {}),
    ...(skipAuth ? {} : getAuthHeaders(resolvedToken)),
  };

  const response = await fetch(finalUrl, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status !== 401 || skipAuth) {
    return response;
  }

  try {
    const latestStoredToken = readStoredAccessToken();

    if (latestStoredToken && latestStoredToken !== resolvedToken) {
      const retryWithStoredHeaders = {
        ...(options.headers || {}),
        ...getAuthHeaders(latestStoredToken),
      };
      const retryWithStoredToken = await fetch(finalUrl, {
        ...options,
        headers: retryWithStoredHeaders,
        credentials: "include",
      });
      if (retryWithStoredToken.status !== 401) {
        return retryWithStoredToken;
      }
    }

    const nextToken = await tryRefreshToken();
    if (!nextToken) {
      if (resolvedToken || latestStoredToken) {
        clearAuthSession();
      }
      return response;
    }

    const retryHeaders = { ...(options.headers || {}), ...getAuthHeaders(nextToken) };
    const retryResponse = await fetch(finalUrl, {
      ...options,
      headers: retryHeaders,
      credentials: "include",
    });

    if (retryResponse.status === 401) {
      clearAuthSession();
    }

    return retryResponse;
  } catch {
    return response;
  }
};
