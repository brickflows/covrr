"use client";

import { BringToFront, SendToBack, Trash2, Edit } from "lucide-react";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { useMutation, useSelf, useStorage } from "@/liveblocks.config";
import { LayerType, type Camera, type Color } from "@/types/canvas";

import { ColorPicker } from "./color-picker";

type SelectionToolsProps = {
  camera: Camera;
  setLastUsedColor: (color: Color) => void;
  onEditImage?: (layerId: string) => void;
};

export const SelectionTools = memo(
  ({ camera, setLastUsedColor, onEditImage }: SelectionToolsProps) => {
    const selection = useSelf((me) => me.presence.selection);

    // Check if any selected layer is a Message type
    const hasMessageSelected = useStorage((root) => {
      const layers = root.layers;
      return selection.some(id => {
        const layer = layers.get(id);
        return layer?.type === LayerType.Message;
      });
    });

    // Check if selected layer is an Image type (single selection only)
    const hasImageSelected = useStorage((root) => {
      if (selection.length !== 1) return false;
      const layers = root.layers;
      const layer = layers.get(selection[0]);
      return layer?.type === LayerType.Image;
    });

    const moveToFront = useMutation(
      ({ storage }) => {
        const liveLayerIds = storage.get("layerIds");
        const indices: number[] = [];

        const arr = liveLayerIds.toImmutable();

        for (let i = 0; i < arr.length; i++) {
          if (selection.includes(arr[i])) indices.push(i);
        }

        for (let i = indices.length - 1; i >= 0; i--) {
          liveLayerIds.move(
            indices[i],
            arr.length - 1 - (indices.length - 1 - i),
          );
        }
      },
      [selection],
    );

    const moveToBack = useMutation(
      ({ storage }) => {
        const liveLayerIds = storage.get("layerIds");
        const indices: number[] = [];

        const arr = liveLayerIds.toImmutable();

        for (let i = 0; i < arr.length; i++) {
          if (selection.includes(arr[i])) indices.push(i);
        }

        for (let i = 0; i < indices.length; i++) {
          liveLayerIds.move(indices[i], i);
        }
      },
      [selection],
    );

    const setFill = useMutation(
      ({ storage }, fill: Color) => {
        const liveLayers = storage.get("layers");
        setLastUsedColor(fill);

        selection.forEach((id) => {
          liveLayers.get(id)?.set("fill", fill);
        });
      },
      [selection, setLastUsedColor],
    );

    const deleteLayers = useDeleteLayers();

    const selectionBounds = useSelectionBounds();

    if (!selectionBounds) return null;

    const x = selectionBounds.width / 2 + selectionBounds.x + camera.x;
    const y = selectionBounds.y + camera.y;

    // For Message nodes, show delete button in top-right corner
    if (hasMessageSelected) {
      // Calculate position in screen coordinates, accounting for camera zoom
      const deleteX = (selectionBounds.x + selectionBounds.width) * camera.scale + camera.x;
      const deleteY = selectionBounds.y * camera.scale + camera.y;

      return (
        <div
          className="absolute p-1 rounded-md bg-white shadow-sm border flex select-none"
          style={{
            transform: `translate(${deleteX + 5}px, ${deleteY - 5}px)`,
          }}
        >
          <Hint label="Delete">
            <Button variant="board" size="icon" onClick={deleteLayers}>
              <Trash2 />
            </Button>
          </Hint>
        </div>
      );
    }

    // For Image nodes, show edit button
    if (hasImageSelected && onEditImage) {
      return (
        <div
          className="absolute p-3 rounded-xl bg-white shadow-sm border flex select-none"
          style={{
            transform: `translate(
              calc(${x}px - 50%),
              calc(${y - 16}px - 100%)
          )`,
          }}
        >
          <Hint label="Edit Image">
            <Button onClick={() => onEditImage(selection[0])} variant="board" size="icon">
              <Edit />
            </Button>
          </Hint>

          <div className="flex items-center pl-2 ml-2 border-l border-t-neutral-200">
            <Hint label="Delete">
              <Button variant="board" size="icon" onClick={deleteLayers}>
                <Trash2 />
              </Button>
            </Hint>
          </div>
        </div>
      );
    }

    // For other nodes, show full selection tools
    return (
      <div
        className="absolute p-3 rounded-xl bg-white shadow-sm border flex select-none"
        style={{
          transform: `translate(
            calc(${x}px - 50%),
            calc(${y - 16}px - 100%)
        )`,
        }}
      >
        <ColorPicker onChange={setFill} />

        <div className="flex flex-col gap-y-0.5">
          <Hint label="Bring to front">
            <Button onClick={moveToFront} variant="board" size="icon">
              <BringToFront />
            </Button>
          </Hint>
          <Hint label="Bring to back" side="bottom">
            <Button onClick={moveToBack} variant="board" size="icon">
              <SendToBack />
            </Button>
          </Hint>
        </div>

        <div className="flex items-center pl-2 ml-2 border-l border-t-neutral-200">
          <Hint label="Delete">
            <Button variant="board" size="icon" onClick={deleteLayers}>
              <Trash2 />
            </Button>
          </Hint>
        </div>
      </div>
    );
  },
);

SelectionTools.displayName = "SelectionTools";
