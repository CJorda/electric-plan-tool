import { useEffect, useMemo, useState } from "react";
import CustomSelect from "../../ui/CustomSelect.jsx";
import DeleteIconButton from "../../ui/DeleteIconButton.jsx";
import "./BoxModal.css";

const formatCurrency = (value) => `€${(Number(value) || 0).toFixed(2)}`;

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
      label: `${item.name}${item.distributorName ? ` · ${item.distributorName}` : ""} (${formatCurrency(item.price)})`,
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
    if (!open) {
      setTariffOptions([]);
      setIsTariffLoading(false);
      return undefined;
    }
    if (!selectedCatalogItem) {
      setTariffOptions([]);
      setIsTariffLoading(false);
      return undefined;
    }

    const currentTariffLabel = selectedCatalogItem.tariffLabel || "Tarifa actual";
    const currentTariffOption = {
      value: "",
      priceHistoryId: "",
      unitPrice: Number(selectedCatalogItem.price) || 0,
      tariffLabel: currentTariffLabel,
      label: `${currentTariffLabel} · ${formatCurrency(selectedCatalogItem.price)}`,
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
          const price = Number(entry?.discountPrice ?? entry?.distributorPrice) || 0;
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
      category: value,
      model: firstItem?.name || "",
      unitPrice: Number(firstItem?.price) || 0,
      catalogKey: firstItem?.catalogKey || "",
      productId: firstItem?.productId || "",
      distributorId: firstItem?.distributorId || "",
      distributorName: firstItem?.distributorName || "",
      priceHistoryId: "",
      tariffLabel: firstItem?.tariffLabel || "Tarifa actual",
    });
  };

  const handleModelChange = (value) => {
    const items = catalog[componentForm.category] || [];
    const nextModel = items.find((item) => (item.catalogKey || item.name) === value);
    if (!nextModel) return;
    onComponentFormChange({
      model: nextModel.name || "",
      unitPrice: Number(nextModel.price) || 0,
      catalogKey: nextModel.catalogKey || "",
      productId: nextModel.productId || "",
      distributorId: nextModel.distributorId || "",
      distributorName: nextModel.distributorName || "",
      priceHistoryId: "",
      tariffLabel: nextModel.tariffLabel || "Tarifa actual",
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

  if (!open || !box) return null;

  return (
    <div className="modal modal--box">
      <div className="modal__content">
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
                  : [{ value: "", label: "Tarifa actual", disabled: true }]
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
          {selectedCatalogItem?.distributorName ? (
            <p className="modal__hint">Proveedor: {selectedCatalogItem.distributorName}</p>
          ) : null}
          {isTariffLoading ? <p className="modal__hint">Cargando historial de tarifas...</p> : null}
        </div>

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
          {box.components.length === 0 ? (
            <p className="modal__empty">Sin componentes añadidos.</p>
          ) : (
            box.components.map((component) => (
              <div key={component.id} className="modal__list-item">
                <div>
                  <strong>{component.model}</strong>
                  <div className="modal__list-meta">
                    {component.category} · {component.quantity} uds · {formatCurrency(component.unitPrice)}
                    {component.tariffLabel ? ` · ${component.tariffLabel}` : ""}
                    {component.distributorName ? ` · ${component.distributorName}` : ""}
                  </div>
                </div>
                <div className="modal__list-actions">
                  <span>€{component.total.toFixed(2)}</span>
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
