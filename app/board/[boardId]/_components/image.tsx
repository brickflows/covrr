import React from "react";
import { ImageLayer, TextWidget } from "@/types/canvas";

interface ImageProps {
  id: string;
  layer: ImageLayer;
  onPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor?: string;
  onImageClick?: (layerId: string) => void;
}

export const Image = ({
  id,
  layer,
  onPointerDown,
  selectionColor,
  onImageClick,
}: ImageProps) => {
  const { x, y, width, height, imageUrl, textWidgets = [] } = layer;

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => onPointerDown(e, id)}
      onClick={() => onImageClick?.(id)}
      style={{
        outline: selectionColor ? `2px solid ${selectionColor}` : "none",
        cursor: "pointer",
      }}
    >
      <div className="relative w-full h-full">
        {/* Base Image */}
        <img
          src={imageUrl}
          alt="Canvas Image"
          className="w-full h-full object-contain"
          draggable={false}
        />

        {/* Text Widgets Overlay */}
        {textWidgets.map((widget: TextWidget) => (
          <div
            key={widget.id}
            className="absolute select-none pointer-events-none"
            style={{
              left: `${(widget.x / width) * 100}%`,
              top: `${(widget.y / height) * 100}%`,
              fontSize: `${(widget.fontSize / width) * 100}%`,
              fontFamily: widget.fontFamily,
              fontWeight: widget.fontWeight,
              color: widget.color,
              transform: `rotate(${widget.rotation}deg)`,
              transformOrigin: "top left",
              textAlign: widget.textAlign,
              letterSpacing: `${widget.letterSpacing}px`,
              lineHeight: widget.lineHeight,
              whiteSpace: "pre-wrap",
            }}
          >
            {widget.content}
          </div>
        ))}

        {/* Selection Indicator */}
        {selectionColor && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: `2px solid ${selectionColor}`,
            }}
          />
        )}
      </div>
    </foreignObject>
  );
};
