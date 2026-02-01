export default function DashboardQuickActions({ onNewProject, onOpenLatest, latestProject }) {
  return (
    <div className="dashboard__panel">
      <h3>Acciones rápidas</h3>
      <div className="dashboard__actions">
        <button type="button" onClick={onNewProject}>Nuevo proyecto</button>
        <button type="button" onClick={onOpenLatest} disabled={!latestProject}>Abrir último</button>
      </div>
    </div>
  );
}
