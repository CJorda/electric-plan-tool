import { memo } from "react";

function ProjectsPageHeader({
  onOpenCreate,
}) {
  "use memo";

  return (
    <>
      <div className="projects__header">
        <div>
          <h2>Proyectos</h2>
          <p>Organiza y gestiona tus proyectos eléctricos por bloques de trabajo.</p>
        </div>
        <div className="projects__header-actions">
          <button className="projects__action" type="button" onClick={onOpenCreate}>
            Nuevo proyecto
          </button>
        </div>
      </div>
    </>
  );
}

export default memo(ProjectsPageHeader);
