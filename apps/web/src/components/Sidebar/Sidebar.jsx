import { ChevronRight, Menu } from "lucide-react";
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
}) {
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
          return (
            <div key={section.title} className="sidebar__section">
              <button
                className={`sidebar__section-button ${isActive ? "is-active" : ""}`}
                onClick={() => onSectionToggle(section.title)}
                type="button"
              >
                <SectionIcon size={18} />
                <span>{section.title}</span>
                <ChevronRight size={16} className="sidebar__chevron" />
              </button>
              {!collapsed && openSection === section.title && (
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
    </aside>
  );
}

export default Sidebar;
