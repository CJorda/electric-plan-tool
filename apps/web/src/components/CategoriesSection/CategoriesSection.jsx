import { useState } from "react";
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
          <span>Acciones</span>
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
          <button className="categories__save" type="button" onClick={onAddCategory}>
            Guardar
          </button>
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
