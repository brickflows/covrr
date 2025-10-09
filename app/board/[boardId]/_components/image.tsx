import React from "react";
import { ImageLayer, TextWidget, LayerType } from "@/types/canvas";
import { useStorage } from "@/liveblocks.config";

interface ImageProps {
  id: string;
  layer: ImageLayer;
  onPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor?: string;
  onImageClick?: (layerId: string) => void;
  onImageSelect?: (imageUrl: string) => void;
}

export const Image = ({
  id,
  layer,
  onPointerDown,
  selectionColor,
  onImageClick,
  onImageSelect,
}: ImageProps) => {
  const { x, y, width, height, imageUrl, textWidgets = [] } = layer;

  // Check if this image has any overlays
  const hasOverlays = useStorage((root) => {
    const layers = root.layers;
    const layerIds = root.layerIds;

    for (const layerId of layerIds) {
      const currentLayer = layers.get(layerId);
      if (currentLayer && currentLayer.type === LayerType.ImageOverlay) {
        const overlayLayer = currentLayer as any;
        console.log("Found overlay layer:", layerId, "parent:", overlayLayer.parentImageId, "current image:", id);
        if (overlayLayer.parentImageId === id) {
          console.log("Image", id, "has overlays!");
          return true;
        }
      }
    }
    return false;
  });

  console.log("Image", id, "hasOverlays:", hasOverlays);

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => {
        console.log("Image clicked! URL:", imageUrl);
        onPointerDown(e, id);
        if (onImageSelect) {
          console.log("Calling onImageSelect with:", imageUrl);
          onImageSelect(imageUrl);
        } else {
          console.log("onImageSelect is not defined");
        }
      }}
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

        {/* Layer Indicator Dot */}
        {hasOverlays && (
          <div
            className="absolute top-2 right-2 w-3 h-3 bg-black rounded-full border-2 border-white shadow-md pointer-events-none"
            title="This image has layers"
          />
        )}
      </div>
    </foreignObject>
  );
};
