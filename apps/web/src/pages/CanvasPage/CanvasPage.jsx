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
  onToggleComponentDiscount,
  onUpdateComponentCustomerDiscount,
  onToggleComponentActive,
}) {
  if (hideCanvas) return null;

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

  const [openBoxes, setOpenBoxes] = useState({});

  const toggleBox = (boxId) => {
    setOpenBoxes((prev) => ({ ...prev, [boxId]: !prev[boxId] }));
  };

  const getDiscountedUnitPrice = (component) => {
    const base = Number(component.unitPrice) || 0;
    const percent = Number(component.customerDiscountPercent) || 0;
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
          <button className="canvas__edit" type="button" onClick={onTogglePartsList}>
            Volver al diseñador
          </button>
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
                            step="0.1"
                            value={row.customerDiscountPercent ?? 0}
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
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
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
  );
}

export default CanvasPage;
