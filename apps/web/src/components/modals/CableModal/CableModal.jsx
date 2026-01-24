import "./CableModal.css";

function CableModal({ open, cableForm, onChange, onClose, onSave, errors }) {
  if (!open) return null;

  return (
    <div className="modal">
      <div className="modal__content">
        <div className="modal__header">
          <h2>Detalles del cable</h2>
          <button className="modal__close" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="modal__grid">
          <label className="modal__label">
            Modelo / referencia
            <input value={cableForm.model} onChange={(event) => onChange({ model: event.target.value })} />
          </label>
          <label className="modal__label">
            Sección
            <input value={cableForm.section} onChange={(event) => onChange({ section: event.target.value })} />
          </label>
          <label className="modal__label">
            Longitud (m)
            <input
              type="number"
              min="0"
              value={cableForm.length}
              onChange={(event) => onChange({ length: Number(event.target.value) })}
            />
          </label>
          <label className="modal__label">
            Precio total (€)
            <input
              type="number"
              min="0"
              value={cableForm.totalPrice}
              onChange={(event) => onChange({ totalPrice: Number(event.target.value) })}
            />
          </label>
        </div>
        <button className="modal__primary" type="button" onClick={onSave} disabled={errors.length > 0}>
          Guardar cable
        </button>
        {errors.length > 0 && (
          <div className="modal__error-list">
            {errors.map((error) => (
              <p key={error} className="modal__error">
                {error}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CableModal;
