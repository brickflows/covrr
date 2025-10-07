"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Download, Type, Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { TextWidget, ImageLayer } from "@/types/canvas";
import { nanoid } from "nanoid";
import { useMutation } from "@/liveblocks.config";

interface ImageEditorPanelProps {
  layerId: string;
  layer: ImageLayer;
  onClose: () => void;
}

const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
  "Impact",
  "Comic Sans MS",
  "Trebuchet MS",
  "Arial Black",
  "Palatino",
  "Garamond",
  "Bookman",
  "Avant Garde",
];

const FONT_WEIGHTS = [
  { label: "Thin", value: 100 },
  { label: "Light", value: 300 },
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semi Bold", value: 600 },
  { label: "Bold", value: 700 },
  { label: "Extra Bold", value: 800 },
  { label: "Black", value: 900 },
];

export const ImageEditorPanel = ({ layerId, layer, onClose }: ImageEditorPanelProps) => {
  const [textWidgets, setTextWidgets] = useState<TextWidget[]>(layer.textWidgets || []);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Update layer with text widgets
  const updateLayerWidgets = useMutation(
    ({ storage }, newWidgets: TextWidget[]) => {
      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(layerId);
      if (layer) {
        layer.update({
          textWidgets: newWidgets,
        });
      }
    },
    []
  );

  // Sync text widgets to liveblocks whenever they change
  useEffect(() => {
    updateLayerWidgets(textWidgets);
  }, [textWidgets, updateLayerWidgets]);

  // Calculate image size
  useEffect(() => {
    if (imageContainerRef.current) {
      const container = imageContainerRef.current;
      const rect = container.getBoundingClientRect();
      setImageSize({ width: rect.width, height: rect.height });
    }
  }, [layer.imageUrl]);

  const selectedWidget = textWidgets.find((w) => w.id === selectedWidgetId);

  const addTextWidget = () => {
    const newWidget: TextWidget = {
      id: nanoid(),
      content: "New Text",
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: "Arial",
      fontWeight: 400,
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
    if (selectedWidgetId === id) {
      setSelectedWidgetId(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, widgetId: string) => {
    e.preventDefault();
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
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width));
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height));

    updateWidget(selectedWidgetId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    if (!imageContainerRef.current) return;

    try {
      // Create a canvas element
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Load the image
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Calculate scale factors
        const scaleX = img.width / imageSize.width;
        const scaleY = img.height / imageSize.height;

        // Draw text widgets
        textWidgets.forEach((widget) => {
          ctx.save();

          // Scale positions
          const scaledX = widget.x * scaleX;
          const scaledY = widget.y * scaleY;
          const scaledFontSize = widget.fontSize * scaleX;

          // Apply transformations
          ctx.translate(scaledX, scaledY);
          ctx.rotate((widget.rotation * Math.PI) / 180);

          // Set text properties
          ctx.font = `${widget.fontWeight} ${scaledFontSize}px ${widget.fontFamily}`;
          ctx.fillStyle = widget.color;
          ctx.textAlign = widget.textAlign;

          // Draw text
          ctx.fillText(widget.content, 0, 0);
          ctx.restore();
        });

        // Download the canvas as image
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
    <div className="fixed right-0 top-0 bottom-0 w-[450px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5" />
          <h2 className="font-semibold text-lg">Text Editor</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image Preview with Text Widgets */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          ref={imageContainerRef}
          className="relative w-full bg-gray-100 rounded-lg overflow-hidden"
          style={{ aspectRatio: `${layer.width} / ${layer.height}` }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={layer.imageUrl}
            alt={layer.imageName || "Image"}
            className="w-full h-full object-contain"
            draggable={false}
          />

          {/* Text Widgets Overlay */}
          {textWidgets.map((widget) => (
            <div
              key={widget.id}
              className={`absolute cursor-move select-none ${
                selectedWidgetId === widget.id ? "ring-2 ring-blue-500" : ""
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
              }}
              onMouseDown={(e) => handleMouseDown(e, widget.id)}
              onClick={() => setSelectedWidgetId(widget.id)}
            >
              {widget.content}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="mt-4 space-y-4">
          {/* Add Text Button */}
          <button
            onClick={addTextWidget}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Text
          </button>

          {/* Widget Editor */}
          {selectedWidget && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Text Properties</h3>
                <button
                  onClick={() => deleteWidget(selectedWidget.id)}
                  className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Text Content
                </label>
                <textarea
                  value={selectedWidget.content}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, { content: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Font Family
                </label>
                <select
                  value={selectedWidget.fontFamily}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, { fontFamily: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {FONT_FAMILIES.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Font Size: {selectedWidget.fontSize}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="120"
                  value={selectedWidget.fontSize}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, { fontSize: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              {/* Font Weight */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Font Weight
                </label>
                <select
                  value={selectedWidget.fontWeight}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      fontWeight: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {FONT_WEIGHTS.map((weight) => (
                    <option key={weight.value} value={weight.value}>
                      {weight.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedWidget.color}
                    onChange={(e) =>
                      updateWidget(selectedWidget.id, { color: e.target.value })
                    }
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedWidget.color}
                    onChange={(e) =>
                      updateWidget(selectedWidget.id, { color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Text Align */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Text Align
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateWidget(selectedWidget.id, { textAlign: "left" })
                    }
                    className={`flex-1 py-2 px-3 rounded border ${
                      selectedWidget.textAlign === "left"
                        ? "bg-black text-white"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    <AlignLeft className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() =>
                      updateWidget(selectedWidget.id, { textAlign: "center" })
                    }
                    className={`flex-1 py-2 px-3 rounded border ${
                      selectedWidget.textAlign === "center"
                        ? "bg-black text-white"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    <AlignCenter className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() =>
                      updateWidget(selectedWidget.id, { textAlign: "right" })
                    }
                    className={`flex-1 py-2 px-3 rounded border ${
                      selectedWidget.textAlign === "right"
                        ? "bg-black text-white"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    <AlignRight className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Rotation: {selectedWidget.rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedWidget.rotation}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, { rotation: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              {/* Letter Spacing */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Letter Spacing: {selectedWidget.letterSpacing}px
                </label>
                <input
                  type="range"
                  min="-5"
                  max="20"
                  step="0.5"
                  value={selectedWidget.letterSpacing}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      letterSpacing: Number(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Line Height */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Line Height: {selectedWidget.lineHeight}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={selectedWidget.lineHeight}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      lineHeight: Number(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Download Button */}
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
