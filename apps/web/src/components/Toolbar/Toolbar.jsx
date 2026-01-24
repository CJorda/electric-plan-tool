import { Image, RefreshCcw, SlidersHorizontal, ZoomIn, ZoomOut } from "lucide-react";
import "./Toolbar.css";

function Toolbar({
  visible,
  zoom,
  modes,
  activeMode,
  onModeChange,
  onZoom,
  onReset,
  onOpenImage,
  onOpenSize,
  totals,
}) {
  if (!visible) return null;

  return (
    <header className="toolbar">
      <div className="toolbar__group">
        <button className="toolbar__button" type="button" onClick={onOpenImage}>
          <Image size={18} />
          Imagen fondo
        </button>
        <button className="toolbar__button" type="button" onClick={onOpenSize}>
          <SlidersHorizontal size={18} />
          Tamaño cuadros
        </button>
      </div>

      <div className="toolbar__group">
        <button className="toolbar__icon" type="button" onClick={() => onZoom(-0.1)}>
          <ZoomOut size={18} />
        </button>
        <span className="toolbar__zoom">{Math.round(zoom * 100)}%</span>
        <button className="toolbar__icon" type="button" onClick={() => onZoom(0.1)}>
          <ZoomIn size={18} />
        </button>
        <button className="toolbar__icon" type="button" onClick={onReset}>
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="toolbar__group">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              className={`toolbar__button ${activeMode === mode.id ? "is-active" : ""}`}
              onClick={() => onModeChange(mode.id)}
              type="button"
            >
              <Icon size={18} />
              {mode.label}
            </button>
          );
        })}
      </div>

      <div className="toolbar__budget">
        <div className="toolbar__budget-label">Presupuesto total</div>
        <div className="toolbar__budget-value">€{totals.total.toFixed(2)}</div>
        <div className="toolbar__budget-detail">
          Cuadros: €{totals.boxes.toFixed(2)} · Cables: €{totals.cables.toFixed(2)}
        </div>
      </div>
    </header>
  );
}

export default Toolbar;
