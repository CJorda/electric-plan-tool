import CustomSelect from "../ui/CustomSelect.jsx";
import DeleteIconButton from "../ui/DeleteIconButton.jsx";

export default function CategoryDetailCard({
  selectedCategory,
  depthById,
  pathById,
  buildParentOptionsForCategory,
  onUpdateCategory,
  onRequestDelete,
}) {
  return (
    <section className="categories__card">
      <h3>Detalle de categoría</h3>
      {!selectedCategory ? (
        <p className="categories__empty-state">
          Selecciona una categoría del árbol para editar nombre, padre o descripción.
        </p>
      ) : (
        <div className="categories__form-grid">
          <label>
            Nombre
            <input
              value={selectedCategory.name}
              onChange={(event) => onUpdateCategory(selectedCategory.id, { name: event.target.value })}
            />
          </label>
          <label>
            Padre / jerarquía
            <CustomSelect
              value={selectedCategory.parentId || ""}
              options={buildParentOptionsForCategory(selectedCategory.id)}
              onChange={(value) => onUpdateCategory(selectedCategory.id, { parentId: value || null })}
            />
          </label>
          <label className="categories__form-span-2">
            Descripción
            <input
              value={selectedCategory.description || ""}
              onChange={(event) =>
                onUpdateCategory(selectedCategory.id, { description: event.target.value })
              }
            />
          </label>
          <div className="categories__form-span-2 categories__detail-footer">
            <span className="categories__meta">
              Nivel {depthById.get(selectedCategory.id) || 0} · Ruta: {pathById.get(selectedCategory.id) || selectedCategory.name}
            </span>
            <DeleteIconButton
              ariaLabel="Eliminar categoría"
              onClick={() => onRequestDelete(selectedCategory)}
            />
          </div>
        </div>
      )}
    </section>
  );
}
