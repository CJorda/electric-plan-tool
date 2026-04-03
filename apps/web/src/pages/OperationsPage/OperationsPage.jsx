import { useEffect, useMemo, useState } from "react";
import useOperations from "../../hooks/useOperations.js";
import { OPERATIONS_BY_TITLE } from "../../constants/operationsModules.js";
import OperationsCreatePanel from "./OperationsCreatePanel.jsx";
import OperationsRecordsPanel from "./OperationsRecordsPanel.jsx";
import "./OperationsPage.css";

const buildInitialForm = (moduleDefinition) => {
  const initial = {};
  (moduleDefinition?.fields || []).forEach((field) => {
    if (field.type === "json") {
      initial[field.key] = JSON.stringify(field.defaultValue ?? {}, null, 2);
      return;
    }
    if (field.type === "checkbox") {
      initial[field.key] = Boolean(field.defaultValue ?? false);
      return;
    }
    initial[field.key] = field.defaultValue ?? "";
  });
  return initial;
};

const rowToEditable = (row, fields) => {
  const editable = {};
  fields.forEach((field) => {
    const value = row?.[field.key];
    if (field.type === "json") {
      editable[field.key] = JSON.stringify(value ?? {}, null, 2);
      return;
    }
    if (field.type === "checkbox") {
      editable[field.key] = Boolean(value);
      return;
    }
    editable[field.key] = value ?? "";
  });
  return editable;
};

const normalizePayload = (values, fields) => {
  const payload = {};
  for (const field of fields) {
    const rawValue = values[field.key];
    if (field.type === "checkbox") {
      payload[field.key] = Boolean(rawValue);
      continue;
    }
    if (field.type === "number") {
      payload[field.key] = rawValue === "" || rawValue === null ? 0 : Number(rawValue);
      continue;
    }
    if (field.type === "json") {
      payload[field.key] = rawValue ? JSON.parse(rawValue) : {};
      continue;
    }
    if (field.type === "date") {
      payload[field.key] = rawValue ? String(rawValue) : null;
      continue;
    }
    payload[field.key] = rawValue === "" ? null : rawValue;
  }
  return payload;
};

const formatCellValue = (value, fieldType) => {
  if (value === null || value === undefined || value === "") return "-";
  if (fieldType === "json") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
};

const renderInput = ({ field, value, onChange, idPrefix }) => {
  const inputId = `${idPrefix}-${field.key}`;

  if (field.type === "select") {
    return (
      <select id={inputId} value={value} onChange={(event) => onChange(field.key, event.target.value)}>
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "textarea" || field.type === "json") {
    return (
      <textarea
        id={inputId}
        rows={field.type === "json" ? 5 : 3}
        value={value}
        onChange={(event) => onChange(field.key, event.target.value)}
      />
    );
  }

  if (field.type === "checkbox") {
    return (
      <input
        id={inputId}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(field.key, event.target.checked)}
      />
    );
  }

  return (
    <input
      id={inputId}
      type={field.type || "text"}
      value={value}
      onChange={(event) => onChange(field.key, event.target.value)}
    />
  );
};

export default function OperationsPage({ isActive, activeSubsection, authToken }) {
  const moduleDefinition = useMemo(
    () => OPERATIONS_BY_TITLE[activeSubsection] || null,
    [activeSubsection]
  );
  const moduleId = moduleDefinition?.moduleId || "";
  const isReadOnlyModule = Boolean(moduleDefinition?.readOnly);
  const [formValues, setFormValues] = useState(() => buildInitialForm(moduleDefinition));
  const [editingId, setEditingId] = useState("");
  const [editingValues, setEditingValues] = useState({});
  const [localError, setLocalError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    recordsByModule,
    loadingByModule,
    errorByModule,
    loadModule,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useOperations({ authToken });

  const rows = recordsByModule[moduleId] || [];
  const isLoading = Boolean(loadingByModule[moduleId]);
  const remoteError = errorByModule[moduleId] || "";

  useEffect(() => {
    if (!isActive || !moduleId) return;
    const timeoutId = setTimeout(() => {
      loadModule(moduleId, { query: searchQuery, limit: 500 });
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [isActive, moduleId, searchQuery, loadModule]);

  if (!isActive || !moduleDefinition) return null;

  const handleFormChange = (fieldKey, nextValue) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: nextValue }));
  };

  const handleRefresh = () => {
    loadModule(moduleId, { query: searchQuery, limit: 500 });
  };

  const handleCreate = async () => {
    setLocalError("");
    try {
      const payload = normalizePayload(formValues, moduleDefinition.fields);
      const missing = moduleDefinition.fields.find(
        (field) => field.required && (payload[field.key] === null || payload[field.key] === "")
      );
      if (missing) {
        setLocalError(`El campo ${missing.label} es obligatorio.`);
        return;
      }
      const result = await createRecord(moduleId, payload);
      if (!result.ok) return;
      setFormValues(buildInitialForm(moduleDefinition));
    } catch {
      setLocalError("JSON inválido en el formulario.");
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditingValues(rowToEditable(row, moduleDefinition.fields));
    setLocalError("");
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditingValues({});
    setLocalError("");
  };

  const handleEditChange = (fieldKey, nextValue) => {
    setEditingValues((prev) => ({ ...prev, [fieldKey]: nextValue }));
  };

  const saveEdit = async () => {
    setLocalError("");
    try {
      const payload = normalizePayload(editingValues, moduleDefinition.fields);
      const missing = moduleDefinition.fields.find(
        (field) => field.required && (payload[field.key] === null || payload[field.key] === "")
      );
      if (missing) {
        setLocalError(`El campo ${missing.label} es obligatorio.`);
        return;
      }
      const result = await updateRecord(moduleId, editingId, payload);
      if (!result.ok) return;
      cancelEdit();
    } catch {
      setLocalError("JSON inválido en la edición.");
    }
  };

  return (
    <section className="operations-page">
      <div className="operations-page__header">
        <div className="operations-page__header-top">
          <div>
            <h2>{moduleDefinition.title}</h2>
            <p>{moduleDefinition.description}</p>
          </div>
          <div className="operations-page__header-actions">
            <input
              type="search"
              placeholder="Buscar registros"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button type="button" className="operations-btn" onClick={handleRefresh}>
              Refrescar
            </button>
          </div>
        </div>
      </div>

      {!isReadOnlyModule && (
        <OperationsCreatePanel
          moduleDefinition={moduleDefinition}
          formValues={formValues}
          onFieldChange={handleFormChange}
          onCreate={handleCreate}
          renderInput={renderInput}
        />
      )}

      {(localError || remoteError) && (
        <div className="operations-page__error">{localError || remoteError}</div>
      )}

      <OperationsRecordsPanel
        moduleDefinition={moduleDefinition}
        rows={rows}
        isLoading={isLoading}
        isReadOnlyModule={isReadOnlyModule}
        editingId={editingId}
        editingValues={editingValues}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        onSaveEdit={saveEdit}
        onEditFieldChange={handleEditChange}
        onDeleteRow={(rowId) => deleteRecord(moduleId, rowId)}
        renderInput={renderInput}
        formatCellValue={formatCellValue}
      />
    </section>
  );
}
