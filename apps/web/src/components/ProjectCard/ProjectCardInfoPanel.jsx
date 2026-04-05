import ProjectStatusBadge from "../ProjectStatus/ProjectStatusBadge.jsx";
import DeleteIconButton from "../ui/DeleteIconButton.jsx";

export default function ProjectCardInfoPanel({
  project,
  total,
  hideStatusControls,
  editingProject,
  projectName,
  setProjectName,
  setEditingProject,
  onRenameProject,
  onToggleVersions,
  versionsCount,
  attachmentsCount,
  onAttachments,
  onDelete,
}) {
  return (
    <>
      <div className="projects__info">
        <div className="projects__title-row">
          {editingProject ? (
            <div className="projects__project-edit">
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Nombre del proyecto"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (!projectName.trim()) return;
                    onRenameProject?.(project, projectName.trim());
                    setEditingProject(false);
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setProjectName(project.name || "");
                    setEditingProject(false);
                  }
                }}
              />
            </div>
          ) : (
            <strong className="projects__name">{project.name}</strong>
          )}
          {!hideStatusControls && <ProjectStatusBadge status={project.status || "draft"} />}
        </div>
        <div className="projects__meta">
          {project.created_at && <span>Creado: {new Date(project.created_at).toLocaleDateString()}</span>}
          {project.client && <span>{project.created_at ? "· " : ""}Cliente: {project.client}</span>}
          <button type="button" className="projects__versions-toggle" onClick={onToggleVersions}>
            Versiones ({versionsCount})
          </button>
          {!editingProject && (
            <button
              type="button"
              className="projects__versions-toggle"
              onClick={() => setEditingProject(true)}
            >
              Renombrar
            </button>
          )}
        </div>
      </div>

      <div className="projects__summary">
        <span className="projects__badge" aria-label="Total estimado">
          <span className="projects__badge-price">€{Number(total || 0).toFixed(2)}</span>
          <span className="projects__badge-label">Total estimado</span>
        </span>
      </div>

      <div className="projects__actions">
        <button className="projects__action" type="button" onClick={() => onAttachments?.(project)}>
          Adjuntos ({attachmentsCount})
        </button>
        <DeleteIconButton ariaLabel="Eliminar proyecto" onClick={() => onDelete(project)} />
      </div>
    </>
  );
}
