export default function ProductsTreePanel({
  selectedNodeId,
  sourceProductsCount,
  rootNodes,
  renderTreeNode,
  onSelectAll,
}) {
  return (
    <aside className="products__tree-panel">
      <div className="products__tree-header">
        <strong>Categorías</strong>
        <button
          type="button"
          className={`products__tree-all ${selectedNodeId === "all" ? "is-active" : ""}`}
          onClick={onSelectAll}
        >
          Todas
          <span>{sourceProductsCount}</span>
        </button>
      </div>
      <div className="products__tree-list">
        {rootNodes.length === 0 ? (
          <p className="products__tree-empty">No hay categorías jerárquicas.</p>
        ) : (
          rootNodes.map((node) => renderTreeNode(node))
        )}
      </div>
    </aside>
  );
}
