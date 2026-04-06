import { useMemo, useState } from "react";
import DeleteIconButton from "../ui/DeleteIconButton.jsx";
import "./ProvidersSection.css";

const SORTABLE_COLUMNS = [
  { key: "name", label: "Distribuidor" },
  { key: "contactName", label: "Contacto" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Teléfono" },
  { key: "website", label: "Web" },
  { key: "notes", label: "Notas" },
];

export default function ProvidersSection({
  providers,
  providerForm,
  onProviderFormChange,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
}) {
  const [showValidation, setShowValidation] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const isNameValid = providerForm.name.trim().length > 0;
  const isContactValid = providerForm.contactName.trim().length > 0;

  const sortedProviders = useMemo(() => {
    const directionFactor = sortConfig.direction === "asc" ? 1 : -1;
    return [...providers].sort((a, b) => {
      const aValue = String(a?.[sortConfig.key] || "").trim();
      const bValue = String(b?.[sortConfig.key] || "").trim();
      return aValue.localeCompare(bValue, "es", { sensitivity: "base", numeric: true }) * directionFactor;
    });
  }, [providers, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const handleAdd = () => {
    if (!isNameValid || !isContactValid) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    onAddProvider();
  };

  return (
    <section className="providers">
      <div className="providers__header">
        <div>
          <h2>Catálogo · Distribuidores</h2>
          <p>Define distribuidores y guarda sus datos de contacto.</p>
        </div>
        <button type="button" onClick={handleAdd}>Añadir distribuidor</button>
      </div>

      <div className="providers__table">
        <div className="providers__head">
          {SORTABLE_COLUMNS.map((column) => (
            <button
              key={column.key}
              type="button"
              className={`providers__sort${sortConfig.key === column.key ? " is-active" : ""}`}
              onClick={() => handleSort(column.key)}
            >
              <span>{column.label}</span>
              <span className="providers__sort-indicator" aria-hidden="true">
                {sortConfig.key === column.key
                  ? sortConfig.direction === "asc"
                    ? "A-Z"
                    : "Z-A"
                  : "↕"}
              </span>
            </button>
          ))}
          <span />
        </div>

        <div className="providers__row providers__row--new">
          <input
            placeholder="Nombre del distribuidor"
            className={showValidation && !isNameValid ? "providers__input--error" : ""}
            value={providerForm.name}
            onChange={(event) => {
              setShowValidation(false);
              onProviderFormChange({ name: event.target.value });
            }}
          />
          <input
            placeholder="Contacto"
            className={showValidation && !isContactValid ? "providers__input--error" : ""}
            value={providerForm.contactName}
            onChange={(event) => {
              setShowValidation(false);
              onProviderFormChange({ contactName: event.target.value });
            }}
          />
          <input
            placeholder="correo@empresa.com"
            value={providerForm.email}
            onChange={(event) => onProviderFormChange({ email: event.target.value })}
          />
          <input
            placeholder="+34 600 000 000"
            value={providerForm.phone}
            onChange={(event) => onProviderFormChange({ phone: event.target.value })}
          />
          <input
            placeholder="https://"
            value={providerForm.website}
            onChange={(event) => onProviderFormChange({ website: event.target.value })}
          />
          <input
            placeholder="Notas"
            value={providerForm.notes}
            onChange={(event) => onProviderFormChange({ notes: event.target.value })}
          />
          <span className="providers__hint">Completa y pulsa Añadir</span>
        </div>

        {sortedProviders.length === 0 ? (
          <div className="providers__empty">Aún no hay distribuidores registrados.</div>
        ) : (
          sortedProviders.map((provider) => (
            <div key={provider.id} className="providers__row">
              <input
                value={provider.name}
                onChange={(event) => onUpdateProvider(provider.id, { name: event.target.value })}
              />
              <input
                value={provider.contactName || ""}
                onChange={(event) => onUpdateProvider(provider.id, { contactName: event.target.value })}
              />
              <input
                value={provider.email || ""}
                onChange={(event) => onUpdateProvider(provider.id, { email: event.target.value })}
              />
              <input
                value={provider.phone || ""}
                onChange={(event) => onUpdateProvider(provider.id, { phone: event.target.value })}
              />
              <input
                value={provider.website || ""}
                onChange={(event) => onUpdateProvider(provider.id, { website: event.target.value })}
              />
              <input
                value={provider.notes || ""}
                onChange={(event) => onUpdateProvider(provider.id, { notes: event.target.value })}
              />
              <DeleteIconButton
                ariaLabel="Eliminar distribuidor"
                onClick={() => onDeleteProvider(provider.id)}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
