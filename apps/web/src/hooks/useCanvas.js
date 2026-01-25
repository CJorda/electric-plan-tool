import { useMemo, useRef, useState } from "react";

function useCanvas({ activeMode, boxSize, onOpenBoxModal, onOpenCableModal, onOpenDeviceModal }) {
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

  const addBoxAtPoint = (point) => {
    const newBox = {
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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
    if (activeMode === "addCable") {
      if (!draftCable) {
        setDraftCable({
          id: crypto.randomUUID(),
          fromBoxId: box.id,
          toBoxId: null,
          points: [],
          model: "",
          section: "",
          length: 0,
          totalPrice: 0,
        });
      } else if (draftCable.fromBoxId !== box.id) {
        const completed = {
          ...draftCable,
          toBoxId: box.id,
        };
        setDraftCable(null);
        setDraftCursor(null);
        setCables((prev) => [...prev, completed]);
        onOpenCableModal?.(completed);
        setSelectedBoxId(null);
      }
      return;
    }
    if (activeMode === "select") {
      setSelectedBoxId(box.id);
      setSelectedDeviceId(null);
      const point = getCanvasPoint(event);
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
    const start = { x: fromBox.x + fromBox.width / 2, y: fromBox.y + fromBox.height / 2 };
    const end = { x: toBox.x + toBox.width / 2, y: toBox.y + toBox.height / 2 };
    const allPoints = [start, ...cable.points, end];
    return allPoints.map((point) => `${point.x},${point.y}`).join(" ");
  };

  const renderCableLabelPosition = (cable) => {
    const fromBox = boxes.find((box) => box.id === cable.fromBoxId);
    const toBox = boxes.find((box) => box.id === cable.toBoxId);
    if (!fromBox || !toBox) return { x: 0, y: 0 };
    const start = { x: fromBox.x + fromBox.width / 2, y: fromBox.y + fromBox.height / 2 };
    const end = { x: toBox.x + toBox.width / 2, y: toBox.y + toBox.height / 2 };
    return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
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
