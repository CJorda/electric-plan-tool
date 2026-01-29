import { useMemo, useState } from "react";
import "./CanvasPage.css";
import CanvasStage from "../../components/CanvasStage/CanvasStage.jsx";

function CanvasPage({
  hideCanvas,
  svgRef,
  pan,
  zoom,
  backgroundImage,
  boxes,
  cables,
  devices,
  selectedBoxId,
  selectedDeviceId,
  draftCable,
  draftPolyline,
  tooltip,
  activeModeLabel,
  helpMessage,
  onCanvasClick,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onBoxPointerDown,
  onDevicePointerDown,
  onDeviceDoubleClick,
  onBoxDoubleClick,
  onBoxPointerMove,
  onBoxPointerLeave,
  onDeleteCable,
  renderCablePoints,
  renderCableLabelPosition,
  renderBoxLabel,
  onEditSelected,
  partsListOpen,
  onTogglePartsList,
  hideStatusControls = false,
  onToggleComponentDiscount,
  onUpdateComponentCustomerDiscount,
  onToggleComponentActive,
  projectStatus,
  onProjectStatusChange,
  statusOptions,
  statusLabels,
}) {
  if (hideCanvas) return null;

  console.log('[CanvasPage] partsListOpen=', partsListOpen);

  const groupedRows = useMemo(() => {
    const groups = boxes.map((box) => ({
      boxId: box.id,
      boxName: box.name,
      items: box.components.map((component) => ({
        boxId: box.id,
        boxName: box.name,
        type: "component",
        ...component,
      })),
    }));

    if (devices.length > 0) {
      groups.push({
        boxId: "devices",
        boxName: "Cámaras",
        items: devices.map((device) => ({
          id: device.id,
          boxId: "devices",
          boxName: "Cámaras",
          type: "device",
          category: device.category || "Cámaras",
          model: device.model || device.name || "Cámara",
          quantity: 1,
          unitPrice: Number(device.unitPrice) || 0,
          customerDiscountPercent: Number(device.customerDiscountPercent) || 0,
          discountApplied: Boolean(device.discountApplied),
          productActive: device.productActive !== false,
          total: Number(device.total) || Number(device.unitPrice) || 0,
        })),
      });
    }

    return groups;
  }, [boxes, devices]);

  const buildBomRows = () => {
    const rows = [];
    groupedRows.forEach((group) => {
      group.items.forEach((item) => {
        const unitPrice = Number(item.unitPrice) || 0;
        const percent = Number(item.customerDiscountPercent) || 0;
        const discountApplied = Boolean(item.discountApplied);
        const discountedUnit = discountApplied ? Math.max(0, unitPrice * (1 - percent / 100)) : unitPrice;
        const quantity = Number(item.quantity) || 1;
        const total = Number(item.total || discountedUnit * quantity) || 0;
        rows.push({
          boxId: group.boxId,
          boxName: group.boxName,
          category: item.category || group.boxName || "",
          model: item.model || item.name || "",
          quantity,
          unitPrice: unitPrice.toFixed(2),
          customerDiscountPercent: percent,
          discountApplied,
          unitPriceWithDiscount: discountedUnit.toFixed(2),
          total: Number(total).toFixed(2),
          type: item.type || "component",
        });
      });
    });
    return rows;
  };

  const exportBOMCSV = () => {
    const rows = buildBomRows();
    if (rows.length === 0) return;
    const header = [
      "Box ID",
      "Box Name",
      "Category",
      "Model",
      "Quantity",
      "Unit Price (€)",
      "Customer Discount (%)",
      "Discount Applied",
      "Unit Price With Discount (€)",
      "Total (€)",
      "Type",
    ];
    const lines = [header.join(",")];
    rows.forEach((r) => {
      const cols = [
        r.boxId,
        (r.boxName || "").replace(/\"/g, '""'),
        (r.category || "").replace(/\"/g, '""'),
        (r.model || "").replace(/\"/g, '""'),
        r.quantity,
        r.unitPrice,
        r.customerDiscountPercent,
        r.discountApplied ? "YES" : "NO",
        r.unitPriceWithDiscount,
        r.total,
        r.type,
      ];
      // Wrap fields that may contain commas in quotes
      const safe = cols.map((c) => (typeof c === "string" && c.includes(",") ? `"${c}"` : c));
      lines.push(safe.join(","));
    });
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `bom-${now}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const [openBoxes, setOpenBoxes] = useState({});

  const toggleBox = (boxId) => {
    setOpenBoxes((prev) => ({ ...prev, [boxId]: !prev[boxId] }));
  };

  const getDiscountedUnitPrice = (component) => {
    const base = Number(component.unitPrice) || 0;
    let percent = Number(component.customerDiscountPercent) || 0;
    percent = Math.max(0, Math.min(100, percent));
    if (base <= 0) return 0;
    return Math.max(0, base * (1 - percent / 100));
  };

  if (partsListOpen) {
    return (
      <main className="canvas">
        <div className="canvas__toolbar">
          <div className="canvas__mode">Listado de piezas</div>
          <div className="canvas__help">Elementos del proyecto con descuentos y totales.</div>
          <div className="canvas__hint">Vuelve al diseñador para seguir editando.</div>
            <div style={{display: 'flex', gap: 8}}>
              <button className="canvas__export" type="button" onClick={exportBOMCSV}>
                Exportar BOM
              </button>
              <button className="canvas__edit" type="button" onClick={onTogglePartsList}>
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
              {groupedRows.map((group) => (
                <div key={group.boxId} className="canvas__parts-group">
                  <button
                    className="canvas__parts-group-header"
                    type="button"
                    onClick={() => toggleBox(group.boxId)}
                  >
                    <span>{group.boxName || "Cuadro"}</span>
                    <span className="canvas__parts-group-count">
                      {group.items.length} piezas
                    </span>
                  </button>
                  {openBoxes[group.boxId] &&
                    group.items.map((row) => {
                      const discountedUnit = getDiscountedUnitPrice(row);
                      return (
                        <div key={row.id} className="canvas__parts-row">
                          <span>{row.category}</span>
                          <span>{row.model}</span>
                          <span>{row.quantity}</span>
                          <span>€{Number(row.unitPrice || 0).toFixed(2)}</span>
                          <input
                            className="canvas__parts-input"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={row.customerDiscountPercent ?? ""}
                            onChange={(event) => {
                              const raw = event.target.value;
                              console.log('[CanvasPage] discount input', { boxId: row.boxId, id: row.id, raw });
                              onUpdateComponentCustomerDiscount?.(row.boxId, row.id, raw);
                            }}
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
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <div className="canvas__header-status">
      {!hideStatusControls && (
        <>
          <span className={`projects__status-pill projects__status-pill--${projectStatus}`}>{statusLabels[projectStatus] ?? projectStatus}</span>
          <label className="projects__status-select" style={{marginLeft: 12}}>
            <select
              value={projectStatus}
              onChange={e => onProjectStatusChange(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </>
      )}
      <CanvasStage
        svgRef={svgRef}
        pan={pan}
        zoom={zoom}
        backgroundImage={backgroundImage}
        boxes={boxes}
        cables={cables}
        devices={devices}
        selectedBoxId={selectedBoxId}
        selectedDeviceId={selectedDeviceId}
        draftCable={draftCable}
        draftPolyline={draftPolyline}
        tooltip={tooltip}
        activeModeLabel={activeModeLabel}
        helpMessage={helpMessage}
        onCanvasClick={onCanvasClick}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onBoxPointerDown={onBoxPointerDown}
        onDevicePointerDown={onDevicePointerDown}
        onDeviceDoubleClick={onDeviceDoubleClick}
        onBoxDoubleClick={onBoxDoubleClick}
        onBoxPointerMove={onBoxPointerMove}
        onBoxPointerLeave={onBoxPointerLeave}
        onDeleteCable={onDeleteCable}
        renderCablePoints={renderCablePoints}
        renderCableLabelPosition={renderCableLabelPosition}
        renderBoxLabel={renderBoxLabel}
        onEditSelected={onEditSelected}
        onTogglePartsList={onTogglePartsList}
      />
    </div>
  );
}

export default CanvasPage;
