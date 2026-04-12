import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";

const createId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const EMPTY_FORM = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

const DEMO_CLIENTS = [
  {
    id: "demo-client-1",
    name: "Logistica Norte SL",
    contactName: "Marta Rios",
    email: "marta.rios@logisticanorte.local",
    phone: "+34 611 100 100",
    address: "Poligono La Vega, Nave 14",
    notes: "Cliente activo con mantenimientos trimestrales",
  },
  {
    id: "demo-client-2",
    name: "Grupo Delta",
    contactName: "Carlos Prieto",
    email: "c.prieto@grupodelta.local",
    phone: "+34 611 200 200",
    address: "Av. Europa 120",
    notes: "Prioridad alta en soporte",
  },
  {
    id: "demo-client-3",
    name: "Comunidad Sol 8",
    contactName: "Elena Saez",
    email: "elena.saez@sol8.local",
    phone: "+34 611 300 300",
    address: "Calle Sol 8",
    notes: "Contacto de administracion de finca",
  },
];

const readLocalClients = () => {
  try {
    const stored = localStorage.getItem("clients");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEMO_CLIENTS;
};

const persistLocalClients = (items) => {
  try {
    localStorage.setItem("clients", JSON.stringify(items));
  } catch {
    // ignore persistence errors
  }
};

const toClientPayload = (client) => ({
  name: String(client?.name || "").trim(),
  contactName: String(client?.contactName || "").trim(),
  email: String(client?.email || "").trim(),
  phone: String(client?.phone || "").trim(),
  address: String(client?.address || "").trim(),
  notes: String(client?.notes || "").trim(),
});

export default function useClients({ apiEnabled = import.meta.env.VITE_API_ENABLED !== "false", authToken = "" } = {}) {
  const [clients, setClients] = useState(() => readLocalClients());
  const [clientForm, setClientForm] = useState(EMPTY_FORM);

  const loadClients = useCallback(async () => {
    if (!apiEnabled) {
      setClients(readLocalClients());
      return;
    }
    try {
      const response = await apiFetch("/api/clients", {}, authToken);
      if (!response.ok) throw new Error("Error listando clientes");
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      setClients(items);
      persistLocalClients(items);
    } catch {
      setClients(readLocalClients());
    }
  }, [apiEnabled, authToken]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    persistLocalClients(clients);
  }, [clients]);

  const normalizedForm = useMemo(
    () => ({
      name: clientForm.name.trim(),
      contactName: clientForm.contactName.trim(),
      email: clientForm.email.trim(),
      phone: clientForm.phone.trim(),
      address: clientForm.address.trim(),
      notes: clientForm.notes.trim(),
    }),
    [clientForm]
  );

  const createLocalClient = (payload) => {
    const created = {
      id: createId(),
      ...payload,
    };
    setClients((prev) => [created, ...prev]);
    return created;
  };

  const handleAddClient = async () => {
    if (!normalizedForm.name || !normalizedForm.contactName) return;

    const payload = toClientPayload(normalizedForm);

    if (!apiEnabled) {
      createLocalClient(payload);
      setClientForm(EMPTY_FORM);
      return;
    }

    try {
      const response = await apiFetch(
        "/api/clients",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        authToken
      );
      if (!response.ok) throw new Error("Error creando cliente");
      const created = await response.json();
      setClients((prev) => [created, ...prev]);
    } catch {
      createLocalClient(payload);
    }

    setClientForm(EMPTY_FORM);
  };

  const updateClient = async (clientId, updates) => {
    const current = clients.find((client) => client.id === clientId);
    const nextClient = { ...current, ...updates };

    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return nextClient;
      })
    );

    if (!apiEnabled) return;

    try {
      const response = await apiFetch(
        `/api/clients/${clientId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toClientPayload(nextClient)),
        },
        authToken
      );
      if (!response.ok) throw new Error("Error actualizando cliente");
      const updated = await response.json();
      setClients((prev) =>
        prev.map((client) => (client.id === clientId ? updated : client))
      );
    } catch {
      // keep optimistic local update
    }
  };

  const deleteClient = async (clientId) => {
    const previous = clients;
    setClients((prev) => prev.filter((client) => client.id !== clientId));

    if (!apiEnabled) return;

    try {
      const response = await apiFetch(
        `/api/clients/${clientId}`,
        {
          method: "DELETE",
        },
        authToken
      );
      if (!response.ok) throw new Error("Error eliminando cliente");
    } catch {
      setClients(previous);
    }
  };

  return {
    clients,
    setClients,
    clientForm,
    setClientForm,
    handleAddClient,
    updateClient,
    deleteClient,
  };
}
