import { X } from "lucide-react";
import ProductFormFields from "./ProductFormFields.jsx";

export default function ProductEditorDrawer({
  open,
  title,
  form,
  categoryOptions,
  manufacturerOptions,
  distributorOptions,
  imagePreview,
  imageInputId,
  discountedPrice,
  saveLabel,
  canSave,
  onClose,
  onSave,
  onImageChange,
  onChangeField,
}) {
  if (!open || !form) {
    return null;
  }

  return (
    <div className="products__drawer-backdrop" role="dialog" aria-modal="true">
      <aside className="products__drawer">
        <header className="products__drawer-header">
          <h3>{title}</h3>
          <button type="button" className="products__drawer-close" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        <div className="products__drawer-form">
          <ProductFormFields
            form={form}
            categoryOptions={categoryOptions}
            manufacturerOptions={manufacturerOptions}
            distributorOptions={distributorOptions}
            imagePreview={imagePreview}
            discountedPrice={discountedPrice}
            imageInputId={imageInputId}
            onImageChange={onImageChange}
            onChange={onChangeField}
          />
        </div>

        <footer className="products__drawer-actions">
          <button type="button" className="products__modal-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="products__primary" onClick={onSave} disabled={!canSave}>
            {saveLabel}
          </button>
        </footer>
      </aside>
    </div>
  );
}
