import { useEffect, useMemo, useState } from "react";
import "./CableTypeModal.css";

const NEW_TYPE_COLORS = ["#22c55e", "#0ea5e9", "#f59e0b", "#f97316", "#ef4444", "#8b5cf6"];

const createId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeType = (type) => ({
  id: String(type?.id || createId()),
  label: String(type?.label || ""),
  subtitle: String(type?.subtitle || ""),
  hint: String(type?.hint || ""),
  color: String(type?.color || "#22c55e"),
});

const getNextColor = (types) => NEW_TYPE_COLORS[types.length % NEW_TYPE_COLORS.length];

function CableTypeModal({ open, mode = "select", types = [], onClose, onSelect, onChangeTypes }) {
  const [activeTypeId, setActiveTypeId] = useState(null);

  const normalizedTypes = useMemo(() => (Array.isArray(types) ? types.map((type) => normalizeType(type)) : []), [types]);

  const resolvedActiveTypeId = useMemo(() => {
    if (!open || normalizedTypes.length === 0) {
      return null;
    }
    if (activeTypeId && normalizedTypes.some((type) => type.id === activeTypeId)) {
      return activeTypeId;
    }
    return normalizedTypes[0].id;
  }, [open, normalizedTypes, activeTypeId]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const setTypes = (nextTypes) => {
    onChangeTypes?.(nextTypes.map((type) => normalizeType(type)));
  };

  const updateType = (typeId, updates) => {
    const next = normalizedTypes.map((type) => (type.id === typeId ? normalizeType({ ...type, ...updates }) : type));
    setTypes(next);
  };

  const addType = () => {
    const typeId = createId();
    const next = [
      ...normalizedTypes,
      {
        id: typeId,
        label: "",
        subtitle: "",
        hint: "",
        color: getNextColor(normalizedTypes),
      },
    ];
    setTypes(next);
    setActiveTypeId(typeId);
  };

  const removeType = (typeId) => {
    const next = normalizedTypes.filter((type) => type.id !== typeId);
    setTypes(next);
    if (resolvedActiveTypeId === typeId) {
      setActiveTypeId(next[0]?.id || null);
    }
  };

  const selectType = (type) => {
    const label = String(type?.label || "").trim();
    if (!label) return;
    onSelect?.({
      id: type.id,
      label,
      color: type.color || "#22c55e",
    });
    if (mode === "select") {
      onClose?.();
    }
  };

  return (
    <div className="cable-type-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="cable-type-modal__panel" onClick={(event) => event.stopPropagation()}>
        <div className="cable-type-modal__header">
          <div>
            <h2>{mode === "manage" ? "Tipos de cable del proyecto" : "Seleccionar tipo de cable"}</h2>
            <p>
              Define, edita o elimina tipos directamente en el editor. Todo se guarda en este proyecto.
            </p>
          </div>
          <button className="cable-type-modal__close" type="button" onClick={onClose} aria-label="Cerrar modal">
            ×
          </button>
        </div>

        <div className="cable-type-modal__toolbar">
          <button className="cable-type-modal__add" type="button" onClick={addType}>
            + Nuevo tipo
          </button>
        </div>

        <div className="cable-type-modal__grid">
          {normalizedTypes.map((type, index) => {
            const isActive = resolvedActiveTypeId === type.id;
            const hasLabel = String(type.label || "").trim().length > 0;

            return (
              <article key={type.id} className={`cable-type-modal__card${isActive ? " is-active" : ""}`}>
                <div className="cable-type-modal__pick" onClick={() => setActiveTypeId(type.id)}>
                  <span className="cable-type-modal__swatch" style={{ "--swatch": type.color }} aria-hidden="true" />
                  <div className="cable-type-modal__info">
                    <label className="cable-type-modal__field">
                      <span>Nombre</span>
                      <input
                        value={type.label}
                        placeholder={`Tipo ${index + 1}`}
                        onChange={(event) => updateType(type.id, { label: event.target.value })}
                        onFocus={() => setActiveTypeId(type.id)}
                      />
                    </label>
                    <label className="cable-type-modal__field">
                      <span>Subtitulo</span>
                      <input
                        value={type.subtitle}
                        placeholder="Descripcion corta"
                        onChange={(event) => updateType(type.id, { subtitle: event.target.value })}
                        onFocus={() => setActiveTypeId(type.id)}
                      />
                    </label>
                    <label className="cable-type-modal__field">
                      <span>Detalle</span>
                      <input
                        value={type.hint}
                        placeholder="Uso o nota"
                        onChange={(event) => updateType(type.id, { hint: event.target.value })}
                        onFocus={() => setActiveTypeId(type.id)}
                      />
                    </label>
                  </div>
                </div>

                <label className="cable-type-modal__color-row">
                  <span>Color</span>
                  <input
                    type="color"
                    value={type.color}
                    onChange={(event) => {
                      updateType(type.id, { color: event.target.value });
                    }}
                    aria-label={`Color ${type.label || `tipo ${index + 1}`}`}
                  />
                </label>

                <div className="cable-type-modal__actions">
                  <button
                    className="cable-type-modal__use"
                    type="button"
                    disabled={!hasLabel}
                    onClick={() => selectType(type)}
                  >
                    Usar tipo
                  </button>
                  <button className="cable-type-modal__danger" type="button" onClick={() => removeType(type.id)}>
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {normalizedTypes.length === 0 && (
          <div className="cable-type-modal__empty">
            No hay tipos de cable configurados. Crea uno para empezar.
          </div>
        )}

        <div className="cable-type-modal__footer">
          <button className="cable-type-modal__cancel" type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CableTypeModal;
