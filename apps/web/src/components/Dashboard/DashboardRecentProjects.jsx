export default function DashboardRecentProjects({ projects = [], onOpen }) {
  return (
    <div className="dashboard__panel">
      <h3>Actividad reciente</h3>
      {projects.length === 0 ? (
        <div className="dashboard__empty">Aún no hay proyectos recientes.</div>
      ) : (
        <div className="dashboard__list">
          {projects.slice(0, 5).map((project) => (
            <button key={project.id} className="dashboard__list-item" type="button" onClick={() => onOpen?.(project)}>
              <div>
                <strong>{project.name}</strong>
                <div className="dashboard__list-meta">{project.type} · {project.status}</div>
              </div>
              <span className="dashboard__list-date">
                {project.created_at ? new Date(project.created_at).toLocaleDateString() : '—'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
