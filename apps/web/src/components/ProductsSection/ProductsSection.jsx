import { ChevronDown, ChevronUp } from "lucide-react";
import "./ProductsSection.css";

function ProductsSection({
  categories,
  categoryFilter,
  onFilterChange,
  productForm,
  onProductFormChange,
  onAddProduct,
  onProductInputKeyDown,
  groupedProducts,
  onSort,
  sortState,
  onUpdateProduct,
}) {
  return (
    <section className="products">
      <div className="products__header">
        <div>
          <h2>Catálogo · Productos</h2>
          <p>Registra productos por categoría y edita directamente en la tabla.</p>
        </div>
        <div className="products__controls">
          <label>
            Filtrar categoría
            <select
              className="products__select"
              value={categoryFilter}
              onChange={(event) => onFilterChange(event.target.value)}
            >
              <option value="Todas">Todas</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onAddProduct} disabled={!productForm.category}>
            Añadir producto
          </button>
        </div>
      </div>

      <div className="products__table">
        <div className="products__table-head">
          {[
            { key: "category", label: "Categoría" },
            { key: "name", label: "Producto" },
            { key: "serial", label: "Serie fabricante" },
            { key: "distributorPrice", label: "Precio distribuidor" },
            { key: "discountPrice", label: "Precio descuento" },
            { key: "shippingCost", label: "Gastos envío" },
            { key: "leadTime", label: "Lead time" },
          ].map((column) => (
            <button key={column.key} type="button" onClick={() => onSort(column.key)}>
              {column.label}
              {sortState.key === column.key &&
                (sortState.direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
          ))}
        </div>

        <div className="products__table-row products__table-row--new">
          <select
            className="products__select"
            value={productForm.category}
            onChange={(event) => onProductFormChange({ category: event.target.value })}
            onKeyDown={onProductInputKeyDown}
          >
            {categories.length === 0 ? (
              <option value="">Sin categorías</option>
            ) : (
              categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))
            )}
          </select>
          <input
            placeholder="Nombre del producto"
            value={productForm.name}
            onChange={(event) => onProductFormChange({ name: event.target.value })}
            onKeyDown={onProductInputKeyDown}
          />
          <input
            placeholder="Nº serie fabricante"
            value={productForm.serial}
            onChange={(event) => onProductFormChange({ serial: event.target.value })}
            onKeyDown={onProductInputKeyDown}
          />
          <input
            type="number"
            min="0"
            placeholder="Precio distribuidor"
            value={productForm.distributorPrice}
            onChange={(event) => onProductFormChange({ distributorPrice: event.target.value })}
            onKeyDown={onProductInputKeyDown}
          />
          <input
            type="number"
            min="0"
            placeholder="Precio descuento"
            value={productForm.discountPrice}
            onChange={(event) => onProductFormChange({ discountPrice: event.target.value })}
            onKeyDown={onProductInputKeyDown}
          />
          <input
            type="number"
            min="0"
            placeholder="Gastos envío"
            value={productForm.shippingCost}
            onChange={(event) => onProductFormChange({ shippingCost: event.target.value })}
            onKeyDown={onProductInputKeyDown}
          />
          <input
            placeholder="Lead time"
            value={productForm.leadTime}
            onChange={(event) => onProductFormChange({ leadTime: event.target.value })}
            onKeyDown={onProductInputKeyDown}
          />
        </div>

        {groupedProducts.length === 0 ? (
          <div className="products__empty">
            {categories.length === 0
              ? "Primero crea categorías en la sección Categorías."
              : "Aún no hay productos registrados."}
          </div>
        ) : (
          groupedProducts.map(([category, items]) => (
            <div key={category} className="products__group">
              <div className="products__group-title">{category}</div>
              {items.map((product) => (
                <div key={product.id} className="products__table-row">
                  <select
                    className="products__select"
                    value={product.category}
                    onChange={(event) => onUpdateProduct(product.id, { category: event.target.value })}
                  >
                    {categories.map((categoryOption) => (
                      <option key={categoryOption} value={categoryOption}>
                        {categoryOption}
                      </option>
                    ))}
                  </select>
                  <input
                    value={product.name}
                    onChange={(event) => onUpdateProduct(product.id, { name: event.target.value })}
                  />
                  <input
                    value={product.serial}
                    onChange={(event) => onUpdateProduct(product.id, { serial: event.target.value })}
                  />
                  <input
                    type="number"
                    min="0"
                    value={product.distributorPrice}
                    onChange={(event) =>
                      onUpdateProduct(product.id, { distributorPrice: Number(event.target.value) })
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    value={product.discountPrice}
                    onChange={(event) =>
                      onUpdateProduct(product.id, { discountPrice: Number(event.target.value) })
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    value={product.shippingCost}
                    onChange={(event) =>
                      onUpdateProduct(product.id, { shippingCost: Number(event.target.value) })
                    }
                  />
                  <input
                    value={product.leadTime}
                    onChange={(event) => onUpdateProduct(product.id, { leadTime: event.target.value })}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default ProductsSection;
