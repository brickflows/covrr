"use client";

import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { X } from "lucide-react";

type TextWidget = {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  fontFamily: string;
};

type TextWidgetEditorProps = {
  widgets: TextWidget[];
  onUpdateWidget: (id: string, updates: Partial<TextWidget>) => void;
  onDeleteWidget: (id: string) => void;
  containerWidth: number;
  containerHeight: number;
};

export const TextWidgetEditor = ({
  widgets,
  onUpdateWidget,
  onDeleteWidget,
  containerWidth,
  containerHeight,
}: TextWidgetEditorProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {widgets.map((widget) => {
        const isSelected = selectedId === widget.id;
        const isEditing = editingId === widget.id;

        return (
          <Rnd
            key={widget.id}
            size={{ width: widget.width, height: widget.height }}
            position={{ x: widget.x, y: widget.y }}
            onDragStop={(e, d) => {
              onUpdateWidget(widget.id, { x: d.x, y: d.y });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              onUpdateWidget(widget.id, {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                ...position,
              });
            }}
            bounds="parent"
            className="pointer-events-auto"
            onMouseDown={() => setSelectedId(widget.id)}
          >
            <div className="relative w-full h-full group">
              {/* Text Content with Selection Effect */}
              {isEditing ? (
                <textarea
                  value={widget.content}
                  onChange={(e) =>
                    onUpdateWidget(widget.id, { content: e.target.value })
                  }
                  onBlur={() => setEditingId(null)}
                  autoFocus
                  className="w-full h-full resize-none rounded p-2 focus:outline-none bg-white"
                  style={{
                    fontSize: `${widget.fontSize}px`,
                    color: widget.color,
                    fontFamily: widget.fontFamily,
                    border: "2px solid #3b82f6",
                    boxShadow: "0 0 0 1px #3b82f6",
                  }}
                />
              ) : (
                <div
                  onClick={() => setEditingId(widget.id)}
                  className="w-full h-full cursor-text p-2 rounded transition-all bg-white"
                  style={{
                    fontSize: `${widget.fontSize}px`,
                    color: widget.color,
                    fontFamily: widget.fontFamily,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    border: isSelected ? "2px solid #3b82f6" : "2px solid transparent",
                    boxShadow: isSelected ? "0 0 0 1px #3b82f6" : "none",
                  }}
                >
                  {widget.content || "Click to edit"}
                </div>
              )}

              {/* Delete button - same style as Message node but smaller */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteWidget(widget.id);
                }}
                className="absolute -top-2 -right-2 bg-white border-2 border-gray-300 rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:border-red-500 hover:bg-red-50 transition-all shadow-sm"
                style={{ width: "20px", height: "20px" }}
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          </Rnd>
        );
      })}
    </div>
  );
};
