import { Suspense, lazy } from 'react';
import './DashboardPage.css';
import { CheckCircle2, Clock3, FolderOpen, Euro } from 'lucide-react';
import DashboardStatCard from '../../components/Dashboard/DashboardStatCard.jsx';
import DashboardQuickActions from '../../components/Dashboard/DashboardQuickActions.jsx';
import DashboardRecentProjects from '../../components/Dashboard/DashboardRecentProjects.jsx';

const DashboardCharts = lazy(() => import('../../components/Dashboard/DashboardCharts.jsx'));

export default function DashboardPage({
  isActive,
  isLoading = false,
  projects,
  totals,
  onNewProject,
  onOpenProject,
}) {
  if (!isActive) return null;

  if (isLoading) {
    return (
      <section className="dashboard">
        <div className="dashboard__header">
          <div>
            <div className="dashboard__skeleton-title skeleton" />
            <div className="dashboard__skeleton-subtitle skeleton" />
          </div>
        </div>

        <div className="dashboard__stats">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="dashboard__stat dashboard__stat--skeleton">
              <div className="dashboard__skeleton-line skeleton" />
              <div className="dashboard__skeleton-value skeleton" />
            </div>
          ))}
        </div>

        <div className="dashboard__grid">
          <div className="dashboard__panel">
            <div className="dashboard__skeleton-panel-title skeleton" />
            <div className="dashboard__skeleton-actions">
              <div className="dashboard__skeleton-button skeleton" />
              <div className="dashboard__skeleton-button skeleton" />
            </div>
          </div>
          <div className="dashboard__panel">
            <div className="dashboard__skeleton-panel-title skeleton" />
            <div className="dashboard__skeleton-list">
              {[1, 2, 3].map((row) => (
                <div key={row} className="dashboard__skeleton-row skeleton" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const totalProjects = projects.length;
  const confirmed = projects.filter((p) => p.status === 'confirmed').length;
  const pending = projects.filter((p) => p.status === 'draft').length;
  const latestProject = projects[0];
  const makeSparkline = (base) => {
    const value = Number(base) || 0;
    return [
      Math.max(0, value * 0.6),
      Math.max(0, value * 0.75),
      Math.max(0, value * 0.7),
      Math.max(0, value * 0.9),
      Math.max(0, value * 0.85),
      Math.max(0, value),
    ];
  };

  return (
    <section className="dashboard">
      <div className="dashboard__header">
        <div>
          <h2>Resumen</h2>
          <p>Indicadores clave y actividad reciente.</p>
        </div>
      </div>

      <div className="dashboard__stats">
        <DashboardStatCard
          label="Proyectos"
          value={totalProjects}
          icon={FolderOpen}
          colorClass="dashboard__stat--blue"
          sparkline={makeSparkline(totalProjects)}
        />
        <DashboardStatCard
          label="Confirmados"
          value={confirmed}
          icon={CheckCircle2}
          colorClass="dashboard__stat--green"
          sparkline={makeSparkline(confirmed)}
        />
        <DashboardStatCard
          label="Pendientes"
          value={pending}
          icon={Clock3}
          colorClass="dashboard__stat--amber"
          sparkline={makeSparkline(pending)}
        />
        <DashboardStatCard
          label="Total estimado"
          value={`€${Number(totals?.total || 0).toFixed(2)}`}
          icon={Euro}
          colorClass="dashboard__stat--violet"
          sparkline={makeSparkline(Number(totals?.total || 0))}
        />
      </div>

      <Suspense fallback={null}>
        <DashboardCharts projects={projects} />
      </Suspense>

      <div className="dashboard__grid">
        <DashboardQuickActions
          onNewProject={onNewProject}
          onOpenLatest={() => latestProject && onOpenProject?.(latestProject)}
          latestProject={latestProject}
        />
        <DashboardRecentProjects projects={projects} onOpen={onOpenProject} />
      </div>
    </section>
  );
}
