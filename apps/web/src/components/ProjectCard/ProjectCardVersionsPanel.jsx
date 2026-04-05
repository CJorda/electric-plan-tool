import DeleteIconButton from "../ui/DeleteIconButton.jsx";

export default function ProjectCardVersionsPanel({
  project,
  versionsLoading,
  sortedVersions,
  selectedVersionId,
  editingVersionId,
  editingName,
  setEditingName,
  onStartRename,
  onCancelRename,
  onRenameVersion,
  onSelectVersion,
  onAcceptVersion,
  onDuplicateVersion,
  onRequestDeleteVersion,
  calcVersionTotal,
}) {
  if (versionsLoading) {
    return <div className="projects__versions-empty">Cargando versiones...</div>;
  }

  if (sortedVersions.length === 0) {
    return <div className="projects__versions-empty">Aún no hay versiones.</div>;
  }

  const submitRename = (project, version, name) => {
    if (!name.trim()) return;
    onRenameVersion?.(project, version, name.trim());
    onCancelRename();
  };

  return (
    <div className="projects__versions-list">
      {sortedVersions.map((version) => (
        <div key={version.id} className="projects__version-row">
          <div>
            {editingVersionId === version.id ? (
              <div className="projects__version-edit">
                <input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  placeholder="Nombre de la versión"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitRename(project, version, editingName);
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      onCancelRename();
                    }
                  }}
                />
              </div>
            ) : (
              <div className="projects__version-title">
                <strong>{version.name || "Versión"}</strong>
                {selectedVersionId === version.id && (
                  <span className="projects__version-active">Buena</span>
                )}
              </div>
            )}
            <div className="projects__version-meta">{new Date(version.createdAt).toLocaleString()}</div>
          </div>
          <div className="projects__version-total">Total: €{calcVersionTotal(version).toFixed(2)}</div>
          <div className="projects__version-actions">
            <button
              type="button"
              className="projects__version-select"
              disabled={version.locked}
              onClick={() => onSelectVersion?.(project, version)}
            >
              Abrir editor
            </button>
            <button
              type="button"
              className={`projects__version-accept${selectedVersionId === version.id ? " is-active" : ""}`}
              onClick={() => onAcceptVersion?.(project, version)}
            >
              {selectedVersionId === version.id ? "Aceptada" : "Aceptar"}
            </button>
            <button type="button" className="projects__version-rename" onClick={() => onStartRename(version)}>
              Renombrar
            </button>
            <button
              type="button"
              className="projects__version-duplicate"
              onClick={() => onDuplicateVersion?.(project, version)}
            >
              Duplicar
            </button>
            <DeleteIconButton
              ariaLabel="Eliminar versión"
              onClick={() => onRequestDeleteVersion?.(project, version)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
