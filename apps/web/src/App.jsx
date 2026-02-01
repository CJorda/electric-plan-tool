import { useEffect, useMemo, useState } from "react";
import { Boxes, Camera, Link2, MousePointer, Home, FolderKanban, Package, Menu } from "lucide-react";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import Toolbar from "./components/Toolbar/Toolbar.jsx";
import CatalogPage from "./pages/CatalogPage/CatalogPage.jsx";
import DashboardPage from "./pages/DashboardPage/DashboardPage.jsx";
import CanvasPage from "./pages/CanvasPage/CanvasPage.jsx";
import ProjectsPage from "./pages/ProjectsPage/ProjectsPage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
import { apiFetch } from "./lib/api.js";
import BoxModal from "./components/modals/BoxModal/BoxModal.jsx";
import CableModal from "./components/modals/CableModal/CableModal.jsx";
import ImageModal from "./components/modals/ImageModal/ImageModal.jsx";
import SizeModal from "./components/modals/SizeModal/SizeModal.jsx";
import CameraModal from "./components/modals/CameraModal/CameraModal.jsx";
import CableTypeModal from "./components/modals/CableTypeModal/CableTypeModal.jsx";
import useCatalog from "./hooks/useCatalog.js";
import useProjects from "./hooks/useProjects.js";
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

const createId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

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
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken") || "");
  const [authUser, setAuthUser] = useState(() => {
    try {
      const stored = localStorage.getItem("authUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const decodeJwt = (token) => {
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!accessToken || authUser) return;
    const payload = decodeJwt(accessToken);
    if (!payload) return;
    const derivedUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role || "user",
      name: payload.name,
    };
    localStorage.setItem("authUser", JSON.stringify(derivedUser));
    setAuthUser(derivedUser);
  }, [accessToken, authUser]);
  const [activeMode, setActiveMode] = useState("select");
  const [isCableTypeOpen, setIsCableTypeOpen] = useState(false);
  const [selectedCableType, setSelectedCableType] = useState(null);

  const handleModeChange = (mode) => {
    if (mode === "addCable") {
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
    handleAddProduct,
    handleProductInputKeyDown,
    updateProduct,
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
    deleteMargin,
    templates,
    templateForm,
    setTemplateForm,
    selectedTemplateId,
    setSelectedTemplateId,
    templateMargins,
    templateMarginForm,
    setTemplateMarginForm,
    handleAddTemplate,
    handleAddTemplateMargin,
    deleteTemplateMargin,
  } = useCatalog({ authToken: accessToken });

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
    selectedCableType,
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
        setBoxes(Array.isArray(data.design?.boxes) ? data.design.boxes : []);
        setCables(Array.isArray(data.design?.cables) ? data.design.cables : []);
        setDevices(Array.isArray(data.design?.devices) ? data.design.devices : []);
      } catch {
        if (!cancelled) {
          setBoxes([]);
          setCables([]);
          setDevices([]);
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
      apiFetch(`/api/projects/${activeProjectId}/design`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design: { boxes, cables, devices } }),
      }, accessToken).catch(() => {
        // ignore
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [activeProjectId, boxes, cables, devices, accessToken]);

  const restoreDesign = async (design) => {
    const nextBoxes = Array.isArray(design?.boxes) ? design.boxes : [];
    const nextCables = Array.isArray(design?.cables) ? design.cables : [];
    const nextDevices = Array.isArray(design?.devices) ? design.devices : [];
    setBoxes(nextBoxes);
    setCables(nextCables);
    setDevices(nextDevices);
    if (!activeProjectId || String(activeProjectId).startsWith("local-")) return;
    try {
      await apiFetch(`/api/projects/${activeProjectId}/design`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design: { boxes: nextBoxes, cables: nextCables, devices: nextDevices } }),
      }, accessToken);
    } catch {
      // ignore
    }
  };

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
        items: ["Proyectos"],
      },
      {
        title: "Catálogo",
        icon: Package,
        items: ["Productos", "Categorías", "Distribuidores", "Márgenes", "Plantillas", "Fabricantes"],
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
  const isProvidersSection = activeSection === "Catálogo" && activeSubsection === "Distribuidores";
  const isMarginsSection = activeSection === "Catálogo" && activeSubsection === "Márgenes";
  const isTemplatesSection = activeSection === "Catálogo" && activeSubsection === "Plantillas";
  const isManufacturersSection = activeSection === "Catálogo" && activeSubsection === "Fabricantes";
  const isProjectsSection = activeSection === "Proyectos";
  const hideToolbar =
    (isDashboardSection || isProductsSection || isCategoriesSection || isProvidersSection || isMarginsSection || isTemplatesSection || isManufacturersSection || isProjectsSection) && !isProjectDesignMode;

  const handleLogin = async ({ email, password }) => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await apiFetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        },
        ""
      );
      clearTimeout(timeout);
      const responseText = await res.text();
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {};
        }
      }
      if (!res.ok) {
        const errorMessage =
          data.error ||
          responseText?.slice(0, 200) ||
          `Error de login (${res.status})`;
        setLoginError(errorMessage);
        return;
      }
      const token = data.accessToken || data.access_token || data.token || "";
      if (!token) {
        const fallbackMessage = responseText
          ? `Respuesta inesperada: ${responseText.slice(0, 200)}`
          : "Token no recibido. Revisa la API.";
        setLoginError(fallbackMessage);
        return;
      }
      localStorage.setItem("accessToken", token);
      setAccessToken(token);
      const nextUser = data.user || null;
      if (nextUser) {
        localStorage.setItem("authUser", JSON.stringify(nextUser));
        setAuthUser(nextUser);
      } else if (token) {
        const payload = decodeJwt(token);
        if (payload) {
          const derivedUser = {
            id: payload.sub,
            email: payload.email,
            role: payload.role || "user",
            name: payload.name,
          };
          localStorage.setItem("authUser", JSON.stringify(derivedUser));
          setAuthUser(derivedUser);
        }
      }
    } catch (error) {
      const message =
        error?.name === "AbortError"
          ? "Tiempo de espera agotado. Revisa la API."
          : "No se pudo iniciar sesión";
      setLoginError(message);
    } finally {
      setLoginLoading(false);
    }
  };

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
  }, [activeSection, activeSubsection, isProjectDesignMode, isPartsListOpen, sidebarSections]);

  const helpMessage = useMemo(() => {
    if (activeMode === "addCable") return "Selecciona un cuadro de origen y destino para añadir el cable.";
    if (activeMode === "addBox") return "Haz click sobre el lienzo para colocar un cuadro.";
    return "Ctrl + arrastrar para desplazar. Rueda para zoom.";
  }, [activeMode]);

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
          onLogout={async () => {
            try {
              await apiFetch("/api/auth/logout", { method: "POST" }, accessToken);
            } catch {
              // ignore
            }
            localStorage.removeItem("accessToken");
            localStorage.removeItem("authUser");
            setAccessToken("");
            setAuthUser(null);
          }}
        />
        <div className="main">
        <Toolbar
          visible={isProjectDesignMode}
          zoom={zoom}
          modes={MODES}
          activeMode={activeMode}
          onModeChange={(mode) => {
            if (mode === "addCable") {
              // open type selector before switching to addCable
              setIsCableTypeOpen(true);
              return;
            }
            setActiveMode(mode);
          }}
          onZoom={(delta) => setZoom((prev) => Math.min(5, Math.max(0.1, prev + delta)))}
          onReset={resetView}
          onOpenImage={() => setIsImageModalOpen(true)}
          onOpenSize={() => setIsSizeModalOpen(true)}
          totals={{ total: totalBudget, boxes: boxesTotal, cables: cablesTotal }}
        />

        <CableTypeModal
          open={isCableTypeOpen}
          onClose={() => setIsCableTypeOpen(false)}
          onSelect={(type) => {
            setSelectedCableType(type);
            setActiveMode("addCable");
          }}
        />
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <button
            className="breadcrumb__menu"
            type="button"
            aria-label="Abrir menú"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
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
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}
        <Toolbar
          visible={!hideToolbar && !isProjectDesignMode}
          zoom={zoom}
          modes={MODES}
          activeMode={activeMode}
          onModeChange={handleModeChange}
          onZoom={handleZoomButton}
          onReset={resetView}
          onOpenImage={() => setIsImageModalOpen(true)}
          onOpenSize={() => setIsSizeModalOpen(true)}
          totals={{ boxes: boxesTotal, cables: cablesTotal, total: totalBudget }}
        />

        <DashboardPage
          isActive={isDashboardSection && !isProjectDesignMode}
          isLoading={isProjectsLoading}
          projects={projects}
          totals={{ total: totalBudget }}
          onNewProject={() => {
            setActiveSection("Proyectos");
            setActiveSubsection("Proyectos");
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
          isTemplatesSection={isTemplatesSection}
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
          providers={providers}
          providerForm={providerForm}
          onProviderFormChange={(updates) => setProviderForm((prev) => ({ ...prev, ...updates }))}
          onAddProvider={handleAddProvider}
          onUpdateProvider={updateProvider}
          onDeleteProvider={deleteProvider}
          manufacturers={manufacturers}
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
          onDeleteMargin={deleteMargin}
          templates={templates}
          templateForm={templateForm}
          onTemplateFormChange={(updates) => setTemplateForm((prev) => ({ ...prev, ...updates }))}
          onAddTemplate={handleAddTemplate}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={setSelectedTemplateId}
          templateMargins={templateMargins}
          templateMarginForm={templateMarginForm}
          onTemplateMarginFormChange={(updates) => setTemplateMarginForm((prev) => ({ ...prev, ...updates }))}
          onAddTemplateMargin={handleAddTemplateMargin}
          onDeleteTemplateMargin={deleteTemplateMargin}
        />

        <ProjectsPage
          isProjectsSection={isProjectsSection && !isProjectDesignMode}
          activeSubsection={activeSubsection}
          hideStatusControls={false}
          authToken={accessToken}
          onOpenDesigner={(projectId, status) => {
            setActiveProjectId(projectId);
            setActiveProjectStatus(status || "draft");
            setIsProjectDesignMode(true);
            setActiveMode("select");
          }}
          onProjectCreated={() => {
            setActiveSection("Proyectos");
            setActiveSubsection("Proyectos");
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
          designSnapshot={{ boxes, cables, devices }}
          onRestoreDesign={restoreDesign}
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
          onUpdateCableColor={(cableId, updates) => updateCable(cableId, updates)}
          projectStatus={activeProjectStatus}
          hideStatusControls={false}
          onProjectStatusChange={setActiveProjectStatus}
          partsListOpen={isPartsListOpen}
          statusOptions={STATUS_OPTIONS}
          statusLabels={STATUS_LABELS}
        />

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

      </div>

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
