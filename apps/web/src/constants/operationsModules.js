export const OPERATIONS_MODULES = [
  {
    title: "Mano de obra",
    moduleId: "labor",
    description: "Tarifas de mano de obra por rol y condición horaria.",
    fields: [
      { key: "role", label: "Rol", type: "text", required: true },
      { key: "hourly_rate", label: "Tarifa/h", type: "number", defaultValue: 0 },
      { key: "overtime_rate", label: "Tarifa extra/h", type: "number", defaultValue: 0 },
      { key: "active", label: "Activo", type: "checkbox", defaultValue: true },
      { key: "notes", label: "Notas", type: "textarea" },
    ],
  },
  {
    title: "Auditoría",
    moduleId: "audit",
    description: "Registro auditable de eventos clave del sistema.",
    readOnly: true,
    fields: [
      { key: "action", label: "Acción", type: "text", required: true },
      { key: "entity_type", label: "Tipo entidad", type: "text", required: true },
      { key: "entity_id", label: "ID entidad", type: "text" },
      { key: "actor", label: "Actor", type: "text" },
      {
        key: "severity",
        label: "Severidad",
        type: "select",
        defaultValue: "info",
        options: [
          { value: "info", label: "Info" },
          { value: "warning", label: "Warning" },
          { value: "error", label: "Error" },
        ],
      },
      { key: "details", label: "Detalles (JSON)", type: "json", defaultValue: {} },
    ],
  },
  {
    title: "Configuración avanzada",
    moduleId: "settings",
    description: "Parámetros de aplicación por alcance y valor estructurado.",
    fields: [
      { key: "setting_key", label: "Clave", type: "text", required: true },
      { key: "scope", label: "Scope", type: "text", defaultValue: "global" },
      { key: "setting_value", label: "Valor (JSON)", type: "json", defaultValue: {} },
    ],
  },
];

export const OPERATIONS_BY_TITLE = OPERATIONS_MODULES.reduce((acc, module) => {
  acc[module.title] = module;
  return acc;
}, {});
