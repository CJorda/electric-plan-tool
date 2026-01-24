import { useMemo, useState } from "react";
import { Boxes, Link2, MousePointer } from "lucide-react";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import Toolbar from "./components/Toolbar/Toolbar.jsx";
import CatalogPage from "./pages/CatalogPage/CatalogPage.jsx";
import CanvasPage from "./pages/CanvasPage/CanvasPage.jsx";
import ProjectsPage from "./pages/ProjectsPage/ProjectsPage.jsx";
import BoxModal from "./components/modals/BoxModal/BoxModal.jsx";
import CableModal from "./components/modals/CableModal/CableModal.jsx";
import ImageModal from "./components/modals/ImageModal/ImageModal.jsx";
import SizeModal from "./components/modals/SizeModal/SizeModal.jsx";
import useCatalog from "./hooks/useCatalog.js";
import useCanvas from "./hooks/useCanvas.js";
import "./App.css";

const MODES = [
  { id: "select", label: "Seleccionar", icon: MousePointer },
  { id: "addBox", label: "Añadir cuadro", icon: Boxes },
  { id: "addCable", label: "Dibujar cable", icon: Link2 },
];

const BOX_SIZES = {
  small: { width: 80, height: 60, label: "Pequeño" },
  medium: { width: 140, height: 100, label: "Mediano" },
  large: { width: 200, height: 140, label: "Grande" },
};

const createId = () => crypto.randomUUID();

const DEFAULT_COMPONENT_FORM = {
  category: "PLC",
  model: "Siemens S7-1200",
  quantity: 1,
  unitPrice: 450,
  customModel: "",
};

function App() {
  const [activeMode, setActiveMode] = useState("select");
  const [activeSection, setActiveSection] = useState("Catálogo");
  const [activeSubsection, setActiveSubsection] = useState("Productos");
  const [openSection, setOpenSection] = useState("Catálogo");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProjectDesignMode, setIsProjectDesignMode] = useState(false);
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [isCableModalOpen, setIsCableModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
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
  } = useCatalog();

  const {
    svgRef,
    boxes,
    cables,
    selectedBoxId,
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
  });

  const catalog = useMemo(
    () => ({
      PLC: [
        { name: "Siemens S7-1200", price: 450 },
        { name: "Siemens S7-1500", price: 850 },
        { name: "Allen Bradley CompactLogix", price: 920 },
        { name: "Schneider M241", price: 380 },
        { name: "Omron CP1L", price: 290 },
      ],
      Protección: [
        { name: "Magnetotérmico 10A", price: 12 },
        { name: "Magnetotérmico 16A", price: 15 },
        { name: "Magnetotérmico 25A", price: 18 },
        { name: "Diferencial 25A", price: 45 },
        { name: "Diferencial 40A", price: 52 },
        { name: "Guardamotor", price: 42 },
      ],
      Relé: [
        { name: "Relé 24VDC", price: 8 },
        { name: "Relé 24VDC premium", price: 12 },
        { name: "Relé térmico", price: 28 },
        { name: "Relé térmico reforzado", price: 32 },
        { name: "Contactor 9A", price: 18 },
        { name: "Contactor 18A", price: 25 },
      ],
      Fuente: [
        { name: "24VDC 2.5A", price: 45 },
        { name: "24VDC 5A", price: 65 },
        { name: "24VDC 10A", price: 85 },
        { name: "24VDC 20A", price: 145 },
        { name: "24VDC 20A industrial", price: 165 },
      ],
      Variador: [
        { name: "0.75kW", price: 180 },
        { name: "1.5kW", price: 240 },
        { name: "2.2kW", price: 320 },
        { name: "5.5kW", price: 420 },
      ],
      "HMI/Panel": [
        { name: "Pantalla táctil 7\"", price: 320 },
        { name: "Pantalla táctil 10\"", price: 450 },
        { name: "Pantalla táctil 15\"", price: 650 },
        { name: "Panel operador compacto", price: 280 },
        { name: "Panel operador avanzado", price: 520 },
      ],
      Sensores: [
        { name: "Sensor inductivo", price: 25 },
        { name: "Sensor capacitivo", price: 28 },
        { name: "Fotocélula estándar", price: 35 },
        { name: "Fotocélula avanzada", price: 42 },
        { name: "Encoder", price: 85 },
      ],
      Comunicación: [
        { name: "Switch Ethernet 8p", price: 95 },
        { name: "Switch Ethernet 16p", price: 145 },
        { name: "Gateway industrial", price: 280 },
        { name: "Router industrial", price: 320 },
      ],
      Otros: [
        { name: "Borneras", price: 1.5 },
        { name: "Riel DIN", price: 2.2 },
        { name: "Canaleta 40x60", price: 3.5 },
        { name: "Canaleta 20x40", price: 2.8 },
        { name: "Kit montaje", price: 0.8 },
      ],
    }),
    []
  );

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

  const helpMessage = useMemo(() => {
    if (activeMode === "addCable") return "Selecciona un cuadro de origen y destino para añadir el cable.";
    if (activeMode === "addBox") return "Haz click sobre el lienzo para colocar un cuadro.";
    return "Ctrl + arrastrar para desplazar. Rueda para zoom.";
  }, [activeMode]);

  const boxTotals = boxes.map((box) => box.components.reduce((sum, component) => sum + component.total, 0));
  const boxesTotal = boxTotals.reduce((sum, total) => sum + total, 0);
  const cablesTotal = cables.reduce((sum, cable) => sum + (Number(cable.totalPrice) || 0), 0);
  const totalBudget = boxesTotal + cablesTotal;

  const handleAddComponent = () => {
    if (!selectedBox) return;
    const selectedModel = catalog[componentForm.category]?.find((item) => item.name === componentForm.model);
    const modelName = componentForm.model === "Personalizado" ? componentForm.customModel : componentForm.model;
    const unitPrice =
      componentForm.model === "Personalizado" ? Number(componentForm.unitPrice) || 0 : selectedModel?.price || 0;
    const quantity = Number(componentForm.quantity) || 0;
    const component = {
      id: createId(),
      category: componentForm.category,
      model: modelName || "Personalizado",
      quantity,
      unitPrice,
      total: unitPrice * quantity,
    };
    updateBox(selectedBox.id, {
      components: [...selectedBox.components, component],
    });
    setComponentForm(DEFAULT_COMPONENT_FORM);
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
    if (componentForm.model === "Personalizado" && !componentForm.customModel.trim()) {
      errors.push("Indica el modelo personalizado.");
    }
    if (Number(componentForm.quantity) <= 0) errors.push("Cantidad mínima 1.");
    if (Number(componentForm.unitPrice) < 0) errors.push("Precio unitario inválido.");
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
        />

        <ProjectsPage
          isProjectsSection={isProjectsSection}
          activeSubsection={activeSubsection}
          onOpenDesigner={() => {
            setIsProjectDesignMode(true);
            setActiveMode("select");
          }}
          onProjectCreated={() => {
            setActiveSection("Proyectos");
            setActiveSubsection("Listado");
            setOpenSection("Proyectos");
          }}
        />

        <CanvasPage
          hideCanvas={hideToolbar}
          svgRef={svgRef}
          pan={pan}
          zoom={zoom}
          backgroundImage={backgroundImage}
          boxes={boxes}
          cables={cables}
          selectedBoxId={selectedBoxId}
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
          onBoxDoubleClick={handleBoxDoubleClick}
          onBoxPointerMove={handleBoxPointerMove}
          onBoxPointerLeave={handleBoxPointerLeave}
          onDeleteCable={handleDeleteCable}
          renderCablePoints={renderCablePoints}
          renderCableLabelPosition={renderCableLabelPosition}
          renderBoxLabel={(box) => {
            const total = box.components.reduce((sum, component) => sum + component.total, 0);
            const nameMaxChars = Math.max(6, Math.floor(box.width / 9));
            const nameText = truncateText(box.name, nameMaxChars);
            const labelFontSize = box.height < 80 ? 10 : 12;
            const detailFontSize = box.height < 80 ? 9 : 11;
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
                  Total: €{total.toFixed(2)}
                </text>
              </g>
            );
          }}
          onEditSelected={() => setIsBoxModalOpen(true)}
        />
      </div>

      <BoxModal
        open={isBoxModalOpen}
        box={selectedBox}
        componentForm={componentForm}
        catalog={catalog}
        onClose={() => setIsBoxModalOpen(false)}
        onNameChange={(name) => updateBox(selectedBox.id, { name })}
        onComponentFormChange={(updates) => setComponentForm((prev) => ({ ...prev, ...updates }))}
        onAddComponent={handleAddComponent}
        onRemoveComponent={removeComponent}
        onDeleteBox={handleDeleteBox}
        componentErrors={componentErrors}
        isNameValid={isBoxNameValid}
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
