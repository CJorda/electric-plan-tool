import React from 'react';
import ProjectStatusBadge from '../ProjectStatus/ProjectStatusBadge.jsx';

export default function ProjectCard({
  project,
  total,
  onOpen,
  onDelete,
  onAttachments,
  attachmentsCount = 0,
  statusOptions,
  onStatusChange,
  hideStatusControls = false,
}) {
  return (
    <div className="projects__card">
      <div className="projects__info">
        <div className="projects__title-row">
          <strong className="projects__name">{project.name}</strong>
          {!hideStatusControls && <ProjectStatusBadge status={project.status || 'draft'} />}
        </div>
        <div className="projects__meta">
          <span>{project.type}</span>
          {project.created_at && <span>· Creado: {new Date(project.created_at).toLocaleDateString()}</span>}
          {project.client && <span>· Cliente: {project.client}</span>}
          {project.reference && <span>· Ref: {project.reference}</span>}
          {project.address && <span>· Dirección: {project.address}</span>}
          {project.versions_count !== undefined && <span>· Revisiones: {project.versions_count}</span>}
        </div>
      </div>

      <div className="projects__summary">
        <span className="projects__badge" aria-label="Total estimado">
          <span className="projects__badge-price">€{Number(total || 0).toFixed(2)}</span>
          <span className="projects__badge-label">Total estimado</span>
        </span>
      </div>

      <div className="projects__actions">
        <button className="projects__action" type="button" onClick={() => onOpen(project.id)}>
          Abrir editor
        </button>
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
    </div>
  );
}
