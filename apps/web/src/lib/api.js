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

export const getAuthHeaders = (token) => {
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
  const refreshResponse = await fetch(withApiBase("/api/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });
  if (!refreshResponse.ok) return null;
  const refreshData = await refreshResponse.json().catch(() => ({}));
  const nextToken = refreshData.accessToken || refreshData.access_token || refreshData.token;
  if (nextToken) {
    localStorage.setItem("accessToken", nextToken);
  }
  if (refreshData.user) {
    localStorage.setItem("authUser", JSON.stringify(refreshData.user));
  }
  return nextToken || null;
};

export const apiFetch = async (url, options = {}, token) => {
  const finalUrl = withApiBase(url);
  const storedToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";
  let resolvedToken = storedToken || token || "";
  if (resolvedToken && !shouldSkipRefresh(finalUrl) && isTokenExpired(resolvedToken)) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      resolvedToken = refreshed;
    }
  }
  const headers = { ...(options.headers || {}), ...getAuthHeaders(resolvedToken) };
  const response = await fetch(finalUrl, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status !== 401 || shouldSkipRefresh(finalUrl)) {
    return response;
  }

  try {
    const latestStoredToken =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";
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
    if (!nextToken) return response;
    const retryHeaders = { ...(options.headers || {}), ...getAuthHeaders(nextToken) };
    return fetch(finalUrl, {
      ...options,
      headers: retryHeaders,
      credentials: "include",
    });
  } catch {
    return response;
  }
};
