import { shallow } from "@liveblocks/react";

import { useStorage, useSelf } from "@/liveblocks.config";
import type { Layer, XYWH } from "@/types/canvas";

type PositionedLayer = Extract<
  Layer,
  {
    x: number;
    y: number;
    width: number;
    height: number;
  }
>;

const isPositionedLayer = (layer: Layer): layer is PositionedLayer =>
  "x" in layer && "y" in layer && "width" in layer && "height" in layer;

const boundingBox = (layers: Layer[]): XYWH | null => {
  const positionedLayers = layers.filter(isPositionedLayer);

  const first = positionedLayers[0];

  if (!first) return null;

  let left = first.x;
  let right = first.x + first.width;
  let top = first.y;
  let bottom = first.y + first.height;

  for (let i = 1; i < positionedLayers.length; i++) {
    const { x, y, width, height } = positionedLayers[i];

    if (left > x) left = x;
    if (right < x + width) right = x + width;
    if (top > y) top = y;
    if (bottom < y + height) bottom = y + height;
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
};

export const useSelectionBounds = () => {
  const selection = useSelf((me) => me.presence.selection);

  return useStorage((root) => {
    const selectedLayers = selection
      .map((layerId) => root.layers.get(layerId)!)
      .filter(Boolean);

    return boundingBox(selectedLayers);
  }, shallow);
};
