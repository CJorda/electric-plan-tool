import { useCallback, useState } from "react";
import { apiFetch } from "../lib/api.js";

export default function useOperations({ authToken }) {
  const [recordsByModule, setRecordsByModule] = useState({});
  const [loadingByModule, setLoadingByModule] = useState({});
  const [errorByModule, setErrorByModule] = useState({});

  const setLoading = useCallback((moduleId, isLoading) => {
    setLoadingByModule((prev) => ({ ...prev, [moduleId]: isLoading }));
  }, []);

  const setError = useCallback((moduleId, errorMessage) => {
    setErrorByModule((prev) => ({ ...prev, [moduleId]: errorMessage }));
  }, []);

  const loadModule = useCallback(async (moduleId, options = {}) => {
    if (!moduleId) return;
    const queryText = typeof options.query === "string" ? options.query.trim() : "";
    const limit = Number.isFinite(options.limit) ? Math.max(1, Math.min(500, Math.trunc(options.limit))) : 500;
    const params = new URLSearchParams();
    if (queryText) params.set("q", queryText);
    params.set("limit", String(limit));
    const endpoint = params.size
      ? `/api/operations/${moduleId}?${params.toString()}`
      : `/api/operations/${moduleId}`;

    setLoading(moduleId, true);
    setError(moduleId, "");
    try {
      const response = await apiFetch(endpoint, {}, authToken);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(moduleId, data.error || "No se pudo cargar el módulo");
        return;
      }
      setRecordsByModule((prev) => ({ ...prev, [moduleId]: Array.isArray(data.items) ? data.items : [] }));
    } catch {
      setError(moduleId, "No se pudo cargar el módulo");
    } finally {
      setLoading(moduleId, false);
    }
  }, [authToken, setError, setLoading]);

  const createRecord = useCallback(async (moduleId, payload) => {
    if (!moduleId) return { ok: false, error: "Módulo inválido" };
    setError(moduleId, "");
    const response = await apiFetch(
      `/api/operations/${moduleId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      authToken
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error || "No se pudo crear el registro";
      setError(moduleId, message);
      return { ok: false, error: message };
    }
    setRecordsByModule((prev) => ({
      ...prev,
      [moduleId]: [data, ...(prev[moduleId] || [])],
    }));
    return { ok: true, item: data };
  }, [authToken, setError]);

  const updateRecord = useCallback(async (moduleId, recordId, payload) => {
    if (!moduleId || !recordId) return { ok: false, error: "Registro inválido" };
    setError(moduleId, "");
    const response = await apiFetch(
      `/api/operations/${moduleId}/${recordId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      authToken
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error || "No se pudo actualizar el registro";
      setError(moduleId, message);
      return { ok: false, error: message };
    }
    setRecordsByModule((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] || []).map((item) => (item.id === recordId ? data : item)),
    }));
    return { ok: true, item: data };
  }, [authToken, setError]);

  const deleteRecord = useCallback(async (moduleId, recordId) => {
    if (!moduleId || !recordId) return { ok: false, error: "Registro inválido" };
    setError(moduleId, "");
    const response = await apiFetch(
      `/api/operations/${moduleId}/${recordId}`,
      { method: "DELETE" },
      authToken
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error || "No se pudo eliminar el registro";
      setError(moduleId, message);
      return { ok: false, error: message };
    }
    setRecordsByModule((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] || []).filter((item) => item.id !== recordId),
    }));
    return { ok: true };
  }, [authToken, setError]);

  return {
    recordsByModule,
    loadingByModule,
    errorByModule,
    loadModule,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
