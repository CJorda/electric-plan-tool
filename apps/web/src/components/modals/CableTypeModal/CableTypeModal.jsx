import { useState } from "react";
import "./CableTypeModal.css";

const TYPES = [
  { id: "ac220", label: "220V AC" },
  { id: "modbus", label: "Modbus" },
  { id: "analog", label: "Señales analógicas" },
  { id: "eth", label: "Ethernet (Cat5/6)" },
  { id: "fiber", label: "Fibra óptica" },
  { id: "dc24", label: "24V DC" },
];

const DEFAULT_COLORS = {
  ac220: "#ef4444",
  modbus: "#f97316",
  analog: "#f59e0b",
  eth: "#0ea5e9",
  fiber: "#8b5cf6",
  dc24: "#22c55e",
};

function CableTypeModal({ open, onClose, onSelect }) {
  const [colors, setColors] = useState(() => ({ ...DEFAULT_COLORS }));

  if (!open) return null;

  return (
    <div className="modal">
      <div className="modal__content">
        <div className="modal__header">
          <h2>Seleccionar tipo de cable</h2>
          <button className="modal__close" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="modal__list">
          {TYPES.map((t) => (
            <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="modal__type"
                type="button"
                onClick={() => {
                  onSelect({ ...t, color: colors[t.id] });
                  onClose();
                }}
              >
                {t.label}
              </button>
              <input
                type="color"
                value={colors[t.id]}
                onChange={(e) => setColors((prev) => ({ ...prev, [t.id]: e.target.value }))}
                aria-label={`Color ${t.label}`}
                style={{ width: 36, height: 28, border: "none", padding: 0, background: "transparent", cursor: "pointer" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CableTypeModal;
