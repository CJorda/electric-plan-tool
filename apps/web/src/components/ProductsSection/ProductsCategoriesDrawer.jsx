import { X } from "lucide-react";
import CategoriesSection from "../CategoriesSection/CategoriesSection.jsx";

export default function ProductsCategoriesDrawer({
  open,
  onClose,
  categoryForm,
  onCategoryFormChange,
  onAddCategory,
  categories,
  onUpdateCategory,
  onDeleteCategory,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="products__drawer-backdrop" role="dialog" aria-modal="true">
      <aside className="products__drawer products__drawer--wide">
        <header className="products__drawer-header">
          <h3>Gestión de categorías</h3>
          <button type="button" className="products__drawer-close" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        <div className="products__drawer-body">
          <CategoriesSection
            categoryForm={categoryForm}
            onCategoryFormChange={onCategoryFormChange}
            onAddCategory={onAddCategory}
            categories={categories}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
          />
        </div>
      </aside>
    </div>
  );
}
