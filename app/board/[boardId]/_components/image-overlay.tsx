"use client";

import { useMutation } from "@/liveblocks.config";
import { ImageOverlayLayer } from "@/types/canvas";
import { colorToCSS } from "@/lib/utils";
import { MoreHorizontal, Download, Trash2 } from "lucide-react";
import { useState } from "react";

interface ImageOverlayProps {
  id: string;
  layer: ImageOverlayLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

export const ImageOverlay = ({
  id,
  layer,
  onPointerDown,
  selectionColor,
}: ImageOverlayProps) => {
  const { x, y, width, height, fill, isVisible } = layer;
  const [showMenu, setShowMenu] = useState(false);

  const deleteOverlay = useMutation(
    ({ storage }) => {
      const layers = storage.get("layers");
      const layerIds = storage.get("layerIds");

      layers.delete(id);

      const index = layerIds.indexOf(id);
      if (index !== -1) {
        layerIds.delete(index);
      }
    },
    []
  );

  const downloadImageWithOverlay = useMutation(
    ({ storage }) => {
      const layers = storage.get("layers");
      const parentLayer = layers.get(layer.parentImageId);

      if (!parentLayer) return;

      // Create a temporary canvas to combine image and overlay
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const parentData = parentLayer.toObject();
      if (!("imageUrl" in parentData)) return;

      canvas.width = width;
      canvas.height = height;

      // Load and draw the parent image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        // Draw the overlay (semi-transparent white)
        ctx.fillStyle = `rgba(${fill.r}, ${fill.g}, ${fill.b}, 0.3)`;
        ctx.fillRect(0, 0, width, height);

        // TODO: Draw text widgets on top

        // Download the combined image
        canvas.toBlob((blob) => {
          if (!blob) return;

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `image-with-overlay-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        });
      };

      img.src = (parentData as any).imageUrl;
    },
    [layer, width, height, fill]
  );

  if (!isVisible) return null;

  return (
    <g onPointerDown={(e) => onPointerDown(e, id)}>
      {/* Overlay rectangle */}
      <rect
        className="drop-shadow-md"
        style={{
          transform: `translate(${x}px, ${y}px)`,
          cursor: "move",
        }}
        x={0}
        y={0}
        width={width}
        height={height}
        strokeWidth={1}
        fill={colorToCSS(fill)}
        fillOpacity={0.3}
        stroke={selectionColor || "transparent"}
      />

      {/* Selection border */}
      {selectionColor && (
        <rect
          className="pointer-events-none"
          style={{
            transform: `translate(${x}px, ${y}px)`,
          }}
          x={0}
          y={0}
          width={width}
          height={height}
          strokeWidth={2}
          fill="transparent"
          stroke={selectionColor}
        />
      )}

      {/* 3-dot menu button */}
      {selectionColor && (
        <g>
          <foreignObject
            x={x + width - 40}
            y={y + 10}
            width={200}
            height={150}
          >
            <div className="relative w-full h-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="bg-white border border-gray-300 rounded-md p-1.5 hover:bg-gray-50 transition-colors shadow-md"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      downloadImageWithOverlay();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Download size={14} />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      deleteOverlay();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </foreignObject>
        </g>
      )}
    </g>
  );
};
