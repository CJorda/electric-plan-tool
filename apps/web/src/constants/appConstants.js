import { Boxes, Camera, Link2, MousePointer } from "lucide-react";

export const MODES = [
  { id: "select", label: "Seleccionar", icon: MousePointer },
  { id: "addBox", label: "Añadir cuadro", icon: Boxes },
  { id: "addCable", label: "Dibujar cable", icon: Link2 },
  { id: "addDevice", label: "Añadir cámara", icon: Camera },
];

export const DEFAULT_COMPONENT_FORM = {
  lineType: "electrical",
  category: "",
  model: "",
  quantity: 1,
  unitPrice: 0,
  catalogKey: "",
  productId: "",
  distributorId: "",
  distributorName: "",
  priceHistoryId: "",
  tariffLabel: "",
  mechanicalPlacement: "",
  mechanicalMachining: "",
  mechanicalNotes: "",
};

export const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "confirmed", label: "Confirmado" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" },
];
