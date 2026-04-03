import React from "react";

const QuoteActions = React.lazy(() => import("../../components/Quote/QuoteActions.jsx"));

export default function CanvasEditorHeader({
  hideStatusControls,
  projectStatus,
  onTogglePartsList,
  projectId,
  statusOptions,
  onProjectStatusChange,
  boxes,
  cables,
  cableTypes,
  devices,
  onRestoreDesign,
  authToken,
}) {
  return (
    <div className="canvas__header-status">
      {onTogglePartsList && (
        <button className="canvas__edit" type="button" onClick={onTogglePartsList}>
          Listado de piezas
        </button>
      )}

      <div className="canvas__header-spacer" />

      {projectId && (
        <React.Suspense fallback={null}>
          <QuoteActions
            projectId={projectId}
            projectStatus={projectStatus}
            statusOptions={statusOptions}
            onStatusChange={onProjectStatusChange}
            hideStatusControls={hideStatusControls}
            designSnapshot={{ boxes, cables, devices, cableTypes }}
            onRestoreDesign={onRestoreDesign}
            authToken={authToken}
          />
        </React.Suspense>
      )}
    </div>
  );
}
