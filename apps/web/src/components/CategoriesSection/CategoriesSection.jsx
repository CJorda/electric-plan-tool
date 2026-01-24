import "./CategoriesSection.css";

function CategoriesSection({ categoryForm, onCategoryFormChange, onAddCategory, categories, onUpdateCategory }) {
  return (
    <section className="products">
      <div className="products__header">
        <div>
          <h2>Catálogo · Categorías</h2>
          <p>Gestiona las categorías disponibles en el catálogo.</p>
        </div>
        <div className="products__controls">
          <button type="button" onClick={onAddCategory}>
            Añadir categoría
          </button>
        </div>
      </div>
      <div className="products__table">
        <div className="products__table-head products__table-head--categories">
          <span>Categoría</span>
          <span>Descripción</span>
        </div>
        <div className="products__table-row products__table-row--new products__table-row--categories">
          <input
            placeholder="Nombre"
            value={categoryForm.name}
            onChange={(event) => onCategoryFormChange({ name: event.target.value })}
          />
          <input
            placeholder="Descripción"
            value={categoryForm.description}
            onChange={(event) => onCategoryFormChange({ description: event.target.value })}
          />
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
              <input
                value={category.description}
                onChange={(event) => onUpdateCategory(category.id, { description: event.target.value })}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default CategoriesSection;
