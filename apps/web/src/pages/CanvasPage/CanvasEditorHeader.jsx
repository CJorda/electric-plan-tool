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
  snapshotPricing,
  onRestoreDesign,
  authToken,
}) {
  return (
    <div className="canvas__header-status">
      <div className="canvas__header-spacer" />

      {projectId && (
        <React.Suspense fallback={null}>
          <QuoteActions
            projectId={projectId}
            projectStatus={projectStatus}
            statusOptions={statusOptions}
            onStatusChange={onProjectStatusChange}
            onTogglePartsList={onTogglePartsList}
            hideStatusControls={hideStatusControls}
            designSnapshot={{ boxes, cables, devices, cableTypes }}
            snapshotPricing={snapshotPricing}
            onRestoreDesign={onRestoreDesign}
            authToken={authToken}
          />
        </React.Suspense>
      )}
    </div>
  );
}
