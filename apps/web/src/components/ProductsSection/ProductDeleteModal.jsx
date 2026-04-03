import DeleteIconButton from "../ui/DeleteIconButton.jsx";

export default function ProductDeleteModal({
  open,
  productName,
  onCancel,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="products__modal-overlay" role="dialog" aria-modal="true">
      <div className="products__modal">
        <h3>¿Eliminar producto?</h3>
        <p>
          Se eliminará <strong>{productName}</strong>.
        </p>
        <div className="products__modal-actions">
          <button className="products__modal-cancel" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <DeleteIconButton ariaLabel="Confirmar eliminación de producto" onClick={onConfirm} />
        </div>
      </div>
    </div>
  );
}
