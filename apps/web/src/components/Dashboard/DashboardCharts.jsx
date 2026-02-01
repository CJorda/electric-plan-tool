import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import "./DashboardCharts.css";

const STATUS_LABELS = {
  draft: "Borrador",
  confirmed: "Confirmado",
  published: "Publicado",
  archived: "Archivado",
};

const STATUS_COLORS = {
  draft: "#fbbf24",
  confirmed: "#60a5fa",
  published: "#34d399",
  archived: "#f87171",
};

const getProjectDate = (project) => {
  const raw = project?.created_at || project?.createdAt || project?.createdAtUtc || project?.created;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function DashboardCharts({ projects = [] }) {
  const lineRef = useRef(null);
  const barRef = useRef(null);
  const pieRef = useRef(null);

  const monthly = useMemo(() => {
    const now = new Date();
    const labels = [];
    const keys = [];
    for (let i = 5; i >= 0; i -= 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(
        month.toLocaleDateString("es-ES", { month: "short" })
      );
      keys.push(`${month.getFullYear()}-${month.getMonth() + 1}`);
    }
    const counts = keys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
    projects.forEach((project) => {
      const date = getProjectDate(project);
      if (!date) return;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (Object.prototype.hasOwnProperty.call(counts, key)) {
        counts[key] += 1;
      }
    });
    const values = keys.map((key) => counts[key] || 0);
    return { labels, values };
  }, [projects]);

  const statusCounts = useMemo(() => {
    const base = { draft: 0, confirmed: 0, published: 0, archived: 0 };
    projects.forEach((project) => {
      const status = project?.status || "draft";
      if (base[status] !== undefined) {
        base[status] += 1;
      }
    });
    return base;
  }, [projects]);

  useEffect(() => {
    if (!lineRef.current) return;
    const chart = echarts.init(lineRef.current);
    chart.setOption({
      backgroundColor: "transparent",
      grid: { left: 16, right: 16, top: 30, bottom: 24, containLabel: true },
      xAxis: {
        type: "category",
        data: monthly.labels,
        axisLabel: { color: "#475569" },
        axisLine: { lineStyle: { color: "#cbd5e1" } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#475569" },
        splitLine: { lineStyle: { color: "rgba(148,163,184,0.3)" } },
      },
      series: [
        {
          name: "Proyectos",
          type: "line",
          data: monthly.values,
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          lineStyle: { color: "#60a5fa", width: 3 },
          itemStyle: { color: "#93c5fd" },
          areaStyle: { color: "rgba(59,130,246,0.2)" },
        },
      ],
      tooltip: { trigger: "axis" },
    });
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [monthly]);

  useEffect(() => {
    if (!barRef.current) return;
    const chart = echarts.init(barRef.current);
    const labels = Object.keys(statusCounts).map((key) => STATUS_LABELS[key]);
    const values = Object.keys(statusCounts).map((key) => statusCounts[key]);
    chart.setOption({
      backgroundColor: "transparent",
      grid: { left: 16, right: 16, top: 30, bottom: 24, containLabel: true },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: "#475569" },
        axisLine: { lineStyle: { color: "#cbd5e1" } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#475569" },
        splitLine: { lineStyle: { color: "rgba(148,163,184,0.3)" } },
      },
      series: [
        {
          name: "Estado",
          type: "bar",
          data: values,
          itemStyle: {
            color: (params) => {
              const key = Object.keys(statusCounts)[params.dataIndex];
              return STATUS_COLORS[key] || "#cbd5e1";
            },
            borderRadius: [8, 8, 0, 0],
          },
          barWidth: 32,
        },
      ],
      tooltip: { trigger: "axis" },
    });
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [statusCounts]);

  useEffect(() => {
    if (!pieRef.current) return;
    const chart = echarts.init(pieRef.current);
    const data = Object.keys(statusCounts).map((key) => ({
      name: STATUS_LABELS[key],
      value: statusCounts[key],
      itemStyle: { color: STATUS_COLORS[key] },
    }));
    chart.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          avoidLabelOverlap: true,
          label: { color: "#475569" },
          data,
        },
      ],
    });
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [statusCounts]);

  return (
    <div className="dashboard__charts">
      <div className="dashboard__chart-panel">
        <div className="dashboard__chart-title">Proyectos por mes</div>
        <div ref={lineRef} className="dashboard__chart" />
      </div>
      <div className="dashboard__chart-panel">
        <div className="dashboard__chart-title">Estados actuales</div>
        <div ref={barRef} className="dashboard__chart" />
      </div>
      <div className="dashboard__chart-panel">
        <div className="dashboard__chart-title">Distribución por estado</div>
        <div ref={pieRef} className="dashboard__chart" />
      </div>
    </div>
  );
}
