import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import DeleteIconButton from "../ui/DeleteIconButton.jsx";
import ProductDeleteModal from "./ProductDeleteModal.jsx";
import ProductsCategoriesDrawer from "./ProductsCategoriesDrawer.jsx";
import ProductEditorDrawer from "./ProductEditorDrawer.jsx";
import ProductsListContent from "./ProductsListContent.jsx";
import ProductsTreePanel from "./ProductsTreePanel.jsx";
import useProductImages from "./useProductImages.js";
import useProductsTreeState from "./useProductsTreeState.js";
import { toastError } from "../../lib/toast.js";
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

const formatCurrency = (value) => `${(Number(value) || 0).toFixed(2)} €`;

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

const buildPriceEvolutionKey = (productId, distributorId) =>
  `${productId || ""}::${distributorId || ""}`;

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
  const [detailDistributorId, setDetailDistributorId] = useState("");
  const [detailForm, setDetailForm] = useState(null);
  const [detailImageFile, setDetailImageFile] = useState(null);
  const [detailImagePreview, setDetailImagePreview] = useState("");
  const [priceHistoryItems, setPriceHistoryItems] = useState([]);
  const [isPriceHistoryLoading, setIsPriceHistoryLoading] = useState(false);
  const [deletingHistoryEntryId, setDeletingHistoryEntryId] = useState("");
  const [tariffNote, setTariffNote] = useState("");
  const [isCreatingTariff, setIsCreatingTariff] = useState(false);
  const [isCategoriesDrawerOpen, setIsCategoriesDrawerOpen] = useState(false);
  const [priceEvolutionByKey, setPriceEvolutionByKey] = useState({});
  const loadingEvolutionKeysRef = useRef(new Set());
  const MAX_SPARKLINE_PRODUCTS = 40;

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
    () => {
      const normalizedDistributorId = String(detailDistributorId || "");
      const exactMatch = sourceProducts.find(
        (product) =>
          product.id === detailProductId &&
          String(product.distributorId || "") === normalizedDistributorId
      );
      if (exactMatch) {
        return exactMatch;
      }
      return sourceProducts.find((product) => product.id === detailProductId) || null;
    },
    [sourceProducts, detailProductId, detailDistributorId]
  );

  useEffect(() => {
    if (!onLoadProductPriceHistory || visibleProducts.length === 0) return;

    // Limit history requests used for sparklines to avoid exhausting API rate limits.
    const productsForEvolution = visibleProducts.slice(0, MAX_SPARKLINE_PRODUCTS);

    const pending = productsForEvolution.filter((product) => {
      const key = buildPriceEvolutionKey(product.id, product.distributorId || "");
      return !priceEvolutionByKey[key] && !loadingEvolutionKeysRef.current.has(key);
    });

    if (pending.length === 0) return;
    pending.forEach((product) => {
      const key = buildPriceEvolutionKey(product.id, product.distributorId || "");
      loadingEvolutionKeysRef.current.add(key);
    });

    const loadEvolution = async () => {
      const results = await Promise.all(
        pending.map(async (product) => {
          const key = buildPriceEvolutionKey(product.id, product.distributorId || "");
          const fallbackPrice = Number(product.discountPrice ?? product.distributorPrice) || 0;

          try {
            let items = await onLoadProductPriceHistory(product.id, product.distributorId || "");
            if ((items?.length || 0) < 2 && product.distributorId) {
              const allDistributorsItems = await onLoadProductPriceHistory(product.id, "");
              if ((allDistributorsItems?.length || 0) > (items?.length || 0)) {
                items = allDistributorsItems;
              }
            }
            const ordered = Array.isArray(items) ? [...items].reverse() : [];
            const points = ordered
              .map((entry) => Number(entry.discountPrice ?? entry.distributorPrice))
              .filter((value) => Number.isFinite(value));

            if (points.length === 0) {
              return { key, points: [fallbackPrice] };
            }

            const last = points[points.length - 1];
            if (Math.abs(last - fallbackPrice) > 0.0001) {
              points.push(fallbackPrice);
            }

            return { key, points: points.slice(-20) };
          } catch {
            return { key, points: [fallbackPrice] };
          }
        })
      );

      setPriceEvolutionByKey((prev) => {
        const next = { ...prev };
        results.forEach(({ key, points }) => {
          next[key] = points;
        });
        return next;
      });

      results.forEach(({ key }) => {
        loadingEvolutionKeysRef.current.delete(key);
      });
    };

    void loadEvolution();
  }, [visibleProducts, onLoadProductPriceHistory, priceEvolutionByKey]);

  const priceHistoryWithDelta = useMemo(() => {
    return priceHistoryItems.map((item, index) => {
      const nextItem = priceHistoryItems[index + 1] || null;
      const basePrice = Number(item.distributorPrice) || 0;
      const currentPrice = Number(item.discountPrice ?? item.distributorPrice) || 0;
      const previousPrice = nextItem
        ? Number(nextItem.discountPrice ?? nextItem.distributorPrice) || 0
        : null;
      const delta = previousPrice == null ? null : currentPrice - previousPrice;
      const deltaPercent =
        previousPrice && previousPrice !== 0 && delta != null
          ? (delta / previousPrice) * 100
          : null;
      const discountPercent =
        basePrice > 0
          ? Math.max(0, ((basePrice - currentPrice) / basePrice) * 100)
          : 0;
      return {
        ...item,
        basePrice,
        currentPrice,
        delta,
        deltaPercent,
        discountPercent,
      };
    });
  }, [priceHistoryItems]);

  const loadPriceHistoryForProduct = async (productId, distributorId) => {
    if (!onLoadProductPriceHistory || !productId) {
      setPriceHistoryItems([]);
      return;
    }

    setIsPriceHistoryLoading(true);
    const normalizedDistributorId = String(distributorId || "").trim();
    try {
      let items = await onLoadProductPriceHistory(productId, normalizedDistributorId);

      // Match sparkline behavior: if provider-specific history is empty, fall back to full history.
      if ((items?.length || 0) === 0 && normalizedDistributorId) {
        const allDistributorsItems = await onLoadProductPriceHistory(productId, "");
        if ((allDistributorsItems?.length || 0) > 0) {
          items = allDistributorsItems;
        }
      }

      setPriceHistoryItems(Array.isArray(items) ? items : []);
    } catch {
      if (normalizedDistributorId) {
        try {
          const allDistributorsItems = await onLoadProductPriceHistory(productId, "");
          setPriceHistoryItems(Array.isArray(allDistributorsItems) ? allDistributorsItems : []);
        } catch {
          setPriceHistoryItems([]);
        }
      } else {
        setPriceHistoryItems([]);
      }
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
    setDetailDistributorId(product.distributorId || "");
    setDetailForm(buildProductForm(product));
    setDetailImageFile(null);
    setDetailImagePreview(imageUrls[product.id] || "");
    setTariffNote("");
    setPriceHistoryItems([]);
    void loadPriceHistoryForProduct(product.id, product.distributorId || "");
  };

  const closeDetail = () => {
    setDetailProductId(null);
    setDetailDistributorId("");
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
    } catch (error) {
      toastError(error?.message || "No se pudo guardar la nueva tarifa.");
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
            getPriceEvolutionPoints={(product) => {
              const key = buildPriceEvolutionKey(product.id, product.distributorId || "");
              return (
                priceEvolutionByKey[key] ||
                [Number(product.discountPrice ?? product.distributorPrice) || 0]
              );
            }}
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
              <p className="products__tariff-empty">Sin histórico de tarifas.</p>
            ) : (
              <ul className="products__tariff-list">
                {priceHistoryWithDelta.map((entry) => {
                  const sanitizedNote = String(entry.note || "").trim();
                  const isAutomaticNote = /^tarifa\s+autom[aá]tica\b/i.test(sanitizedNote);
                  const visibleNote = isAutomaticNote ? "" : sanitizedNote;
                  const hasEntryDiscount = entry.discountPercent > 0.01;
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
                      <DeleteIconButton
                        className="products__tariff-delete"
                        ariaLabel="Eliminar entrada de tarifa"
                        onClick={() => handleDeleteTariffEntry(entry)}
                        disabled={deletingHistoryEntryId === entry.id}
                      />
                      <div className="products__tariff-meta">
                        <span>{formatDateTime(entry.createdAt)}</span>
                      </div>
                      <div className="products__tariff-values">
                        <span className="products__tariff-price">{formatCurrency(entry.currentPrice)}</span>
                      </div>
                      <div className="products__tariff-origin">
                        <span>
                          {hasEntryDiscount
                            ? `Viene de ${formatCurrency(entry.basePrice)} con ${entry.discountPercent.toFixed(2)}% dto`
                            : `Precio base ${formatCurrency(entry.basePrice)} (sin descuento)`}
                        </span>
                        <span className={`products__tariff-delta products__tariff-origin-delta ${deltaClass}`}>
                          {hasDelta
                            ? `${deltaValue > 0 ? "+" : ""}${formatCurrency(deltaValue)}${percentText}`
                            : "Base"}
                        </span>
                      </div>
                      {visibleNote ? <small>{visibleNote}</small> : null}
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
