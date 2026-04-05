import ProjectList from "../../components/ProjectList/ProjectList.jsx";

export default function ProjectsPageContent({
  projectsCount,
  filteredProjects,
  error,
  isLoading,
  projectTotals,
  onOpen,
  onDelete,
  onAttachments,
  onDuplicateVersion,
  onRequestDeleteVersion,
  onRenameVersion,
  onRenameProject,
  attachmentsByProject,
  versionsByProject,
  versionsOpenByProject,
  versionsLoadingByProject,
  selectedVersionsByProject,
  onToggleVersions,
  onSelectVersion,
  onAcceptVersion,
  onStatusChange,
  hideStatusControls,
}) {
  return (
    <div className="projects__placeholder">
      <h3>Listado de proyectos ({filteredProjects.length})</h3>
      <p>Se muestran los proyectos según filtros activos y búsqueda global.</p>
      {!isLoading && !error && projectsCount > 0 && filteredProjects.length === 0 && (
        <p className="projects__status">No hay coincidencias con los filtros actuales. Se restablecieron a "Todos" al entrar.</p>
      )}
      {error && <p className="projects__status projects__status--error">{error}</p>}
      {isLoading ? (
        <div className="projects__skeleton">
          {[1, 2, 3].map((item) => (
            <div key={item} className="projects__skeleton-card">
              <div className="projects__skeleton-title skeleton" />
              <div className="projects__skeleton-meta">
                <span className="projects__skeleton-pill skeleton" />
                <span className="projects__skeleton-line skeleton" />
                <span className="projects__skeleton-line skeleton" />
              </div>
              <div className="projects__skeleton-actions">
                <span className="projects__skeleton-button skeleton" />
                <span className="projects__skeleton-button skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ProjectList
          projects={filteredProjects}
          totals={projectTotals}
          onOpen={onOpen}
          onDelete={onDelete}
          onAttachments={onAttachments}
          onDuplicateVersion={onDuplicateVersion}
          onRequestDeleteVersion={onRequestDeleteVersion}
          onRenameVersion={onRenameVersion}
          onRenameProject={onRenameProject}
          attachmentsByProject={attachmentsByProject}
          versionsByProject={versionsByProject}
          versionsOpenByProject={versionsOpenByProject}
          versionsLoadingByProject={versionsLoadingByProject}
          selectedVersionsByProject={selectedVersionsByProject}
          onToggleVersions={onToggleVersions}
          onSelectVersion={onSelectVersion}
          onAcceptVersion={onAcceptVersion}
          onStatusChange={onStatusChange}
          hideStatusControls={hideStatusControls}
        />
      )}
    </div>
  );
}
