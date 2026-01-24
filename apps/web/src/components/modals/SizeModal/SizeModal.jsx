import "./SizeModal.css";

function SizeModal({ open, boxSizes, customSize, onCustomSizeChange, onApply, onClose }) {
  if (!open) return null;

  return (
    <div className="modal">
      <div className="modal__content">
        <div className="modal__header">
          <h2>Tamaño de cuadros</h2>
          <button className="modal__close" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="modal__grid">
          {Object.entries(boxSizes).map(([key, size]) => (
            <button key={key} className="modal__tile" type="button" onClick={() => onApply(size)}>
              <strong>{size.label}</strong>
              <span>
                {size.width} x {size.height}px
              </span>
            </button>
          ))}
        </div>
        <div className="modal__grid">
          <label className="modal__label">
            Ancho personalizado
            <input
              type="number"
              min="40"
              value={customSize.width}
              onChange={(event) => onCustomSizeChange({ width: Number(event.target.value) })}
            />
          </label>
          <label className="modal__label">
            Alto personalizado
            <input
              type="number"
              min="40"
              value={customSize.height}
              onChange={(event) => onCustomSizeChange({ height: Number(event.target.value) })}
            />
          </label>
        </div>
        <button className="modal__primary" type="button" onClick={() => onApply(customSize)}>
          Aplicar tamaño personalizado
        </button>
      </div>
    </div>
  );
}

export default SizeModal;
