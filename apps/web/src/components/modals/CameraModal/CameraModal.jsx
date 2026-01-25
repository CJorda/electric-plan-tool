import { useEffect } from "react";
import "./CameraModal.css";

function CameraModal({ open, device, catalog, categoryName, onClose, onUpdate, onDelete }) {
  if (!open || !device) return null;
  const hasCatalog = catalog.length > 0;

  useEffect(() => {
    if (!open || !device || !hasCatalog) return;
    const current = catalog.find((item) => item.name === device.model);
    const fallback = catalog[0];
    const nextModel = current?.name || fallback?.name || "";
    const nextPrice = current?.price ?? fallback?.price ?? 0;
    if (device.model !== nextModel || Number(device.unitPrice || 0) !== Number(nextPrice || 0)) {
      onUpdate({
        model: nextModel,
        category: categoryName,
        unitPrice: nextPrice,
      });
    }
  }, [open, device, hasCatalog, catalog, categoryName, onUpdate]);

  return (
    <div className="modal modal--camera">
      <div className="modal__content">
        <div className="modal__header">
          <h2>Editar cámara</h2>
          <button className="modal__close" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {!hasCatalog && (
          <p className="modal__hint">
            No hay productos en la categoría {categoryName}. Crea productos en Catálogo → Productos.
          </p>
        )}

        <label className="modal__label">
          Nombre
          <input
            value={device.name || ""}
            onChange={(event) => onUpdate({ name: event.target.value })}
          />
        </label>

        <label className="modal__label">
          Zona de planta
          <input
            value={device.zone || ""}
            onChange={(event) => onUpdate({ zone: event.target.value })}
            placeholder="Ej: Acceso principal"
          />
        </label>

        <label className="modal__label">
          Modelo
          <select
            value={device.model || ""}
            onChange={(event) => {
              const value = event.target.value;
              const found = catalog.find((item) => item.name === value);
              onUpdate({
                model: value,
                category: categoryName,
                unitPrice: found?.price || 0,
              });
            }}
            disabled={!hasCatalog}
          >
            {hasCatalog ? (
              catalog.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name} ({item.price}€)
                </option>
              ))
            ) : (
              <option value="">Sin modelos</option>
            )}
          </select>
        </label>

        <button className="modal__danger" type="button" onClick={onDelete}>
          Eliminar cámara
        </button>
      </div>
    </div>
  );
}

export default CameraModal;
