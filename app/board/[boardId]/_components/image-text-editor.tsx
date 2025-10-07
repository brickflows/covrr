"use client";

import React, { useState } from "react";
import { Plus, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { nanoid } from "nanoid";
import { useMutation } from "@/liveblocks.config";
import { TextWidget } from "@/types/canvas";

interface ImageTextEditorProps {
  layerId: string;
  textWidgets: TextWidget[];
}

const FONT_FAMILIES = ["Arial", "Helvetica", "Times New Roman", "Georgia", "Courier New", "Verdana", "Impact"];

export const ImageTextEditor = ({ layerId, textWidgets }: ImageTextEditorProps) => {
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

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

  const addTextWidget = () => {
    const newWidget: TextWidget = {
      id: nanoid(),
      content: "New Text",
      x: 50,
      y: 50,
      fontSize: 32,
      fontFamily: "Arial",
      fontWeight: 700,
      color: "#000000",
      rotation: 0,
      textAlign: "center",
      letterSpacing: 0,
      lineHeight: 1.2,
    };
    const newWidgets = [...textWidgets, newWidget];
    updateLayerWidgets(newWidgets);
    setSelectedWidgetId(newWidget.id);
  };

  const updateWidget = (id: string, updates: Partial<TextWidget>) => {
    const newWidgets = textWidgets.map((w) => (w.id === id ? { ...w, ...updates } : w));
    updateLayerWidgets(newWidgets);
  };

  const deleteWidget = (id: string) => {
    const newWidgets = textWidgets.filter((w) => w.id !== id);
    updateLayerWidgets(newWidgets);
    if (selectedWidgetId === id) setSelectedWidgetId(null);
  };

  const selectedWidget = textWidgets.find((w) => w.id === selectedWidgetId);

  return (
    <div className="absolute top-1/2 right-2 -translate-y-1/2 w-72 p-3 bg-white rounded-xl shadow-lg border max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4" />
          <span className="font-semibold text-sm">Text Editor</span>
        </div>
        <Hint label="Add Text">
          <Button onClick={addTextWidget} variant="board" size="icon">
            <Plus />
          </Button>
        </Hint>
      </div>

      {selectedWidget ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Editing Text</span>
            <button
              onClick={() => deleteWidget(selectedWidget.id)}
              className="p-1 hover:bg-red-100 rounded text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <div>
            <label className="block text-xs mb-1">Content</label>
            <textarea
              value={selectedWidget.content}
              onChange={(e) => updateWidget(selectedWidget.id, { content: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs mb-1">Font</label>
            <select
              value={selectedWidget.fontFamily}
              onChange={(e) => updateWidget(selectedWidget.id, { fontFamily: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1">Size: {selectedWidget.fontSize}px</label>
            <input
              type="range"
              min="12"
              max="80"
              value={selectedWidget.fontSize}
              onChange={(e) => updateWidget(selectedWidget.id, { fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs mb-1">Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedWidget.color}
                onChange={(e) => updateWidget(selectedWidget.id, { color: e.target.value })}
                className="w-10 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={selectedWidget.color}
                onChange={(e) => updateWidget(selectedWidget.id, { color: e.target.value })}
                className="flex-1 px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>
      ) : textWidgets.length > 0 ? (
        <div className="space-y-2">
          <span className="text-xs text-gray-600">Select a text widget:</span>
          {textWidgets.map((widget) => (
            <button
              key={widget.id}
              onClick={() => setSelectedWidgetId(widget.id)}
              className="w-full p-2 text-left border rounded hover:bg-gray-50 text-sm"
            >
              {widget.content.substring(0, 20)}{widget.content.length > 20 ? "..." : ""}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-xs">
          <Type className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>Click + to add text</p>
        </div>
      )}
    </div>
  );
};
