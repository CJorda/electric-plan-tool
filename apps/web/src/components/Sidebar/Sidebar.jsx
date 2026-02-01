import { ChevronRight, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./Sidebar.css";

function Sidebar({
  sections,
  activeSection,
  activeSubsection,
  openSection,
  collapsed,
  onToggleCollapsed,
  onSectionToggle,
  onSubsectionChange,
  user,
  onLogout,
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__brand">
        <span className="sidebar__logo" />
        <div className="sidebar__brand-text">
          <div className="sidebar__title">Electric Designer</div>
          <div className="sidebar__subtitle">Industrial Automation</div>
        </div>
        <button className="sidebar__toggle" type="button" onClick={onToggleCollapsed}>
          <Menu size={18} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          const isActive = activeSection === section.title;
          const hasItems = Array.isArray(section.items) && section.items.length > 0;
          return (
            <div key={section.title} className="sidebar__section">
              <button
                className={`sidebar__section-button ${isActive ? "is-active" : ""}`}
                onClick={() =>
                  hasItems
                    ? onSectionToggle(section.title)
                    : onSubsectionChange(section.title, "")
                }
                type="button"
              >
                <SectionIcon size={18} />
                <span>{section.title}</span>
                {hasItems && <ChevronRight size={16} className="sidebar__chevron" />}
              </button>
              {hasItems && !collapsed && openSection === section.title && (
                <div className="sidebar__items">
                  {section.items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`sidebar__item ${
                        activeSection === section.title && activeSubsection === item
                          ? "is-active"
                          : ""
                      }`}
                      onClick={() => onSubsectionChange(section.title, item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {user && !collapsed && (
        <div className="sidebar__user" ref={userMenuRef}>
          <button
            className="sidebar__avatar"
            type="button"
            aria-label="Abrir menú de usuario"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
          />
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user.name || user.email}</div>
            <div className="sidebar__user-role">{user.role || "usuario"}</div>
          </div>
          {isUserMenuOpen && (
            <div className="sidebar__user-menu">
              <button className="sidebar__user-menu-item" type="button">
                Configuración
              </button>
              <button
                className="sidebar__user-menu-item danger"
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onLogout?.();
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
