import React, { useMemo, useState } from 'react';
import ProjectCardInfoPanel from './ProjectCardInfoPanel.jsx';
import ProjectCardVersionsPanel from './ProjectCardVersionsPanel.jsx';

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
      <ProjectCardInfoPanel
        project={project}
        total={total}
        hideStatusControls={hideStatusControls}
        editingProject={editingProject}
        projectName={projectName}
        setProjectName={setProjectName}
        setEditingProject={setEditingProject}
        onRenameProject={onRenameProject}
        onToggleVersions={() => onToggleVersions?.(project)}
        versionsCount={project.versions_count ?? versions.length}
        attachmentsCount={attachmentsCount}
        onAttachments={onAttachments}
        onDelete={onDelete}
      />

      {versionsOpen && (
        <div className="projects__versions">
          <ProjectCardVersionsPanel
            project={project}
            versionsLoading={versionsLoading}
            sortedVersions={sortedVersions}
            editingVersionId={editingVersionId}
            editingName={editingName}
            setEditingName={setEditingName}
            onStartRename={startRename}
            onCancelRename={cancelRename}
            onRenameVersion={onRenameVersion}
            onSelectVersion={onSelectVersion}
            onDuplicateVersion={onDuplicateVersion}
            onRequestDeleteVersion={onRequestDeleteVersion}
            calcVersionTotal={calcVersionTotal}
          />
        </div>
      )}
    </div>
  );
}
