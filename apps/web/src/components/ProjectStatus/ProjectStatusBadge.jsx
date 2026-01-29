import React from 'react';
import '../../pages/ProjectsPage/ProjectsPage.css';

export default function ProjectStatusBadge({ status, className = '' }) {
  return (
    <span className={`projects__status-pill projects__status-pill--${status} ${className}`.trim()}>
      {status}
    </span>
  );
}
