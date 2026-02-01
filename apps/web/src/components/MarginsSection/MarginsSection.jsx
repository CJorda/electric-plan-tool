import CustomSelect from "../ui/CustomSelect.jsx";
import './MarginsSection.css';

export default function MarginsSection({
  categories,
  providers,
  margins,
  marginForm,
  onMarginFormChange,
  onAddMargin,
  onDeleteMargin,
}) {
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
            />
            <CustomSelect
              value={marginForm.categoryId}
              options={[
                { value: "", label: "Categoría" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
              onChange={(value) => onMarginFormChange({ categoryId: value })}
            />
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={marginForm.marginPercent}
              onChange={(e) => onMarginFormChange({ marginPercent: e.target.value })}
              placeholder="%"
            />
            <button className="margins__action" type="button" onClick={onAddMargin}>Guardar</button>
          </div>
          <div className="margins__table">
            {margins.map((margin) => (
              <div key={margin.id} className="margins__table-row">
                <span>{margin.providerName}</span>
                <span>{margin.categoryName}</span>
                <span>{Number(margin.marginPercent).toFixed(1)}%</span>
                <button type="button" onClick={() => onDeleteMargin(margin.id)}>Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
