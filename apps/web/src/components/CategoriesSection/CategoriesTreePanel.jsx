export default function CategoriesTreePanel({
  selectedCategoryId,
  categoriesCount,
  rootCategories,
  renderTreeNode,
  onSelectAll,
}) {
  return (
    <aside className="categories__tree-panel">
      <div className="categories__tree-header">
        <strong>Jerarquía</strong>
        <button
          type="button"
          className={`categories__tree-all ${selectedCategoryId === "" ? "is-active" : ""}`}
          onClick={onSelectAll}
        >
          Todas
          <span>{categoriesCount}</span>
        </button>
      </div>
      <div className="categories__tree-list">
        {rootCategories.length === 0 ? (
          <p className="categories__tree-empty">Aún no hay categorías creadas.</p>
        ) : (
          rootCategories.map((category) => renderTreeNode(category))
        )}
      </div>
    </aside>
  );
}
