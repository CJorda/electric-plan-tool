import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DeleteIconButton from "../ui/DeleteIconButton.jsx";
import ProductDeleteModal from "./ProductDeleteModal.jsx";
import ProductsCategoriesDrawer from "./ProductsCategoriesDrawer.jsx";
import ProductEditorDrawer from "./ProductEditorDrawer.jsx";
import ProductsListContent from "./ProductsListContent.jsx";
import ProductsTreePanel from "./ProductsTreePanel.jsx";
import useProductImages from "./useProductImages.js";
import useProductsTreeState from "./useProductsTreeState.js";
import "./ProductsSection.css";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDiscountedPrice = (pvp, discountPercent) => {
  const base = toNumber(pvp);
  const percent = toNumber(discountPercent);
  if (base <= 0) return 0;
  const raw = base * (1 - percent / 100);
  return Number.isFinite(raw) ? Math.max(0, raw) : 0;
};

const formatCurrency = (value) => `€${(Number(value) || 0).toFixed(2)}`;

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildProductForm = (product) => ({
  category: product?.category || "",
  name: product?.name || "",
  manufacturer: product?.manufacturer || "",
  distributorId: product?.distributorId || "",
  serial: product?.serial || "",
  distributorPrice: String(product?.distributorPrice ?? 0),
  discountPercent: String(product?.discountPercent ?? 0),
  shippingCost: String(product?.shippingCost ?? 0),
  leadTime: product?.leadTime || "",
});

function ProductsSection({
  authToken,
  categories,
  categoryNodes = [],
  manufacturers,
  providers,
  productForm,
  onProductFormChange,
  onAddProduct,
  onUploadProductImage,
  groupedProducts,
  allSortedProducts = [],
  onSort,
  sortState,
  onUpdateProduct,
  onLoadProductPriceHistory,
  onCreateProductTariff,
  onDeleteProductTariffEntry,
  onDeleteProduct,
  categoryForm,
  onCategoryFormChange,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) {
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [createImageFile, setCreateImageFile] = useState(null);
  const [createImagePreview, setCreateImagePreview] = useState("");

  const [detailProductId, setDetailProductId] = useState(null);
  const [detailForm, setDetailForm] = useState(null);
  const [detailImageFile, setDetailImageFile] = useState(null);
  const [detailImagePreview, setDetailImagePreview] = useState("");
  const [priceHistoryItems, setPriceHistoryItems] = useState([]);
  const [isPriceHistoryLoading, setIsPriceHistoryLoading] = useState(false);
  const [deletingHistoryEntryId, setDeletingHistoryEntryId] = useState("");
  const [tariffNote, setTariffNote] = useState("");
  const [isCreatingTariff, setIsCreatingTariff] = useState(false);
  const [isCategoriesDrawerOpen, setIsCategoriesDrawerOpen] = useState(false);

  const categoryOptions = useMemo(() => {
    if (categories.length === 0) {
      return [{ value: "", label: "Sin categorías", disabled: true }];
    }
    return categories.map((category) => ({
      value: category.name,
      label: category.label,
    }));
  }, [categories]);

  const manufacturerOptions = useMemo(
    () =>
      (manufacturers || []).map((manufacturer) => ({
        value: manufacturer.name,
        label: manufacturer.name,
      })),
    [manufacturers]
  );

  const distributorOptions = useMemo(
    () =>
      (providers || []).map((provider) => ({
        value: provider.id,
        label: provider.name,
      })),
    [providers]
  );

  const providersById = useMemo(
    () => new Map((providers || []).map((provider) => [provider.id, provider.name])),
    [providers]
  );

  const sourceProducts = useMemo(() => {
    if (Array.isArray(allSortedProducts) && allSortedProducts.length > 0) {
      return allSortedProducts;
    }
    return groupedProducts.flatMap(([, items]) => items);
  }, [allSortedProducts, groupedProducts]);

  const {
    selectedNodeId,
    setSelectedNodeId,
    expandedNodeIds,
    toggleNode,
    childrenByParentId,
    rootNodes,
    subtreeCountById,
    visibleProducts,
    selectedNodeLabel,
  } = useProductsTreeState({
    categoryNodes,
    categories,
    sourceProducts,
  });

  const { imageUrls, setProductImageUrl } = useProductImages({
    authToken,
    visibleProducts,
  });

  const selectedProduct = useMemo(
    () => sourceProducts.find((product) => product.id === detailProductId) || null,
    [sourceProducts, detailProductId]
  );

  const priceHistoryWithDelta = useMemo(() => {
    return priceHistoryItems.map((item, index) => {
      const nextItem = priceHistoryItems[index + 1] || null;
      const currentPrice = Number(item.discountPrice ?? item.distributorPrice) || 0;
      const previousPrice = nextItem
        ? Number(nextItem.discountPrice ?? nextItem.distributorPrice) || 0
        : null;
      const delta = previousPrice == null ? null : currentPrice - previousPrice;
      const deltaPercent =
        previousPrice && previousPrice !== 0 && delta != null
          ? (delta / previousPrice) * 100
          : null;
      return {
        ...item,
        currentPrice,
        delta,
        deltaPercent,
      };
    });
  }, [priceHistoryItems]);

  const loadPriceHistoryForProduct = async (productId, distributorId) => {
    if (!onLoadProductPriceHistory || !productId) {
      setPriceHistoryItems([]);
      return;
    }

    setIsPriceHistoryLoading(true);
    try {
      const items = await onLoadProductPriceHistory(productId, distributorId || "");
      setPriceHistoryItems(Array.isArray(items) ? items : []);
    } catch {
      setPriceHistoryItems([]);
    } finally {
      setIsPriceHistoryLoading(false);
    }
  };

  const handleUploadImage = async (productId, file) => {
    if (!file || !onUploadProductImage) return;
    await onUploadProductImage(productId, file);
    setProductImageUrl(productId, URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!detailProductId || detailImageFile) return;
    setDetailImagePreview(imageUrls[detailProductId] || "");
  }, [detailProductId, detailImageFile, imageUrls]);

  useEffect(
    () =>
      () => {
        if (createImagePreview && createImagePreview.startsWith("blob:")) {
          URL.revokeObjectURL(createImagePreview);
        }
        if (detailImagePreview && detailImagePreview.startsWith("blob:")) {
          URL.revokeObjectURL(detailImagePreview);
        }
      },
    [createImagePreview, detailImagePreview]
  );

  const closeCreateDrawer = () => {
    setIsCreateDrawerOpen(false);
    setCreateImageFile(null);
    if (createImagePreview && createImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(createImagePreview);
    }
    setCreateImagePreview("");
  };

  const openDetail = (product) => {
    setDetailProductId(product.id);
    setDetailForm(buildProductForm(product));
    setDetailImageFile(null);
    setDetailImagePreview(imageUrls[product.id] || "");
    setTariffNote("");
    setPriceHistoryItems([]);
    void loadPriceHistoryForProduct(product.id, product.distributorId || "");
  };

  const closeDetail = () => {
    setDetailProductId(null);
    setDetailForm(null);
    setDetailImageFile(null);
    if (detailImagePreview && detailImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(detailImagePreview);
    }
    setDetailImagePreview("");
    setTariffNote("");
    setPriceHistoryItems([]);
    setIsPriceHistoryLoading(false);
  };

  const handleCreateImageChange = (file) => {
    setCreateImageFile(file || null);
    if (createImagePreview && createImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(createImagePreview);
    }
    setCreateImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const handleDetailImageChange = (file) => {
    setDetailImageFile(file || null);
    if (detailImagePreview && detailImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(detailImagePreview);
    }
    setDetailImagePreview(file ? URL.createObjectURL(file) : imageUrls[detailProductId] || "");
  };

  const handleAddProductWithImage = async () => {
    const created = await onAddProduct?.();
    if (created?.id && createImageFile) {
      await handleUploadImage(created.id, createImageFile);
    }
    closeCreateDrawer();
  };

  const handleSaveDetail = async () => {
    if (!selectedProduct || !detailForm?.name?.trim() || !detailForm.category) return;

    const distributorPrice = toNumber(detailForm.distributorPrice);
    const discountPercent = toNumber(detailForm.discountPercent);

    await onUpdateProduct?.(selectedProduct.id, {
      category: detailForm.category,
      name: detailForm.name,
      manufacturer: detailForm.manufacturer,
      distributorId: detailForm.distributorId,
      serial: detailForm.serial,
      distributorPrice,
      discountPercent,
      discountPrice: getDiscountedPrice(distributorPrice, discountPercent),
      shippingCost: toNumber(detailForm.shippingCost),
      leadTime: detailForm.leadTime,
    });

    if (detailImageFile) {
      await handleUploadImage(selectedProduct.id, detailImageFile);
    }

    closeDetail();
  };

  const handleCreateTariff = async () => {
    if (!selectedProduct || !detailForm || !onCreateProductTariff) return;

    const distributorPrice = toNumber(detailForm.distributorPrice);
    const discountPercent = toNumber(detailForm.discountPercent);

    setIsCreatingTariff(true);
    try {
      const updated = await onCreateProductTariff(selectedProduct.id, {
        distributorId: detailForm.distributorId,
        distributorPrice,
        discountPrice: getDiscountedPrice(distributorPrice, discountPercent),
        shippingCost: toNumber(detailForm.shippingCost),
        leadTime: detailForm.leadTime,
        note: tariffNote,
      });

      if (updated) {
        setDetailForm(buildProductForm(updated));
      }

      await loadPriceHistoryForProduct(
        selectedProduct.id,
        detailForm.distributorId || ""
      );
      setTariffNote("");
    } finally {
      setIsCreatingTariff(false);
    }
  };

  const handleDeleteTariffEntry = async (entry) => {
    if (!entry?.id || !selectedProduct || !onDeleteProductTariffEntry || !detailForm) return;
    setDeletingHistoryEntryId(entry.id);
    try {
      const updated = await onDeleteProductTariffEntry(
        selectedProduct.id,
        entry.id,
        detailForm.distributorId || ""
      );
      if (updated) {
        setDetailForm(buildProductForm(updated));
      }
      await loadPriceHistoryForProduct(selectedProduct.id, detailForm.distributorId || "");
    } finally {
      setDeletingHistoryEntryId("");
    }
  };

  const renderTreeNode = (node, depth = 0) => {
    const children = childrenByParentId.get(node.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodeIds.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const count = subtreeCountById.get(node.id) || 0;

    return (
      <div key={node.id} className="products__tree-node-wrap">
        <div className="products__tree-row" style={{ paddingLeft: `${depth * 14}px` }}>
          <button
            type="button"
            className="products__tree-toggle"
            onClick={() => hasChildren && toggleNode(node.id)}
            disabled={!hasChildren}
            aria-label={hasChildren ? (isExpanded ? "Contraer" : "Expandir") : "Sin hijos"}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <span className="products__tree-toggle-spacer" />
            )}
          </button>
          <button
            type="button"
            className={`products__tree-node ${isSelected ? "is-active" : ""}`}
            onClick={() => setSelectedNodeId(node.id)}
          >
            <span>{node.name}</span>
            <span className="products__tree-count">{count}</span>
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div className="products__tree-children">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="products products--catalog">
      <div className="products__header">
        <div>
          <h2>Catálogo · Productos</h2>
          <p>Navega por árbol de categorías y abre el panel de detalle para editar.</p>
        </div>
        <div className="products__controls">
          <button
            type="button"
            className="products__secondary"
            onClick={() => setIsCategoriesDrawerOpen(true)}
            disabled={!categoryForm || !onCategoryFormChange || !onAddCategory}
          >
            Gestionar categorías
          </button>
          <button type="button" className="products__primary" onClick={() => setIsCreateDrawerOpen(true)}>
            Añadir producto
          </button>
        </div>
      </div>

      <div className="products__layout">
        <ProductsTreePanel
          selectedNodeId={selectedNodeId}
          sourceProductsCount={sourceProducts.length}
          rootNodes={rootNodes}
          renderTreeNode={renderTreeNode}
          onSelectAll={() => setSelectedNodeId("all")}
        />

        <div className="products__content-panel">
          <div className="products__context">
            <span className="products__context-label">Vista:</span>
            <strong>{selectedNodeLabel}</strong>
            <span className="products__context-count">{visibleProducts.length} productos</span>
          </div>

          <ProductsListContent
            visibleProducts={visibleProducts}
            categoriesCount={categories.length}
            imageUrls={imageUrls}
            sortState={sortState}
            onSort={onSort}
            onOpenDetail={openDetail}
            onRequestDelete={setDeleteCandidate}
            calculateDiscountedPrice={getDiscountedPrice}
          />
        </div>
      </div>

      <ProductEditorDrawer
        open={isCreateDrawerOpen}
        title="Nuevo producto"
        form={productForm}
        categoryOptions={categoryOptions}
        manufacturerOptions={manufacturerOptions}
        distributorOptions={distributorOptions}
        imagePreview={createImagePreview}
        imageInputId="create-product-image"
        discountedPrice={getDiscountedPrice(
          productForm.distributorPrice,
          productForm.discountPercent
        ).toFixed(2)}
        saveLabel="Guardar"
        canSave={Boolean(productForm.name?.trim()) && Boolean(productForm.category)}
        onClose={closeCreateDrawer}
        onSave={handleAddProductWithImage}
        onImageChange={handleCreateImageChange}
        onChangeField={(field, value) => onProductFormChange({ [field]: value })}
      />

      <ProductsCategoriesDrawer
        open={isCategoriesDrawerOpen}
        onClose={() => setIsCategoriesDrawerOpen(false)}
        categoryForm={categoryForm}
        onCategoryFormChange={onCategoryFormChange}
        onAddCategory={onAddCategory}
        categories={categoryNodes}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
      />

      <ProductEditorDrawer
        open={Boolean(detailProductId && detailForm && selectedProduct)}
        title="Detalle de producto"
        form={detailForm}
        categoryOptions={categoryOptions}
        manufacturerOptions={manufacturerOptions}
        distributorOptions={distributorOptions}
        imagePreview={detailImagePreview}
        imageInputId="detail-product-image"
        discountedPrice={
          detailForm
            ? getDiscountedPrice(detailForm.distributorPrice, detailForm.discountPercent).toFixed(2)
            : "0.00"
        }
        saveLabel="Guardar cambios"
        canSave={Boolean(detailForm?.name?.trim()) && Boolean(detailForm?.category)}
        secondaryActionLabel="Nueva tarifa"
        secondaryActionDisabled={
          isCreatingTariff ||
          !detailForm?.distributorId ||
          !Number.isFinite(toNumber(detailForm?.distributorPrice))
        }
        onSecondaryAction={handleCreateTariff}
        onClose={closeDetail}
        onSave={handleSaveDetail}
        onImageChange={handleDetailImageChange}
        onChangeField={(field, value) => setDetailForm((prev) => ({ ...prev, [field]: value }))}
      >
        <div className="products__tariff-panel">
          <label>
            Nota de nueva tarifa (opcional)
            <input
              value={tariffNote}
              onChange={(event) => setTariffNote(event.target.value)}
              placeholder="Ej: subida mensual proveedor"
            />
          </label>

          <div className="products__tariff-history">
            <strong>Historial de tarifas</strong>
            {isPriceHistoryLoading ? (
              <p className="products__tariff-empty">Cargando historial...</p>
            ) : priceHistoryWithDelta.length === 0 ? (
              <p className="products__tariff-empty">Sin histórico para este proveedor.</p>
            ) : (
              <ul className="products__tariff-list">
                {priceHistoryWithDelta.map((entry) => {
                  const providerName = entry.distributorId
                    ? providersById.get(entry.distributorId) || "Proveedor"
                    : "General";
                  const hasDelta = entry.delta != null;
                  const deltaValue = hasDelta ? Number(entry.delta) : 0;
                  const isUp = deltaValue > 0;
                  const isDown = deltaValue < 0;
                  const deltaClass = isUp
                    ? "is-up"
                    : isDown
                      ? "is-down"
                      : "is-flat";
                  const percentText =
                    entry.deltaPercent == null
                      ? ""
                      : ` (${entry.deltaPercent > 0 ? "+" : ""}${entry.deltaPercent.toFixed(2)}%)`;

                  return (
                    <li key={entry.id} className="products__tariff-item">
                      <div className="products__tariff-meta">
                        <span>{providerName}</span>
                        <span>{formatDateTime(entry.createdAt)}</span>
                      </div>
                      <div className="products__tariff-values">
                        <span className="products__tariff-price">{formatCurrency(entry.currentPrice)}</span>
                        <span className={`products__tariff-delta ${deltaClass}`}>
                          {hasDelta
                            ? `${deltaValue > 0 ? "+" : ""}${formatCurrency(deltaValue)}${percentText}`
                            : "Base"}
                        </span>
                      </div>
                      <div className="products__tariff-footer">
                        {entry.note ? <small>{entry.note}</small> : <small>Sin nota</small>}
                        <DeleteIconButton
                          ariaLabel="Eliminar entrada de tarifa"
                          onClick={() => handleDeleteTariffEntry(entry)}
                          disabled={deletingHistoryEntryId === entry.id}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </ProductEditorDrawer>

      <ProductDeleteModal
        open={Boolean(deleteCandidate)}
        productName={deleteCandidate?.name}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            onDeleteProduct?.(deleteCandidate.id);
          }
          setDeleteCandidate(null);
        }}
      />
    </section>
  );
}

export default ProductsSection;
