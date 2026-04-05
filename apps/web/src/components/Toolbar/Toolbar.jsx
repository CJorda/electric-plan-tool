import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Image, Plus, RefreshCcw, SlidersHorizontal, ZoomIn, ZoomOut } from "lucide-react";
import QuoteActions from "../Quote/QuoteActions.jsx";
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
  onOpenCableTypes,
  projectActions = null,
  totals,
}) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef(null);

  const hasSelectMode = useMemo(() => modes.some((mode) => mode.id === "select"), [modes]);
  const selectMode = useMemo(
    () => (hasSelectMode ? modes.find((mode) => mode.id === "select") || null : null),
    [hasSelectMode, modes]
  );
  const addModes = useMemo(
    () => (hasSelectMode ? modes.filter((mode) => mode.id !== "select") : modes),
    [hasSelectMode, modes]
  );
  const SelectIcon = selectMode?.icon;
  const isAddModeActive = addModes.some((mode) => mode.id === activeMode);

  useEffect(() => {
    if (!isAddMenuOpen) return;

    const handlePointerDown = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setIsAddMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsAddMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddMenuOpen]);

  const handleChooseMode = (modeId) => {
    onModeChange(modeId);
    setIsAddMenuOpen(false);
  };

  const handleMenuAction = (action) => {
    action?.();
    setIsAddMenuOpen(false);
  };

  if (!visible) return null;

  return (
    <header className="toolbar">
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

      <div className="toolbar__group toolbar__group--modes">
        {selectMode && (
          <button
            className={`toolbar__button ${activeMode === selectMode.id ? "is-active" : ""}`}
            onClick={() => handleChooseMode(selectMode.id)}
            type="button"
          >
            {SelectIcon ? <SelectIcon size={18} /> : null}
            {selectMode.label}
          </button>
        )}

        {addModes.length > 0 && (
          <div className="toolbar__menu" ref={addMenuRef}>
            <button
              className={`toolbar__button toolbar__menu-trigger ${isAddModeActive ? "is-active" : ""}`}
              type="button"
              aria-haspopup="menu"
              aria-expanded={isAddMenuOpen}
              onClick={() => setIsAddMenuOpen((prev) => !prev)}
            >
              <Plus size={18} />
              Añadir
              <ChevronDown className={`toolbar__menu-chevron${isAddMenuOpen ? " is-open" : ""}`} size={16} />
            </button>

            {isAddMenuOpen && (
              <div className="toolbar__menu-popover" role="menu" aria-label="Opciones para añadir">
                {addModes.map((mode) => {
                  const Icon = mode.icon;
                  const isCurrent = activeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      className={`toolbar__menu-item${isCurrent ? " is-current" : ""}`}
                      onClick={() => handleChooseMode(mode.id)}
                      type="button"
                      role="menuitem"
                    >
                      <Icon size={16} />
                      {mode.label}
                    </button>
                  );
                })}

                <button
                  className="toolbar__menu-item"
                  onClick={() => handleMenuAction(onOpenImage)}
                  type="button"
                  role="menuitem"
                >
                  <Image size={16} />
                  Imagen de fondo
                </button>

                {onOpenCableTypes && (
                  <button
                    className="toolbar__menu-item"
                    onClick={() => handleMenuAction(onOpenCableTypes)}
                    type="button"
                    role="menuitem"
                  >
                    <SlidersHorizontal size={16} />
                    Tipos de cable
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {projectActions?.projectId && <QuoteActions {...projectActions} />}
      </div>

      <div className="toolbar__budget">
        <div className="toolbar__budget-label">Presupuesto total</div>
        <div className="toolbar__budget-value">€{totals.total.toFixed(2)}</div>
      </div>
    </header>
  );
}

export default Toolbar;
