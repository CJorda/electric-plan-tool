import DeleteIconButton from "../ui/DeleteIconButton.jsx";

export default function CategoryDeleteModal({
  open,
  categoryName,
  onCancel,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="categories__modal-overlay" role="dialog" aria-modal="true">
      <div className="categories__modal">
        <h3>¿Eliminar categoría?</h3>
        <p>
          Se eliminará <strong>{categoryName}</strong> y todos sus productos asociados.
        </p>
        <div className="categories__modal-actions">
          <button className="categories__modal-cancel" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <DeleteIconButton ariaLabel="Confirmar eliminación de categoría" onClick={onConfirm} />
        </div>
      </div>
    </div>
  );
}
