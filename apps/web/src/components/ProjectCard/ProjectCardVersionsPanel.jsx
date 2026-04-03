import DeleteIconButton from "../ui/DeleteIconButton.jsx";

export default function ProjectCardVersionsPanel({
  project,
  versionsLoading,
  sortedVersions,
  editingVersionId,
  editingName,
  setEditingName,
  onStartRename,
  onCancelRename,
  onRenameVersion,
  onSelectVersion,
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
                />
                <div className="projects__version-edit-actions">
                  <button
                    type="button"
                    className="projects__version-rename"
                    onClick={() => {
                      if (!editingName.trim()) return;
                      onRenameVersion?.(project, version, editingName.trim());
                      onCancelRename();
                    }}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="projects__version-cancel"
                    onClick={onCancelRename}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <strong>{version.name || "Versión"}</strong>
            )}
            <div className="projects__version-meta">
              {new Date(version.createdAt).toLocaleString()}
              {version.author ? ` · ${version.author}` : ""}
              {version.status ? ` · ${version.status}` : ""}
              {version.locked ? " · bloqueada" : ""}
            </div>
            {version.notes && <div className="projects__version-notes">{version.notes}</div>}
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
