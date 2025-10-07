"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Download, Trash2, Type, Palette, Layers } from "lucide-react";
import { TextWidget, ImageLayer } from "@/types/canvas";
import { nanoid } from "nanoid";
import { useMutation } from "@/liveblocks.config";

interface ImageEditorPanelProps {
  layerId: string;
  layer: ImageLayer;
  onClose: () => void;
}

const FONT_FAMILIES = [
  "Arial", "Helvetica", "Times New Roman", "Georgia", "Courier New",
  "Verdana", "Impact", "Comic Sans MS", "Trebuchet MS", "Arial Black",
];

const FONT_WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semi Bold", value: 600 },
  { label: "Bold", value: 700 },
  { label: "Extra Bold", value: 800 },
];

type FeatureTab = "text" | "color" | "composition";

export const ImageEditorPanel = ({ layerId, layer, onClose }: ImageEditorPanelProps) => {
  const [textWidgets, setTextWidgets] = useState<TextWidget[]>(layer.textWidgets || []);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<FeatureTab>("text");
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const updateLayerWidgets = useMutation(
    ({ storage }, newWidgets: TextWidget[]) => {
      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(layerId);
      if (layer) {
        layer.update({ textWidgets: newWidgets });
      }
    },
    []
  );

  useEffect(() => {
    updateLayerWidgets(textWidgets);
  }, [textWidgets, updateLayerWidgets]);

  useEffect(() => {
    if (imageContainerRef.current) {
      const updateSize = () => {
        const rect = imageContainerRef.current!.getBoundingClientRect();
        setImageSize({ width: rect.width, height: rect.height });
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  const selectedWidget = textWidgets.find((w) => w.id === selectedWidgetId);

  const addTextWidget = () => {
    const newWidget: TextWidget = {
      id: nanoid(),
      content: "New Text",
      x: imageSize.width / 2 - 50,
      y: imageSize.height / 2 - 20,
      fontSize: 32,
      fontFamily: "Arial",
      fontWeight: 700,
      color: "#000000",
      rotation: 0,
      textAlign: "center",
      letterSpacing: 0,
      lineHeight: 1.2,
    };
    setTextWidgets([...textWidgets, newWidget]);
    setSelectedWidgetId(newWidget.id);
  };

  const updateWidget = (id: string, updates: Partial<TextWidget>) => {
    setTextWidgets(textWidgets.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const deleteWidget = (id: string) => {
    setTextWidgets(textWidgets.filter((w) => w.id !== id));
    if (selectedWidgetId === id) setSelectedWidgetId(null);
  };

  const handleMouseDown = (e: React.MouseEvent, widgetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const widget = textWidgets.find((w) => w.id === widgetId);
    if (!widget || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - widget.x;
    const offsetY = e.clientY - rect.top - widget.y;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    setSelectedWidgetId(widgetId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedWidgetId || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 50));
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 20));

    updateWidget(selectedWidgetId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    if (!imageContainerRef.current) return;

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const scaleX = img.width / imageSize.width;
        const scaleY = img.height / imageSize.height;

        textWidgets.forEach((widget) => {
          ctx.save();
          const scaledX = widget.x * scaleX;
          const scaledY = widget.y * scaleY;
          const scaledFontSize = widget.fontSize * scaleX;

          ctx.translate(scaledX, scaledY);
          ctx.rotate((widget.rotation * Math.PI) / 180);
          ctx.font = `${widget.fontWeight} ${scaledFontSize}px ${widget.fontFamily}`;
          ctx.fillStyle = widget.color;
          ctx.textAlign = widget.textAlign;
          ctx.fillText(widget.content, 0, 0);
          ctx.restore();
        });

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${layer.imageName || "styled-image"}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      };

      img.src = layer.imageUrl;
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full bg-white z-50 flex">
      {/* LEFT SECTION - Full Height Image Preview */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h2 className="font-semibold text-lg">Image Editor</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-8 flex items-center justify-center">
          <div
            ref={imageContainerRef}
            className="relative max-w-full max-h-full"
            style={{ aspectRatio: `${layer.width} / ${layer.height}` }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={layer.imageUrl}
              alt=""
              className="w-full h-full object-contain select-none"
              draggable={false}
            />

            {textWidgets.map((widget) => (
              <div
                key={widget.id}
                className={`absolute cursor-move select-none transition-shadow ${
                  selectedWidgetId === widget.id
                    ? "ring-2 ring-blue-500 shadow-lg"
                    : "hover:ring-1 hover:ring-gray-400"
                }`}
                style={{
                  left: `${widget.x}px`,
                  top: `${widget.y}px`,
                  fontSize: `${widget.fontSize}px`,
                  fontFamily: widget.fontFamily,
                  fontWeight: widget.fontWeight,
                  color: widget.color,
                  transform: `rotate(${widget.rotation}deg)`,
                  transformOrigin: "top left",
                  textAlign: widget.textAlign,
                  letterSpacing: `${widget.letterSpacing}px`,
                  lineHeight: widget.lineHeight,
                  whiteSpace: "pre-wrap",
                  padding: "4px",
                }}
                onMouseDown={(e) => handleMouseDown(e, widget.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWidgetId(widget.id);
                }}
              >
                {widget.content}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION - Feature Controls */}
      <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("text")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "text"
                ? "text-black border-b-2 border-black bg-gray-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Type className="w-4 h-4" />
            Text
          </button>
          <button
            onClick={() => setActiveTab("color")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "color"
                ? "text-black border-b-2 border-black bg-gray-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Palette className="w-4 h-4" />
            Color
          </button>
          <button
            onClick={() => setActiveTab("composition")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "composition"
                ? "text-black border-b-2 border-black bg-gray-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            Composition
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "text" && (
            <div className="space-y-4">
              <button
                onClick={addTextWidget}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Text
              </button>

              {selectedWidget ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Text Properties</h3>
                    <button
                      onClick={() => deleteWidget(selectedWidget.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={selectedWidget.content}
                      onChange={(e) => updateWidget(selectedWidget.id, { content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Font</label>
                    <select
                      value={selectedWidget.fontFamily}
                      onChange={(e) => updateWidget(selectedWidget.id, { fontFamily: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      {FONT_FAMILIES.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Size: {selectedWidget.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={selectedWidget.fontSize}
                      onChange={(e) => updateWidget(selectedWidget.id, { fontSize: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                    <select
                      value={selectedWidget.fontWeight}
                      onChange={(e) => updateWidget(selectedWidget.id, { fontWeight: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      {FONT_WEIGHTS.map((w) => (
                        <option key={w.value} value={w.value}>{w.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={selectedWidget.color}
                        onChange={(e) => updateWidget(selectedWidget.id, { color: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedWidget.color}
                        onChange={(e) => updateWidget(selectedWidget.id, { color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Rotation: {selectedWidget.rotation}°
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={selectedWidget.rotation}
                      onChange={(e) => updateWidget(selectedWidget.id, { rotation: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 text-sm">
                  <Type className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Add text or select existing text to edit</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "color" && (
            <div className="text-center py-12 text-gray-500 text-sm">
              <Palette className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Color adjustments coming soon</p>
            </div>
          )}

          {activeTab === "composition" && (
            <div className="text-center py-12 text-gray-500 text-sm">
              <Layers className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Composition tools coming soon</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Image
          </button>
        </div>
      </div>
    </div>
  );
};
