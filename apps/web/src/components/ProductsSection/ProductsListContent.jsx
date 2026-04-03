import { ChevronDown, ChevronUp } from "lucide-react";
import DeleteIconButton from "../ui/DeleteIconButton";

export default function ProductsListContent({
  visibleProducts,
  categoriesCount,
  imageUrls,
  sortState,
  onSort,
  onOpenDetail,
  onRequestDelete,
  calculateDiscountedPrice,
}) {
  const columns = [
    { key: "category", label: "Categoría", sortable: true },
    { key: "image", label: "Foto", sortable: false },
    { key: "name", label: "Producto", sortable: true },
    { key: "manufacturer", label: "Fabricante", sortable: true },
    { key: "discountPrice", label: "Precio final", sortable: true },
    { key: "actions", label: "Acciones", sortable: false },
  ];

  return (
    <div className="products__table">
      <div className="products__table-scroll">
        <div className="products__table-head products__table-head--compact-list">
          {columns.map((column) =>
            column.sortable ? (
              <button key={column.key} type="button" onClick={() => onSort(column.key)}>
                {column.label}
                {sortState.key === column.key &&
                  (sortState.direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </button>
            ) : (
              <div key={column.key}>{column.label}</div>
            )
          )}
        </div>

        {visibleProducts.length === 0 ? (
          <div className="products__empty">
            {categoriesCount === 0
              ? "Primero crea categorías desde Gestión de categorías."
              : "Aún no hay productos registrados."}
          </div>
        ) : (
          visibleProducts.map((product) => (
            <div key={product.id} className="products__table-row products__table-row--compact-list">
              <span className="products__category-chip">{product.category || "Sin categoría"}</span>

              <button className="products__image-button" type="button" onClick={() => onOpenDetail(product)}>
                {imageUrls[product.id] ? (
                  <img
                    src={imageUrls[product.id]}
                    alt={`Foto ${product.name}`}
                    className="products__image-thumb products__image-thumb--small"
                  />
                ) : (
                  <span className="products__image-placeholder">Sin foto</span>
                )}
              </button>

              <button type="button" className="products__name-button" onClick={() => onOpenDetail(product)}>
                <span>{product.name}</span>
                <small>{product.distributorName || "Sin distribuidor"}</small>
              </button>

              <span className="products__compact-text">{product.manufacturer || "-"}</span>

              <span className="products__price-pill">
                €{calculateDiscountedPrice(product.distributorPrice, product.discountPercent ?? 0).toFixed(2)}
              </span>

              <div className="products__actions-cell">
                <DeleteIconButton
                  ariaLabel="Eliminar producto"
                  onClick={() => onRequestDelete(product)}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
