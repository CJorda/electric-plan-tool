export default function OperationsCreatePanel({
  moduleDefinition,
  formValues,
  onFieldChange,
  onCreate,
  renderInput,
}) {
  return (
    <div className="operations-page__panel">
      <h3>Nuevo registro</h3>
      <div className="operations-form-grid">
        {moduleDefinition.fields.map((field) => (
          <label
            key={field.key}
            className={`operations-form-field ${field.type === "json" || field.type === "textarea" ? "wide" : ""}`}
          >
            <span>
              {field.label}
              {field.required ? " *" : ""}
            </span>
            {renderInput({
              field,
              value: formValues[field.key],
              onChange: onFieldChange,
              idPrefix: "create",
            })}
          </label>
        ))}
      </div>
      <div className="operations-actions">
        <button type="button" className="operations-btn operations-btn--primary" onClick={onCreate}>
          Guardar
        </button>
      </div>
    </div>
  );
}
