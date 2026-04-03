import { useEffect, useMemo, useState } from "react";

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

export default function useClients() {
  const [clients, setClients] = useState(() => {
    try {
      const stored = localStorage.getItem("clients");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
        localStorage.setItem("clients", JSON.stringify(DEMO_CLIENTS));
        return DEMO_CLIENTS;
      }
      localStorage.setItem("clients", JSON.stringify(DEMO_CLIENTS));
      return DEMO_CLIENTS;
    } catch {
      return DEMO_CLIENTS;
    }
  });
  const [clientForm, setClientForm] = useState(EMPTY_FORM);

  useEffect(() => {
    try {
      localStorage.setItem("clients", JSON.stringify(clients));
    } catch {
      // ignore persistence errors
    }
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

  const handleAddClient = () => {
    if (!normalizedForm.name || !normalizedForm.contactName) return;
    setClients((prev) => [
      {
        id: createId(),
        ...normalizedForm,
      },
      ...prev,
    ]);
    setClientForm(EMPTY_FORM);
  };

  const updateClient = (clientId, updates) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          ...updates,
        };
      })
    );
  };

  const deleteClient = (clientId) => {
    setClients((prev) => prev.filter((client) => client.id !== clientId));
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
