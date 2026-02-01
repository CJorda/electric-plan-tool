import "./CanvasStage.css";

function CanvasStage({
  svgRef,
  pan,
  zoom,
  backgroundImage,
  boxes,
  cables,
  devices,
  selectedBoxId,
  selectedDeviceId,
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
  onDevicePointerDown,
  onDeviceDoubleClick,
  onBoxDoubleClick,
  onBoxPointerMove,
  onBoxPointerLeave,
  onDeleteCable,
  onUpdateCableColor,
  renderCablePoints,
  renderCableLabelPosition,
  renderBoxLabel,
  onEditSelected,
  onTogglePartsList,
}) {
  return (
    <main className="canvas">
      {/* Toolbar is intentionally rendered by the page container (CanvasPage) */}

      <div className="canvas__stage">
        <svg
          ref={svgRef}
          className="canvas__svg"
          onClick={onCanvasClick}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {backgroundImage && (
              <image
                href={backgroundImage}
                x="0"
                y="0"
                width="1600"
                height="900"
                preserveAspectRatio="xMidYMid meet"
              />
            )}

            

            {draftCable && draftPolyline && (
              <polyline
                points={draftPolyline}
                fill="none"
                stroke="#16a34a"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
            )}

            {boxes.map((box) => (
              <g key={box.id}>
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.width}
                  height={box.height}
                  rx={10}
                  fill={box.id === selectedBoxId ? "#1f2937" : "#111827"}
                  stroke={box.id === selectedBoxId ? "#94a3b8" : "#374151"}
                  strokeWidth="2"
                  onPointerDown={(event) => onBoxPointerDown(event, box)}
                  onDoubleClick={(event) => onBoxDoubleClick(event, box)}
                  onPointerMove={(event) => onBoxPointerMove(event, box)}
                  onPointerLeave={onBoxPointerLeave}
                />
                {renderBoxLabel(box)}
              </g>
            ))}

            {devices.map((device) => (
              <g key={device.id}>
                <circle
                  cx={device.x}
                  cy={device.y}
                  r={14}
                  fill={device.id === selectedDeviceId ? "#1e293b" : "#0f172a"}
                  stroke={device.id === selectedDeviceId ? "#38bdf8" : "#64748b"}
                  strokeWidth="2"
                  onPointerDown={(event) => onDevicePointerDown?.(event, device)}
                  onDoubleClick={(event) => onDeviceDoubleClick?.(event, device)}
                />
                <circle cx={device.x} cy={device.y} r={5} fill="#38bdf8" />
                <text
                  x={device.x}
                  y={device.y + 26}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="11"
                >
                  {device.name || "Cámara"}
                </text>
              </g>
            ))}

            {cables.map((cable) => {
              const points = renderCablePoints(cable);
              const labelPosition = renderCableLabelPosition(cable);
              const pointList = points ? points.split(" ").map((p) => p.split(",").map(Number)) : [];
              const start = pointList[0] || [];
              const end = pointList[pointList.length - 1] || [];
              return (
                <g key={cable.id}>
                  <polyline
                    className="cable cable--animated"
                    points={points}
                    fill="none"
                    stroke={cable.color || "#22c55e"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={"12 8"}
                  />
                  {pointList.map(([x, y], index) => (
                    <circle key={`${cable.id}-p-${index}`} cx={x} cy={y} r={4} fill={cable.color || "#16a34a"} />
                  ))}
                  {start.length === 2 && <circle cx={start[0]} cy={start[1]} r={6} fill={cable.color || "#22c55e"} opacity={0.95} />}
                  {end.length === 2 && <circle cx={end[0]} cy={end[1]} r={6} fill={cable.color || "#22c55e"} opacity={0.95} />}
                  <g className="cable__label" onClick={() => onDeleteCable(cable.id)}>
                    <rect
                      x={labelPosition.x - 60}
                      y={labelPosition.y - 16}
                      width={120}
                      height={26}
                      rx={8}
                      fill="#0f172a"
                      opacity="0.85"
                    />
                    <text
                      x={labelPosition.x}
                      y={labelPosition.y}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="12"
                      dominantBaseline="middle"
                    >
                      {cable.model || "Cable"} · {cable.length || 0}m
                    </text>
                  </g>
                  <foreignObject x={labelPosition.x + 68} y={labelPosition.y - 12} width={34} height={28}>
                    <div xmlns="http://www.w3.org/1999/xhtml" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <input
                        type="color"
                        value={cable.color || '#22c55e'}
                        onChange={(e) => onUpdateCableColor?.(cable.id, { color: e.target.value })}
                        className="cable-color-input"
                        aria-label={`Color del cable ${cable.model || ''}`}
                      />
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>

        {tooltip && (
          <div className="canvas__tooltip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
            <div className="canvas__tooltip-title">{tooltip.box.name}</div>
            {tooltip.box.zone && (
              <div className="canvas__tooltip-row">Zona: {tooltip.box.zone}</div>
            )}
            <div className="canvas__tooltip-row">
              Componentes: <strong>{tooltip.box.components.length}</strong>
            </div>
            <div className="canvas__tooltip-row">
              Total: <strong>€{tooltip.box.components.reduce((sum, c) => sum + c.total, 0).toFixed(2)}</strong>
            </div>
            <div className="canvas__tooltip-row">
              Tamaño: {tooltip.box.width} x {tooltip.box.height}px
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default CanvasStage;
