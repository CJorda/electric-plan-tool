import DeleteIconButton from "../../components/ui/DeleteIconButton.jsx";

export default function OperationsRecordsPanel({
  moduleDefinition,
  rows,
  isLoading,
  isReadOnlyModule,
  editingId,
  editingValues,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditFieldChange,
  onDeleteRow,
  renderInput,
  formatCellValue,
}) {
  return (
    <div className="operations-page__panel">
      <h3>Registros</h3>
      {isLoading ? (
        <p className="operations-page__muted">Cargando...</p>
      ) : rows.length === 0 ? (
        <p className="operations-page__muted">Sin registros todavía.</p>
      ) : (
        <div className="operations-table-wrap">
          <table className="operations-table">
            <thead>
              <tr>
                {moduleDefinition.fields.map((field) => (
                  <th key={field.key}>{field.label}</th>
                ))}
                <th>{isReadOnlyModule ? "Detalle" : "Acciones"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isEditing = editingId === row.id;
                return (
                  <tr key={row.id}>
                    {moduleDefinition.fields.map((field) => (
                      <td key={`${row.id}-${field.key}`}>
                        {isEditing ? (
                          renderInput({
                            field,
                            value: editingValues[field.key],
                            onChange: onEditFieldChange,
                            idPrefix: `edit-${row.id}`,
                          })
                        ) : (
                          <span className="operations-cell-value">
                            {formatCellValue(row[field.key], field.type)}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="operations-actions-cell">
                      {isReadOnlyModule ? (
                        <span className="operations-page__muted">Solo lectura</span>
                      ) : isEditing ? (
                        <>
                          <button
                            type="button"
                            className="operations-btn operations-btn--primary"
                            onClick={onSaveEdit}
                          >
                            Guardar
                          </button>
                          <button type="button" className="operations-btn" onClick={onCancelEdit}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="operations-btn" onClick={() => onStartEdit(row)}>
                            Editar
                          </button>
                          <DeleteIconButton
                            ariaLabel="Eliminar registro"
                            onClick={() => onDeleteRow(row.id)}
                          />
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
