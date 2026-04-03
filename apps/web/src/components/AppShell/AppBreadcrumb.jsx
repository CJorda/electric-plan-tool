import { Menu } from "lucide-react";

export default function AppBreadcrumb({
  breadcrumbItems,
  isSidebarCollapsed,
  onToggleSidebar,
  onCloseSidebar,
}) {
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <button
          className="breadcrumb__menu"
          type="button"
          aria-label="Abrir menú"
          onClick={onToggleSidebar}
        >
          <Menu size={18} />
        </button>
        {breadcrumbItems.map((item, index) => (
          <span key={`${item.label}-${index}`} className="breadcrumb__item">
            <button className="breadcrumb__link" type="button" onClick={item.onClick}>
              {item.label}
            </button>
            {index < breadcrumbItems.length - 1 && <span className="breadcrumb__sep">/</span>}
          </span>
        ))}
      </nav>

      {!isSidebarCollapsed && (
        <button
          className="sidebar__overlay"
          type="button"
          aria-label="Cerrar menú"
          onClick={onCloseSidebar}
        />
      )}
    </>
  );
}
