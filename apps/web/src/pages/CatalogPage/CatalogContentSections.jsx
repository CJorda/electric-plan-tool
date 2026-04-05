import ProductsSection from "../../components/ProductsSection/ProductsSection.jsx";
import MarginsSection from "../../components/MarginsSection/MarginsSection.jsx";
import ManufacturersSection from "../../components/ManufacturersSection/ManufacturersSection.jsx";
import ProvidersSection from "../../components/ProvidersSection/ProvidersSection.jsx";

export default function CatalogContentSections({
  isCatalogUnifiedSection,
  isProvidersSection,
  isManufacturersSection,
  isPricingRulesSection,
  authToken,
  productCategoryOptions,
  categories,
  productCategoryFilter,
  onFilterChange,
  productForm,
  onProductFormChange,
  onAddProduct,
  onUploadProductImage,
  onProductInputKeyDown,
  groupedProducts,
  allSortedProducts,
  onSort,
  sortState,
  onUpdateProduct,
  onDeleteProduct,
  categoryForm,
  onCategoryFormChange,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  providers,
  providerForm,
  onProviderFormChange,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
  manufacturers,
  manufacturerForm,
  onManufacturerFormChange,
  onAddManufacturer,
  onUpdateManufacturer,
  onDeleteManufacturer,
  margins,
  marginForm,
  onMarginFormChange,
  onAddMargin,
  onUpdateMargin,
  onDeleteMargin,
}) {
  const catalogClassName = `catalog${isCatalogUnifiedSection ? " catalog--products-layout" : ""}`;

  return (
    <section className={catalogClassName}>
      <div className="catalog__content">
        <div className="catalog__content-panel">
          {isCatalogUnifiedSection && (
            <ProductsSection
              authToken={authToken}
              categories={productCategoryOptions}
              categoryNodes={categories}
              manufacturers={manufacturers}
              providers={providers}
              categoryFilter={productCategoryFilter}
              onFilterChange={onFilterChange}
              productForm={productForm}
              onProductFormChange={onProductFormChange}
              onAddProduct={onAddProduct}
              onUploadProductImage={onUploadProductImage}
              onProductInputKeyDown={onProductInputKeyDown}
              groupedProducts={groupedProducts}
              allSortedProducts={allSortedProducts}
              onSort={onSort}
              sortState={sortState}
              onUpdateProduct={onUpdateProduct}
              onDeleteProduct={onDeleteProduct}
              categoryForm={categoryForm}
              onCategoryFormChange={onCategoryFormChange}
              onAddCategory={onAddCategory}
              onUpdateCategory={onUpdateCategory}
              onDeleteCategory={onDeleteCategory}
            />
          )}

          {isProvidersSection && (
            <ProvidersSection
              providers={providers}
              providerForm={providerForm}
              onProviderFormChange={onProviderFormChange}
              onAddProvider={onAddProvider}
              onUpdateProvider={onUpdateProvider}
              onDeleteProvider={onDeleteProvider}
            />
          )}

          {isManufacturersSection && (
            <ManufacturersSection
              manufacturers={manufacturers}
              manufacturerForm={manufacturerForm}
              onManufacturerFormChange={onManufacturerFormChange}
              onAddManufacturer={onAddManufacturer}
              onUpdateManufacturer={onUpdateManufacturer}
              onDeleteManufacturer={onDeleteManufacturer}
            />
          )}

          {isPricingRulesSection && (
            <>
              <MarginsSection
                categories={categories}
                providers={providers}
                margins={margins}
                marginForm={marginForm}
                onMarginFormChange={onMarginFormChange}
                onAddMargin={onAddMargin}
                onUpdateMargin={onUpdateMargin}
                onDeleteMargin={onDeleteMargin}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
