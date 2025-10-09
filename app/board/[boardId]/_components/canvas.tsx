"use client";

import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import React, { useCallback, useState, useMemo, useEffect, useRef } from "react";

import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import {
  colorToCSS,
  connectionIdToColor,
  findIntersectingLayersWithRectangle,
  penPointsToPathLayer,
  pointerEventToCanvasPoint,
  resizeBounds,
} from "@/lib/utils";
import {
  useCanRedo,
  useCanUndo,
  useHistory,
  useMutation,
  useOthersMapped,
  useSelf,
  useStorage,
} from "@/liveblocks.config";
import {
  type Camera,
  CanvasMode,
  type CanvasState,
  type Color,
  LayerType,
  type ImageLayer,
  type ImageOverlayLayer,
  type Point,
  type Side,
  type XYWH,
} from "@/types/canvas";

import { CursorsPresence } from "./cursors-presence";
import { Info } from "./info";
import { LayerPreview } from "./layer-preview";
import { Participants } from "./participants";
import { Path } from "./path";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { Toolbar } from "./toolbar";
import { ZoomControls } from "./zoom-controls";
import { BookDetailsPopover } from "./book-details-popover";
import { TextWidgetEditor } from "./text-widget-editor";
import { FontSelector } from "./font-selector";
import { FabricImageCanvas } from "./fabric-image-canvas";
import { FabricImageCanvasV2 } from "./fabric-image-canvas-v2";
import FabricImageCanvasV3 from "./fabric-image-canvas-v3";
import { X } from "lucide-react";

const MAX_LAYERS = 100;
const MULTISELECTION_THRESHOLD = 5;

type CanvasProps = {
  boardId: string;
};

export const Canvas = ({ boardId }: CanvasProps) => {
  const layerIds = useStorage((root) => root.layerIds);

  const pencilDraft = useSelf((me) => me.presence.pencilDraft);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useDisableScrollBounce();
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  // Prevent browser zoom on Ctrl+Wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Add the event listener with { passive: false } to allow preventDefault
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const insertLayer = useMutation(
    (
      { storage, setMyPresence },
      layerType:
        | LayerType.Ellipse
        | LayerType.Rectangle
        | LayerType.Text
        | LayerType.Note
        | LayerType.Message
        | LayerType.Image,
      position: Point,
      imageUrl?: string,
    ) => {
      const liveLayers = storage.get("layers");

      if (liveLayers.size >= MAX_LAYERS) return;

      const liveLayerIds = storage.get("layerIds");
      const layerId = nanoid();

      // Set different default sizes for Message and Image types
      const defaultSize = layerType === LayerType.Message ?
        { width: 280, height: 200 } :
        layerType === LayerType.Image ?
        { width: 400, height: 300 } :
        { width: 100, height: 100 };

      const layerData: any = {
        type: layerType,
        x: position.x,
        y: position.y,
        height: defaultSize.height,
        width: defaultSize.width,
        fill: lastUsedColor,
      };

      // Add Message-specific fields
      if (layerType === LayerType.Message) {
        layerData.images = [];
        layerData.value = "";
        layerData.negativePrompt = "";
      }

      // Add Image-specific fields
      if (layerType === LayerType.Image && imageUrl) {
        layerData.imageUrl = imageUrl;
        layerData.textWidgets = [];
      }

      const layer = new LiveObject(layerData);

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      setCanvasState({ mode: CanvasMode.None });
    },
    [lastUsedColor],
  );

  const insertConnection = useMutation(
    ({ storage }, startId: string, endId: string, startPoint: Point, endPoint: Point) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) return;

      const liveLayerIds = storage.get("layerIds");
      const layerId = nanoid();
      const layer = new LiveObject({
        type: LayerType.Connection,
        startId,
        endId,
        startPoint,
        endPoint,
        fill: lastUsedColor,
      } as any);

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer as any);

      setCanvasState({ mode: CanvasMode.None });
    },
    [lastUsedColor],
  );

  const onConnectionStart = useCallback(
    (layerId: string, point: { x: number; y: number }) => {
      // The point passed is already the left side position from SelectionBox
      // We'll use the right side as the starting point
      setCanvasState({
        mode: CanvasMode.Connecting,
        startLayerId: layerId,
        startPoint: point,
        currentPoint: point,
      });
    },
    [],
  );

  const translateSelectedLayers = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) return;

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };

      const liveLayers = storage.get("layers");

      for (const id of self.presence.selection) {
        const layer = liveLayers.get(id);

        if (layer) {
          const layerData = layer.toObject();
          // Only update layers that have x and y properties (not ConnectionLayer)
          if ("x" in layerData && "y" in layerData) {
            layer.update({
              x: layerData.x + offset.x,
              y: layerData.y + offset.y,
            });
          }
        }
      }

      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState],
  );

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  const updateSelectionNet = useMutation(
    ({ storage, setMyPresence }, current: Point, origin: Point) => {
      const layers = storage.get("layers").toImmutable();
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });

      const ids = findIntersectingLayersWithRectangle(
        layerIds,
        layers,
        origin,
        current,
      );

      setMyPresence({ selection: ids });
    },
    [layerIds],
  );

  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    if (
      Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) >
      MULTISELECTION_THRESHOLD
    ) {
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });
    }
  }, []);

  const continueDrawing = useMutation(
    ({ self, setMyPresence }, point: Point, e: React.PointerEvent) => {
      const { pencilDraft } = self.presence;

      if (
        canvasState.mode !== CanvasMode.Pencil ||
        e.buttons !== 1 ||
        pencilDraft == null
      )
        return;

      setMyPresence({
        cursor: point,
        pencilDraft:
          pencilDraft.length === 1 &&
          pencilDraft[0][0] === point.x &&
          pencilDraft[0][1] === point.y
            ? pencilDraft
            : [...pencilDraft, [point.x, point.y, e.pressure]],
      });
    },
    [canvasState.mode],
  );

  const insertPath = useMutation(
    ({ storage, self, setMyPresence }) => {
      const liveLayers = storage.get("layers");
      const { pencilDraft } = self.presence;

      if (
        pencilDraft == null ||
        pencilDraft.length < 2 ||
        liveLayers.size >= MAX_LAYERS
      ) {
        setMyPresence({ pencilDraft: null });
        return;
      }

      const id = nanoid();
      liveLayers.set(
        id,
        new LiveObject(penPointsToPathLayer(pencilDraft, lastUsedColor)),
      );

      const liveLayerIds = storage.get("layerIds");
      liveLayerIds.push(id);

      setMyPresence({ pencilDraft: null });
      setCanvasState({ mode: CanvasMode.Pencil });
    },
    [lastUsedColor],
  );

  const startDrawing = useMutation(
    ({ setMyPresence }, point: Point, pressure: number) => {
      setMyPresence({
        pencilDraft: [[point.x, point.y, pressure]],
        penColor: lastUsedColor,
      });
    },
    [lastUsedColor],
  );

  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) return;

      const bounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point,
      );

      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(self.presence.selection[0]);

      if (layer) layer.update(bounds);
    },
    [canvasState],
  );

  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      history.pause();

      setCanvasState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
      });
    },
    [history],
  );

  const handleZoomIn = useCallback(() => {
    setCamera((camera) => ({
      ...camera,
      scale: Math.min(camera.scale * 1.2, 5),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCamera((camera) => ({
      ...camera,
      scale: Math.max(camera.scale * 0.8, 0.1),
    }));
  }, []);

  const handleResetZoom = useCallback(() => {
    setCamera((camera) => ({
      ...camera,
      scale: 1,
    }));
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    // Check if Ctrl or Cmd key is pressed for zooming
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();

      const scaleDelta = e.deltaY > 0 ? 0.95 : 1.05;

      // Calculate mouse position relative to canvas before state update
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      setCamera((camera) => {
        const newScale = Math.min(Math.max(camera.scale * scaleDelta, 0.1), 5);

        // Adjust camera position to zoom towards mouse position
        const scaleChange = newScale / camera.scale;
        const newX = mouseX - (mouseX - camera.x) * scaleChange;
        const newY = mouseY - (mouseY - camera.y) * scaleChange;

        return {
          x: newX,
          y: newY,
          scale: newScale
        };
      });
    } else {
      // Regular panning
      setCamera((camera) => ({
        ...camera,
        x: camera.x - e.deltaX,
        y: camera.y - e.deltaY,
      }));
    }
  }, []);

  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      e.preventDefault();

      const current = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      } else if (canvasState.mode === CanvasMode.Connecting) {
        setCanvasState({
          ...canvasState,
          currentPoint: current,
        });
      }

      setMyPresence({ cursor: current });
    },
    [
      startMultiSelection,
      updateSelectionNet,
      continueDrawing,
      canvasState,
      resizeSelectedLayer,
      camera,
      translateSelectedLayers,
    ],
  );

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({
      cursor: null,
    });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.Inserting) return;

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }

      setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState.mode, setCanvasState, startDrawing],
  );

  const onPointerUp = useMutation(
    ({ storage }, e) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (
        canvasState.mode === CanvasMode.None ||
        canvasState.mode === CanvasMode.Pressing
      ) {
        unselectLayers();
        setCanvasState({
          mode: CanvasMode.None,
        });
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPath();
      } else if (canvasState.mode === CanvasMode.Inserting) {
        insertLayer(canvasState.layerType, point);
      } else if (canvasState.mode === CanvasMode.Connecting) {
        // Find which layer we're over
        const layers = storage.get("layers");
        const layerIds = storage.get("layerIds").toArray();

        let endLayerId = null;
        for (let i = layerIds.length - 1; i >= 0; i--) {
          const layer = layers.get(layerIds[i]);
          if (layer && layer.get("type") !== LayerType.Connection) {
            const layerData = layer.toObject();
            if ("x" in layerData && "y" in layerData &&
                "width" in layerData && "height" in layerData) {
              const bounds = {
                x: layerData.x,
                y: layerData.y,
                width: layerData.width,
                height: layerData.height,
              };

              if (
                point.x >= bounds.x &&
                point.x <= bounds.x + bounds.width &&
                point.y >= bounds.y &&
                point.y <= bounds.y + bounds.height &&
                layerIds[i] !== canvasState.startLayerId
              ) {
                endLayerId = layerIds[i];
                break;
              }
            }
          }
        }

        if (endLayerId && canvasState.startLayerId) {
          const endLayer = layers.get(endLayerId);
          const startLayer = layers.get(canvasState.startLayerId);

          if (endLayer && startLayer) {
            // Check connection rules for messages
            if (endLayer.get("type") === LayerType.Message && startLayer.get("type") === LayerType.Message) {
              const endData = endLayer.toObject();
              const startData = startLayer.toObject();
              const endHasValue = "value" in endData ? endData.value : undefined;
              const startHasValue = "value" in startData ? startData.value : undefined;

              // Don't allow: sent -> sent OR unsent -> sent
              // Only allow: sent -> unsent OR unsent -> unsent
              if (endHasValue) {
                // Can't connect TO a sent message
                setCanvasState({
                  mode: CanvasMode.None,
                });
                return;
              }
            }

            // Connection endpoints: right side of start shape, left side of end shape
            const endData = endLayer.toObject();
            if ("x" in endData && "y" in endData && "height" in endData) {
              const endPoint = {
                x: endData.x,
                y: endData.y + endData.height / 2
              };

              insertConnection(
                canvasState.startLayerId,
                endLayerId,
                canvasState.startPoint,
                endPoint
              );
            }
          }
        }

        setCanvasState({ mode: CanvasMode.None });
      } else {
        setCanvasState({
          mode: CanvasMode.None,
        });
      }

      history.resume();
    },
    [
      setCanvasState,
      camera,
      canvasState,
      history,
      insertLayer,
      unselectLayers,
      insertPath,
      insertConnection,
    ],
  );

  const selections = useOthersMapped((other) => other.presence.selection);

  // Image panel state - simple approach with page state
  const [isImagePanelOpen, setIsImagePanelOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const lastValidImageUrlRef = useRef<string | null>(null);

  // Keep track of last valid image URL to prevent unmounting during temporary null states
  if (selectedImageUrl) {
    lastValidImageUrlRef.current = selectedImageUrl;
  }

  // Responsive panel width: 40% on large screens, max 50% on smaller screens
  const getInitialPanelWidth = () => {
    if (typeof window === 'undefined') return 600;
    const screenWidth = window.innerWidth;
    if (screenWidth <= 1200) {
      return Math.min(screenWidth * 0.5, screenWidth - 100); // 50% max on small screens
    }
    return Math.min(screenWidth * 0.4, screenWidth * 0.5); // 40% on large screens, max 50%
  };

  const [panelWidth, setPanelWidth] = useState(getInitialPanelWidth());
  const [isResizingPanel, setIsResizingPanel] = useState(false);

  // Text widgets state
  const [textWidgets, setTextWidgets] = useState<Array<{
    id: string;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: Color;
    fontSize?: number;
    fontWeight?: number;
    fontFamily?: string;
    letterSpacing?: number;
    lineHeight?: number;
    textAlign?: 'left' | 'center' | 'right';
    locked?: boolean;
    rotation?: number;
  }>>([]);

  const [selectedTextWidgetId, setSelectedTextWidgetId] = useState<string | null>(null);

  // Handle window resize to keep panel responsive
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      let newWidth;
      if (screenWidth <= 1200) {
        newWidth = Math.min(screenWidth * 0.5, screenWidth - 100); // 50% max on small screens
      } else {
        newWidth = Math.min(screenWidth * 0.4, screenWidth * 0.5); // 40% on large screens
      }
      setPanelWidth(newWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("selectedImageUrl changed:", selectedImageUrl);
  }, [selectedImageUrl]);

  // Handle panel resize
  useEffect(() => {
    if (!isResizingPanel) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      // Min width 300px, max width 50% of screen
      const minWidth = 300;
      const maxWidth = window.innerWidth * 0.5;
      setPanelWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizingPanel(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingPanel]);

  const onLayerPointerDown = useMutation(
    ({ self, setMyPresence, storage }, e: React.PointerEvent, layerId: string) => {
      if (
        canvasState.mode === CanvasMode.Pencil ||
        canvasState.mode === CanvasMode.Inserting
      )
        return;

      // Handle adding overlay to image
      if (canvasState.mode === CanvasMode.AddingOverlay) {
        const layers = storage.get("layers");
        const layer = layers.get(layerId);

        if (layer) {
          const layerData = layer.toObject();

          if (layerData.type === LayerType.Image) {
            const imageData = layerData as ImageLayer;

            // Create overlay layer with same dimensions as the image
            const liveLayerIds = storage.get("layerIds");
            const overlayId = nanoid();

            const liveLayer = new LiveObject<ImageOverlayLayer>({
              type: LayerType.ImageOverlay,
              x: imageData.x,
              y: imageData.y,
              height: imageData.height,
              width: imageData.width,
              fill: { r: 255, g: 255, b: 255 }, // Transparent white overlay
              parentImageId: layerId,
              isVisible: true,
              textWidgets: [],
            });

            liveLayerIds.push(overlayId);
            layers.set(overlayId, liveLayer);

            // Select the new overlay
            setMyPresence({ selection: [overlayId] }, { addToHistory: true });
            setCanvasState({ mode: CanvasMode.None });

            console.log("Created overlay:", overlayId, "for image:", layerId);
          } else {
            console.log("Clicked layer is not an image, type:", layerData.type);
          }
        }

        e.stopPropagation();
        return;
      }

      history.pause();
      e.stopPropagation();

      const point = pointerEventToCanvasPoint(e, camera);

      if (!self.presence.selection.includes(layerId)) {
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
      }

      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [setCanvasState, camera, history, canvasState.mode],
  );


  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for (const user of selections) {
      const [connectionId, selection] = user;

      for (const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
      }
    }

    return layerIdsToColorSelection;
  }, [selections]);

  const deleteLayers = useDeleteLayers();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "Escape":
          unselectLayers();
          setCanvasState({ mode: CanvasMode.None });
          break;
        case "z":
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey || e.altKey) history.redo();
            else history.undo();

            break;
          }
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [deleteLayers, history, unselectLayers, setCanvasState]);

  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none">
      <Info boardId={boardId} />
      <Participants />
      <BookDetailsPopover boardId={boardId} />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        canRedo={canRedo}
        canUndo={canUndo}
        undo={history.undo}
        redo={history.redo}
        onImagePanelToggle={() => setIsImagePanelOpen(!isImagePanelOpen)}
        isImagePanelOpen={isImagePanelOpen}
      />
      <SelectionTools
        camera={camera}
        setLastUsedColor={setLastUsedColor}
      />

      <ZoomControls
        scale={camera.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetZoom}
      />

      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {layerIds.map((layerId) => (
            <LayerPreview
              key={layerId}
              id={layerId}
              onLayerPointerDown={onLayerPointerDown}
              boardId={boardId}
              selectionColor={layerIdsToColorSelection[layerId]}
              onImageClick={(url) => setSelectedImage(url)}
              onImageSelect={(url) => setSelectedImageUrl(url)}
            />
          ))}
          <SelectionBox
            onResizeHandlePointerDown={onResizeHandlePointerDown}
            onConnectionStart={onConnectionStart}
          />
          {canvasState.mode === CanvasMode.SelectionNet &&
            canvasState.current != null && (
              <rect
                className="fill-blue-500/5 stroke-blue-500 stroke-1"
                x={Math.min(canvasState.origin.x, canvasState.current.x)}
                y={Math.min(canvasState.origin.y, canvasState.current.y)}
                width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                height={Math.abs(canvasState.origin.y - canvasState.current.y)}
              />
            )}
          {canvasState.mode === CanvasMode.Connecting &&
            canvasState.currentPoint != null && (
              <path
                d={`
                  M ${canvasState.startPoint.x} ${canvasState.startPoint.y}
                  L ${(canvasState.startPoint.x + canvasState.currentPoint.x) / 2} ${canvasState.startPoint.y}
                  L ${(canvasState.startPoint.x + canvasState.currentPoint.x) / 2} ${canvasState.currentPoint.y}
                  L ${canvasState.currentPoint.x} ${canvasState.currentPoint.y}
                `}
                stroke="#0066ff"
                strokeWidth={2}
                strokeDasharray="5,5"
                fill="none"
                opacity={0.7}
              />
            )}
          <CursorsPresence />
          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path
              points={pencilDraft}
              fill={colorToCSS(lastUsedColor)}
              x={0}
              y={0}
            />
          )}
        </g>
      </svg>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] p-4">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Right Image Inspection Panel */}
      {isImagePanelOpen && (
        <div
          className="fixed right-0 top-0 bottom-0 bg-gray-100 shadow-2xl z-50 flex"
          style={{ width: `${panelWidth}px` }}
        >
          {/* Resize Handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingPanel(true);
            }}
            style={{ background: isResizingPanel ? '#3b82f6' : 'transparent' }}
          />

          {/* Close button */}
          <button
            onClick={() => setIsImagePanelOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Fabric.js Image Editor - Full Width */}
          <div className="w-full h-full">
            {selectedImageUrl ? (
              <FabricImageCanvasV2 imageUrl={selectedImageUrl} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">Select an image on canvas</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
