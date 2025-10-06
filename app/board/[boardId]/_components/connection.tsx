import { useState, useMemo, memo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ConnectionLayer, LayerType } from "@/types/canvas";
import { colorToCSS } from "@/lib/utils";
import { useMutation, useStorage } from "@/liveblocks.config";

interface ConnectionProps {
  id: string;
  layer: ConnectionLayer;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  startBounds?: { x: number; y: number; width: number; height: number };
  endBounds?: { x: number; y: number; width: number; height: number };
}

const ConnectionComponent = ({
  id,
  layer,
  startPoint,
  endPoint,
  startBounds,
  endBounds,
}: ConnectionProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const connectionRef = useRef<SVGGElement>(null);

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (connectionRef.current && !connectionRef.current.contains(e.target as Node)) {
        setIsSelected(false);
        setIsHovered(false);
      }
    };

    if (isSelected) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSelected]);

  // Check if the end layer is a sent message
  const endLayer = useStorage((root) => {
    if (layer.endId) {
      return root.layers.get(layer.endId);
    }
    return null;
  });

  // Connection is "sent" if the message has a value (has been sent)
  const isSent = endLayer?.type === LayerType.Message && (endLayer as any)?.value;
  // Can only disconnect unsent connections
  const canDisconnect = endLayer?.type === LayerType.Message && !(endLayer as any)?.value;

  // Professional color scheme
  const connectionColor = useMemo(() => {
    if (isSent) {
      return "#94a3b8"; // Muted blue-gray for sent
    }
    return "#3b82f6"; // Vibrant blue for active/unsent
  }, [isSent]);

  const deleteConnection = useMutation(
    ({ storage }) => {
      const layers = storage.get("layers");
      const layerIds = storage.get("layerIds");

      layers.delete(id);

      const index = layerIds.indexOf(id);
      if (index !== -1) {
        layerIds.delete(index);
      }
    },
    [id]
  );

  // Calculate clean elbow path with rounded corners
  const { pathData, buttonPosition } = useMemo(() => {
    // Connection points - right side of start, left side of end
    const start = startBounds
      ? { x: startBounds.x + startBounds.width, y: startBounds.y + startBounds.height / 2 }
      : startPoint;

    const end = endBounds
      ? { x: endBounds.x, y: endBounds.y + endBounds.height / 2 }
      : endPoint;

    // Calculate the path segments
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;

    // Corner radius for smooth turns
    const cornerRadius = 8;

    let path = "";
    let midPoint = { x: 0, y: 0 };

    if (deltaX > 40) {
      // Standard L-shaped path when there's enough horizontal space
      const midX = start.x + deltaX / 2;

      // Build path with rounded corners
      path = `M ${start.x} ${start.y}`;

      // Horizontal segment to midpoint
      if (Math.abs(deltaY) > cornerRadius * 2) {
        // Add rounded corner at the turn
        path += ` L ${midX - cornerRadius} ${start.y}`;
        path += ` Q ${midX} ${start.y} ${midX} ${start.y + Math.sign(deltaY) * cornerRadius}`;
        path += ` L ${midX} ${end.y - Math.sign(deltaY) * cornerRadius}`;
        path += ` Q ${midX} ${end.y} ${midX + cornerRadius} ${end.y}`;
      } else {
        // Direct horizontal line when nodes are aligned
        path += ` L ${midX} ${start.y}`;
        path += ` L ${midX} ${end.y}`;
      }

      // Final horizontal segment to end
      path += ` L ${end.x} ${end.y}`;

      midPoint = { x: midX, y: (start.y + end.y) / 2 };

    } else {
      // S-shaped path when nodes are close or reversed
      const extendDistance = 50;
      const midY = (start.y + end.y) / 2;

      path = `M ${start.x} ${start.y}`;

      // First horizontal segment (going right)
      path += ` L ${start.x + extendDistance - cornerRadius} ${start.y}`;

      // First turn (down or up)
      if (Math.abs(deltaY) > cornerRadius * 2) {
        path += ` Q ${start.x + extendDistance} ${start.y} ${start.x + extendDistance} ${start.y + Math.sign(deltaY) * cornerRadius}`;
        path += ` L ${start.x + extendDistance} ${midY - Math.sign(deltaY) * cornerRadius}`;
        path += ` Q ${start.x + extendDistance} ${midY} ${start.x + extendDistance - cornerRadius} ${midY}`;
      } else {
        path += ` L ${start.x + extendDistance} ${start.y}`;
        path += ` L ${start.x + extendDistance} ${midY}`;
      }

      // Middle horizontal segment
      path += ` L ${end.x - extendDistance + cornerRadius} ${midY}`;

      // Second turn (down or up)
      if (Math.abs(deltaY) > cornerRadius * 2) {
        path += ` Q ${end.x - extendDistance} ${midY} ${end.x - extendDistance} ${midY + Math.sign(deltaY) * cornerRadius}`;
        path += ` L ${end.x - extendDistance} ${end.y - Math.sign(deltaY) * cornerRadius}`;
        path += ` Q ${end.x - extendDistance} ${end.y} ${end.x - extendDistance + cornerRadius} ${end.y}`;
      } else {
        path += ` L ${end.x - extendDistance} ${midY}`;
        path += ` L ${end.x - extendDistance} ${end.y}`;
      }

      // Final horizontal segment to end
      path += ` L ${end.x} ${end.y}`;

      midPoint = { x: (start.x + extendDistance + end.x - extendDistance) / 2, y: midY };
    }

    return {
      pathData: path,
      buttonPosition: { x: midPoint.x - 16, y: midPoint.y - 16 }
    };
  }, [startBounds, endBounds, startPoint, endPoint]);

  return (
    <g ref={connectionRef}>
      {/* Shadow effect for depth */}
      {!isSent && (
        <path
          d={pathData}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
          transform="translate(1, 1)"
        />
      )}

      {/* Invisible wider path for easier hover detection */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth={20}
        fill="none"
        style={{ cursor: canDisconnect ? "pointer" : "default" }}
        onMouseEnter={() => {
          if (canDisconnect) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (!isSelected) setIsHovered(false);
        }}
        onClick={() => {
          if (canDisconnect) {
            setIsSelected(!isSelected);
            setIsHovered(true);
          }
        }}
      />

      {/* Main connection line */}
      <path
        d={pathData}
        stroke={(isHovered || isSelected) && canDisconnect ? "#ef4444" : connectionColor}
        strokeWidth={(isHovered || isSelected) && canDisconnect ? 3 : 2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isSent ? 0.5 : 1}
        style={{
          transition: "stroke 0.15s, stroke-width 0.15s, opacity 0.15s",
          willChange: "d",
        }}
        pointerEvents="none"
      />

      {/* Connection points with professional look */}
      {/* Start point */}
      <g>
        <circle
          cx={startBounds ? startBounds.x + startBounds.width : startPoint.x}
          cy={startBounds ? startBounds.y + startBounds.height / 2 : startPoint.y}
          r={5}
          fill={connectionColor}
          opacity={isSent ? 0.5 : 1}
        />
        <circle
          cx={startBounds ? startBounds.x + startBounds.width : startPoint.x}
          cy={startBounds ? startBounds.y + startBounds.height / 2 : startPoint.y}
          r={2}
          fill="white"
        />
      </g>

      {/* End point */}
      <g>
        <circle
          cx={endBounds ? endBounds.x : endPoint.x}
          cy={endBounds ? endBounds.y + endBounds.height / 2 : endPoint.y}
          r={5}
          fill={(isHovered || isSelected) && canDisconnect ? "#ef4444" : connectionColor}
          opacity={isSent ? 0.5 : 1}
          style={{ transition: "fill 0.2s" }}
        />
        <circle
          cx={endBounds ? endBounds.x : endPoint.x}
          cy={endBounds ? endBounds.y + endBounds.height / 2 : endPoint.y}
          r={2}
          fill="white"
        />
      </g>

      {/* Disconnect button - only for unsent connections */}
      {(isHovered || isSelected) && canDisconnect && (
        <g
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            if (!isSelected) setIsHovered(false);
          }}
        >
          <foreignObject
            x={buttonPosition.x}
            y={buttonPosition.y}
            width={32}
            height={32}
            style={{ cursor: "pointer", pointerEvents: "all" }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                deleteConnection();
                setIsSelected(false);
                setIsHovered(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full h-full flex items-center justify-center"
            >
              <div className="bg-white rounded-full p-1.5 shadow-lg border border-gray-200 hover:bg-red-50 hover:border-red-400 transition-all transform hover:scale-110">
                <X className="text-red-500" size={14} strokeWidth={2.5} />
              </div>
            </div>
          </foreignObject>
        </g>
      )}
    </g>
  );
};

// Memoize the component with custom comparison
export const Connection = memo(ConnectionComponent, (prevProps, nextProps) => {
  // Only re-render if bounds actually changed
  return (
    prevProps.id === nextProps.id &&
    prevProps.startBounds?.x === nextProps.startBounds?.x &&
    prevProps.startBounds?.y === nextProps.startBounds?.y &&
    prevProps.startBounds?.width === nextProps.startBounds?.width &&
    prevProps.startBounds?.height === nextProps.startBounds?.height &&
    prevProps.endBounds?.x === nextProps.endBounds?.x &&
    prevProps.endBounds?.y === nextProps.endBounds?.y &&
    prevProps.endBounds?.width === nextProps.endBounds?.width &&
    prevProps.endBounds?.height === nextProps.endBounds?.height &&
    prevProps.layer === nextProps.layer
  );
});