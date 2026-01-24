import "./CanvasPage.css";
import CanvasStage from "../../components/CanvasStage/CanvasStage.jsx";

function CanvasPage({
  hideCanvas,
  svgRef,
  pan,
  zoom,
  backgroundImage,
  boxes,
  cables,
  selectedBoxId,
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
  onBoxDoubleClick,
  onBoxPointerMove,
  onBoxPointerLeave,
  onDeleteCable,
  renderCablePoints,
  renderCableLabelPosition,
  renderBoxLabel,
  onEditSelected,
}) {
  if (hideCanvas) return null;

  return (
    <CanvasStage
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
      activeModeLabel={activeModeLabel}
      helpMessage={helpMessage}
      onCanvasClick={onCanvasClick}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onBoxPointerDown={onBoxPointerDown}
      onBoxDoubleClick={onBoxDoubleClick}
      onBoxPointerMove={onBoxPointerMove}
      onBoxPointerLeave={onBoxPointerLeave}
      onDeleteCable={onDeleteCable}
      renderCablePoints={renderCablePoints}
      renderCableLabelPosition={renderCableLabelPosition}
      renderBoxLabel={renderBoxLabel}
      onEditSelected={onEditSelected}
    />
  );
}

export default CanvasPage;
