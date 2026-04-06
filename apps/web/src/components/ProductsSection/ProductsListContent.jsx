import { ChevronDown, ChevronUp } from "lucide-react";
import DeleteIconButton from "../ui/DeleteIconButton";

const formatCurrency = (value) => `€${(Number(value) || 0).toFixed(2)}`;

function PriceEvolutionSparkline({ points = [] }) {
  const values = Array.isArray(points)
    ? points.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];

  if (values.length === 0) {
    return <span className="products__sparkline-empty">Sin datos</span>;
  }

  const width = 96;
  const height = 28;
  const padding = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  const isSinglePoint = values.length === 1;

  const pointCoordinates = values.map((value, index) => {
    const x = padding + step * index;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const path = isSinglePoint
    ? `M${padding} ${pointCoordinates[0].y.toFixed(2)} L${width - padding} ${pointCoordinates[0].y.toFixed(2)}`
    : pointCoordinates
        .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(" ");

  const first = values[0] || 0;
  const last = values[values.length - 1] || 0;
  const delta = last - first;
  const trendClass = delta > 0 ? "is-up" : delta < 0 ? "is-down" : "is-flat";
  const deltaLabel = `${delta > 0 ? "+" : ""}${formatCurrency(delta)}`;

  return (
    <div className="products__sparkline" title={`Evolución: ${formatCurrency(first)} -> ${formatCurrency(last)}`}>
      <svg
        className="products__sparkline-chart"
        viewBox={`0 0 ${width} ${height}`}
        aria-label="Evolución de precio"
        role="img"
      >
        <path
          className="products__sparkline-track"
          d={`M${padding} ${height - padding} L${width - padding} ${height - padding}`}
        />
        <path className={`products__sparkline-line ${trendClass}`} d={path} />
        <circle
          className={`products__sparkline-point ${trendClass}`}
          cx={pointCoordinates[0].x.toFixed(2)}
          cy={pointCoordinates[0].y.toFixed(2)}
          r="2.2"
        />
        <circle
          className={`products__sparkline-point ${trendClass}`}
          cx={pointCoordinates[pointCoordinates.length - 1].x.toFixed(2)}
          cy={pointCoordinates[pointCoordinates.length - 1].y.toFixed(2)}
          r="2.2"
        />
      </svg>
      <span className={`products__sparkline-trend ${trendClass}`}>{deltaLabel}</span>
    </div>
  );
}

export default function ProductsListContent({
  visibleProducts,
  categoriesCount,
  imageUrls,
  sortState,
  onSort,
  onOpenDetail,
  onRequestDelete,
  calculateDiscountedPrice,
  getPriceEvolutionPoints,
}) {
  const columns = [
    { key: "category", label: "Categoría", sortable: true },
    { key: "image", label: "Foto", sortable: false },
    { key: "name", label: "Producto", sortable: true },
    { key: "manufacturer", label: "Fabricante", sortable: true },
    { key: "discountPrice", label: "Precio final", sortable: true },
    { key: "priceTrend", label: "Evolución", sortable: false },
    { key: "actions", label: "Acciones", sortable: false },
  ];

  const handleRowClick = (event, product) => {
    const target = event.target;
    if (target instanceof Element && target.closest(".products__actions-cell")) {
      return;
    }
    onOpenDetail(product);
  };

  const handleRowKeyDown = (event, product) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest(".products__actions-cell")) {
      return;
    }
    event.preventDefault();
    onOpenDetail(product);
  };

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
            <div
              key={`${product.id}::${product.distributorId || ""}`}
              className="products__table-row products__table-row--compact-list"
              role="button"
              tabIndex={0}
              aria-label={`Abrir detalle de ${product.name}`}
              onClick={(event) => handleRowClick(event, product)}
              onKeyDown={(event) => handleRowKeyDown(event, product)}
            >
              <span className="products__category-chip">{product.category || "Sin categoría"}</span>

              <button className="products__image-button" type="button" aria-hidden="true" tabIndex={-1}>
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

              <button type="button" className="products__name-button" aria-hidden="true" tabIndex={-1}>
                <span>{product.name}</span>
                <small>{product.distributorName || "Sin distribuidor"}</small>
              </button>

              <span className="products__compact-text">{product.manufacturer || "-"}</span>

              <span className="products__price-pill">
                €{calculateDiscountedPrice(product.distributorPrice, product.discountPercent ?? 0).toFixed(2)}
              </span>

              <PriceEvolutionSparkline
                points={getPriceEvolutionPoints?.(product) || []}
              />

              <div className="products__actions-cell">
                <DeleteIconButton
                  ariaLabel="Eliminar producto"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRequestDelete(product);
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
