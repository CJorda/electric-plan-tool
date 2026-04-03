import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { decodeJwt } from "../lib/auth.js";

export default function useAuthSession() {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken") || "");
  const [authUser, setAuthUser] = useState(() => {
    try {
      const stored = localStorage.getItem("authUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (!accessToken || authUser) return;
    const payload = decodeJwt(accessToken);
    if (!payload) return;
    const derivedUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role || "user",
      name: payload.name,
    };
    localStorage.setItem("authUser", JSON.stringify(derivedUser));
    setAuthUser(derivedUser);
  }, [accessToken, authUser]);

  const handleLogin = async ({ email, password }) => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await apiFetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        },
        ""
      );
      clearTimeout(timeout);

      const responseText = await res.text();
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {};
        }
      }

      if (!res.ok) {
        const errorMessage = data.error || responseText?.slice(0, 200) || `Error de login (${res.status})`;
        setLoginError(errorMessage);
        return;
      }

      const token = data.accessToken || data.access_token || data.token || "";
      if (!token) {
        const fallbackMessage = responseText
          ? `Respuesta inesperada: ${responseText.slice(0, 200)}`
          : "Token no recibido. Revisa la API.";
        setLoginError(fallbackMessage);
        return;
      }

      localStorage.setItem("accessToken", token);
      setAccessToken(token);

      const nextUser = data.user || null;
      if (nextUser) {
        localStorage.setItem("authUser", JSON.stringify(nextUser));
        setAuthUser(nextUser);
      } else {
        const payload = decodeJwt(token);
        if (payload) {
          const derivedUser = {
            id: payload.sub,
            email: payload.email,
            role: payload.role || "user",
            name: payload.name,
          };
          localStorage.setItem("authUser", JSON.stringify(derivedUser));
          setAuthUser(derivedUser);
        }
      }
    } catch (error) {
      const message = error?.name === "AbortError"
        ? "Tiempo de espera agotado. Revisa la API."
        : "No se pudo iniciar sesión";
      setLoginError(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" }, accessToken);
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    setAccessToken("");
    setAuthUser(null);
  };

  return {
    accessToken,
    authUser,
    loginError,
    loginLoading,
    handleLogin,
    logout,
  };
}
