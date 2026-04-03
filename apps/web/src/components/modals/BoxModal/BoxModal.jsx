import CustomSelect from "../../ui/CustomSelect.jsx";
import DeleteIconButton from "../../ui/DeleteIconButton.jsx";
import "./BoxModal.css";

function BoxModal({
  open,
  box,
  componentForm,
  catalog,
  onClose,
  onNameChange,
  onZoneChange,
  onComponentFormChange,
  onAddComponent,
  onRemoveComponent,
  onDeleteBox,
  componentErrors,
  isNameValid,
}) {
  if (!open || !box) return null;

  return (
    <div className="modal modal--box">
      <div className="modal__content">
        <div className="modal__header">
          <h2>Editar cuadro</h2>
          <button className="modal__close" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <label className="modal__label">
          Nombre del cuadro
          <input value={box.name} onChange={(event) => onNameChange(event.target.value)} />
        </label>
        {!isNameValid && <p className="modal__error">El nombre es obligatorio.</p>}

        <label className="modal__label">
          Zona de planta
          <input
            value={box.zone || ""}
            onChange={(event) => onZoneChange?.(event.target.value)}
            placeholder="Ej: Nave A · Zona 3"
          />
        </label>

        <div className="modal__grid">
          <label className="modal__label">
            Categoría
            <CustomSelect
              value={componentForm.category}
              options={Object.keys(catalog).map((category) => ({
                value: category,
                label: category,
              }))}
              onChange={(value) =>
                onComponentFormChange({
                  category: value,
                  model: catalog[value]?.[0]?.name || "",
                  unitPrice: catalog[value]?.[0]?.price || 0,
                })
              }
              disabled={Object.keys(catalog).length === 0}
            />
          </label>

          <label className="modal__label">
            Modelo
            <CustomSelect
              value={componentForm.model}
              options={
                catalog[componentForm.category]?.length
                  ? catalog[componentForm.category].map((item) => ({
                      value: item.name,
                      label: `${item.name} (${item.price}€)`,
                    }))
                  : [{ value: "", label: "Sin modelos", disabled: true }]
              }
              onChange={(value) => {
                const price =
                  catalog[componentForm.category]?.find((item) => item.name === value)?.price ??
                  componentForm.unitPrice;
                onComponentFormChange({
                  model: value,
                  unitPrice: price,
                });
              }}
              disabled={!catalog[componentForm.category]?.length}
            />
          </label>

          <label className="modal__label">
            Cantidad
            <input
              type="number"
              min="1"
              value={componentForm.quantity}
              onChange={(event) => onComponentFormChange({ quantity: Number(event.target.value) })}
            />
          </label>

        </div>

        <button
          className="modal__primary"
          type="button"
          onClick={onAddComponent}
          disabled={componentErrors.length > 0}
        >
          Añadir componente
        </button>
        {componentErrors.length > 0 && (
          <div className="modal__error-list">
            {componentErrors.map((error) => (
              <p key={error} className="modal__error">
                {error}
              </p>
            ))}
          </div>
        )}

        <div className="modal__list">
          {box.components.length === 0 ? (
            <p className="modal__empty">Sin componentes añadidos.</p>
          ) : (
            box.components.map((component) => (
              <div key={component.id} className="modal__list-item">
                <div>
                  <strong>{component.model}</strong>
                  <div className="modal__list-meta">
                    {component.category} · {component.quantity} uds · €{component.unitPrice}
                  </div>
                </div>
                <div className="modal__list-actions">
                  <span>€{component.total.toFixed(2)}</span>
                  <button type="button" onClick={() => onRemoveComponent(component.id)}>
                    Quitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <DeleteIconButton
          ariaLabel="Eliminar cuadro"
          className="modal__danger--icon"
          onClick={onDeleteBox}
        />
      </div>
    </div>
  );
}

export default BoxModal;
