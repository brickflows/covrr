"use client";

import React, { memo } from "react";

import { colorToCSS } from "@/lib/utils";
import { useStorage } from "@/liveblocks.config";
import { LayerType } from "@/types/canvas";

import { Ellipse } from "./eliipse";
import { Note } from "./note";
import { Rectangle } from "./rectangle";
import { Text } from "./text";
import { Path } from "./path";
import { Connection } from "./connection";
import { Message } from "./message";
import { Image } from "./image";

type LayerPreviewProps = {
  id: string;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor?: string;
  boardId?: string;
  onImageClick?: (imageUrl: string) => void;
  onImageLayerClick?: (layerId: string) => void;
};

const LayerPreviewComponent = ({ id, onLayerPointerDown, selectionColor, boardId, onImageClick, onImageLayerClick }: LayerPreviewProps) => {
    const layer = useStorage((root) => root.layers.get(id));
    const layers = useStorage((root) => root.layers);

    if (!layer) return null;

    switch (layer.type) {
      case LayerType.Path:
        return (
          <Path
            key={id}
            points={layer.points}
            onPointerDown={(e) => onLayerPointerDown(e, id)}
            x={layer.x}
            y={layer.y}
            fill={layer.fill ? colorToCSS(layer.fill) : "#000"}
            stroke={selectionColor}
          />
        );
      case LayerType.Note:
        return (
          <Note
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        );
      case LayerType.Text:
        return (
          <Text
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        );
      case LayerType.Ellipse:
        return (
          <Ellipse
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        );
      case LayerType.Rectangle:
        return (
          <Rectangle
            id={id}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
            layer={layer}
          />
        );
      case LayerType.Connection:
        const startLayer = layers.get(layer.startId);
        const endLayer = layers.get(layer.endId);

        if (!startLayer || !endLayer) return null;

        // Check if layers have x, y, width, height properties
        if (!("x" in startLayer && "y" in startLayer && "width" in startLayer && "height" in startLayer)) return null;
        if (!("x" in endLayer && "y" in endLayer && "width" in endLayer && "height" in endLayer)) return null;

        const startBounds = {
          x: startLayer.x,
          y: startLayer.y,
          width: startLayer.width,
          height: startLayer.height,
        };

        const endBounds = {
          x: endLayer.x,
          y: endLayer.y,
          width: endLayer.width,
          height: endLayer.height,
        };

        const startPoint = {
          x: startBounds.x + startBounds.width,
          y: startBounds.y + startBounds.height / 2,
        };

        const endPoint = {
          x: endBounds.x,
          y: endBounds.y + endBounds.height / 2,
        };

        return (
          <Connection
            id={id}
            layer={layer}
            startPoint={startPoint}
            endPoint={endPoint}
            startBounds={startBounds}
            endBounds={endBounds}
          />
        );
      case LayerType.Message:
        return (
          <Message
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
            boardId={boardId || ""}
            onImageClick={onImageClick}
          />
        );
      case LayerType.Image:
        return (
          <Image
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
            onImageClick={onImageLayerClick}
          />
        );
      default:
        console.warn("Unknown layer type");
        return null;
    }
};

// More aggressive memoization for LayerPreview
export const LayerPreview = memo(LayerPreviewComponent, (prevProps, nextProps) => {
  // Only re-render if the specific props that affect this layer changed
  return (
    prevProps.id === nextProps.id &&
    prevProps.selectionColor === nextProps.selectionColor &&
    prevProps.boardId === nextProps.boardId &&
    prevProps.onLayerPointerDown === nextProps.onLayerPointerDown &&
    prevProps.onImageClick === nextProps.onImageClick &&
    prevProps.onImageLayerClick === nextProps.onImageLayerClick
  );
});

LayerPreview.displayName = "LayerPreview";
