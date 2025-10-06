import { Link2 } from "lucide-react";
import { MouseEvent } from "react";

interface ConnectionHandleProps {
  layerId: string;
  x: number;
  y: number;
  onConnectionStart: (layerId: string, point: { x: number; y: number }) => void;
}

export const ConnectionHandle = ({
  layerId,
  x,
  y,
  onConnectionStart,
}: ConnectionHandleProps) => {
  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation();
    onConnectionStart(layerId, { x, y });
  };

  return (
    <g
      onMouseDown={handleMouseDown}
      style={{ cursor: "crosshair" }}
    >
      <circle
        cx={x}
        cy={y}
        r={8}
        fill="#ffffff"
        stroke="#0066ff"
        strokeWidth={2}
        opacity={0.9}
      />
      <foreignObject
        x={x - 6}
        y={y - 6}
        width={12}
        height={12}
        style={{ pointerEvents: "none" }}
      >
        <Link2 size={12} color="#0066ff" />
      </foreignObject>
    </g>
  );
};