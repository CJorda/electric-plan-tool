import { useEffect, useMemo, useState } from "react";
import { Boxes, Camera, Link2, MousePointer } from "lucide-react";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import Toolbar from "./components/Toolbar/Toolbar.jsx";
import CatalogPage from "./pages/CatalogPage/CatalogPage.jsx";
import CanvasPage from "./pages/CanvasPage/CanvasPage.jsx";
import ProjectsPage from "./pages/ProjectsPage/ProjectsPage.jsx";
import BoxModal from "./components/modals/BoxModal/BoxModal.jsx";
import CableModal from "./components/modals/CableModal/CableModal.jsx";
import ImageModal from "./components/modals/ImageModal/ImageModal.jsx";
import SizeModal from "./components/modals/SizeModal/SizeModal.jsx";
import CameraModal from "./components/modals/CameraModal/CameraModal.jsx";
import useCatalog from "./hooks/useCatalog.js";
import useCanvas from "./hooks/useCanvas.js";
import "./App.css";

const MODES = [
  { id: "select", label: "Seleccionar", icon: MousePointer },
  { id: "addBox", label: "Añadir cuadro", icon: Boxes },
  { id: "addCable", label: "Dibujar cable", icon: Link2 },
  { id: "addDevice", label: "Añadir cámara", icon: Camera },
];

const BOX_SIZES = {
  small: { width: 80, height: 60, label: "Pequeño" },
  medium: { width: 140, height: 100, label: "Mediano" },
  large: { width: 200, height: 140, label: "Grande" },
};

const createId = () => crypto.randomUUID();

const DEFAULT_COMPONENT_FORM = {
  category: "",
  model: "",
  quantity: 1,
  unitPrice: 0,
};

const STATUS_OPTIONS = [
  { value: "draft", label: "borrador" },
  { value: "confirmed", label: "confirmado" },
  { value: "published", label: "publicado" },
  { value: "archived", label: "archivado" },
];

const STATUS_LABELS = {
  draft: "borrador",
  confirmed: "confirmado",
  published: "publicado",
  archived: "archivado",
  local: "local",
};

function App() {
  const [activeMode, setActiveMode] = useState("select");
  const [activeSection, setActiveSection] = useState("Catálogo");
  const [activeSubsection, setActiveSubsection] = useState("Productos");
  const [openSection, setOpenSection] = useState("Catálogo");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProjectDesignMode, setIsProjectDesignMode] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [activeProjectStatus, setActiveProjectStatus] = useState("draft");
  const [isCableModalOpen, setIsCableModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isPartsListOpen, setIsPartsListOpen] = useState(false);
  const [boxSize, setBoxSize] = useState(BOX_SIZES.medium);
  const [customBoxSize, setCustomBoxSize] = useState({ width: 160, height: 120 });
  const [componentForm, setComponentForm] = useState(DEFAULT_COMPONENT_FORM);
  const [cableForm, setCableForm] = useState({
    model: "Cable UTP Cat6",
    section: "0.5mm²",
    length: 10,
    totalPrice: 20,
  });
  const [editingCableId, setEditingCableId] = useState(null);

  const {
    productForm,
    setProductForm,
    products,
    productCategoryFilter,
    setProductCategoryFilter,
    productSort,
    categoryForm,
    setCategoryForm,
    categories,
    productCategories,
    groupedProducts,
    handleAddProduct,
    handleProductInputKeyDown,
    updateProduct,
    handleSort,
    handleAddCategory,
    updateCategory,
    deleteCategory,
  } = useCatalog();

  const {
    svgRef,
    boxes,
    cables,
    devices,
    setBoxes,
    setCables,
    setDevices,
    selectedBoxId,
    selectedDeviceId,
    pan,
    zoom,
    backgroundImage,
    tooltip,
    draftCable,
    draftPolyline,
    handleCanvasClick,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleBoxPointerDown,
    handleDevicePointerDown,
    handleDeviceDoubleClick,
    handleBoxDoubleClick,
    handleBoxPointerMove,
    handleBoxPointerLeave,
    updateBox,
    updateCable,
    deleteBox,
    deleteCable,
    handleZoomButton,
    resetView,
    setBackgroundImage,
    handleBackgroundFile,
    renderCablePoints,
    renderCableLabelPosition,
  } = useCanvas({
    activeMode,
    boxSize,
    onOpenBoxModal: () => setIsBoxModalOpen(true),
    onOpenCableModal: (cable) => {
      setIsCableModalOpen(true);
      setEditingCableId(cable.id);
      setCableForm({
        model: cable.model || "Cable UTP Cat6",
        section: cable.section || "0.5mm²",
        length: cable.length || 10,
        totalPrice: cable.totalPrice || 0,
      });
    },
    onOpenDeviceModal: () => setIsCameraModalOpen(true),
  });

  useEffect(() => {
    if (!activeProjectId) return;
    let cancelled = false;
    const loadDesign = async () => {
      try {
        const response = await fetch(`/api/projects/${activeProjectId}/design`);
        if (!response.ok) throw new Error("Error cargando diseño");
        const data = await response.json();
        if (cancelled) return;
        setBoxes(Array.isArray(data.design?.boxes) ? data.design.boxes : []);
        setCables(Array.isArray(data.design?.cables) ? data.design.cables : []);
        setDevices(Array.isArray(data.design?.devices) ? data.design.devices : []);
      } catch {
        if (!cancelled) {
          setBoxes([]);
          setCables([]);
          setDevices([]);
        }
      }
    };
    loadDesign();
    return () => {
      cancelled = true;
    };
  }, [activeProjectId, setBoxes, setCables, setDevices]);

  useEffect(() => {
    if (!activeProjectId) return;
    const timeout = setTimeout(() => {
      fetch(`/api/projects/${activeProjectId}/design`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design: { boxes, cables, devices } }),
      }).catch(() => {
        // ignore
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [activeProjectId, boxes, cables, devices]);

  const catalog = useMemo(() => {
    const map = {};
    categories.forEach((category) => {
      map[category.name] = [];
    });
    products.forEach((product) => {
      const price = Number(product.discountPrice) > 0 ? product.discountPrice : product.distributorPrice;
      if (!map[product.category]) map[product.category] = [];
      map[product.category].push({
        name: product.name,
        price: Number(price) || 0,
        discountPercent: Number(product.discountPercent) || 0,
      });
    });
    return map;
  }, [categories, products]);

  const cameraCategoryKey = useMemo(() => {
    const keys = Object.keys(catalog);
    return keys.find((key) => key.toLowerCase() === "cámaras" || key.toLowerCase() === "camaras") || "";
  }, [catalog]);

  const cameraCatalog = useMemo(() => (cameraCategoryKey ? catalog[cameraCategoryKey] || [] : []), [catalog, cameraCategoryKey]);

  const catalogCategories = useMemo(() => Object.keys(catalog), [catalog]);

  useEffect(() => {
    if (catalogCategories.length === 0) return;
    const nextCategory = catalog[componentForm.category] ? componentForm.category : catalogCategories[0];
    const models = catalog[nextCategory] || [];
    const currentModel = models.find((item) => item.name === componentForm.model);
    const nextModel = currentModel?.name || models[0]?.name || "";
    const nextPrice = currentModel?.price ?? models[0]?.price ?? 0;
    setComponentForm((prev) => {
      if (prev.category === nextCategory && prev.model === nextModel && prev.unitPrice === nextPrice) {
        return prev;
      }
      return {
        ...prev,
        category: nextCategory,
        model: nextModel,
        unitPrice: nextPrice,
      };
    });
  }, [catalog, catalogCategories, componentForm.category, componentForm.model]);

  const sidebarSections = useMemo(
    () => [
      {
        title: "Proyectos",
        icon: Boxes,
        items: ["Listado", "Nuevo"],
      },
      {
        title: "Catálogo",
        icon: Boxes,
        items: ["Productos", "Categorías"],
      },
    ],
    []
  );

  const handleSectionToggle = (sectionTitle) => {
    setActiveSection(sectionTitle);
    setActiveSubsection(
      sidebarSections.find((section) => section.title === sectionTitle)?.items?.[0] || ""
    );
    setOpenSection((prev) => (prev === sectionTitle ? null : sectionTitle));
    setIsProjectDesignMode(false);
  };

  const handleSubsectionChange = (sectionTitle, subsection) => {
    setActiveSection(sectionTitle);
    setActiveSubsection(subsection);
    setOpenSection(sectionTitle);
    setIsProjectDesignMode(false);
  };

  const selectedBox = boxes.find((box) => box.id === selectedBoxId) || null;
  const isProductsSection = activeSection === "Catálogo" && activeSubsection === "Productos";
  const isCategoriesSection = activeSection === "Catálogo" && activeSubsection === "Categorías";
  const isProjectsSection = activeSection === "Proyectos";
  const hideToolbar =
    (isProductsSection || isCategoriesSection || isProjectsSection) && !isProjectDesignMode;

  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: "Inicio", onClick: () => {
        setActiveSection("Catálogo");
        setActiveSubsection("Productos");
        setOpenSection("Catálogo");
        setIsProjectDesignMode(false);
        setIsPartsListOpen(false);
      } },
      { label: activeSection, onClick: () => {
        setActiveSection(activeSection);
        const nextSub =
          sidebarSections.find((section) => section.title === activeSection)?.items?.[0] || "";
        setActiveSubsection(nextSub);
        setOpenSection(activeSection);
        setIsProjectDesignMode(false);
        setIsPartsListOpen(false);
      } },
    ];

    if (isProjectDesignMode) {
      items.push({ label: "Editor", onClick: () => {
        setIsProjectDesignMode(true);
        setIsPartsListOpen(false);
      }});
      if (isPartsListOpen) {
        items.push({ label: "Listado de piezas", onClick: () => setIsPartsListOpen(true) });
      }
      return items;
    }

    if (activeSubsection) {
      items.push({ label: activeSubsection, onClick: () => {
        setActiveSubsection(activeSubsection);
        setIsProjectDesignMode(false);
        setIsPartsListOpen(false);
      }});
    }
    return items;
  }, [activeSection, activeSubsection, isProjectDesignMode, isPartsListOpen, sidebarSections]);

  const helpMessage = useMemo(() => {
    if (activeMode === "addCable") return "Selecciona un cuadro de origen y destino para añadir el cable.";
    if (activeMode === "addBox") return "Haz click sobre el lienzo para colocar un cuadro.";
    return "Ctrl + arrastrar para desplazar. Rueda para zoom.";
  }, [activeMode]);

  const boxTotals = boxes.map((box) => box.components.reduce((sum, component) => sum + component.total, 0));
  const boxesTotal = boxTotals.reduce((sum, total) => sum + total, 0);
  const cablesTotal = cables.reduce((sum, cable) => sum + (Number(cable.totalPrice) || 0), 0);
  const totalBudget = boxesTotal + cablesTotal;

  useEffect(() => {
    if (!activeProjectId) return;
    try {
      const stored = localStorage.getItem("projectTotals");
      const current = stored ? JSON.parse(stored) : {};
      current[activeProjectId] = Number(totalBudget) || 0;
      localStorage.setItem("projectTotals", JSON.stringify(current));
    } catch {
      // ignore
    }
  }, [activeProjectId, totalBudget]);

  const getDiscountedUnitPrice = (component) => {
    const base = Number(component.unitPrice) || 0;
    let percent = Number(component.customerDiscountPercent) || 0;
    percent = Math.max(0, Math.min(100, percent));
    if (base <= 0) return 0;
    return Math.max(0, base * (1 - percent / 100));
  };

  const handleAddComponent = () => {
    if (!selectedBox) return;
    const selectedModel = catalog[componentForm.category]?.find((item) => item.name === componentForm.model);
    const modelName = componentForm.model;
    const unitPrice = selectedModel?.price || 0;
    const discountPercent = selectedModel?.discountPercent || 0;
    const quantity = Number(componentForm.quantity) || 0;
    const existing = selectedBox.components.find(
      (component) => component.category === componentForm.category && component.model === modelName
    );
    if (existing) {
      const nextQuantity = (Number(existing.quantity) || 0) + quantity;
      const nextUnitPrice = Number(unitPrice) || 0;
      const applied = Boolean(existing.discountApplied);
      const base = applied ? getDiscountedUnitPrice({
        unitPrice: nextUnitPrice,
        customerDiscountPercent: existing.customerDiscountPercent ?? 0,
      }) : nextUnitPrice;
      const nextComponent = {
        ...existing,
        unitPrice: nextUnitPrice,
        discountPercent: existing.discountPercent ?? discountPercent,
        customerDiscountPercent: existing.customerDiscountPercent ?? 0,
        quantity: nextQuantity,
        total: base * nextQuantity,
      };
      updateBox(selectedBox.id, {
        components: selectedBox.components.map((component) =>
          component.id === existing.id ? nextComponent : component
        ),
      });
    } else {
      const component = {
        id: createId(),
        category: componentForm.category,
        model: modelName || "",
        quantity,
        unitPrice,
        discountPercent,
        customerDiscountPercent: 0,
        discountApplied: false,
        productActive: true,
        total: unitPrice * quantity,
      };
      updateBox(selectedBox.id, {
        components: [...selectedBox.components, component],
      });
    }
    setComponentForm(DEFAULT_COMPONENT_FORM);
  };

  const toggleComponentDiscount = (boxId, componentId, nextApplied) => {
    console.log('[App] toggleComponentDiscount', { boxId, componentId, nextApplied });
    if (boxId === "devices") {
      setDevices((prev) =>
        prev.map((device) => {
          if (device.id !== componentId) return device;
          const discountedUnit = getDiscountedUnitPrice(device);
          const unit = nextApplied ? discountedUnit : Number(device.unitPrice) || 0;
          return {
            ...device,
            discountApplied: nextApplied,
            total: unit,
          };
        })
      );
      return;
    }
    const targetBox = boxes.find((box) => box.id === boxId);
    if (!targetBox) return;
    const nextComponents = targetBox.components.map((component) => {
      if (component.id !== componentId) return component;
      const discountedUnit = getDiscountedUnitPrice(component);
      const unit = nextApplied ? discountedUnit : Number(component.unitPrice) || 0;
      return {
        ...component,
        discountApplied: nextApplied,
        total: unit * (Number(component.quantity) || 0),
      };
    });
    updateBox(boxId, { components: nextComponents });
  };

  const toggleComponentActive = (boxId, componentId, nextActive) => {
    console.log('[App] toggleComponentActive', { boxId, componentId, nextActive });
    if (boxId === "devices") {
      setDevices((prev) =>
        prev.map((device) => {
          if (device.id !== componentId) return device;
          if (!nextActive) {
            return { ...device, productActive: false, total: 0 };
          }
          const unit = device.discountApplied
            ? getDiscountedUnitPrice(device)
            : Number(device.unitPrice) || 0;
          return {
            ...device,
            productActive: true,
            total: unit,
          };
        })
      );
      return;
    }
    const targetBox = boxes.find((box) => box.id === boxId);
    if (!targetBox) return;
    const nextComponents = targetBox.components.map((component) => {
      if (component.id !== componentId) return component;
      if (!nextActive) {
        return { ...component, productActive: false, total: 0 };
      }
      const unit = component.discountApplied
        ? getDiscountedUnitPrice(component)
        : Number(component.unitPrice) || 0;
      return {
        ...component,
        productActive: true,
        total: unit * (Number(component.quantity) || 0),
      };
    });
    updateBox(boxId, { components: nextComponents });
  };

  const updateComponentCustomerDiscount = (boxId, componentId, percent) => {
    console.log('[App] updateComponentCustomerDiscount', { boxId, componentId, percent });
    if (boxId === "devices") {
      setDevices((prev) =>
        prev.map((device) => {
          if (device.id !== componentId) return device;
          const raw = percent === "" ? "" : Number(percent);
          const clamped = raw === "" ? "" : Math.max(0, Math.min(100, isNaN(raw) ? 0 : raw));
          const nextDevice = {
            ...device,
            customerDiscountPercent: clamped,
            discountApplied: device.discountApplied || (clamped !== "" && Number(clamped) > 0),
          };
          const discountedUnit = getDiscountedUnitPrice(nextDevice);
          return nextDevice.discountApplied ? { ...nextDevice, total: discountedUnit } : nextDevice;
        })
      );
      return;
    }
    const targetBox = boxes.find((box) => box.id === boxId);
    if (!targetBox) return;
    const nextComponents = targetBox.components.map((component) => {
      if (component.id !== componentId) return component;
      const raw = percent === "" ? "" : Number(percent);
      const clamped = raw === "" ? "" : Math.max(0, Math.min(100, isNaN(raw) ? 0 : raw));
      const nextComponent = {
        ...component,
        customerDiscountPercent: clamped,
        discountApplied: component.discountApplied || (clamped !== "" && Number(clamped) > 0),
      };
      const discountedUnit = getDiscountedUnitPrice(nextComponent);
      return nextComponent.discountApplied
        ? { ...nextComponent, total: discountedUnit * (Number(nextComponent.quantity) || 0) }
        : nextComponent;
    });
    updateBox(boxId, { components: nextComponents });
  };

  const removeComponent = (componentId) => {
    if (!selectedBox) return;
    updateBox(selectedBox.id, {
      components: selectedBox.components.filter((component) => component.id !== componentId),
    });
  };

  const handleCableFormSave = () => {
    const errors = getCableErrors();
    if (errors.length > 0) return;
    updateCable(editingCableId, cableForm);
    setIsCableModalOpen(false);
    setEditingCableId(null);
  };

  const handleDeleteBox = () => {
    if (!selectedBox) return;
    deleteBox(selectedBox.id);
    setIsBoxModalOpen(false);
  };

  const handleDeleteCable = (cableId) => {
    deleteCable(cableId);
  };

  const applyBoxSize = (size) => {
    const width = Number(size.width) || boxSize.width;
    const height = Number(size.height) || boxSize.height;
    setBoxSize({ ...size, width, height });
    setIsSizeModalOpen(false);
  };
  const getComponentErrors = () => {
    const errors = [];
    if (!componentForm.category) errors.push("Selecciona una categoría.");
    if (!componentForm.model) errors.push("Selecciona un modelo.");
    if (Number(componentForm.quantity) <= 0) errors.push("Cantidad mínima 1.");
    return errors;
  };

  const getCableErrors = () => {
    const errors = [];
    if (!cableForm.model.trim()) errors.push("Modelo requerido.");
    if (!cableForm.section.trim()) errors.push("Sección requerida.");
    if (Number(cableForm.length) <= 0) errors.push("Longitud mínima 1.");
    if (Number(cableForm.totalPrice) < 0) errors.push("Precio inválido.");
    return errors;
  };

  const isBoxNameValid = selectedBox?.name?.trim().length > 0;
  const componentErrors = getComponentErrors();
  const cableErrors = getCableErrors();



  const truncateText = (text, maxChars) => {
    if (!text) return "";
    if (text.length <= maxChars) return text;
    return `${text.slice(0, Math.max(0, maxChars - 1))}…`;
  };

  const renderBoxLabel = (box) => {
    const total = (box.components || []).reduce((sum, component) => sum + (component.total || 0), 0);
    const nameMaxChars = Math.max(6, Math.floor((box.width || 140) / 9));
    const nameText = truncateText(box.name, nameMaxChars);
    const labelFontSize = (box.height || 100) < 80 ? 10 : 12;
    const detailFontSize = (box.height || 100) < 80 ? 9 : 11;
    return (
      <g>
        <clipPath id={`clip-${box.id}`}>
          <rect x={box.x + 4} y={box.y + 4} width={box.width - 8} height={box.height - 8} rx={8} />
        </clipPath>
        <text
          x={box.x + 10}
          y={box.y + 22}
          fontSize={labelFontSize}
          fill="#e5e7eb"
          clipPath={`url(#clip-${box.id})`}
        >
          {nameText}
        </text>
        <text
          x={box.x + 10}
          y={box.y + 40}
          fontSize={detailFontSize}
          fill="#9ca3af"
          clipPath={`url(#clip-${box.id})`}
        >
          Total: €{Number(total || 0).toFixed(2)}
        </text>
      </g>
    );
  };

  return (
    <div className="app">
      <Sidebar
        sections={sidebarSections}
        activeSection={activeSection}
        activeSubsection={activeSubsection}
        openSection={openSection}
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
        onSectionToggle={handleSectionToggle}
        onSubsectionChange={handleSubsectionChange}
      />

      <div className="main">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          {breadcrumbItems.map((item, index) => (
            <span key={`${item.label}-${index}`} className="breadcrumb__item">
              <button className="breadcrumb__link" type="button" onClick={item.onClick}>
                {item.label}
              </button>
              {index < breadcrumbItems.length - 1 && <span className="breadcrumb__sep">/</span>}
            </span>
          ))}
        </nav>
        <Toolbar
          visible={!hideToolbar}
          zoom={zoom}
          modes={MODES}
          activeMode={activeMode}
          onModeChange={setActiveMode}
          onZoom={handleZoomButton}
          onReset={resetView}
          onOpenImage={() => setIsImageModalOpen(true)}
          onOpenSize={() => setIsSizeModalOpen(true)}
          totals={{ boxes: boxesTotal, cables: cablesTotal, total: totalBudget }}
        />

        <CatalogPage
          isProductsSection={isProductsSection}
          isCategoriesSection={isCategoriesSection}
          productCategories={productCategories}
          categories={categories}
          productCategoryFilter={productCategoryFilter}
          onFilterChange={setProductCategoryFilter}
          productForm={productForm}
          onProductFormChange={(updates) => setProductForm((prev) => ({ ...prev, ...updates }))}
          onAddProduct={handleAddProduct}
          onProductInputKeyDown={handleProductInputKeyDown}
          groupedProducts={groupedProducts}
          onSort={handleSort}
          sortState={productSort}
          onUpdateProduct={updateProduct}
          categoryForm={categoryForm}
          onCategoryFormChange={(updates) => setCategoryForm((prev) => ({ ...prev, ...updates }))}
          onAddCategory={handleAddCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
        />

        <ProjectsPage
          isProjectsSection={isProjectsSection && !isProjectDesignMode}
          activeSubsection={activeSubsection}
          hideStatusControls={isProjectDesignMode}
          onOpenDesigner={(projectId, status) => {
            setActiveProjectId(projectId);
            setActiveProjectStatus(status || "draft");
            setIsProjectDesignMode(true);
            setActiveMode("select");
          }}
          onProjectCreated={() => {
            setActiveSection("Proyectos");
            setActiveSubsection("Listado");
            setOpenSection("Proyectos");
          }}
          onEditSelected={() => setIsBoxModalOpen(true)}
          onToggleComponentDiscount={toggleComponentDiscount}
          onUpdateComponentCustomerDiscount={updateComponentCustomerDiscount}
          onToggleComponentActive={toggleComponentActive}
          partsListOpen={isPartsListOpen}
          onTogglePartsList={() => setIsPartsListOpen((prev) => !prev)}
        />

        <CanvasPage
          hideCanvas={hideToolbar}
          svgRef={svgRef}
          pan={pan}
          zoom={zoom}
          backgroundImage={backgroundImage}
          boxes={boxes}
          cables={cables}
          devices={devices}
          selectedBoxId={selectedBoxId}
          selectedDeviceId={selectedDeviceId}
          draftCable={draftCable}
          draftPolyline={draftPolyline}
          tooltip={tooltip}
          activeModeLabel={MODES.find((m) => m.id === activeMode)?.label || ""}
          helpMessage={helpMessage}
          onCanvasClick={handleCanvasClick}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onBoxPointerDown={handleBoxPointerDown}
          onDevicePointerDown={handleDevicePointerDown}
          onDeviceDoubleClick={handleDeviceDoubleClick}
          onBoxDoubleClick={handleBoxDoubleClick}
          onBoxPointerMove={handleBoxPointerMove}
          onBoxPointerLeave={handleBoxPointerLeave}
          onDeleteCable={handleDeleteCable}
          renderCablePoints={renderCablePoints}
          renderCableLabelPosition={renderCableLabelPosition}
          renderBoxLabel={renderBoxLabel}
          onEditSelected={() => setIsBoxModalOpen(true)}
            onTogglePartsList={() => setIsPartsListOpen((prev) => !prev)}
            onToggleComponentDiscount={toggleComponentDiscount}
            onUpdateComponentCustomerDiscount={updateComponentCustomerDiscount}
            onToggleComponentActive={toggleComponentActive}
          projectStatus={activeProjectStatus}
          hideStatusControls={isProjectDesignMode}
          onProjectStatusChange={setActiveProjectStatus}
          partsListOpen={isPartsListOpen}
          statusOptions={STATUS_OPTIONS}
          statusLabels={STATUS_LABELS}
        />
      </div>

      <BoxModal
        open={isBoxModalOpen}
        box={selectedBox}
        componentForm={componentForm}
        catalog={catalog}
        onClose={() => setIsBoxModalOpen(false)}
        onNameChange={(name) => updateBox(selectedBox.id, { name })}
        onZoneChange={(zone) => updateBox(selectedBox.id, { zone })}
        onComponentFormChange={(updates) => setComponentForm((prev) => ({ ...prev, ...updates }))}
        onAddComponent={handleAddComponent}
        onRemoveComponent={removeComponent}
        onDeleteBox={handleDeleteBox}
        componentErrors={componentErrors}
        isNameValid={isBoxNameValid}
      />

      <CameraModal
        open={isCameraModalOpen}
        device={devices.find((device) => device.id === selectedDeviceId) || null}
        catalog={cameraCatalog}
        categoryName={cameraCategoryKey || "Cámaras"}
        onClose={() => setIsCameraModalOpen(false)}
        onUpdate={(updates) =>
          setDevices((prev) => prev.map((device) => (device.id === selectedDeviceId ? { ...device, ...updates } : device)))
        }
        onDelete={() =>
          setDevices((prev) => prev.filter((device) => device.id !== selectedDeviceId))
        }
      />

      <CableModal
        open={isCableModalOpen}
        cableForm={cableForm}
        onChange={(updates) => setCableForm((prev) => ({ ...prev, ...updates }))}
        onClose={() => setIsCableModalOpen(false)}
        onSave={handleCableFormSave}
        errors={cableErrors}
      />

      <ImageModal
        open={isImageModalOpen}
        backgroundImage={backgroundImage}
        onClose={() => setIsImageModalOpen(false)}
        onUrlChange={setBackgroundImage}
        onFileChange={handleBackgroundFile}
      />

      <SizeModal
        open={isSizeModalOpen}
        boxSizes={BOX_SIZES}
        customSize={customBoxSize}
        onCustomSizeChange={(updates) => setCustomBoxSize((prev) => ({ ...prev, ...updates }))}
        onApply={applyBoxSize}
        onClose={() => setIsSizeModalOpen(false)}
      />
    </div>
  );
}

export default App;
