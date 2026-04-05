import { memo } from 'react';
import ProjectCard from '../ProjectCard/ProjectCard.jsx';
import { STATUS_OPTIONS } from '../../constants/projectStatus';

function ProjectList({
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
  selectedVersionsByProject = {},
  onToggleVersions,
  onSelectVersion,
  onAcceptVersion,
  onStatusChange,
  hideStatusControls = false,
}) {
  "use memo";

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
          selectedVersionId={selectedVersionsByProject[p.id]?.id || null}
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
          onAcceptVersion={onAcceptVersion}
          onStatusChange={onStatusChange}
          hideStatusControls={hideStatusControls}
        />
      ))}
    </div>
  );
}

export default memo(ProjectList);
