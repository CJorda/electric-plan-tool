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

export default function useClients() {
  const [clients, setClients] = useState(() => {
    try {
      const stored = localStorage.getItem("clients");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
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
