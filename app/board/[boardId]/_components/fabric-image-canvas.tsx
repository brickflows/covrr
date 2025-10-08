"use client";

import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from "lucide-react";

type FabricImageCanvasProps = {
  imageUrl: string;
  onFontSelect?: (fontFamily: string) => void;
};

const FONT_SIZE_DEFAULT = 32;
const FONT_FAMILY_DEFAULT = "Arial";
const FILL_COLOR_DEFAULT = "#000000";

export const FabricImageCanvas = ({ imageUrl, onFontSelect }: FabricImageCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      preserveObjectStacking: true,
      controlsAboveOverlay: true,
    });

    fabricCanvasRef.current = canvas;

    // Load background image
    fabric.Image.fromURL(imageUrl, (img) => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      // Calculate scale to fit image
      const scaleX = containerWidth / (img.width || 1);
      const scaleY = containerHeight / (img.height || 1);
      const scale = Math.min(scaleX, scaleY);

      img.set({
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });

      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      canvas.setWidth(containerWidth);
      canvas.setHeight(containerHeight);
    });

    // Selection events
    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  const addText = (text: string = "Your text here", options: any = {}) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const textbox = new fabric.Textbox(text, {
      left: 100,
      top: 100,
      fontSize: options.fontSize || FONT_SIZE_DEFAULT,
      fontFamily: options.fontFamily || FONT_FAMILY_DEFAULT,
      fill: options.fill || FILL_COLOR_DEFAULT,
      width: 250,
      ...options,
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
  };

  const changeFontSize = (fontSize: number) => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();

    if (activeObject && activeObject.type === "textbox") {
      (activeObject as fabric.Textbox).set({ fontSize });
      canvas?.renderAll();
    }
  };

  const changeFontFamily = (fontFamily: string) => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();

    if (activeObject && activeObject.type === "textbox") {
      (activeObject as fabric.Textbox).set({ fontFamily });
      canvas?.renderAll();
    }
  };

  const changeFontWeight = (fontWeight: string | number) => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();

    if (activeObject && activeObject.type === "textbox") {
      (activeObject as fabric.Textbox).set({ fontWeight });
      canvas?.renderAll();
    }
  };

  const changeFillColor = (color: string) => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();

    if (activeObject) {
      activeObject.set({ fill: color });
      canvas?.renderAll();
    }
  };

  const changeTextAlign = (align: string) => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();

    if (activeObject && activeObject.type === "textbox") {
      (activeObject as fabric.Textbox).set({ textAlign: align });
      canvas?.renderAll();
    }
  };

  const toggleFontStyle = (style: 'italic' | 'underline' | 'bold') => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject() as fabric.Textbox;

    if (!activeObject || activeObject.type !== "textbox") return;

    if (style === 'italic') {
      activeObject.set({ fontStyle: activeObject.fontStyle === 'italic' ? 'normal' : 'italic' });
    } else if (style === 'underline') {
      activeObject.set({ underline: !activeObject.underline });
    } else if (style === 'bold') {
      const currentWeight = activeObject.fontWeight;
      activeObject.set({ fontWeight: currentWeight === 'bold' || currentWeight === 700 ? 'normal' : 'bold' });
    }

    canvas?.renderAll();
  };

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();

    if (activeObject) {
      canvas?.remove(activeObject);
      canvas?.renderAll();
    }
  };

  const bringToFront = () => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();

    if (activeObject) {
      canvas?.bringToFront(activeObject);
      canvas?.renderAll();
    }
  };

  const sendToBack = () => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();

    if (activeObject) {
      canvas?.sendToBack(activeObject);
      canvas?.renderAll();
    }
  };

  const textObj = selectedObject?.type === "textbox" ? selectedObject as fabric.Textbox : null;

  return (
    <div className="flex h-full w-full">
      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 relative bg-gray-100">
        <canvas ref={canvasRef} />
      </div>

      {/* Properties Panel */}
      <div className="bg-white border-l overflow-y-auto p-4" style={{ width: '280px' }}>
        <button
          onClick={() => addText()}
          className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mb-4"
        >
          + Add Text
        </button>

        {textObj && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Text Properties</h3>

            {/* Font Size */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Font Size: {textObj.fontSize || 32}
              </label>
              <input
                type="range"
                min="12"
                max="120"
                value={textObj.fontSize || 32}
                onChange={(e) => changeFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Font Family</label>
              <select
                value={textObj.fontFamily || "Arial"}
                onChange={(e) => changeFontFamily(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
              </select>
            </div>

            {/* Text Align */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Text Align</label>
              <div className="flex gap-2">
                <button
                  onClick={() => changeTextAlign("left")}
                  className={`flex-1 py-2 px-3 rounded border ${
                    textObj.textAlign === "left" ? "bg-purple-600 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  <AlignLeft size={16} className="mx-auto" />
                </button>
                <button
                  onClick={() => changeTextAlign("center")}
                  className={`flex-1 py-2 px-3 rounded border ${
                    textObj.textAlign === "center" ? "bg-purple-600 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  <AlignCenter size={16} className="mx-auto" />
                </button>
                <button
                  onClick={() => changeTextAlign("right")}
                  className={`flex-1 py-2 px-3 rounded border ${
                    textObj.textAlign === "right" ? "bg-purple-600 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  <AlignRight size={16} className="mx-auto" />
                </button>
              </div>
            </div>

            {/* Font Styles */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Font Style</label>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleFontStyle("bold")}
                  className={`flex-1 py-2 px-3 rounded border ${
                    textObj.fontWeight === "bold" || textObj.fontWeight === 700
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <Bold size={16} className="mx-auto" />
                </button>
                <button
                  onClick={() => toggleFontStyle("italic")}
                  className={`flex-1 py-2 px-3 rounded border ${
                    textObj.fontStyle === "italic" ? "bg-purple-600 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  <Italic size={16} className="mx-auto" />
                </button>
                <button
                  onClick={() => toggleFontStyle("underline")}
                  className={`flex-1 py-2 px-3 rounded border ${
                    textObj.underline ? "bg-purple-600 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  <Underline size={16} className="mx-auto" />
                </button>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Color</label>
              <input
                type="color"
                value={typeof textObj.fill === 'string' ? textObj.fill : "#000000"}
                onChange={(e) => changeFillColor(e.target.value)}
                className="w-full h-10 rounded border"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t space-y-2">
              <button
                onClick={bringToFront}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Bring to Front
              </button>
              <button
                onClick={sendToBack}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Send to Back
              </button>
              <button
                onClick={deleteSelected}
                className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
