"use client";

import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { Trash2 } from "lucide-react";

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

  return (
    <div className="absolute inset-0 pointer-events-none">
      {widgets.map((widget) => (
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
        >
          <div className="relative w-full h-full group">
            {/* Text Content */}
            {editingId === widget.id ? (
              <textarea
                value={widget.content}
                onChange={(e) =>
                  onUpdateWidget(widget.id, { content: e.target.value })
                }
                onBlur={() => setEditingId(null)}
                autoFocus
                className="w-full h-full resize-none border-2 border-blue-500 rounded p-2 focus:outline-none"
                style={{
                  fontSize: `${widget.fontSize}px`,
                  color: widget.color,
                  fontFamily: widget.fontFamily,
                }}
              />
            ) : (
              <div
                onClick={() => setEditingId(widget.id)}
                className="w-full h-full cursor-text p-2 border-2 border-transparent hover:border-blue-300 rounded transition-colors"
                style={{
                  fontSize: `${widget.fontSize}px`,
                  color: widget.color,
                  fontFamily: widget.fontFamily,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {widget.content || "Click to edit"}
              </div>
            )}

            {/* Delete button - shows on hover */}
            <button
              onClick={() => onDeleteWidget(widget.id)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </Rnd>
      ))}
    </div>
  );
};
