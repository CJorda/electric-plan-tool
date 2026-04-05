import "./CatalogPage.css";
import CatalogContentSections from "./CatalogContentSections.jsx";
import CatalogLoadingState from "./CatalogLoadingState.jsx";

function CatalogPage({
  isProductsSection,
  isCategoriesSection,
  isMarginsSection,
  isManufacturersSection,
  isProvidersSection,
  activeSubsection,
  isLoading = false,
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
  const isProvidersCatalogSection =
    isProvidersSection || activeSubsection === "Proveedores y fabricantes";
  const isManufacturersCatalogSection = isManufacturersSection;
  const isPricingRulesSection =
    isMarginsSection || activeSubsection === "Reglas de precio";
  const isCatalogUnifiedSection = isProductsSection || isCategoriesSection;
  const isActive =
    isCatalogUnifiedSection ||
    isPricingRulesSection ||
    isProvidersCatalogSection ||
    isManufacturersCatalogSection;

  if (!isActive) return null;

  if (isLoading) {
    return (
      <CatalogLoadingState
        isCatalogUnifiedSection={isCatalogUnifiedSection}
        isMarginsSection={isMarginsSection}
        isProvidersSection={isProvidersCatalogSection}
        isManufacturersSection={isManufacturersCatalogSection}
      />
    );
  }

  return (
    <CatalogContentSections
      isCatalogUnifiedSection={isCatalogUnifiedSection}
      isProvidersSection={isProvidersCatalogSection}
      isManufacturersSection={isManufacturersCatalogSection}
      isPricingRulesSection={isPricingRulesSection}
      authToken={authToken}
      productCategoryOptions={productCategoryOptions}
      categories={categories}
      productCategoryFilter={productCategoryFilter}
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
      providers={providers}
      providerForm={providerForm}
      onProviderFormChange={onProviderFormChange}
      onAddProvider={onAddProvider}
      onUpdateProvider={onUpdateProvider}
      onDeleteProvider={onDeleteProvider}
      manufacturers={manufacturers}
      manufacturerForm={manufacturerForm}
      onManufacturerFormChange={onManufacturerFormChange}
      onAddManufacturer={onAddManufacturer}
      onUpdateManufacturer={onUpdateManufacturer}
      onDeleteManufacturer={onDeleteManufacturer}
      margins={margins}
      marginForm={marginForm}
      onMarginFormChange={onMarginFormChange}
      onAddMargin={onAddMargin}
      onUpdateMargin={onUpdateMargin}
      onDeleteMargin={onDeleteMargin}
    />
  );
}

export default CatalogPage;
