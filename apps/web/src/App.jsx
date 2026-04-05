import { useCallback, useEffect, useMemo, useState } from "react";
import { Home, FolderKanban, Package, Users, Briefcase } from "lucide-react";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import Toolbar from "./components/Toolbar/Toolbar.jsx";
import CatalogPage from "./pages/CatalogPage/CatalogPage.jsx";
import DashboardPage from "./pages/DashboardPage/DashboardPage.jsx";
import CanvasPage from "./pages/CanvasPage/CanvasPage.jsx";
import ProjectsPage from "./pages/ProjectsPage/ProjectsPage.jsx";
import ClientsPage from "./pages/ClientsPage/ClientsPage.jsx";
import OperationsPage from "./pages/OperationsPage/OperationsPage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
import { apiFetch } from "./lib/api.js";
import CableTypeModal from "./components/modals/CableTypeModal/CableTypeModal.jsx";
import useCatalog from "./hooks/useCatalog.js";
import useProjects from "./hooks/useProjects.js";
import useCanvas from "./hooks/useCanvas.js";
import useClients from "./hooks/useClients.js";
import useAuthSession from "./hooks/useAuthSession.js";
import AppBreadcrumb from "./components/AppShell/AppBreadcrumb.jsx";
import AppGlobalModals from "./components/AppShell/AppGlobalModals.jsx";
import { OPERATIONS_MODULES } from "./constants/operationsModules.js";
import { DEFAULT_COMPONENT_FORM, MODES, STATUS_LABELS, STATUS_OPTIONS } from "./constants/appConstants.js";
import "./App.css";

const createId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const DEFAULT_CABLE_COLOR = "#22c55e";

const DEFAULT_CABLE_FORM = {
  model: "",
  section: "",
  length: 0,
  totalPrice: 0,
};

const normalizeCableType = (type) => {
  const label = String(type?.label || "").trim();
  return {
    id: String(type?.id || createId()),
    label,
    subtitle: String(type?.subtitle || "").trim(),
    hint: String(type?.hint || "").trim(),
    color: String(type?.color || DEFAULT_CABLE_COLOR),
  };
};

const normalizeCableTypes = (types) => {
  if (!Array.isArray(types)) return [];
  const seen = new Set();
  return types
    .map((type) => normalizeCableType(type))
    .filter((type) => {
      if (!type.id || seen.has(type.id)) {
        return false;
      }
      seen.add(type.id);
      return true;
    });
};

const deriveCableTypesFromCables = (cables) => {
  if (!Array.isArray(cables)) return [];
  const map = new Map();
  cables.forEach((cable) => {
    const label = String(cable?.model || "").trim();
    if (!label) return;
    const color = String(cable?.color || DEFAULT_CABLE_COLOR);
    const key = `${label.toLowerCase()}::${color.toLowerCase()}`;
    if (map.has(key)) return;
    map.set(key, {
      id: createId(),
      label,
      subtitle: "",
      hint: "",
      color,
    });
  });
  return [...map.values()];
};

function App() {
  const {
    accessToken,
    authUser,
    loginError,
    loginLoading,
    handleLogin,
    logout,
  } = useAuthSession();

  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-dark-mode", theme === "dark" ? "true" : "false");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const [activeMode, setActiveMode] = useState("select");
  const [isCableTypeOpen, setIsCableTypeOpen] = useState(false);
  const [cableTypeModalMode, setCableTypeModalMode] = useState("select");
  const [cableTypes, setCableTypes] = useState([]);
  const [selectedCableType, setSelectedCableType] = useState(null);

  const handleModeChange = (mode) => {
    if (mode === "addCable") {
      setCableTypeModalMode("select");
      setIsCableTypeOpen(true);
      return;
    }
    setActiveMode(mode);
  };
  const [activeSection, setActiveSection] = useState("Inicio");
  const [activeSubsection, setActiveSubsection] = useState("Productos");
  const [openSection, setOpenSection] = useState("Inicio");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProjectDesignMode, setIsProjectDesignMode] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeVersion, setActiveVersion] = useState(null);
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [activeProjectStatus, setActiveProjectStatus] = useState("draft");
  const [isCableModalOpen, setIsCableModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isPartsListOpen, setIsPartsListOpen] = useState(false);
  const [componentForm, setComponentForm] = useState(DEFAULT_COMPONENT_FORM);
  const [cableForm, setCableForm] = useState(() => ({ ...DEFAULT_CABLE_FORM }));
  const [editingCableId, setEditingCableId] = useState(null);
  const [isDesignLoading, setIsDesignLoading] = useState(false);

  const {
    isLoading: isCatalogLoading,
    productForm,
    setProductForm,
    products,
    productCategoryFilter,
    setProductCategoryFilter,
    productSort,
    categoryForm,
    setCategoryForm,
    categories,
    productCategoryOptions,
    groupedProducts,
    allSortedProducts,
    handleAddProduct,
    handleProductInputKeyDown,
    uploadProductImage,
    updateProduct,
    deleteProduct,
    handleSort,
    handleAddCategory,
    updateCategory,
    deleteCategory,
    providers,
    providerForm,
    setProviderForm,
    updateProvider,
    deleteProvider,
    manufacturers,
    manufacturerForm,
    setManufacturerForm,
    margins,
    marginForm,
    setMarginForm,
    handleAddProvider,
    handleAddManufacturer,
    updateManufacturer,
    deleteManufacturer,
    handleAddMargin,
    updateMargin,
    deleteMargin,
  } = useCatalog({ authToken: accessToken });

  const {
    clients,
    clientForm,
    setClientForm,
    handleAddClient,
    updateClient,
    deleteClient,
  } = useClients();

  const { projects, isLoading: isProjectsLoading } = useProjects({
    apiEnabled: import.meta.env.VITE_API_ENABLED === "true",
    authToken: accessToken,
  });

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
    draftBox,
    draftCable,
    draftPolyline,
    handleCanvasClick,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleBoxPointerDown,
    handleBoxResizePointerDown,
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
    selectedCableType,
    onOpenBoxModal: () => setIsBoxModalOpen(true),
    onOpenCableModal: (cable) => {
      setIsCableModalOpen(true);
      setEditingCableId(cable.id);
      setCableForm({
        model: cable.model || selectedCableType?.label || "",
        section: cable.section || "",
        length: Number(cable.length) || 0,
        totalPrice: Number(cable.totalPrice) || 0,
      });
    },
    onOpenDeviceModal: () => setIsCameraModalOpen(true),
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 900px)");
    const handleChange = () => {
      if (media.matches) {
        setIsSidebarCollapsed(true);
      }
    };
    handleChange();
    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }
    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (!activeProjectId) {
      setIsDesignLoading(false);
      setCableTypes([]);
      setSelectedCableType(null);
      return;
    }
    let cancelled = false;
    const loadDesign = async () => {
      try {
        setIsDesignLoading(true);
        const response = await apiFetch(`/api/projects/${activeProjectId}/design`, {}, accessToken);
        if (!response.ok) throw new Error("Error cargando diseño");
        const data = await response.json();
        if (cancelled) return;
        const nextBoxes = Array.isArray(data.design?.boxes) ? data.design.boxes : [];
        const nextCables = Array.isArray(data.design?.cables) ? data.design.cables : [];
        const nextDevices = Array.isArray(data.design?.devices) ? data.design.devices : [];
        const loadedTypes = normalizeCableTypes(data.design?.cableTypes);
        const nextCableTypes = loadedTypes.length > 0 ? loadedTypes : deriveCableTypesFromCables(nextCables);
        setBoxes(nextBoxes);
        setCables(nextCables);
        setDevices(nextDevices);
        setCableTypes(nextCableTypes);
      } catch {
        if (!cancelled) {
          setBoxes([]);
          setCables([]);
          setDevices([]);
          setCableTypes([]);
        }
      } finally {
        if (!cancelled) {
          setIsDesignLoading(false);
        }
      }
    };
    loadDesign();
    return () => {
      cancelled = true;
    };
  }, [activeProjectId, accessToken, setBoxes, setCables, setDevices]);

  useEffect(() => {
    if (!activeProjectId) return;
    const timeout = setTimeout(() => {
      if (activeVersion?.locked) return;
      const marginByCategory = new Map();
      (margins || []).forEach((margin) => {
        const category = margin?.categoryName;
        const percent = Number(margin?.marginPercent) || 0;
        if (!category) return;
        const current = marginByCategory.get(category) ?? 0;
        if (percent > current) marginByCategory.set(category, percent);
      });

      const snapshotComponentsTotal = boxes.reduce((sum, box) => {
        return sum + (box.components || []).reduce((componentSum, component) => {
          const quantity = Number(component.quantity) || 1;
          const unit = Number(component.unitPrice) || 0;
          const base = Number(component.total);
          return componentSum + (Number.isFinite(base) ? base : unit * quantity);
        }, 0);
      }, 0);
      const snapshotMarginTotal = boxes.reduce((sum, box) => {
        return sum + (box.components || []).reduce((componentSum, component) => {
          const category = component.category || "";
          const percent = marginByCategory.get(category) || 0;
          const quantity = Number(component.quantity) || 1;
          const unit = Number(component.unitPrice) || 0;
          const base = Number(component.total);
          const componentBase = Number.isFinite(base) ? base : unit * quantity;
          return componentSum + componentBase * (percent / 100);
        }, 0);
      }, 0);
      const snapshotCablesTotal = cables.reduce((sum, cable) => sum + (Number(cable.totalPrice) || 0), 0);
      const snapshotDevicesTotal = devices.reduce(
        (sum, device) => sum + (Number(device.total) || Number(device.unitPrice) || 0),
        0
      );
      const snapshotTotalBudget = snapshotComponentsTotal + snapshotCablesTotal + snapshotMarginTotal;

      apiFetch(`/api/projects/${activeProjectId}/design`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design: { boxes, cables, devices, cableTypes } }),
      }, accessToken).catch(() => {
        // ignore
      });
      if (activeVersion?.id) {
        apiFetch(`/api/projects/${activeProjectId}/versions/${activeVersion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snapshot: {
              design: { boxes, cables, devices, cableTypes },
              pricing: {
                componentsTotal: snapshotComponentsTotal,
                cablesTotal: snapshotCablesTotal,
                devicesTotal: snapshotDevicesTotal,
                marginTotal: snapshotMarginTotal,
                totalBudget: snapshotTotalBudget,
              },
            },
          }),
        }, accessToken).catch(() => {
          // ignore
        });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [activeProjectId, boxes, cables, devices, cableTypes, margins, accessToken, activeVersion]);

  const restoreDesign = useCallback(async (design) => {
    const nextBoxes = Array.isArray(design?.boxes) ? design.boxes : [];
    const nextCables = Array.isArray(design?.cables) ? design.cables : [];
    const nextDevices = Array.isArray(design?.devices) ? design.devices : [];
    const loadedTypes = normalizeCableTypes(design?.cableTypes);
    const nextCableTypes = loadedTypes.length > 0 ? loadedTypes : deriveCableTypesFromCables(nextCables);
    setBoxes(nextBoxes);
    setCables(nextCables);
    setDevices(nextDevices);
    setCableTypes(nextCableTypes);
    if (!activeProjectId || String(activeProjectId).startsWith("local-")) return;
    try {
      await apiFetch(`/api/projects/${activeProjectId}/design`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design: { boxes: nextBoxes, cables: nextCables, devices: nextDevices, cableTypes: nextCableTypes } }),
      }, accessToken);
    } catch {
      // ignore
    }
  }, [activeProjectId, accessToken, setBoxes, setCables, setDevices, setCableTypes]);

  useEffect(() => {
    if (!selectedCableType) return;
    const match = cableTypes.find((type) => type.id === selectedCableType.id);
    if (!match) {
      setSelectedCableType(null);
      return;
    }
    const nextLabel = String(match.label || "").trim();
    const nextColor = String(match.color || DEFAULT_CABLE_COLOR);
    if (nextLabel !== selectedCableType.label || nextColor !== selectedCableType.color) {
      setSelectedCableType({ id: match.id, label: nextLabel, color: nextColor });
    }
  }, [cableTypes, selectedCableType]);

  useEffect(() => {
    if (!activeProjectId) {
      setActiveVersion(null);
      return;
    }
    try {
      const stored = localStorage.getItem("projectActiveVersions");
      const map = stored ? JSON.parse(stored) : {};
      setActiveVersion(map[activeProjectId] || null);
    } catch {
      setActiveVersion(null);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (!activeProjectId) return;
    try {
      const stored = localStorage.getItem("projectActiveVersions");
      const map = stored ? JSON.parse(stored) : {};
      if (activeVersion?.id) {
        map[activeProjectId] = activeVersion;
      } else {
        delete map[activeProjectId];
      }
      localStorage.setItem("projectActiveVersions", JSON.stringify(map));
    } catch {
      // ignore
    }
  }, [activeProjectId, activeVersion]);

  useEffect(() => {
    if (!activeProjectId || !activeVersion?.id) return;
    if (String(activeProjectId).startsWith("local-")) return;
    apiFetch(`/api/projects/${activeProjectId}/versions`, {}, accessToken)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const versions = data?.versions || [];
        const found = versions.find((version) => version.id === activeVersion.id);
        if (found?.snapshot?.design) {
          restoreDesign(found.snapshot.design);
          setActiveVersion((prev) => ({ ...prev, name: found.name || prev?.name, locked: found.locked ?? prev?.locked }));
        }
      })
      .catch(() => {
        // ignore
      });
  }, [activeProjectId, activeVersion?.id, accessToken, restoreDesign]);

  // Auto-calculate cable lengths and total prices when boxes/cable points change.
  useEffect(() => {
    if (!cables || cables.length === 0) return;
    const computeLengthForCable = (cable) => {
      const fromBox = boxes.find((b) => b.id === cable.fromBoxId);
      const toBox = boxes.find((b) => b.id === cable.toBoxId);
      if (!fromBox || !toBox) return 0;
      const center = (box) => ({ x: box.x + (box.width || 0) / 2, y: box.y + (box.height || 0) / 2 });
      const pts = [center(fromBox), ...(Array.isArray(cable.points) ? cable.points : []), center(toBox)];
      let len = 0;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const dx = (b.x || 0) - (a.x || 0);
        const dy = (b.y || 0) - (a.y || 0);
        len += Math.sqrt(dx * dx + dy * dy);
      }
      // Assume SVG units are pixels; convert to meters with a heuristic if needed.
      // For now, treat 1 unit as 0.01 m (1 px -> 1 cm) to produce realistic cable lengths.
      const meters = Math.round((len * 0.01) * 10) / 10; // one decimal
      return meters;
    };

    cables.forEach((cable) => {
      const lengthMeters = computeLengthForCable(cable);
      // Determine price per meter from products catalog if matching model name
      let pricePerMeter = 0;
      try {
        const match = products.find((p) => String(p.name || "").toLowerCase() === String(cable.model || "").toLowerCase());
        if (match) pricePerMeter = Number(match.discountPrice || match.distributorPrice) || 0;
      } catch {
        pricePerMeter = 0;
      }
      const computedTotal = Math.round((lengthMeters * (pricePerMeter || 0)) * 100) / 100;
      const needUpdateLength = cable.length !== lengthMeters;
      const needUpdateTotal = cable.autoCalculated !== false && Number(cable.totalPrice || 0) !== computedTotal;
      if (needUpdateLength || needUpdateTotal) {
        const updates = {};
        if (needUpdateLength) updates.length = lengthMeters;
        if (needUpdateTotal) updates.totalPrice = computedTotal;
        updateCable(cable.id, updates);
      }
    });
  }, [boxes, cables, products, updateCable]);

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
        title: "Inicio",
        icon: Home,
        items: [],
      },
      {
        title: "Proyectos",
        icon: FolderKanban,
        items: [],
      },
      {
        title: "Catálogo",
        icon: Package,
        items: ["Productos", "Proveedores", "Fabricantes", "Reglas de precio"],
      },
      {
        title: "Clientes",
        icon: Users,
        items: [],
      },
      {
        title: "Operaciones",
        icon: Briefcase,
        items: OPERATIONS_MODULES.map((module) => module.title),
      },
    ],
    []
  );

  const handleSectionToggle = (sectionTitle) => {
    setActiveSection(sectionTitle);
    const nextItems = sidebarSections.find((section) => section.title === sectionTitle)?.items || [];
    setActiveSubsection(nextItems[0] || "");
    setOpenSection((prev) => (prev === sectionTitle ? null : sectionTitle));
    setIsProjectDesignMode(false);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches) {
      setIsSidebarCollapsed(true);
    }
  };

  const handleSubsectionChange = (sectionTitle, subsection) => {
    setActiveSection(sectionTitle);
    setActiveSubsection(subsection);
    setOpenSection(sectionTitle);
    setIsProjectDesignMode(false);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches) {
      setIsSidebarCollapsed(true);
    }
  };

  const selectedBox = boxes.find((box) => box.id === selectedBoxId) || null;
  const isDashboardSection = activeSection === "Inicio";
  const isProductsSection = activeSection === "Catálogo" && activeSubsection === "Productos";
  const isCategoriesSection = activeSection === "Catálogo" && activeSubsection === "Categorías";
  const isProvidersSection = activeSection === "Catálogo" && activeSubsection === "Proveedores";
  const isMarginsSection = activeSection === "Catálogo" && activeSubsection === "Reglas de precio";
  const isManufacturersSection = activeSection === "Catálogo" && activeSubsection === "Fabricantes";
  const isProjectsSection = activeSection === "Proyectos";
  const isClientsSection = activeSection === "Clientes";
  const isOperationsSection = activeSection === "Operaciones";
  const hideToolbar =
    (
      isDashboardSection ||
      isProductsSection ||
      isCategoriesSection ||
      isProvidersSection ||
      isMarginsSection ||
      isManufacturersSection ||
      isProjectsSection ||
      isClientsSection ||
      isOperationsSection
    ) && !isProjectDesignMode;

  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: "Inicio", onClick: () => {
        setActiveSection("Inicio");
        setActiveSubsection("");
        setOpenSection("Inicio");
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
      items.push({
        label: activeVersion?.name
          ? `Versión: ${activeVersion.name}${activeVersion.locked ? " (bloqueada)" : ""}`
          : "Versión: sin seleccionar",
        onClick: () => {
          setIsProjectDesignMode(true);
          setIsPartsListOpen(false);
        },
      });
      if (isPartsListOpen) {
        items.push({ label: "Listado de piezas", onClick: () => setIsPartsListOpen(true) });
      }
      return items;
    }

    if (activeSubsection && activeSubsection !== activeSection) {
      items.push({ label: activeSubsection, onClick: () => {
        setActiveSubsection(activeSubsection);
        setIsProjectDesignMode(false);
        setIsPartsListOpen(false);
      }});
    }
    return items;
  }, [activeSection, activeSubsection, isProjectDesignMode, isPartsListOpen, sidebarSections, activeVersion]);

  const helpMessage = useMemo(() => {
    if (activeMode === "addCable") return "Selecciona un cuadro de origen y destino para añadir el cable.";
    if (activeMode === "addBox") return "Arrastra en el lienzo para dibujar el cuadro.";
    return "Ctrl + arrastrar para desplazar. Rueda para zoom.";
  }, [activeMode]);

  const openCableTypesEditor = () => {
    setCableTypeModalMode("manage");
    setIsCableTypeOpen(true);
  };

  const handleCableTypesChange = (nextTypes) => {
    setCableTypes(normalizeCableTypes(nextTypes));
  };

  const categoryMarginMap = useMemo(() => {
    const map = new Map();
    (margins || []).forEach((margin) => {
      const name = margin.categoryName;
      const percent = Number(margin.marginPercent) || 0;
      if (!name) return;
      const current = map.get(name) ?? 0;
      if (percent > current) map.set(name, percent);
    });
    return map;
  }, [margins]);

  const boxTotals = boxes.map((box) => box.components.reduce((sum, component) => sum + component.total, 0));
  const boxesTotal = boxTotals.reduce((sum, total) => sum + total, 0);
  const marginTotal = boxes.reduce((sum, box) => {
    const components = box.components || [];
    return (
      sum +
      components.reduce((componentSum, component) => {
        const category = component.category || "";
        const percent = categoryMarginMap.get(category) || 0;
        const base = Number(component.total) || 0;
        return componentSum + base * (percent / 100);
      }, 0)
    );
  }, 0);
  const cablesTotal = cables.reduce((sum, cable) => sum + (Number(cable.totalPrice) || 0), 0);
  const devicesTotal = devices.reduce(
    (sum, device) => sum + (Number(device.total) || Number(device.unitPrice) || 0),
    0
  );
  const totalBudget = boxesTotal + cablesTotal + marginTotal;

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

  if (!accessToken) {
    return (
      <LoginPage
        loading={loginLoading}
        error={loginError}
        onLogin={handleLogin}
      />
    );
  }

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
          user={authUser}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={logout}
        />
        <div className="main">
        <AppBreadcrumb
          breadcrumbItems={breadcrumbItems}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onCloseSidebar={() => setIsSidebarCollapsed(true)}
        />

        <Toolbar
          visible={isProjectDesignMode}
          zoom={zoom}
          modes={MODES}
          activeMode={activeMode}
          onModeChange={handleModeChange}
          onZoom={handleZoomButton}
          onReset={resetView}
          onOpenImage={() => setIsImageModalOpen(true)}
          onOpenCableTypes={openCableTypesEditor}
          projectActions={{
            projectId: activeProjectId,
            projectStatus: activeProjectStatus,
            statusOptions: STATUS_OPTIONS,
            onStatusChange: setActiveProjectStatus,
            onTogglePartsList: () => setIsPartsListOpen((prev) => !prev),
            hideStatusControls: false,
            designSnapshot: { boxes, cables, devices, cableTypes },
            snapshotPricing: {
              componentsTotal: boxesTotal,
              cablesTotal,
              devicesTotal,
              marginTotal,
              totalBudget,
            },
            onRestoreDesign: restoreDesign,
            onSetActiveVersion: (version) =>
              setActiveVersion(version ? { id: version.id, name: version.name, locked: version.locked } : null),
            onClearActiveVersion: () => setActiveVersion(null),
            activeVersionId: activeVersion?.id || null,
            authToken: accessToken,
            authorName: authUser?.name || authUser?.email || "",
          }}
          totals={{ total: totalBudget, boxes: boxesTotal, cables: cablesTotal }}
        />

        <CableTypeModal
          open={isCableTypeOpen}
          mode={cableTypeModalMode}
          types={cableTypes}
          onChangeTypes={handleCableTypesChange}
          onClose={() => setIsCableTypeOpen(false)}
          onSelect={(type) => {
            const nextLabel = String(type?.label || "").trim();
            if (!nextLabel) return;
            setSelectedCableType({
              id: String(type.id),
              label: nextLabel,
              color: String(type.color || DEFAULT_CABLE_COLOR),
            });
            setActiveMode("addCable");
          }}
        />
        <Toolbar
          visible={!hideToolbar && !isProjectDesignMode}
          zoom={zoom}
          modes={MODES}
          activeMode={activeMode}
          onModeChange={handleModeChange}
          onZoom={handleZoomButton}
          onReset={resetView}
          onOpenImage={() => setIsImageModalOpen(true)}
          totals={{ boxes: boxesTotal, cables: cablesTotal, total: totalBudget }}
        />

        <DashboardPage
          isActive={isDashboardSection && !isProjectDesignMode}
          isLoading={isProjectsLoading}
          projects={projects}
          totals={{ total: totalBudget }}
          onNewProject={() => {
            setActiveSection("Proyectos");
            setActiveSubsection("");
            setOpenSection("Proyectos");
          }}
          onOpenProject={(project) => {
            if (!project?.id) return;
            setActiveProjectId(project.id);
            setActiveProjectStatus(project.status || "draft");
            setIsProjectDesignMode(true);
            setActiveMode("select");
          }}
        />

        <CatalogPage
          isProductsSection={isProductsSection}
          isCategoriesSection={isCategoriesSection}
          isProvidersSection={isProvidersSection}
          isMarginsSection={isMarginsSection}
          isManufacturersSection={isManufacturersSection}
          activeSubsection={activeSubsection}
          onSubsectionChange={handleSubsectionChange}
          isLoading={isCatalogLoading}
          authToken={accessToken}
          productCategoryOptions={productCategoryOptions}
          categories={categories}
          manufacturers={manufacturers}
          providers={providers}
          productCategoryFilter={productCategoryFilter}
          onFilterChange={setProductCategoryFilter}
          productForm={productForm}
          onProductFormChange={(updates) => setProductForm((prev) => ({ ...prev, ...updates }))}
          onAddProduct={handleAddProduct}
          onUploadProductImage={uploadProductImage}
          onProductInputKeyDown={handleProductInputKeyDown}
          groupedProducts={groupedProducts}
          allSortedProducts={allSortedProducts}
          onSort={handleSort}
          sortState={productSort}
          onUpdateProduct={updateProduct}
          onDeleteProduct={deleteProduct}
          categoryForm={categoryForm}
          onCategoryFormChange={(updates) => setCategoryForm((prev) => ({ ...prev, ...updates }))}
          onAddCategory={handleAddCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          providerForm={providerForm}
          onProviderFormChange={(updates) => setProviderForm((prev) => ({ ...prev, ...updates }))}
          onAddProvider={handleAddProvider}
          onUpdateProvider={updateProvider}
          onDeleteProvider={deleteProvider}
          manufacturerForm={manufacturerForm}
          onManufacturerFormChange={(updates) =>
            setManufacturerForm((prev) => ({ ...prev, ...updates }))
          }
          onAddManufacturer={handleAddManufacturer}
          onUpdateManufacturer={updateManufacturer}
          onDeleteManufacturer={deleteManufacturer}
          margins={margins}
          marginForm={marginForm}
          onMarginFormChange={(updates) => setMarginForm((prev) => ({ ...prev, ...updates }))}
          onAddMargin={handleAddMargin}
          onUpdateMargin={updateMargin}
          onDeleteMargin={deleteMargin}
        />

        <ClientsPage
          isActive={isClientsSection && !isProjectDesignMode}
          clients={clients}
          clientForm={clientForm}
          onClientFormChange={(updates) => setClientForm((prev) => ({ ...prev, ...updates }))}
          onAddClient={handleAddClient}
          onUpdateClient={updateClient}
          onDeleteClient={deleteClient}
        />

        <OperationsPage
          key={`operations-${activeSubsection}`}
          isActive={isOperationsSection && !isProjectDesignMode}
          activeSubsection={activeSubsection}
          authToken={accessToken}
        />

        <ProjectsPage
          isProjectsSection={isProjectsSection && !isProjectDesignMode}
          searchQuery=""
          hideStatusControls={false}
          authToken={accessToken}
          clients={clients}
          onOpenDesigner={(projectId, status, version) => {
            setActiveProjectId(projectId);
            setActiveProjectStatus(status || "draft");
            setActiveVersion(version ? { id: version.id, name: version.name, locked: version.locked } : null);
            setIsProjectDesignMode(true);
            setActiveMode("select");
          }}
          onProjectCreated={() => {
            setActiveSection("Proyectos");
            setActiveSubsection("");
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
          isLoading={isDesignLoading}
          projectId={activeProjectId}
          authToken={accessToken}
          designSnapshot={{ boxes, cables, devices, cableTypes }}
          snapshotPricing={{
            componentsTotal: boxesTotal,
            cablesTotal,
            devicesTotal,
            marginTotal,
            totalBudget,
          }}
          onRestoreDesign={restoreDesign}
          svgRef={svgRef}
          pan={pan}
          zoom={zoom}
          backgroundImage={backgroundImage}
          boxes={boxes}
          cables={cables}
          cableTypes={cableTypes}
          devices={devices}
          selectedBoxId={selectedBoxId}
          selectedDeviceId={selectedDeviceId}
          draftBox={draftBox}
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
          onBoxResizePointerDown={handleBoxResizePointerDown}
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
          onUpdateCableColor={(cableId, updates) => updateCable(cableId, updates)}
          projectStatus={activeProjectStatus}
          hideStatusControls={false}
          onProjectStatusChange={setActiveProjectStatus}
          partsListOpen={isPartsListOpen}
          statusOptions={STATUS_OPTIONS}
          statusLabels={STATUS_LABELS}
          activeVersion={activeVersion}
          onSetActiveVersion={(version) => setActiveVersion(version ? { id: version.id, name: version.name, locked: version.locked } : null)}
          onClearActiveVersion={() => setActiveVersion(null)}
          authorName={authUser?.name || authUser?.email || ""}
        />

      <AppGlobalModals
        isBoxModalOpen={isBoxModalOpen}
        selectedBox={selectedBox}
        componentForm={componentForm}
        catalog={catalog}
        onCloseBoxModal={() => setIsBoxModalOpen(false)}
        onUpdateBoxName={(name) => updateBox(selectedBox.id, { name })}
        onUpdateBoxZone={(zone) => updateBox(selectedBox.id, { zone })}
        onComponentFormChange={(updates) => setComponentForm((prev) => ({ ...prev, ...updates }))}
        onAddComponent={handleAddComponent}
        onRemoveComponent={removeComponent}
        onDeleteBox={handleDeleteBox}
        componentErrors={componentErrors}
        isBoxNameValid={isBoxNameValid}
        isCameraModalOpen={isCameraModalOpen}
        selectedDevice={devices.find((device) => device.id === selectedDeviceId) || null}
        cameraCatalog={cameraCatalog}
        cameraCategoryKey={cameraCategoryKey}
        onCloseCameraModal={() => setIsCameraModalOpen(false)}
        onUpdateDevice={(updates) =>
          setDevices((prev) => prev.map((device) => (device.id === selectedDeviceId ? { ...device, ...updates } : device)))
        }
        onDeleteDevice={() =>
          setDevices((prev) => prev.filter((device) => device.id !== selectedDeviceId))
        }
        isCableModalOpen={isCableModalOpen}
        cableForm={cableForm}
        onCableFormChange={(updates) => setCableForm((prev) => ({ ...prev, ...updates }))}
        onCloseCableModal={() => setIsCableModalOpen(false)}
        onSaveCable={handleCableFormSave}
        cableErrors={cableErrors}
        isImageModalOpen={isImageModalOpen}
        backgroundImage={backgroundImage}
        onCloseImageModal={() => setIsImageModalOpen(false)}
        onBackgroundUrlChange={setBackgroundImage}
        onBackgroundFileChange={handleBackgroundFile}
      />

      </div>
    </div>
  );
}

export default App;
