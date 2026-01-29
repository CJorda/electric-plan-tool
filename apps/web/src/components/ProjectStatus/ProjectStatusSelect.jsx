import React from 'react';
import '../../pages/ProjectsPage/ProjectsPage.css';

export default function ProjectStatusSelect({ value, options = [], onChange }) {
  return (
    <label className="projects__status-select">
      <select value={value} onChange={(e) => onChange?.(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
