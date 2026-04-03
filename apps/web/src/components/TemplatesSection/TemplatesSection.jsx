import CustomSelect from "../ui/CustomSelect.jsx";
import DeleteIconButton from "../ui/DeleteIconButton.jsx";
import './TemplatesSection.css';

export default function TemplatesSection({
  categories,
  templates,
  templateForm,
  onTemplateFormChange,
  onAddTemplate,
  selectedTemplateId,
  onSelectTemplate,
  templateMargins,
  templateMarginForm,
  onTemplateMarginFormChange,
  onAddTemplateMargin,
  onDeleteTemplateMargin,
}) {
  return (
    <section className="templates">
      <div className="templates__header">
        <div>
          <h2>Plantillas de precios</h2>
          <p>Crea plantillas con márgenes por categoría para aplicar precios rápidamente.</p>
        </div>
      </div>

      <div className="templates__grid">
        <div className="templates__panel">
          <h3>Nueva plantilla</h3>
          <div className="templates__row">
            <input
              value={templateForm.name}
              onChange={(e) => onTemplateFormChange({ name: e.target.value })}
              placeholder="Nombre de la plantilla"
            />
            <input
              value={templateForm.description}
              onChange={(e) => onTemplateFormChange({ description: e.target.value })}
              placeholder="Descripción"
            />
            <button className="templates__action" type="button" onClick={onAddTemplate}>Crear</button>
          </div>
          <label className="templates__label">
            Plantilla activa
            <CustomSelect
              value={selectedTemplateId}
              options={[
                { value: "", label: "Selecciona" },
                ...templates.map((t) => ({ value: t.id, label: t.name })),
              ]}
              onChange={onSelectTemplate}
            />
          </label>
        </div>

        <div className="templates__panel">
          <h3>Márgenes por categoría</h3>
          <div className="templates__row">
            <CustomSelect
              value={templateMarginForm.categoryId}
              options={[
                { value: "", label: "Categoría" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
              onChange={(value) => onTemplateMarginFormChange({ categoryId: value })}
            />
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={templateMarginForm.marginPercent}
              onChange={(e) => onTemplateMarginFormChange({ marginPercent: e.target.value })}
              placeholder="%"
            />
            <button
              className="templates__action"
              type="button"
              onClick={onAddTemplateMargin}
              disabled={!selectedTemplateId}
            >
              Guardar
            </button>
          </div>
          <div className="templates__table">
            {templateMargins.map((margin) => (
              <div key={margin.id} className="templates__table-row">
                <span>{margin.categoryName}</span>
                <span>{Number(margin.marginPercent).toFixed(1)}%</span>
                <DeleteIconButton
                  ariaLabel="Eliminar margen de plantilla"
                  onClick={() => onDeleteTemplateMargin(margin.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
