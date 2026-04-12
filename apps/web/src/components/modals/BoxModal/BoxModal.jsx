import { useEffect, useMemo, useState } from "react";
import CustomSelect from "../../ui/CustomSelect.jsx";
import DeleteIconButton from "../../ui/DeleteIconButton.jsx";
import MechanicalCabinetPreview3D from "./MechanicalCabinetPreview3D.jsx";
import "./BoxModal.css";

const formatCurrency = (value) => `€${(Number(value) || 0).toFixed(2)}`;

const MECHANICAL_OPTIONS = [
  { value: "Pantalla", label: "Pantalla", unitPrice: 0 },
  { value: "Antena", label: "Antena", unitPrice: 0 },
  { value: "Prensaestopas", label: "Prensaestopas", unitPrice: 0 },
];

const formatTariffDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function BoxModal({
  open,
  box,
  componentForm,
  catalog,
  onClose,
  onNameChange,
  onZoneChange,
  onComponentFormChange,
  onLoadProductPriceHistory,
  onAddComponent,
  onRemoveComponent,
  onDeleteBox,
  componentErrors,
  isNameValid,
}) {
  const [tariffOptions, setTariffOptions] = useState([]);
  const [isTariffLoading, setIsTariffLoading] = useState(false);
  const isMechanicalMode = componentForm.lineType === "mechanical";

  const categoryOptions = useMemo(
    () =>
      Object.keys(catalog).map((category) => ({
        value: category,
        label: category,
      })),
    [catalog]
  );

  const modelOptions = useMemo(() => {
    const items = catalog[componentForm.category] || [];
    if (!items.length) {
      return [{ value: "", label: "Sin modelos", disabled: true }];
    }
    return items.map((item) => ({
      value: item.catalogKey || item.name,
      label: `${item.name} (${formatCurrency(item.price)})`,
    }));
  }, [catalog, componentForm.category]);

  const selectedCatalogItem = useMemo(() => {
    const items = catalog[componentForm.category] || [];
    if (!items.length) return null;
    if (componentForm.catalogKey) {
      const byKey = items.find((item) => item.catalogKey === componentForm.catalogKey);
      if (byKey) return byKey;
    }
    const byName = items.find((item) => item.name === componentForm.model);
    return byName || items[0] || null;
  }, [catalog, componentForm.category, componentForm.catalogKey, componentForm.model]);

  useEffect(() => {
    let cancelled = false;
    if (!open || isMechanicalMode) {
      setTariffOptions([]);
      setIsTariffLoading(false);
      return undefined;
    }
    if (!selectedCatalogItem) {
      setTariffOptions([]);
      setIsTariffLoading(false);
      return undefined;
    }

    const currentTariffLabel = selectedCatalogItem.tariffLabel || "";
    const currentTariffOption = {
      value: "",
      priceHistoryId: "",
      unitPrice: Number(selectedCatalogItem.price) || 0,
      tariffLabel: currentTariffLabel,
      label: currentTariffLabel
        ? `${currentTariffLabel} · ${formatCurrency(selectedCatalogItem.price)}`
        : formatCurrency(selectedCatalogItem.price),
    };

    const loadTariffs = async () => {
      setTariffOptions([currentTariffOption]);
      if (!onLoadProductPriceHistory || !selectedCatalogItem.productId) {
        setIsTariffLoading(false);
        return;
      }
      setIsTariffLoading(true);
      try {
        const items = await onLoadProductPriceHistory(
          selectedCatalogItem.productId,
          selectedCatalogItem.distributorId || ""
        );
        if (cancelled) return;

        const historyOptions = [];
        const seenIds = new Set([""]);
        (Array.isArray(items) ? items : []).forEach((entry) => {
          const id = String(entry?.id || "");
          if (!id || seenIds.has(id)) return;
          seenIds.add(id);
          const note = String(entry?.note || "").trim();
          const createdAt = formatTariffDate(entry?.createdAt || entry?.created_at);
          const shippingCost = Number(entry?.shippingCost ?? entry?.shipping_cost) || 0;
          const basePrice = Number(entry?.discountPrice ?? entry?.distributorPrice) || 0;
          const price = Math.round((Math.max(0, basePrice) + Math.max(0, shippingCost) + Number.EPSILON) * 100) / 100;
          const tariffLabel = note || (createdAt ? `Tarifa ${createdAt}` : "Tarifa");
          historyOptions.push({
            value: id,
            priceHistoryId: id,
            unitPrice: price,
            tariffLabel,
            label: `${tariffLabel}${createdAt && !note ? "" : createdAt ? ` · ${createdAt}` : ""} · ${formatCurrency(price)}`,
          });
        });

        setTariffOptions([currentTariffOption, ...historyOptions]);
      } catch {
        if (!cancelled) {
          setTariffOptions([currentTariffOption]);
        }
      } finally {
        if (!cancelled) {
          setIsTariffLoading(false);
        }
      }
    };

    loadTariffs();
    return () => {
      cancelled = true;
    };
  }, [
    isMechanicalMode,
    open,
    onLoadProductPriceHistory,
    selectedCatalogItem,
  ]);

  const selectedTariffValue = String(componentForm.priceHistoryId || "");
  const selectedTariffOption =
    tariffOptions.find((option) => option.value === selectedTariffValue) || tariffOptions[0] || null;

  const handleCategoryChange = (value) => {
    const firstItem = catalog[value]?.[0] || null;
    onComponentFormChange({
      lineType: "electrical",
      category: value,
      model: firstItem?.name || "",
      unitPrice: Number(firstItem?.price) || 0,
      catalogKey: firstItem?.catalogKey || "",
      productId: firstItem?.productId || "",
      distributorId: firstItem?.distributorId || "",
      distributorName: firstItem?.distributorName || "",
      priceHistoryId: "",
      tariffLabel: firstItem?.tariffLabel || "",
    });
  };

  const handleModelChange = (value) => {
    const items = catalog[componentForm.category] || [];
    const nextModel = items.find((item) => (item.catalogKey || item.name) === value);
    if (!nextModel) return;
    onComponentFormChange({
      lineType: "electrical",
      model: nextModel.name || "",
      unitPrice: Number(nextModel.price) || 0,
      catalogKey: nextModel.catalogKey || "",
      productId: nextModel.productId || "",
      distributorId: nextModel.distributorId || "",
      distributorName: nextModel.distributorName || "",
      priceHistoryId: "",
      tariffLabel: nextModel.tariffLabel || "",
    });
  };

  const handleTariffChange = (value) => {
    const option = tariffOptions.find((item) => item.value === value);
    if (!option) return;
    onComponentFormChange({
      unitPrice: Number(option.unitPrice) || 0,
      priceHistoryId: option.priceHistoryId || "",
      tariffLabel: option.tariffLabel || "",
    });
  };

  const handleLineTypeChange = (lineType) => {
    if (lineType === "mechanical") {
      const defaultMechanical = MECHANICAL_OPTIONS[0] || null;
      const nextModel = componentForm.lineType === "mechanical"
        ? componentForm.model
        : defaultMechanical?.value || "";
      const nextUnitPrice = componentForm.lineType === "mechanical"
        ? Number(componentForm.unitPrice) || 0
        : Number(defaultMechanical?.unitPrice) || 0;
      onComponentFormChange({
        lineType: "mechanical",
        category: "Mecánica",
        model: nextModel,
        quantity: Math.max(1, Number(componentForm.quantity) || 1),
        unitPrice: nextUnitPrice,
        catalogKey: "",
        productId: "",
        distributorId: "",
        distributorName: "",
        priceHistoryId: "",
        tariffLabel: "",
      });
      return;
    }

    const firstCategory = Object.keys(catalog)[0] || "";
    const firstItem = firstCategory ? catalog[firstCategory]?.[0] || null : null;
    onComponentFormChange({
      lineType: "electrical",
      category: firstCategory,
      model: firstItem?.name || "",
      quantity: Math.max(1, Number(componentForm.quantity) || 1),
      unitPrice: Number(firstItem?.price) || 0,
      catalogKey: firstItem?.catalogKey || "",
      productId: firstItem?.productId || "",
      distributorId: firstItem?.distributorId || "",
      distributorName: firstItem?.distributorName || "",
      priceHistoryId: "",
      tariffLabel: firstItem?.tariffLabel || "",
      mechanicalPlacement: "",
      mechanicalMachining: "",
      mechanicalNotes: "",
    });
  };

  const handleMechanicalModelChange = (value) => {
    const option = MECHANICAL_OPTIONS.find((item) => item.value === value);
    onComponentFormChange({
      lineType: "mechanical",
      category: "Mecánica",
      model: value,
      unitPrice:
        Number(componentForm.unitPrice) > 0
          ? Number(componentForm.unitPrice)
          : Number(option?.unitPrice) || 0,
      catalogKey: "",
      productId: "",
      distributorId: "",
      distributorName: "",
      priceHistoryId: "",
      tariffLabel: "",
    });
  };

  if (!open || !box) return null;

  const boxComponents = box.components || [];
  const mechanicalPlacementLabel = String(componentForm.mechanicalPlacement || "").trim() || "Frontal";
  const mechanicalMachiningLabel = String(componentForm.mechanicalMachining || "").trim();

  return (
    <div className="modal modal--box">
      <div className={`modal__content${isMechanicalMode ? " modal__content--mechanical" : ""}`}>
        <div className="modal__header">
          <h2>Editar cuadro</h2>
          <button className="modal__close" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <label className="modal__label">
          Nombre del cuadro
          <input value={box.name} onChange={(event) => onNameChange(event.target.value)} />
        </label>
        {!isNameValid && <p className="modal__error">El nombre es obligatorio.</p>}

        <label className="modal__label">
          Zona de planta
          <input
            value={box.zone || ""}
            onChange={(event) => onZoneChange?.(event.target.value)}
            placeholder="Ej: Nave A · Zona 3"
          />
        </label>

        <div className="modal__line-type" role="group" aria-label="Tipo de línea">
          <button
            type="button"
            className={`modal__line-type-button${!isMechanicalMode ? " is-active" : ""}`}
            onClick={() => handleLineTypeChange("electrical")}
          >
            Eléctrica
          </button>
          <button
            type="button"
            className={`modal__line-type-button${isMechanicalMode ? " is-active" : ""}`}
            onClick={() => handleLineTypeChange("mechanical")}
          >
            Mecánica
          </button>
        </div>

        {isMechanicalMode ? (
          <div className="modal__mechanical-layout">
            <div className="modal__mechanical-form">
              <div className="modal__grid">
                <label className="modal__label">
                  Elemento mecánico
                  <CustomSelect
                    value={componentForm.model || ""}
                    options={MECHANICAL_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    onChange={handleMechanicalModelChange}
                  />
                </label>

                <label className="modal__label">
                  Ubicación
                  <input
                    value={componentForm.mechanicalPlacement || ""}
                    onChange={(event) => onComponentFormChange({ mechanicalPlacement: event.target.value })}
                    placeholder="Puerta, lateral, tapa superior..."
                  />
                </label>

                <label className="modal__label">
                  Mecanizado
                  <input
                    value={componentForm.mechanicalMachining || ""}
                    onChange={(event) => onComponentFormChange({ mechanicalMachining: event.target.value })}
                    placeholder="Taladro Ø22, recorte 120x80..."
                  />
                </label>

                <label className="modal__label">
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    value={componentForm.quantity}
                    onChange={(event) => onComponentFormChange({ quantity: Number(event.target.value) })}
                  />
                </label>

                <label className="modal__label">
                  Precio unitario (€)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={componentForm.unitPrice}
                    onChange={(event) => onComponentFormChange({ unitPrice: Number(event.target.value) })}
                  />
                </label>

                <label className="modal__label modal__label--wide">
                  Nota
                  <input
                    value={componentForm.mechanicalNotes || ""}
                    onChange={(event) => onComponentFormChange({ mechanicalNotes: event.target.value })}
                    placeholder="Ej: incluye junta EMC"
                  />
                </label>
              </div>

              <div className="modal__tariff-meta">
                <p className="modal__hint">
                  Subtotal línea mecánica: {formatCurrency((Number(componentForm.unitPrice) || 0) * (Number(componentForm.quantity) || 0))}
                </p>
              </div>
            </div>

            <aside className="modal__mechanical-preview" aria-label="Vista previa 3D del cuadro eléctrico">
              <div className="modal__mechanical-preview-header">
                <h3>Vista 3D del cuadro</h3>
                <p>
                  {componentForm.model || "Selecciona un elemento"} · {mechanicalPlacementLabel}
                </p>
              </div>

              <MechanicalCabinetPreview3D
                model={componentForm.model}
                placement={componentForm.mechanicalPlacement}
              />

              <div className="modal__mechanical-preview-meta">
                <span>Ubicación: {mechanicalPlacementLabel}</span>
                {mechanicalMachiningLabel ? <span>Mecanizado: {mechanicalMachiningLabel}</span> : null}
              </div>
            </aside>
          </div>
        ) : (
          <>
            <div className="modal__grid">
              <label className="modal__label">
                Categoría
                <CustomSelect
                  value={componentForm.category}
                  options={categoryOptions}
                  onChange={handleCategoryChange}
                  disabled={Object.keys(catalog).length === 0}
                />
              </label>

              <label className="modal__label">
                Modelo
                <CustomSelect
                  value={componentForm.catalogKey || componentForm.model}
                  options={modelOptions}
                  onChange={handleModelChange}
                  disabled={!catalog[componentForm.category]?.length}
                />
              </label>

              <label className="modal__label">
                Tarifa
                <CustomSelect
                  value={selectedTariffValue}
                  options={
                    tariffOptions.length
                      ? tariffOptions.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))
                      : [{ value: "", label: "Sin histórico", disabled: true }]
                  }
                  onChange={handleTariffChange}
                  disabled={!selectedCatalogItem || tariffOptions.length === 0}
                />
              </label>

              <label className="modal__label">
                Cantidad
                <input
                  type="number"
                  min="1"
                  value={componentForm.quantity}
                  onChange={(event) => onComponentFormChange({ quantity: Number(event.target.value) })}
                />
              </label>

            </div>

            <div className="modal__tariff-meta">
              <p className="modal__hint">
                Precio unitario aplicado: {formatCurrency(componentForm.unitPrice)}
              </p>
              {selectedTariffOption ? (
                <p className="modal__hint">Tarifa seleccionada: {selectedTariffOption.label}</p>
              ) : null}
              {isTariffLoading ? <p className="modal__hint">Cargando historial de tarifas...</p> : null}
            </div>
          </>
        )}

        <button
          className="modal__primary"
          type="button"
          onClick={onAddComponent}
          disabled={componentErrors.length > 0}
        >
          Añadir componente
        </button>
        {componentErrors.length > 0 && (
          <div className="modal__error-list">
            {componentErrors.map((error) => (
              <p key={error} className="modal__error">
                {error}
              </p>
            ))}
          </div>
        )}

        <div className="modal__list">
          {boxComponents.length === 0 ? (
            <p className="modal__empty">Sin componentes añadidos.</p>
          ) : (
            boxComponents.map((component) => (
              <div key={component.id} className="modal__list-item">
                <div>
                  <strong>
                    {component.model}
                    {component.lineType === "mechanical" ? <span className="modal__chip">Mecánica</span> : null}
                  </strong>
                  <div className="modal__list-meta">
                    {component.category} · {component.quantity} uds · {formatCurrency(component.unitPrice)}
                    {component.tariffLabel ? ` · ${component.tariffLabel}` : ""}
                  </div>
                  {component.lineType === "mechanical" ? (
                    <div className="modal__list-meta">
                      {component.mechanicalPlacement ? `Ubicación: ${component.mechanicalPlacement}` : "Ubicación: -"}
                      {component.mechanicalMachining ? ` · Mecanizado: ${component.mechanicalMachining}` : ""}
                      {component.mechanicalNotes ? ` · ${component.mechanicalNotes}` : ""}
                    </div>
                  ) : null}
                </div>
                <div className="modal__list-actions">
                  <span>€{Number(component.total || 0).toFixed(2)}</span>
                  <button type="button" onClick={() => onRemoveComponent(component.id)}>
                    Quitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <DeleteIconButton
          ariaLabel="Eliminar cuadro"
          className="modal__danger--icon"
          onClick={onDeleteBox}
        />
      </div>
    </div>
  );
}

export default BoxModal;
