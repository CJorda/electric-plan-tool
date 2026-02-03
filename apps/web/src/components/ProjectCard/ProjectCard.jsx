import React, { useMemo, useState } from 'react';
import ProjectStatusBadge from '../ProjectStatus/ProjectStatusBadge.jsx';

const calcVersionTotal = (version) => {
  const design = version?.snapshot?.design || version?.snapshot || {};
  const boxes = Array.isArray(design.boxes) ? design.boxes : [];
  const cables = Array.isArray(design.cables) ? design.cables : [];
  const devices = Array.isArray(design.devices) ? design.devices : [];
  const componentsTotal = boxes.reduce((sum, box) => {
    return sum + (box.components || []).reduce((inner, component) => {
      const quantity = Number(component.quantity) || 1;
      const unit = Number(component.unitPrice) || 0;
      const total = Number(component.total) || unit * quantity;
      return inner + total;
    }, 0);
  }, 0);
  const devicesTotal = devices.reduce(
    (sum, device) => sum + (Number(device.total) || Number(device.unitPrice) || 0),
    0
  );
  const cablesTotal = cables.reduce((sum, cable) => sum + (Number(cable.totalPrice) || 0), 0);
  return componentsTotal + devicesTotal + cablesTotal;
};

export default function ProjectCard({
  project,
  total,
  onDelete,
  onAttachments,
  onDuplicateVersion,
  onRequestDeleteVersion,
  onRenameVersion,
  onRenameProject,
  attachmentsCount = 0,
  versions = [],
  versionsOpen = false,
  versionsLoading = false,
  onToggleVersions,
  onSelectVersion,
  statusOptions,
  onStatusChange,
  hideStatusControls = false,
}) {
  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [versions]
  );
  const [editingVersionId, setEditingVersionId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingProject, setEditingProject] = useState(false);
  const [projectName, setProjectName] = useState(project.name || '');

  const startRename = (version) => {
    setEditingVersionId(version.id);
    setEditingName(version.name || '');
  };

  const cancelRename = () => {
    setEditingVersionId(null);
    setEditingName('');
  };
  return (
    <div className="projects__card">
      <div className="projects__info">
        <div className="projects__title-row">
          {editingProject ? (
            <div className="projects__project-edit">
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Nombre del proyecto"
              />
              <div className="projects__project-edit-actions">
                <button
                  type="button"
                  className="projects__version-rename"
                  onClick={() => {
                    if (!projectName.trim()) return;
                    onRenameProject?.(project, projectName.trim());
                    setEditingProject(false);
                  }}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="projects__version-cancel"
                  onClick={() => {
                    setProjectName(project.name || '');
                    setEditingProject(false);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <strong className="projects__name">{project.name}</strong>
          )}
          {!hideStatusControls && <ProjectStatusBadge status={project.status || 'draft'} />}
        </div>
        <div className="projects__meta">
          <span>{project.type}</span>
          {project.created_at && <span>· Creado: {new Date(project.created_at).toLocaleDateString()}</span>}
          {project.client && <span>· Cliente: {project.client}</span>}
          {project.reference && <span>· Ref: {project.reference}</span>}
          {project.address && <span>· Dirección: {project.address}</span>}
          {project.versions_count !== undefined && <span>· Revisiones: {project.versions_count}</span>}
          <button
            type="button"
            className="projects__versions-toggle"
            onClick={() => onToggleVersions?.(project)}
          >
            Versiones ({project.versions_count ?? versions.length})
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
        <button
          className="projects__action"
          type="button"
          onClick={() => onAttachments?.(project)}
        >
          Adjuntos ({attachmentsCount})
        </button>
        <button className="projects__danger projects__danger--icon" type="button" onClick={() => onDelete(project)} aria-label="Eliminar">
          ×
        </button>
      </div>

      {versionsOpen && (
        <div className="projects__versions">
          {versionsLoading ? (
            <div className="projects__versions-empty">Cargando versiones...</div>
          ) : sortedVersions.length === 0 ? (
            <div className="projects__versions-empty">Aún no hay versiones.</div>
          ) : (
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
                              cancelRename();
                            }}
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            className="projects__version-cancel"
                            onClick={cancelRename}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <strong>{version.name || 'Versión'}</strong>
                    )}
                    <div className="projects__version-meta">
                      {new Date(version.createdAt).toLocaleString()}
                      {version.author ? ` · ${version.author}` : ''}
                      {version.status ? ` · ${version.status}` : ''}
                      {version.locked ? ' · bloqueada' : ''}
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
                    <button
                      type="button"
                      className="projects__version-rename"
                      onClick={() => startRename(version)}
                    >
                      Renombrar
                    </button>
                    <button
                      type="button"
                      className="projects__version-duplicate"
                      onClick={() => onDuplicateVersion?.(project, version)}
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      className="projects__version-delete"
                      onClick={() => onRequestDeleteVersion?.(project, version)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
