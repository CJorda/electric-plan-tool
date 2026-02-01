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

const tryRefreshToken = async () => {
  const refreshResponse = await fetch("/api/auth/refresh", {
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
  let resolvedToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : "");
  if (resolvedToken && !shouldSkipRefresh(url) && isTokenExpired(resolvedToken)) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      resolvedToken = refreshed;
    }
  }
  const headers = { ...(options.headers || {}), ...getAuthHeaders(resolvedToken) };
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status !== 401 || shouldSkipRefresh(url)) {
    return response;
  }

  try {
    const nextToken = await tryRefreshToken();
    if (!nextToken) return response;
    const retryHeaders = { ...(options.headers || {}), ...getAuthHeaders(nextToken) };
    return fetch(url, {
      ...options,
      headers: retryHeaders,
      credentials: "include",
    });
  } catch {
    return response;
  }
};
