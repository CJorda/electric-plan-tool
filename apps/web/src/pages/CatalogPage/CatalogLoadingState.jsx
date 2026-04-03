export default function CatalogLoadingState({
  isCatalogUnifiedSection,
  isMarginsSection,
  isProvidersAndManufacturersSection,
}) {
  return (
    <section className="catalog">
      <div className="catalog__content">
        <div className="catalog__content-panel">
          {isCatalogUnifiedSection && (
            <section className="catalog__skeleton-section">
              <div className="catalog__skeleton-header">
                <div className="catalog__skeleton-title skeleton" />
                <div className="catalog__skeleton-subtitle skeleton" />
              </div>
              <div className="catalog__skeleton-controls">
                <span className="catalog__skeleton-chip skeleton" />
                <span className="catalog__skeleton-chip skeleton" />
                <span className="catalog__skeleton-button skeleton" />
              </div>
              <div className="catalog__skeleton-grid">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="catalog__skeleton-card skeleton" />
                ))}
              </div>
            </section>
          )}

          {isMarginsSection && (
            <section className="catalog__skeleton-section">
              <div className="catalog__skeleton-header">
                <div className="catalog__skeleton-title skeleton" />
                <div className="catalog__skeleton-subtitle skeleton" />
              </div>
              <div className="catalog__skeleton-grid">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="catalog__skeleton-row skeleton" />
                ))}
              </div>
            </section>
          )}

          {isProvidersAndManufacturersSection && (
            <section className="catalog__skeleton-section">
              <div className="catalog__skeleton-header">
                <div className="catalog__skeleton-title skeleton" />
                <div className="catalog__skeleton-subtitle skeleton" />
              </div>
              <div className="catalog__skeleton-grid">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="catalog__skeleton-row skeleton" />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
