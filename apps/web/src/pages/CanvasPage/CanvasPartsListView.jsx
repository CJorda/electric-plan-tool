import { getDiscountedUnitPrice } from "./canvasPartsUtils.js";

export default function CanvasPartsListView({
  groupedRows,
  openBoxes,
  onToggleBox,
  onExportBom,
  onBackToDesigner,
  onUpdateComponentCustomerDiscount,
  onToggleComponentDiscount,
  onToggleComponentActive,
}) {
  return (
    <main className="canvas">
      <div className="canvas__toolbar">
        <div className="canvas__mode">Listado de piezas</div>
        <div className="canvas__help">Elementos del proyecto con descuentos y totales.</div>
        <div className="canvas__hint">Vuelve al diseñador para seguir editando.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="canvas__export" type="button" onClick={onExportBom}>
            Exportar BOM
          </button>
          <button className="canvas__edit" type="button" onClick={onBackToDesigner}>
            Volver al diseñador
          </button>
        </div>
      </div>

      <section className="canvas__parts">
        {groupedRows.length === 0 || groupedRows.every((group) => group.items.length === 0) ? (
          <div className="canvas__parts-empty">Aún no hay elementos añadidos.</div>
        ) : (
          <div className="canvas__parts-table">
            <div className="canvas__parts-head">
              <span>Categoría</span>
              <span>Modelo</span>
              <span>Cantidad</span>
              <span>Precio unitario (€)</span>
              <span>Desc. cliente</span>
              <span>Precio con desc. cliente (€)</span>
              <span>Total (€)</span>
              <span>Aplicar desc.</span>
              <span>Producto</span>
            </div>

            {groupedRows.map((group) => {
              const isOpen = Boolean(openBoxes[group.boxId]);

              return (
                <div key={group.boxId} className="canvas__parts-group">
                  <button
                    className="canvas__parts-group-header"
                    type="button"
                    onClick={() => onToggleBox(group.boxId)}
                  >
                    <span className="canvas__parts-group-title">
                      <span className="canvas__parts-group-caret" aria-hidden="true">
                        {isOpen ? "▾" : "▸"}
                      </span>
                      {group.boxName || "Cuadro"}
                    </span>
                    <span className="canvas__parts-group-count">{group.items.length} piezas</span>
                  </button>

                  {isOpen && (
                    <div className="canvas__parts-group-body">
                      {group.items.map((row) => {
                        const discountedUnit = getDiscountedUnitPrice(row);
                        const mechanicalMeta = [
                          row.mechanicalPlacement ? `Ubicación: ${row.mechanicalPlacement}` : "",
                          row.mechanicalMachining ? `Mecanizado: ${row.mechanicalMachining}` : "",
                          row.mechanicalNotes ? row.mechanicalNotes : "",
                        ]
                          .filter(Boolean)
                          .join(" · ");

                        return (
                          <div key={row.id} className="canvas__parts-row canvas__parts-row--child">
                            <span className="canvas__parts-category">{row.category}</span>
                            <span className="canvas__parts-model">
                              {row.model}
                              {row.lineType === "mechanical" && mechanicalMeta ? (
                                <span className="canvas__parts-model-meta">{mechanicalMeta}</span>
                              ) : null}
                            </span>
                            <span>{row.quantity}</span>
                            <span>€{Number(row.unitPrice || 0).toFixed(2)}</span>
                            <input
                              className="canvas__parts-input"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={row.customerDiscountPercent ?? ""}
                              onChange={(event) =>
                                onUpdateComponentCustomerDiscount?.(row.boxId, row.id, event.target.value)
                              }
                            />
                            <span>€{discountedUnit.toFixed(2)}</span>
                            <span>€{Number(row.total || 0).toFixed(2)}</span>
                            <label className="canvas__parts-toggle">
                              <input
                                type="checkbox"
                                checked={Boolean(row.discountApplied)}
                                onChange={(event) =>
                                  onToggleComponentDiscount?.(row.boxId, row.id, event.target.checked)
                                }
                              />
                            </label>
                            <label className="canvas__parts-toggle">
                              <input
                                type="checkbox"
                                checked={row.productActive !== false}
                                onChange={(event) =>
                                  onToggleComponentActive?.(row.boxId, row.id, event.target.checked)
                                }
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
