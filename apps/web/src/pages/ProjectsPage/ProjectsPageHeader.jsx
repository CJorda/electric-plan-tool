import CustomSelect from "../../components/ui/CustomSelect.jsx";

export default function ProjectsPageHeader({
  quickFilter,
  onQuickFilterChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  onOpenCreate,
  onExportCsv,
}) {
  return (
    <>
      <div className="projects__header">
        <div>
          <h2>Proyectos</h2>
          <p>Organiza y gestiona tus proyectos eléctricos por bloques de trabajo.</p>
        </div>
        <div className="projects__header-actions">
          <button className="projects__action" type="button" onClick={onOpenCreate}>
            Nuevo proyecto
          </button>
          <button className="projects__action projects__action--secondary" type="button" onClick={onExportCsv}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="projects__filters-bar">
        <div className="projects__subsections" role="tablist" aria-label="Filtros rápidos de proyectos">
          <button
            type="button"
            className={`projects__subsection-pill ${quickFilter === "all" ? "is-active" : ""}`}
            onClick={() => onQuickFilterChange("all")}
          >
            Todos
          </button>
          <button
            type="button"
            className={`projects__subsection-pill ${quickFilter === "with-attachments" ? "is-active" : ""}`}
            onClick={() => onQuickFilterChange("with-attachments")}
          >
            Con adjuntos
          </button>
          <button
            type="button"
            className={`projects__subsection-pill ${quickFilter === "cost-desc" ? "is-active" : ""}`}
            onClick={() => onQuickFilterChange("cost-desc")}
          >
            Por coste
          </button>
        </div>

        <label className="projects__status-filter">
          <span>Estado</span>
          <CustomSelect
            className="projects__status-filter-select"
            value={statusFilter}
            options={[{ value: "all", label: "Todos" }, ...statusOptions]}
            onChange={onStatusFilterChange}
          />
        </label>
      </div>
    </>
  );
}
