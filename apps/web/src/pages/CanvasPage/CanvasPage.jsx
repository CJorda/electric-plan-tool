import { useMemo, useState } from "react";
import "./CanvasPage.css";
import CanvasStage from "../../components/CanvasStage/CanvasStage.jsx";
import CanvasEditorHeader from "./CanvasEditorHeader.jsx";
import CanvasPartsListView from "./CanvasPartsListView.jsx";
import { buildGroupedRows, exportBomCsv } from "./canvasPartsUtils.js";

function CanvasPage({
  hideCanvas,
  isLoading = false,
  authToken = '',
  svgRef,
  pan,
  zoom,
  backgroundImage,
  boxes,
  cables,
  cableTypes,
  devices,
  selectedBoxId,
  selectedDeviceId,
  draftBox,
  draftCable,
  draftPolyline,
  tooltip,
  activeModeLabel,
  helpMessage,
  onCanvasClick,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onBoxPointerDown,
  onBoxResizePointerDown,
  onDevicePointerDown,
  onDeviceDoubleClick,
  onBoxDoubleClick,
  onBoxPointerMove,
  onBoxPointerLeave,
  onDeleteCable,
  renderCablePoints,
  renderCableLabelPosition,
  renderBoxLabel,
  partsListOpen,
  onTogglePartsList,
  hideStatusControls = false,
  onToggleComponentDiscount,
  onUpdateComponentCustomerDiscount,
  onToggleComponentActive,
  onUpdateCableColor,
  projectStatus,
  onProjectStatusChange,
  statusOptions,
  projectId,
  onRestoreDesign,
}) {
  const [openBoxes, setOpenBoxes] = useState({});

  const groupedRows = useMemo(() => {
    return buildGroupedRows(boxes, devices);
  }, [boxes, devices]);

  const toggleBox = (boxId) => {
    setOpenBoxes((prev) => ({ ...prev, [boxId]: !prev[boxId] }));
  };

  if (hideCanvas) return null;
  if (isLoading) {
    return (
      <div className="canvas__editor canvas__editor--loading">
        <div className="canvas__header-status">
          <span className="canvas__skeleton-pill skeleton" />
          <div className="canvas__header-spacer" />
          <span className="canvas__skeleton-button skeleton" />
          <span className="canvas__skeleton-button skeleton" />
        </div>
        <div className="canvas__loading-stage skeleton" />
      </div>
    );
  }

  if (partsListOpen) {
    return (
      <CanvasPartsListView
        groupedRows={groupedRows}
        openBoxes={openBoxes}
        onToggleBox={toggleBox}
        onExportBom={() => exportBomCsv(groupedRows)}
        onBackToDesigner={onTogglePartsList}
        onUpdateComponentCustomerDiscount={onUpdateComponentCustomerDiscount}
        onToggleComponentDiscount={onToggleComponentDiscount}
        onToggleComponentActive={onToggleComponentActive}
      />
    );
  }

  return (
    <div className="canvas__editor">
      <CanvasEditorHeader
        hideStatusControls={hideStatusControls}
        projectStatus={projectStatus}
        onTogglePartsList={onTogglePartsList}
        projectId={projectId}
        statusOptions={statusOptions}
        onProjectStatusChange={onProjectStatusChange}
        boxes={boxes}
        cables={cables}
        cableTypes={cableTypes}
        devices={devices}
        onRestoreDesign={onRestoreDesign}
        authToken={authToken}
      />

      <CanvasStage
        svgRef={svgRef}
        pan={pan}
        zoom={zoom}
        backgroundImage={backgroundImage}
        boxes={boxes}
        cables={cables}
        devices={devices}
        selectedBoxId={selectedBoxId}
        selectedDeviceId={selectedDeviceId}
        draftBox={draftBox}
        draftCable={draftCable}
        draftPolyline={draftPolyline}
        tooltip={tooltip}
        activeModeLabel={activeModeLabel}
        helpMessage={helpMessage}
        onCanvasClick={onCanvasClick}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onBoxPointerDown={onBoxPointerDown}
        onBoxResizePointerDown={onBoxResizePointerDown}
        onDevicePointerDown={onDevicePointerDown}
        onDeviceDoubleClick={onDeviceDoubleClick}
        onBoxDoubleClick={onBoxDoubleClick}
        onBoxPointerMove={onBoxPointerMove}
        onBoxPointerLeave={onBoxPointerLeave}
        onDeleteCable={onDeleteCable}
        renderCablePoints={renderCablePoints}
        renderCableLabelPosition={renderCableLabelPosition}
        renderBoxLabel={renderBoxLabel}
        onTogglePartsList={onTogglePartsList}
        onUpdateCableColor={onUpdateCableColor}
      />
    </div>
  );
}

export default CanvasPage;
