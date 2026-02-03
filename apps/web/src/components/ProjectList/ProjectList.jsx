import React from 'react';
import ProjectCard from '../ProjectCard/ProjectCard.jsx';
import { STATUS_OPTIONS } from '../../constants/projectStatus';

export default function ProjectList({
  projects,
  totals = {},
  onOpen,
  onDelete,
  onAttachments,
  onDuplicateVersion,
  onRequestDeleteVersion,
  onRenameVersion,
  onRenameProject,
  attachmentsByProject = {},
  versionsByProject = {},
  versionsOpenByProject = {},
  versionsLoadingByProject = {},
  onToggleVersions,
  onSelectVersion,
  onStatusChange,
  hideStatusControls = false,
}) {
  if (!projects || projects.length === 0) return <div className="projects__placeholder">No hay proyectos.</div>;
  return (
    <div className="projects__list">
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          total={totals[p.id]}
          attachmentsCount={attachmentsByProject[p.id]?.length || 0}
          versions={versionsByProject[p.id] || []}
          versionsOpen={Boolean(versionsOpenByProject[p.id])}
          versionsLoading={Boolean(versionsLoadingByProject[p.id])}
          statusOptions={STATUS_OPTIONS}
          onOpen={onOpen}
          onDelete={onDelete}
          onAttachments={onAttachments}
          onDuplicateVersion={onDuplicateVersion}
          onRequestDeleteVersion={onRequestDeleteVersion}
          onRenameVersion={onRenameVersion}
          onRenameProject={onRenameProject}
          onToggleVersions={onToggleVersions}
          onSelectVersion={onSelectVersion}
          onStatusChange={onStatusChange}
          hideStatusControls={hideStatusControls}
        />
      ))}
    </div>
  );
}
