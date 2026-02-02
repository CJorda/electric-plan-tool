import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import CustomSelect from "../ui/CustomSelect.jsx";
import "./ProductsSection.css";

function ProductsSection({
  categories,
  manufacturers,
  providers,
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
  onDeleteProduct,
}) {
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const getDiscountedPrice = (pvp, discountPercent) => {
    const base = Number(pvp) || 0;
    const percent = Number(discountPercent) || 0;
    if (base <= 0) return 0;
    const raw = base * (1 - percent / 100);
    return Number.isFinite(raw) ? Math.max(0, raw) : 0;
  };

  const formatTwoDecimals = (value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return "";
    return numberValue.toFixed(2);
  };

  const categoryFilterOptions = useMemo(
    () => [
      { value: "Todas", label: "Todas" },
      ...categories.map((category) => ({
        value: category.name,
        label: category.label,
      })),
    ],
    [categories]
  );

  const categoryOptions = useMemo(() => {
    if (categories.length === 0) {
      return [{ value: "", label: "Sin categorías", disabled: true }];
    }
    return categories.map((category) => ({
      value: category.name,
      label: category.label,
    }));
  }, [categories]);

  const manufacturerOptions = useMemo(
    () =>
      (manufacturers || []).map((manufacturer) => ({
        value: manufacturer.name,
        label: manufacturer.name,
      })),
    [manufacturers]
  );

  const distributorOptions = useMemo(
    () =>
      (providers || []).map((provider) => ({
        value: provider.id,
        label: provider.name,
      })),
    [providers]
  );

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
            <CustomSelect
              value={categoryFilter}
              options={categoryFilterOptions}
              onChange={onFilterChange}
            />
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
            { key: "manufacturer", label: "Fabricante" },
            { key: "distributorName", label: "Distribuidor" },
            { key: "serial", label: "Serie fabricante" },
            { key: "distributorPrice", label: "Precio PVP (€)" },
            { key: "discountPercent", label: "Descuento (%)" },
            { key: "discountPrice", label: "Precio con descuento (€)" },
            { key: "shippingCost", label: "Gastos envío (€)" },
            { key: "leadTime", label: "Tiempo entrega" },
          ].map((column) => (
            <button key={column.key} type="button" onClick={() => onSort(column.key)}>
              {column.label}
              {sortState.key === column.key &&
                (sortState.direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
          ))}
        </div>

        <div className="products__table-row products__table-row--new">
          <CustomSelect
            value={productForm.category}
            options={categoryOptions}
            onChange={(value) => onProductFormChange({ category: value })}
            onKeyDown={onProductInputKeyDown}
            disabled={categories.length === 0}
          />
          <input
            placeholder="Nombre del producto"
            name="productName"
            value={productForm.name}
            onChange={(event) => onProductFormChange({ name: event.target.value })}
            onKeyDown={onProductInputKeyDown}
          />
          <CustomSelect
            value={productForm.manufacturer}
            options={manufacturerOptions}
            placeholder="Fabricante"
            onChange={(value) => onProductFormChange({ manufacturer: value })}
            onKeyDown={onProductInputKeyDown}
          />
          <CustomSelect
            value={productForm.distributorId}
            options={distributorOptions}
            placeholder="Distribuidor"
            onChange={(value) => onProductFormChange({ distributorId: value })}
            onKeyDown={onProductInputKeyDown}
          />
          <input
            placeholder="Nº serie fabricante"
            name="productSerial"
            className="products__input--serial"
            value={productForm.serial}
            onChange={(event) => onProductFormChange({ serial: event.target.value })}
            onKeyDown={onProductInputKeyDown}
          />
          <input
            type="number"
            min="0"
            placeholder="Precio PVP"
            className="products__input--small"
            name="productPvp"
            value={productForm.distributorPrice}
            onChange={(event) => onProductFormChange({ distributorPrice: event.target.value })}
            onBlur={(event) =>
              onProductFormChange({ distributorPrice: formatTwoDecimals(event.target.value) })
            }
            onKeyDown={onProductInputKeyDown}
          />
          <input
            type="number"
            min="0"
            placeholder="Descuento %"
            className="products__input--compact"
            name="productDiscount"
            value={productForm.discountPercent}
            onChange={(event) => onProductFormChange({ discountPercent: event.target.value })}
            onBlur={(event) =>
              onProductFormChange({ discountPercent: formatTwoDecimals(event.target.value) })
            }
            onKeyDown={onProductInputKeyDown}
          />
          <input
            className="products__readonly"
            name="productDiscountPrice"
            value={getDiscountedPrice(productForm.distributorPrice, productForm.discountPercent).toFixed(2)}
            readOnly
            tabIndex={-1}
          />
          <input
            type="number"
            min="0"
            placeholder="Gastos envío"
            className="products__input--wide"
            name="productShipping"
            value={productForm.shippingCost}
            onChange={(event) => onProductFormChange({ shippingCost: event.target.value })}
            onBlur={(event) =>
              onProductFormChange({ shippingCost: formatTwoDecimals(event.target.value) })
            }
            onKeyDown={onProductInputKeyDown}
          />
          <div className="products__leadtime-cell">
            <input
              placeholder="Tiempo entrega"
              className="products__input--wide"
              name="productLeadTime"
              value={productForm.leadTime}
              onChange={(event) => onProductFormChange({ leadTime: event.target.value })}
              onKeyDown={onProductInputKeyDown}
            />
          </div>
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
                  <CustomSelect
                    value={product.category}
                    options={categoryOptions}
                    onChange={(value) => onUpdateProduct(product.id, { category: value })}
                  />
                  <input
                    value={product.name}
                    onChange={(event) => onUpdateProduct(product.id, { name: event.target.value })}
                  />
                  <CustomSelect
                    value={product.manufacturer || ""}
                    options={manufacturerOptions}
                    placeholder="Fabricante"
                    onChange={(value) => onUpdateProduct(product.id, { manufacturer: value })}
                  />
                  <CustomSelect
                    value={product.distributorId || ""}
                    options={distributorOptions}
                    placeholder="Distribuidor"
                    onChange={(value) => onUpdateProduct(product.id, { distributorId: value })}
                  />
                  <input
                    value={product.serial}
                    className="products__input--serial"
                    onChange={(event) => onUpdateProduct(product.id, { serial: event.target.value })}
                  />
                  <input
                    type="number"
                    min="0"
                    value={product.distributorPrice}
                    className="products__input--small"
                    onChange={(event) =>
                      onUpdateProduct(product.id, { distributorPrice: Number(event.target.value) })
                    }
                    onBlur={(event) =>
                      onUpdateProduct(product.id, {
                        distributorPrice: Number(formatTwoDecimals(event.target.value)),
                      })
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    value={product.discountPercent ?? 0}
                    className="products__input--compact"
                    onChange={(event) =>
                      onUpdateProduct(product.id, { discountPercent: Number(event.target.value) })
                    }
                    onBlur={(event) =>
                      onUpdateProduct(product.id, {
                        discountPercent: Number(formatTwoDecimals(event.target.value)),
                      })
                    }
                  />
                  <input
                    className="products__readonly"
                    value={getDiscountedPrice(product.distributorPrice, product.discountPercent ?? 0).toFixed(2)}
                    readOnly
                    tabIndex={-1}
                  />
                  <input
                    type="number"
                    min="0"
                    value={product.shippingCost}
                    className="products__input--wide"
                    onChange={(event) =>
                      onUpdateProduct(product.id, { shippingCost: Number(event.target.value) })
                    }
                    onBlur={(event) =>
                      onUpdateProduct(product.id, {
                        shippingCost: Number(formatTwoDecimals(event.target.value)),
                      })
                    }
                  />
                  <div className="products__leadtime-cell">
                    <input
                      value={product.leadTime}
                      className="products__input--wide"
                      onChange={(event) => onUpdateProduct(product.id, { leadTime: event.target.value })}
                    />
                    <button
                      className="products__delete"
                      type="button"
                      onClick={() => setDeleteCandidate(product)}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      {deleteCandidate && (
        <div className="products__modal-overlay" role="dialog" aria-modal="true">
          <div className="products__modal">
            <h3>¿Eliminar producto?</h3>
            <p>
              Se eliminará <strong>{deleteCandidate.name}</strong>.
            </p>
            <div className="products__modal-actions">
              <button
                className="products__modal-cancel"
                type="button"
                onClick={() => setDeleteCandidate(null)}
              >
                Cancelar
              </button>
              <button
                className="products__modal-confirm"
                type="button"
                onClick={() => {
                  onDeleteProduct?.(deleteCandidate.id);
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

export default ProductsSection;
