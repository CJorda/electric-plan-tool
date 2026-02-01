export default function DashboardStatCard({
  label,
  value,
  trend,
  icon: Icon,
  colorClass = "",
  sparkline,
}) {
  const buildPath = (values = []) => {
    if (!values.length) return "";
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const width = 100;
    const height = 28;
    const step = width / Math.max(values.length - 1, 1);
    return values
      .map((value, index) => {
        const x = Math.round(index * step);
        const y = Math.round(height - ((value - min) / range) * height);
        return `${index === 0 ? "M" : "L"}${x} ${y}`;
      })
      .join(" ");
  };

  const sparkPath = sparkline?.length ? buildPath(sparkline) : "";

  return (
    <div className={`dashboard__stat ${colorClass}`.trim()}>
      <div className="dashboard__stat-header">
        <div>
          <div className="dashboard__stat-label">{label}</div>
          <div className="dashboard__stat-value">{value}</div>
        </div>
        {Icon && (
          <span className="dashboard__stat-icon" aria-hidden="true">
            <Icon size={18} />
          </span>
        )}
      </div>
      <div className="dashboard__stat-footer">
        {trend && <div className="dashboard__stat-trend">{trend}</div>}
        {sparkPath && (
          <svg className="dashboard__stat-sparkline" viewBox="0 0 100 28" aria-hidden="true">
            <path d={sparkPath} />
          </svg>
        )}
      </div>
    </div>
  );
}
