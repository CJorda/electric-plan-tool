import { useMemo, useRef, useState } from "react";

const createId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function useCanvas({ activeMode, boxSize, onOpenBoxModal, onOpenCableModal, onOpenDeviceModal, selectedCableType }) {
  const svgRef = useRef(null);
  const [boxes, setBoxes] = useState([]);
  const [cables, setCables] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [draggingBox, setDraggingBox] = useState(null);
  const [draggingDevice, setDraggingDevice] = useState(null);
  const [draftCable, setDraftCable] = useState(null);
  const [draftCursor, setDraftCursor] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState("");

  const getCanvasPoint = (event) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  const defaultColorMap = {
    ac220: "#ef4444",
    modbus: "#f97316",
    analog: "#f59e0b",
    eth: "#0ea5e9",
    fiber: "#8b5cf6",
    dc24: "#22c55e",
  };

  const addBoxAtPoint = (point) => {
    const newBox = {
      id: createId(),
      x: point.x - boxSize.width / 2,
      y: point.y - boxSize.height / 2,
      width: boxSize.width,
      height: boxSize.height,
      name: `Cuadro ${boxes.length + 1}`,
      zone: "",
      components: [],
    };
    setBoxes((prev) => [...prev, newBox]);
    setSelectedBoxId(newBox.id);
    setSelectedDeviceId(null);
    onOpenBoxModal();
  };

  const addDeviceAtPoint = (point) => {
    const newDevice = {
      id: createId(),
      x: point.x,
      y: point.y,
      type: "camera",
      name: `Cámara ${devices.length + 1}`,
      zone: "",
      category: "",
      model: "",
      unitPrice: 0,
      customerDiscountPercent: 0,
      discountApplied: false,
      productActive: true,
      total: 0,
    };
    setDevices((prev) => [...prev, newDevice]);
    setSelectedDeviceId(newDevice.id);
    setSelectedBoxId(null);
    onOpenDeviceModal?.(newDevice.id);
  };

  const handleCanvasClick = (event) => {
    if (isPanning || draggingBox) return;
    if (activeMode === "addBox") {
      const point = getCanvasPoint(event);
      addBoxAtPoint(point);
      return;
    }
    if (activeMode === "addDevice") {
      const point = getCanvasPoint(event);
      addDeviceAtPoint(point);
      return;
    }
    if (activeMode === "addCable" && draftCable) {
      const point = getCanvasPoint(event);
      setDraftCable((prev) => ({
        ...prev,
        points: [...prev.points, point],
      }));
      return;
    }
    setSelectedBoxId(null);
    setSelectedDeviceId(null);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const delta = -event.deltaY;
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    const nextZoom = Math.min(5, Math.max(0.1, zoom * zoomFactor));
    const point = getCanvasPoint(event);
    const newPan = {
      x: pan.x - point.x * (nextZoom - zoom),
      y: pan.y - point.y * (nextZoom - zoom),
    };
    setZoom(nextZoom);
    setPan(newPan);
  };

  const handlePointerDown = (event) => {
    if (!event.ctrlKey) return;
    setIsPanning(true);
    setPanStart({ x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y });
  };

  const handlePointerMove = (event) => {
    if (isPanning && panStart) {
      setPan({
        x: panStart.panX + (event.clientX - panStart.x),
        y: panStart.panY + (event.clientY - panStart.y),
      });
      return;
    }
    if (draftCable) {
      const point = getCanvasPoint(event);
      setDraftCursor(point);
    }
    if (draggingBox) {
      const point = getCanvasPoint(event);
      setBoxes((prev) =>
        prev.map((box) =>
          box.id === draggingBox.id
            ? {
                ...box,
                x: point.x - draggingBox.offsetX,
                y: point.y - draggingBox.offsetY,
              }
            : box
        )
      );
    }
    if (draggingDevice) {
      const point = getCanvasPoint(event);
      setDevices((prev) =>
        prev.map((device) =>
          device.id === draggingDevice.id
            ? {
                ...device,
                x: point.x - draggingDevice.offsetX,
                y: point.y - draggingDevice.offsetY,
              }
            : device
        )
      );
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setPanStart(null);
    setDraggingBox(null);
    setDraggingDevice(null);
  };

  const handleBoxPointerDown = (event, box) => {
    event.stopPropagation();
    const point = getCanvasPoint(event);

    if (activeMode === "addCable") {
      if (!draftCable) {
        setDraftCable({
          id: createId(),
          fromBoxId: box.id,
          toBoxId: null,
          points: [],
          model: selectedCableType?.label || "",
          section: "",
          length: 0,
          totalPrice: 0,
          autoCalculated: true,
          color: (selectedCableType && (selectedCableType.color || defaultColorMap[selectedCableType.id])) || "#22c55e",
        });
      } else if (draftCable.fromBoxId !== box.id) {
        const completed = {
          ...draftCable,
          id: createId(),
          toBoxId: box.id,
          model: draftCable.model || selectedCableType?.label || "",
          color: draftCable.color || ((selectedCableType && (selectedCableType.color || defaultColorMap[selectedCableType.id])) || "#22c55e"),
        };
        setCables((prev) => [...prev, completed]);
        setDraftCable(null);
        onOpenCableModal?.(completed);
        setSelectedBoxId(null);
      }
      return;
    }

    if (activeMode === "select") {
      setSelectedBoxId(box.id);
      setSelectedDeviceId(null);
      setDraggingBox({
        id: box.id,
        offsetX: point.x - box.x,
        offsetY: point.y - box.y,
      });
    }
  };

  const handleDevicePointerDown = (event, device) => {
    event.stopPropagation();
    if (activeMode !== "select") return;
    setSelectedDeviceId(device.id);
    setSelectedBoxId(null);
    const point = getCanvasPoint(event);
    setDraggingDevice({
      id: device.id,
      offsetX: point.x - device.x,
      offsetY: point.y - device.y,
    });
  };

  const handleBoxDoubleClick = (event, box) => {
    event.stopPropagation();
    if (activeMode !== "select") return;
    setSelectedBoxId(box.id);
    onOpenBoxModal();
  };

  const handleDeviceDoubleClick = (event, device) => {
    event.stopPropagation();
    if (activeMode !== "select") return;
    setSelectedDeviceId(device.id);
    onOpenDeviceModal?.(device.id);
  };

  const handleBoxPointerMove = (event, box) => {
    if (draggingBox || isPanning) return;
    const stageRect = svgRef.current?.getBoundingClientRect();
    if (!stageRect) return;
    setTooltip({
      x: event.clientX - stageRect.left,
      y: event.clientY - stageRect.top,
      box,
    });
  };

  const handleBoxPointerLeave = () => {
    setTooltip(null);
  };

  const updateBox = (boxId, updates) => {
    setBoxes((prev) => prev.map((box) => (box.id === boxId ? { ...box, ...updates } : box)));
  };

  const updateCable = (cableId, updates) => {
    setCables((prev) => prev.map((cable) => (cable.id === cableId ? { ...cable, ...updates } : cable)));
  };

  const deleteBox = (boxId) => {
    setBoxes((prev) => prev.filter((box) => box.id !== boxId));
    setCables((prev) => prev.filter((cable) => cable.fromBoxId !== boxId && cable.toBoxId !== boxId));
    setSelectedBoxId(null);
  };

  const deleteCable = (cableId) => {
    setCables((prev) => prev.filter((cable) => cable.id !== cableId));
  };

  const handleZoomButton = (delta) => {
    const nextZoom = Math.min(5, Math.max(0.1, zoom + delta));
    setZoom(nextZoom);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleBackgroundFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBackgroundImage(url);
  };

  const renderCablePoints = (cable) => {
    const fromBox = boxes.find((box) => box.id === cable.fromBoxId);
    const toBox = boxes.find((box) => box.id === cable.toBoxId);
    if (!fromBox || !toBox) return "";

    const center = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

    const intersectRectEdge = (rect, target) => {
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;
      const dx = target.x - cx;
      const dy = target.y - cy;
      const candidates = [];
      if (dx !== 0) {
        const tLeft = (rect.x - cx) / dx;
        const tRight = (rect.x + rect.width - cx) / dx;
        if (tLeft > 0) candidates.push(tLeft);
        if (tRight > 0) candidates.push(tRight);
      }
      if (dy !== 0) {
        const tTop = (rect.y - cy) / dy;
        const tBottom = (rect.y + rect.height - cy) / dy;
        if (tTop > 0) candidates.push(tTop);
        if (tBottom > 0) candidates.push(tBottom);
      }
      if (candidates.length === 0) return { x: cx, y: cy };
      const t = Math.min(...candidates);
      return { x: cx + dx * t, y: cy + dy * t };
    };

    const fromCenter = center(fromBox);
    const toCenter = center(toBox);

    const firstTarget = cable.points && cable.points.length > 0 ? cable.points[0] : toCenter;
    const lastTarget = cable.points && cable.points.length > 0 ? cable.points[cable.points.length - 1] : fromCenter;

    const start = intersectRectEdge(fromBox, firstTarget);
    const end = intersectRectEdge(toBox, lastTarget);

    const allPoints = [start, ...(cable.points || []), end];
    return allPoints.map((point) => `${point.x},${point.y}`).join(" ");
  };

  const renderCableLabelPosition = (cable) => {
    const fromBox = boxes.find((box) => box.id === cable.fromBoxId);
    const toBox = boxes.find((box) => box.id === cable.toBoxId);
    if (!fromBox || !toBox) return { x: 0, y: 0 };
    const points = renderCablePoints(cable);
    const pointList = points ? points.split(" ").map((p) => p.split(",").map(Number)) : [];
    const start = pointList[0] || [];
    const end = pointList[pointList.length - 1] || [];
    if (start.length !== 2 || end.length !== 2) return { x: 0, y: 0 };
    return { x: (start[0] + end[0]) / 2, y: (start[1] + end[1]) / 2 };
  };

  const draftPolyline = useMemo(() => {
    if (!draftCable) return "";
    const fromBox = boxes.find((box) => box.id === draftCable.fromBoxId);
    if (!fromBox) return "";
    const start = { x: fromBox.x + fromBox.width / 2, y: fromBox.y + fromBox.height / 2 };
    const points = [start, ...draftCable.points];
    if (draftCursor) points.push(draftCursor);
    return points.map((point) => `${point.x},${point.y}`).join(" ");
  }, [boxes, draftCable, draftCursor]);

  return {
    svgRef,
    boxes,
    cables,
    devices,
    setBoxes,
    setCables,
    setDevices,
    selectedBoxId,
    setSelectedBoxId,
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
    handleBoxDoubleClick,
    handleDeviceDoubleClick,
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
  };
}

export default useCanvas;
