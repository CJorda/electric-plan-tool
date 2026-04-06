import { useMemo, useState } from "react";
import DeleteIconButton from "../ui/DeleteIconButton.jsx";
import "./ManufacturersSection.css";

const SORTABLE_COLUMNS = [
  { key: "name", label: "Fabricante" },
  { key: "contactName", label: "Contacto" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Teléfono" },
  { key: "website", label: "Web" },
  { key: "notes", label: "Notas" },
];

export default function ManufacturersSection({
  manufacturers,
  manufacturerForm,
  onManufacturerFormChange,
  onAddManufacturer,
  onUpdateManufacturer,
  onDeleteManufacturer,
}) {
  const [showValidation, setShowValidation] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const isNameValid = manufacturerForm.name.trim().length > 0;
  const isContactValid = manufacturerForm.contactName.trim().length > 0;

  const sortedManufacturers = useMemo(() => {
    const directionFactor = sortConfig.direction === "asc" ? 1 : -1;
    return [...manufacturers].sort((a, b) => {
      const aValue = String(a?.[sortConfig.key] || "").trim();
      const bValue = String(b?.[sortConfig.key] || "").trim();
      return aValue.localeCompare(bValue, "es", { sensitivity: "base", numeric: true }) * directionFactor;
    });
  }, [manufacturers, sortConfig]);

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
    onAddManufacturer();
  };

  return (
    <section className="manufacturers">
      <div className="manufacturers__header">
        <div>
          <h2>Catálogo · Fabricantes</h2>
          <p>Define fabricantes y guarda sus datos de contacto.</p>
        </div>
        <button type="button" onClick={handleAdd}>
          Añadir fabricante
        </button>
      </div>

      <div className="manufacturers__table">
        <div className="manufacturers__head">
          {SORTABLE_COLUMNS.map((column) => (
            <button
              key={column.key}
              type="button"
              className={`manufacturers__sort${sortConfig.key === column.key ? " is-active" : ""}`}
              onClick={() => handleSort(column.key)}
            >
              <span>{column.label}</span>
              <span className="manufacturers__sort-indicator" aria-hidden="true">
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

        <div className="manufacturers__row manufacturers__row--new">
          <input
            placeholder="Nombre"
            className={showValidation && !isNameValid ? "manufacturers__input--error" : ""}
            value={manufacturerForm.name}
            onChange={(event) => {
              setShowValidation(false);
              onManufacturerFormChange({ name: event.target.value });
            }}
          />
          <input
            placeholder="Contacto"
            className={showValidation && !isContactValid ? "manufacturers__input--error" : ""}
            value={manufacturerForm.contactName}
            onChange={(event) => {
              setShowValidation(false);
              onManufacturerFormChange({ contactName: event.target.value });
            }}
          />
          <input
            placeholder="correo@empresa.com"
            value={manufacturerForm.email}
            onChange={(event) => onManufacturerFormChange({ email: event.target.value })}
          />
          <input
            placeholder="+34 600 000 000"
            value={manufacturerForm.phone}
            onChange={(event) => onManufacturerFormChange({ phone: event.target.value })}
          />
          <input
            placeholder="https://"
            value={manufacturerForm.website}
            onChange={(event) => onManufacturerFormChange({ website: event.target.value })}
          />
          <input
            placeholder="Notas"
            value={manufacturerForm.notes}
            onChange={(event) => onManufacturerFormChange({ notes: event.target.value })}
          />
          <span className="manufacturers__hint">Completa y pulsa Añadir</span>
        </div>

        {sortedManufacturers.length === 0 ? (
          <div className="manufacturers__empty">Aún no hay fabricantes registrados.</div>
        ) : (
          sortedManufacturers.map((manufacturer) => (
            <div key={manufacturer.id} className="manufacturers__row">
              <input
                value={manufacturer.name}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { name: event.target.value })
                }
              />
              <input
                value={manufacturer.contactName || ""}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { contactName: event.target.value })
                }
              />
              <input
                value={manufacturer.email || ""}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { email: event.target.value })
                }
              />
              <input
                value={manufacturer.phone || ""}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { phone: event.target.value })
                }
              />
              <input
                value={manufacturer.website || ""}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { website: event.target.value })
                }
              />
              <input
                value={manufacturer.notes || ""}
                onChange={(event) =>
                  onUpdateManufacturer(manufacturer.id, { notes: event.target.value })
                }
              />
              <DeleteIconButton
                ariaLabel="Eliminar fabricante"
                onClick={() => onDeleteManufacturer(manufacturer.id)}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
