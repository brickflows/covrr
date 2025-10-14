"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Textbox as FabricTextbox, Canvas as FabricCanvas } from "fabric/fabric-impl";
import { loadFont } from "@/app/lib/font-loader";

declare global {
  interface Window {
    fabric: any;
  }
}

type ExtendedTextbox = FabricTextbox & {
  _frameWidth?: number;
  _frameHeight?: number;
  _clipWidth?: number;
  _clipHeight?: number;
  _originalFontSize?: number;
  layer_id?: string;
};

interface FabricOverlayCanvasProps {
  overlayId: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  isActive: boolean;
  maskMode?: boolean;
  brushSize?: number;
  onTextSelect?: (textbox: ExtendedTextbox | null) => void;
  onCanvasReady?: (canvas: FabricCanvas) => void;
  initialFabricState?: any; // Initial Fabric.js JSON state to load
  onFabricStateChange?: (state: any) => void; // Callback when canvas state changes
}

export const FabricOverlayCanvas = React.forwardRef<any, FabricOverlayCanvasProps>(
  ({ overlayId, imageUrl, imageWidth, imageHeight, isActive, maskMode = false, brushSize = 20, onTextSelect, onCanvasReady, initialFabricState, onFabricStateChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);
    const [fabricLoaded, setFabricLoaded] = useState(false);
    const initializedRef = useRef(false);
    const imageUrlRef = useRef(imageUrl);
    const historyRef = useRef<any[]>([]);
    const historyStepRef = useRef(0);
    const isUndoRedoRef = useRef(false);

    // Removed manual scaling due to mouse coordinate issues
    // Using Fabric's built-in retina scaling instead for better compatibility

    // Load Fabric.js
    useEffect(() => {
      if (window.fabric) {
        setFabricLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js";
      script.onload = () => setFabricLoaded(true);
      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }, []);

    // Initialize Fabric canvas ONCE
    useEffect(() => {
      if (!fabricLoaded || !canvasRef.current || !window.fabric || initializedRef.current) return;

      initializedRef.current = true;
      const fabric = window.fabric;

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: imageWidth,
        height: imageHeight,
        preserveObjectStacking: true,
        controlsAboveOverlay: true,
        selectionColor: "transparent",
        selectionBorderColor: "#3b82f6",
        selectionLineWidth: 2,
        renderOnAddRemove: true,
        enableRetinaScaling: true, // Use Fabric's built-in retina support
      });

      // Force higher pixel density for crisp text rendering at all zoom levels
      // Use 3x or device pixel ratio (whichever is higher) for maximum quality
      const devicePixelRatio = window.devicePixelRatio || 1;
      const pixelRatio = Math.max(3, devicePixelRatio); // Minimum 3x for crisp text
      const canvasEl = canvas.getElement();
      const ctx = canvas.getContext();

      // Set actual canvas resolution to high DPI
      canvasEl.width = imageWidth * pixelRatio;
      canvasEl.height = imageHeight * pixelRatio;

      // But display at original size via CSS
      canvasEl.style.width = `${imageWidth}px`;
      canvasEl.style.height = `${imageHeight}px`;

      // Scale the context to match and enable better text rendering
      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.textRendering = 'optimizeLegibility';

      // Tell Fabric about the pixel ratio so it handles coordinates correctly
      canvas.setDimensions({ width: imageWidth, height: imageHeight });

      // Set global control styles
      fabric.Object.prototype.set({
        borderColor: "#3b82f6",
        cornerColor: "#ffffff",
        cornerStrokeColor: "#3b82f6",
        cornerStyle: "rect",
        cornerSize: 8,
        transparentCorners: false,
        borderScaleFactor: 1,
        padding: 0,
      });

      fabricCanvasRef.current = canvas;

      // Load background image with error handling
      fabric.Image.fromURL(
        imageUrl,
        (img: any) => {
          if (!img || !fabricCanvasRef.current) return;

          // Scale to cover the entire canvas
          const scaleX = imageWidth / (img.width || 1);
          const scaleY = imageHeight / (img.height || 1);
          const scale = Math.max(scaleX, scaleY); // Use max for cover, min for contain

          img.set({
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center',
            left: imageWidth / 2,
            top: imageHeight / 2,
          });

          fabricCanvasRef.current.setBackgroundImage(img, () => {
            fabricCanvasRef.current?.requestRenderAll();
          });
        },
        { crossOrigin: 'anonymous' }
      );

      // Track which control is being used
      let currentControl: string | null = null;
      let isApplyingTransform = false;

      // Selection handlers
      canvas.on("selection:created", (e: any) => {
        const selected = (e.selected?.[0] as ExtendedTextbox | undefined) ?? null;
        // Only trigger onTextSelect for textbox objects
        if (selected && selected.type === "textbox") {
          onTextSelect?.(selected);
        } else {
          onTextSelect?.(null);
        }
      });

      canvas.on("selection:updated", (e: any) => {
        const selected = (e.selected?.[0] as ExtendedTextbox | undefined) ?? null;
        // Only trigger onTextSelect for textbox objects
        if (selected && selected.type === "textbox") {
          onTextSelect?.(selected);
        } else {
          onTextSelect?.(null);
        }
      });

      canvas.on("selection:cleared", () => {
        onTextSelect?.(null);
      });

      // Handle text changes to update properties panel
      canvas.on("text:changed", (e: any) => {
        const textbox = e.target as ExtendedTextbox | undefined;
        if (textbox && textbox.type === "textbox") {
          onTextSelect?.(textbox);
        }
      });

      // Track which control is being dragged
      canvas.on("object:scaling", (e: any) => {
        const obj = e.target as FabricTextbox | undefined;
        if (obj && obj.type === "textbox") {
          const transform = (e as any).transform as { corner?: string } | undefined;
          if (transform?.corner && !currentControl) {
            currentControl = transform.corner;
          }
        }
      });

      // Handle scaling/resizing transformations
      canvas.on("object:modified", (e: any) => {
        if (isApplyingTransform) return;

        const obj = e.target as ExtendedTextbox | undefined;
        if (obj?.type !== "textbox") return;

        isApplyingTransform = true;

        const textbox = obj;
        const isCornerHandle = currentControl && ["tl", "tr", "bl", "br"].includes(currentControl);
        const isMiddleHandle = currentControl && ["ml", "mr"].includes(currentControl);

        const scaleX = textbox.scaleX ?? 1;
        const scaleY = textbox.scaleY ?? 1;
        const baseFontSize = textbox.fontSize ?? 16;
        const baseWidth = textbox.width ?? textbox.getScaledWidth();
        const baseHeight = textbox.height ?? textbox.getScaledHeight();

        try {
          if (scaleX !== 1 || scaleY !== 1) {
            if (isCornerHandle) {
              // Corner: scale both text and frame
              const scaleFactor = Math.max(scaleX, scaleY);
              const newFontSize = Math.round(baseFontSize * scaleFactor);
              const newWidth = baseWidth * scaleX;

              textbox.set("fontSize", newFontSize);
              textbox.set("width", newWidth);
              textbox.set("scaleX", 1);
              textbox.set("scaleY", 1);

              textbox._frameWidth = newWidth;
              textbox._frameHeight = baseHeight;
              textbox.clipPath = undefined;
            } else if (isMiddleHandle) {
              // Middle handles: resize frame only, preserve text size
              const newWidth = baseWidth * scaleX;

              if (!textbox._originalFontSize) {
                textbox._originalFontSize = baseFontSize;
              }

              textbox.set("width", newWidth);
              textbox.set("fontSize", textbox._originalFontSize ?? baseFontSize);
              textbox.set("scaleX", 1);
              textbox.set("scaleY", 1);

              textbox._frameWidth = newWidth;
              textbox._frameHeight = baseHeight;

              // Create clipping mask
              const clipRect = new fabric.Rect({
                left: -newWidth / 2,
                top: -baseHeight / 2,
                width: newWidth,
                height: baseHeight,
                absolutePositioned: true,
              });

              textbox.clipPath = clipRect;
            }
          }

          onTextSelect?.(textbox);
          canvas.requestRenderAll();
        } finally {
          currentControl = null;
          isApplyingTransform = false;
        }
      });

      canvas.on("mouse:up", () => {
        isApplyingTransform = false;
      });

      // Helper function to save canvas state
      const saveCanvasState = () => {
        if (isUndoRedoRef.current) {
          isUndoRedoRef.current = false;
          return;
        }

        const json = canvas.toJSON([
          "layer_id",
          "_frameWidth",
          "_frameHeight",
          "_clipWidth",
          "_clipHeight",
          "_originalFontSize",
          "fontFamily",
          "fontWeight",
          "fontStyle",
          "underline",
          "linethrough",
          "overline",
          "textDecoration"
        ]);

        // Add to history stack
        historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
        historyRef.current.push(JSON.stringify(json));
        historyStepRef.current = historyRef.current.length - 1;

        // Limit history to 50 steps
        if (historyRef.current.length > 50) {
          historyRef.current = historyRef.current.slice(-50);
          historyStepRef.current = historyRef.current.length - 1;
        }

        if (onFabricStateChange) {
          onFabricStateChange(json);
        }
      };

      // Save state whenever objects are added, modified, or removed
      canvas.on("object:added", saveCanvasState);
      canvas.on("object:modified", saveCanvasState);
      canvas.on("object:removed", saveCanvasState);
      canvas.on("text:changed", saveCanvasState);

      // Load initial state if provided - filter objects by layer_id
      if (initialFabricState && initialFabricState.objects && initialFabricState.objects.length > 0) {
        // Filter objects to only include those belonging to this layer
        const filteredObjects = initialFabricState.objects.filter((obj: any) => obj.layer_id === overlayId);

        const filteredState = {
          ...initialFabricState,
          objects: filteredObjects
        };

        // Extract all unique font families from the state and preload them
        const fontFamilies = new Set<string>();
        filteredObjects.forEach((obj: any) => {
          if (obj.type === 'textbox' && obj.fontFamily) {
            fontFamilies.add(obj.fontFamily);
          }
        });

        // Load all fonts before loading canvas state
        if (fontFamilies.size > 0) {
          Promise.all(Array.from(fontFamilies).map(loadFont))
            .then(() => {
              canvas.loadFromJSON(filteredState, () => {
                canvas.requestRenderAll();
                // Don't auto-select textboxes on load - wait for user interaction
              });
            })
            .catch((error) => {
              console.error('Error loading fonts:', error);
              // Load canvas anyway even if fonts fail
              canvas.loadFromJSON(filteredState, () => {
                canvas.requestRenderAll();
              });
            });
        } else {
          // No fonts to load, just load the canvas
          canvas.loadFromJSON(filteredState, () => {
            canvas.requestRenderAll();
            // Don't auto-select textboxes on load - wait for user interaction
          });
        }
      }

      // Save initial empty state to history
      const initialJson = canvas.toJSON([
        "layer_id",
        "_frameWidth",
        "_frameHeight",
        "_clipWidth",
        "_clipHeight",
        "_originalFontSize",
        "fontFamily",
        "fontWeight",
        "fontStyle",
        "underline",
        "linethrough",
        "overline",
        "textDecoration"
      ]);
      historyRef.current = [JSON.stringify(initialJson)];
      historyStepRef.current = 0;

      onCanvasReady?.(canvas);

      // Don't dispose on cleanup - keep canvas alive
      // Canvas will be disposed when component unmounts completely
    }, [fabricLoaded]); // Only depend on fabricLoaded, not dimensions

    // Define undo/redo functions at component level so they can be exposed
    const undo = useCallback(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || historyStepRef.current === 0) return;

      isUndoRedoRef.current = true;
      historyStepRef.current -= 1;
      const state = JSON.parse(historyRef.current[historyStepRef.current]);

      canvas.loadFromJSON(state, () => {
        canvas.requestRenderAll();
        if (onFabricStateChange) {
          onFabricStateChange(state);
        }
      });
    }, [onFabricStateChange]);

    const redo = useCallback(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || historyStepRef.current >= historyRef.current.length - 1) return;

      isUndoRedoRef.current = true;
      historyStepRef.current += 1;
      const state = JSON.parse(historyRef.current[historyStepRef.current]);

      canvas.loadFromJSON(state, () => {
        canvas.requestRenderAll();
        if (onFabricStateChange) {
          onFabricStateChange(state);
        }
      });
    }, [onFabricStateChange]);

    // Undo/Redo keyboard shortcuts
    useEffect(() => {
      if (!isActive) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Check if user is typing in an input or textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }

        // Undo: Ctrl+Z or Cmd+Z
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        }

        // Redo: Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y
        if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
          e.preventDefault();
          redo();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [isActive, undo, redo]);

    // Control pointer events based on isActive
    useEffect(() => {
      if (!canvasRef.current) return;
      canvasRef.current.style.pointerEvents = isActive ? "auto" : "none";

      // Clear text selection when layer becomes inactive
      if (!isActive) {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
        onTextSelect?.(null);
      }
    }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle mask mode toggling and brush size changes
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !window.fabric) return;

      if (maskMode) {
        // Enable drawing mode
        canvas.isDrawingMode = true;

        // Configure brush for mask drawing with dynamic size
        const brush = new window.fabric.PencilBrush(canvas);
        brush.color = '#FFFFFF'; // White for mask
        brush.width = brushSize;
        brush.shadow = new window.fabric.Shadow({
          blur: Math.max(3, brushSize * 0.15),
          offsetX: 0,
          offsetY: 0,
          color: 'rgba(0, 0, 0, 0.3)'
        });

        canvas.freeDrawingBrush = brush;

        // Change cursor to crosshair
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';

        // Deselect any selected objects
        canvas.discardActiveObject();
        canvas.requestRenderAll();

        // Listen for path creation to tag it with layer_id
        const handlePathCreated = (e: any) => {
          if (e.path) {
            e.path.set({
              layer_id: overlayId,
              selectable: false, // Make mask paths non-selectable
              evented: false // Don't respond to events
            });
          }
        };

        canvas.on('path:created', handlePathCreated);

        // Cleanup listener when mask mode is disabled
        return () => {
          canvas.off('path:created', handlePathCreated);
        };
      } else {
        // Disable drawing mode
        canvas.isDrawingMode = false;

        // Restore default cursors
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
      }
    }, [maskMode, brushSize, overlayId]);


    // Handle canvas resize when imageWidth or imageHeight props change
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !window.fabric) return;

      const oldWidth = canvas.getWidth();
      const oldHeight = canvas.getHeight();

      // Only resize if dimensions actually changed
      if (Math.abs(oldWidth - imageWidth) < 1 && Math.abs(oldHeight - imageHeight) < 1) {
        return;
      }

      // Calculate scale factors
      const scaleX = imageWidth / oldWidth;
      const scaleY = imageHeight / oldHeight;

      // Resize canvas
      canvas.setDimensions({ width: imageWidth, height: imageHeight });

      // Scale all objects proportionally
      canvas.getObjects().forEach((obj: any) => {
        obj.set({
          left: obj.left * scaleX,
          top: obj.top * scaleY,
          scaleX: obj.scaleX * scaleX,
          scaleY: obj.scaleY * scaleY,
        });
        obj.setCoords();
      });

      // Resize the background image
      const backgroundImage = canvas.backgroundImage;
      if (backgroundImage && typeof backgroundImage === 'object') {
        const img = backgroundImage as any;
        img.set({
          scaleX: imageWidth / (img.width || 1),
          scaleY: imageHeight / (img.height || 1),
          left: imageWidth / 2,
          top: imageHeight / 2,
        });
      }

      canvas.requestRenderAll();

      // Save the updated state after resizing
      if (onFabricStateChange) {
        const json = canvas.toJSON([
          "layer_id",
          "_frameWidth",
          "_frameHeight",
          "_clipWidth",
          "_clipHeight",
          "_originalFontSize",
          "fontFamily",
          "fontWeight",
          "fontStyle",
          "underline",
          "linethrough",
          "overline",
          "textDecoration"
        ]);
        onFabricStateChange(json);
      }
    }, [imageWidth, imageHeight, onFabricStateChange]);

    // Expose methods to parent
    React.useImperativeHandle(ref, () => ({
      addText: (text = "Add your text", options = {}) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !window.fabric) {
          console.error('Canvas or Fabric not ready');
          return;
        }

        try {
          const textbox = new window.fabric.Textbox(text, {
            left: imageWidth / 2 - 150,
            top: imageHeight / 2 - 20,
            fontSize: 40,
            fontFamily: "Arial",
            fill: "#FFFFFF",
            width: 300,
            fontWeight: "bold",
            splitByGrapheme: true,
            ...options,
          }) as ExtendedTextbox;

          // Disable top/bottom handles
          textbox.setControlsVisibility({
            mt: false,
            mb: false,
            ml: true,
            mr: true,
            tl: true,
            tr: true,
            bl: true,
            br: true,
          });

          textbox.layer_id = overlayId;

          canvas.add(textbox);
          canvas.setActiveObject(textbox);
          canvas.requestRenderAll();

          onTextSelect?.(textbox);
        } catch (error) {
          console.error('Error adding text to canvas:', error);
        }
      },
      getCanvas: () => fabricCanvasRef.current,
      getActiveTextbox: () => {
        const canvas = fabricCanvasRef.current;
        const activeObj = canvas?.getActiveObject();
        return activeObj?.type === "textbox" ? (activeObj as ExtendedTextbox) : null;
      },
      undo,
      redo,
      canUndo: () => historyStepRef.current > 0,
      canRedo: () => historyStepRef.current < historyRef.current.length - 1,
    }), [undo, redo, imageWidth, imageHeight, overlayId, onTextSelect]);

    if (!fabricLoaded) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
          <div className="text-white text-sm">Loading canvas...</div>
        </div>
      );
    }

    return (
      <div
        className="absolute inset-0"
        style={{ overflow: 'hidden' }}
      >
        <canvas ref={canvasRef} />
      </div>
    );
  }
);

FabricOverlayCanvas.displayName = "FabricOverlayCanvas";
