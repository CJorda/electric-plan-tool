import { useMemo, useState } from "react";
import CustomSelect from "../ui/CustomSelect.jsx";
import DeleteIconButton from "../ui/DeleteIconButton.jsx";
import './MarginsSection.css';

export default function MarginsSection({
  categories,
  providers,
  margins,
  marginForm,
  onMarginFormChange,
  onAddMargin,
  onUpdateMargin,
  onDeleteMargin,
}) {
  const [draftById, setDraftById] = useState({});

  const mergedDraftById = useMemo(() => {
    const next = {};
    margins.forEach((margin) => {
      next[margin.id] = {
        providerId: margin.providerId || "",
        categoryId: margin.categoryId || "",
        marginPercent: Number(margin.marginPercent) || 0,
        ...(draftById[margin.id] || {}),
      };
    });
    return next;
  }, [margins, draftById]);

  const updateDraft = (marginId, updates) => {
    setDraftById((prev) => ({
      ...prev,
      [marginId]: {
        ...(prev[marginId] || {}),
        ...updates,
      },
    }));
  };

  const handleSaveMargin = (marginId) => {
    const draft = mergedDraftById[marginId];
    if (!draft) return;
    if (!draft.providerId || !draft.categoryId) return;
    onUpdateMargin?.(marginId, {
      providerId: draft.providerId,
      categoryId: draft.categoryId,
      marginPercent: Number(draft.marginPercent) || 0,
    });
  };

  const handleAddMarginEnter = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onAddMargin?.();
  };

  const handleRowEnter = (marginId) => (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleSaveMargin(marginId);
  };

  return (
    <section className="margins">
      <div className="margins__header">
        <div>
          <h2>Márgenes por categoría y distribuidor</h2>
          <p>Define márgenes por distribuidor y categoría para automatizar precios.</p>
        </div>
      </div>

      <div className="margins__grid">
        <div className="margins__panel">
          <h3>Márgenes</h3>
          <div className="margins__row">
            <CustomSelect
              value={marginForm.providerId}
              options={[
                { value: "", label: "Distribuidor" },
                ...providers.map((provider) => ({ value: provider.id, label: provider.name })),
              ]}
              onChange={(value) => onMarginFormChange({ providerId: value })}
              onKeyDown={handleAddMarginEnter}
            />
            <CustomSelect
              value={marginForm.categoryId}
              options={[
                { value: "", label: "Categoría" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
              onChange={(value) => onMarginFormChange({ categoryId: value })}
              onKeyDown={handleAddMarginEnter}
            />
            <div className="margins__percent-input">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={marginForm.marginPercent}
                onChange={(e) => onMarginFormChange({ marginPercent: e.target.value })}
                onKeyDown={handleAddMarginEnter}
                placeholder="0.0"
                aria-label="Margen en porcentaje"
              />
              <span>%</span>
            </div>
          </div>
          <p className="margins__hint">Pulsa Enter para guardar cambios.</p>

          <div className="margins__table-wrap">
            <table className="margins__table">
              <thead>
                <tr>
                  <th>Distribuidor</th>
                  <th>Categoría</th>
                  <th>Margen (%)</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {margins.map((margin) => (
                  <tr key={margin.id}>
                    <td>
                      <CustomSelect
                        value={mergedDraftById[margin.id]?.providerId || ""}
                        options={[
                          { value: "", label: "Distribuidor" },
                          ...providers.map((provider) => ({ value: provider.id, label: provider.name })),
                        ]}
                        onChange={(value) => updateDraft(margin.id, { providerId: value })}
                        onKeyDown={handleRowEnter(margin.id)}
                      />
                    </td>
                    <td>
                      <CustomSelect
                        value={mergedDraftById[margin.id]?.categoryId || ""}
                        options={[
                          { value: "", label: "Categoría" },
                          ...categories.map((category) => ({ value: category.id, label: category.name })),
                        ]}
                        onChange={(value) => updateDraft(margin.id, { categoryId: value })}
                        onKeyDown={handleRowEnter(margin.id)}
                      />
                    </td>
                    <td>
                      <div className="margins__percent-input">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={mergedDraftById[margin.id]?.marginPercent ?? 0}
                          onChange={(event) => updateDraft(margin.id, { marginPercent: event.target.value })}
                          onKeyDown={handleRowEnter(margin.id)}
                          aria-label={`Margen en porcentaje para ${margin.categoryName || "categoría"}`}
                        />
                        <span>%</span>
                      </div>
                    </td>
                    <td className="margins__actions-cell">
                      <DeleteIconButton
                        ariaLabel="Eliminar margen"
                        onClick={() => onDeleteMargin(margin.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
