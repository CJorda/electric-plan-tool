import { useState } from "react";
import CustomSelect from "../ui/CustomSelect.jsx";
import "./CategoriesSection.css";

function CategoriesSection({
  categoryForm,
  onCategoryFormChange,
  onAddCategory,
  categories,
  onUpdateCategory,
  onDeleteCategory,
}) {
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isSubcategory, setIsSubcategory] = useState(false);
  const getCategoryLabel = (category) => {
    if (!category?.parentId) return category?.name || "";
    const parent = categories.find((item) => item.id === category.parentId);
    return parent ? `${parent.name} / ${category.name}` : category.name;
  };

  const parentOptions = categories
    .filter((category) => !category.parentId)
    .map((category) => ({
      id: category.id,
      label: getCategoryLabel(category),
    }));

  const selectedParent = parentOptions.find((option) => option.id === categoryForm.parentId);
  const parentName = selectedParent?.label || "";
  const trimmedName = categoryForm.name.trim();
  const isNameSameAsParent =
    Boolean(isSubcategory && parentName) &&
    trimmedName.toLowerCase() === parentName.split("/").pop()?.trim().toLowerCase();
  const canSaveCategory =
    trimmedName.length > 0 &&
    (!isSubcategory || Boolean(categoryForm.parentId)) &&
    !isNameSameAsParent;

  const handleSaveCategory = () => {
    if (!canSaveCategory) return;
    const payload = {
      name: categoryForm.name,
      description: categoryForm.description,
      parentId: isSubcategory ? categoryForm.parentId : "",
    };
    onCategoryFormChange(payload);
    onAddCategory();
    if (!isSubcategory) {
      setIsSubcategory(false);
    }
  };
  return (
    <section className="products">
      <div className="products__header">
        <div>
          <h2>Catálogo · Categorías</h2>
          <p>Gestiona las categorías disponibles en el catálogo.</p>
        </div>
        <div className="products__controls products__controls--right">
          <button
            className="categories__action"
            type="button"
            onClick={handleSaveCategory}
            disabled={!canSaveCategory}
          >
            Añadir categoría
          </button>
        </div>
      </div>
      <div className="products__table">
        <div className="products__table-head products__table-head--categories">
          <span>Categoría</span>
          <span>Subcategoría de</span>
          <span>Descripción</span>
          <span>Acciones</span>
        </div>
        <div className="products__table-row products__table-row--new products__table-row--categories">
          <input
            placeholder="Nombre"
            value={categoryForm.name}
            onChange={(event) => onCategoryFormChange({ name: event.target.value })}
          />
          <div className="categories__parent">
            <div className="categories__parent-row">
              <label className="categories__checkbox">
                <input
                  type="checkbox"
                  checked={isSubcategory}
                  onChange={(event) => {
                    const nextValue = event.target.checked;
                    setIsSubcategory(nextValue);
                    if (!nextValue) {
                      onCategoryFormChange({ parentId: "" });
                    }
                  }}
                />
                Es subcategoría
              </label>
              <CustomSelect
                value={categoryForm.parentId || ""}
                options={[
                  { value: "", label: "Selecciona padre" },
                  ...parentOptions.map((option) => ({ value: option.id, label: option.label })),
                ]}
                onChange={(value) => onCategoryFormChange({ parentId: value })}
                disabled={!isSubcategory}
              />
            </div>
            {isNameSameAsParent && (
              <span className="categories__hint">La subcategoría debe ser distinta al padre.</span>
            )}
          </div>
          <input
            placeholder="Descripción"
            value={categoryForm.description}
            onChange={(event) => onCategoryFormChange({ description: event.target.value })}
          />
          <span />
        </div>
        {categories.length === 0 ? (
          <div className="products__empty">Aún no hay categorías creadas.</div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="products__table-row products__table-row--categories">
              <input
                value={category.name}
                onChange={(event) => onUpdateCategory(category.id, { name: event.target.value })}
              />
              <CustomSelect
                value={category.parentId || ""}
                options={[
                  { value: "", label: "Sin padre" },
                  ...parentOptions
                    .filter((option) => option.id !== category.id)
                    .map((option) => ({ value: option.id, label: option.label })),
                ]}
                onChange={(value) => onUpdateCategory(category.id, { parentId: value || null })}
              />
              <input
                value={category.description}
                onChange={(event) => onUpdateCategory(category.id, { description: event.target.value })}
              />
              <button
                className="categories__delete"
                type="button"
                onClick={() => setDeleteCandidate(category)}
              >
                X
              </button>
            </div>
          ))
        )}
      </div>
      {deleteCandidate && (
        <div className="categories__modal-overlay" role="dialog" aria-modal="true">
          <div className="categories__modal">
            <h3>¿Eliminar categoría?</h3>
            <p>
              Se eliminará <strong>{deleteCandidate.name}</strong> y todos sus productos asociados.
            </p>
            <div className="categories__modal-actions">
              <button
                className="categories__modal-cancel"
                type="button"
                onClick={() => setDeleteCandidate(null)}
              >
                Cancelar
              </button>
              <button
                className="categories__modal-confirm"
                type="button"
                onClick={() => {
                  onDeleteCategory(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CategoriesSection;
