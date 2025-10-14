import type { Layer, LayerType, MessageLayer } from "@/types/canvas";
import { LiveMap } from "@liveblocks/client";

type LayerMap = LiveMap<string, Layer> | Map<string, Layer>;

export function calculateLayerAbsolutePosition(
  layer: Layer & { parentImageId?: string; parentOverlayId?: string; relativeX?: number; relativeY?: number; relativeWidth?: number; relativeHeight?: number },
  layers: LayerMap
): { x: number; y: number; width: number; height: number } {
  // If layer doesn't have parent binding, return original position
  if (!layer.parentOverlayId || !layer.parentImageId) {
    return {
      x: (layer as any).x ?? 0,
      y: (layer as any).y ?? 0,
      width: (layer as any).width ?? 0,
      height: (layer as any).height ?? 0
    };
  }

  // Find the parent message layer
  const parentMessageLayer = layers.get(layer.parentImageId);
  if (!parentMessageLayer) {
    return {
      x: (layer as any).x ?? 0,
      y: (layer as any).y ?? 0,
      width: (layer as any).width ?? 0,
      height: (layer as any).height ?? 0
    };
  }

  const messageLayer = parentMessageLayer as any;

  // Find the overlay layer that contains this child
  let overlayLayer = null;
  let imageIndex = -1;

  if (messageLayer.generatedImageLayers) {
    for (const [idx, overlays] of Object.entries(messageLayer.generatedImageLayers)) {
      const found = (overlays as any[]).find((ol: any) => ol.id === layer.parentOverlayId);
      if (found) {
        overlayLayer = found;
        imageIndex = parseInt(idx);
        break;
      }
    }
  }

  if (!overlayLayer || imageIndex === -1) {
    return {
      x: (layer as any).x ?? 0,
      y: (layer as any).y ?? 0,
      width: (layer as any).width ?? 0,
      height: (layer as any).height ?? 0
    };
  }

  // Calculate image position relative to message
  const imageSizes = messageLayer.generatedImageSizes || [];
  const imageVisibility = messageLayer.generatedImageVisibility || [true, true, true, true];
  const currentImageSize = imageSizes[imageIndex] || { width: 240, height: 360 };

  // Calculate cumulative X offset for this image
  const xOffset = imageSizes.slice(0, imageIndex).reduce((sum: number, size: any, i: number) => {
    if (imageVisibility[i]) {
      return sum + (size?.width || 240) + 10;
    }
    return sum;
  }, 0);

  // Image position relative to message node
  const imageX = xOffset;
  const imageY = messageLayer.height + 10; // Below message node with 10px gap

  // Calculate absolute position using relative values (0-1 range) as percentages
  // relativeX and relativeY are normalized coordinates within the image bounds
  const absoluteX = messageLayer.x + imageX + ((layer.relativeX || 0) * currentImageSize.width);
  const absoluteY = messageLayer.y + imageY + 32 + ((layer.relativeY || 0) * currentImageSize.height); // +32 for title bar

  // Calculate absolute width and height from relative values
  const absoluteWidth = (layer.relativeWidth || 0) * currentImageSize.width || (layer as any).width;
  const absoluteHeight = (layer.relativeHeight || 0) * currentImageSize.height || (layer as any).height;

  return {
    x: absoluteX,
    y: absoluteY,
    width: absoluteWidth,
    height: absoluteHeight
  };
}
