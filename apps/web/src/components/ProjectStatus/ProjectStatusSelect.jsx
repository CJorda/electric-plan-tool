import React from 'react';
import CustomSelect from "../ui/CustomSelect.jsx";
import '../../pages/ProjectsPage/ProjectsPage.css';

export default function ProjectStatusSelect({ value, options = [], onChange }) {
  return (
    <label className="projects__status-select">
      <CustomSelect
        value={value}
        options={options.map((o) => ({ value: o.value, label: o.label }))}
        onChange={onChange}
        className="projects__status-select-control"
      />
    </label>
  );
}
