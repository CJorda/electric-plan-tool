import CustomSelect from "../ui/CustomSelect.jsx";

export default function CategoryCreateCard({
  categoryForm,
  parentOptions,
  nextCategoryPath,
  selectedCategory,
  isNameSameAsParent,
  onCategoryFormChange,
}) {
  return (
    <section className="categories__card">
      <h3>Nueva categoría</h3>
      <div className="categories__form-grid">
        <label>
          Nombre
          <input
            placeholder="Nombre"
            value={categoryForm.name}
            onChange={(event) => onCategoryFormChange({ name: event.target.value })}
          />
        </label>
        <label>
          Padre / jerarquía
          <CustomSelect
            value={categoryForm.parentId || ""}
            options={parentOptions}
            onChange={(value) => onCategoryFormChange({ parentId: value })}
          />
        </label>
        <label className="categories__form-span-2">
          Descripción
          <input
            placeholder="Descripción"
            value={categoryForm.description}
            onChange={(event) => onCategoryFormChange({ description: event.target.value })}
          />
        </label>
      </div>
      <div className="categories__meta">Ruta: {nextCategoryPath}</div>
      {selectedCategory && (
        <button
          type="button"
          className="categories__link-action"
          onClick={() => onCategoryFormChange({ parentId: selectedCategory.id })}
        >
          Usar "{selectedCategory.name}" como padre
        </button>
      )}
      {isNameSameAsParent && (
        <span className="categories__hint">
          La categoría no puede tener el mismo nombre que su padre.
        </span>
      )}
    </section>
  );
}
