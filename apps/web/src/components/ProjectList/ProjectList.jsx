import React from 'react';
import ProjectCard from '../ProjectCard/ProjectCard.jsx';
import { STATUS_OPTIONS } from '../../constants/projectStatus';

export default function ProjectList({ projects, totals = {}, onOpen, onDelete, onStatusChange, hideStatusControls = false }) {
  if (!projects || projects.length === 0) return <div className="projects__placeholder">No hay proyectos.</div>;
  return (
    <div className="projects__list">
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          total={totals[p.id]}
          statusOptions={STATUS_OPTIONS}
          onOpen={onOpen}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          hideStatusControls={hideStatusControls}
        />
      ))}
    </div>
  );
}
