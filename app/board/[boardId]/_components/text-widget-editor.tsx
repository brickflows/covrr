"use client";

import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { X } from "lucide-react";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";

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

const calculateFontSize = (width: number, height: number, baseFontSize: number) => {
  const maxFontSize = 96;
  const minFontSize = 12;
  const scaleFactor = 0.5;
  const fontSizeBasedOnHeight = height * scaleFactor;
  const fontSizeBasedOnWidth = width * scaleFactor;

  return Math.max(
    minFontSize,
    Math.min(fontSizeBasedOnHeight, fontSizeBasedOnWidth, maxFontSize, baseFontSize)
  );
};

export const TextWidgetEditor = ({
  widgets,
  onUpdateWidget,
  onDeleteWidget,
  containerWidth,
  containerHeight,
}: TextWidgetEditorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {widgets.map((widget) => {
        const isSelected = selectedId === widget.id;
        const calculatedFontSize = calculateFontSize(widget.width, widget.height, widget.fontSize);

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
            <div
              className="relative w-full h-full group"
              style={{
                outline: isSelected ? "1px solid #3b82f6" : "none",
              }}
            >
              {/* Text Content - Canvas Style */}
              <ContentEditable
                html={widget.content || "Text"}
                onChange={(e: ContentEditableEvent) => {
                  onUpdateWidget(widget.id, { content: e.target.value });
                }}
                className="h-full w-full flex items-center justify-center text-center drop-shadow-md outline-none"
                style={{
                  fontSize: `${calculatedFontSize}px`,
                  color: widget.color,
                  fontFamily: widget.fontFamily,
                }}
              />

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
