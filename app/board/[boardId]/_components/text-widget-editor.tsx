"use client";

import React, { useState } from "react";
import { Rnd } from "react-rnd";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { Kalam } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { BringToFront, SendToBack, Trash2 } from "lucide-react";
import { cn, colorToCSS } from "@/lib/utils";
import type { Color } from "@/types/canvas";

const font = Kalam({
  subsets: ["latin"],
  weight: ["400"],
});

type TextWidget = {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: Color;
};

type TextWidgetEditorProps = {
  widgets: TextWidget[];
  onUpdateWidget: (id: string, updates: Partial<TextWidget>) => void;
  onDeleteWidget: (id: string) => void;
  onColorChange: (id: string, color: Color) => void;
  containerWidth: number;
  containerHeight: number;
};

const calculateFontSize = (width: number, height: number) => {
  const maxFontSize = 96;
  const scaleFactor = 0.5;
  const fontSizeBasedOnHeight = height * scaleFactor;
  const fontSizeBasedOnWidth = width * scaleFactor;

  return Math.min(fontSizeBasedOnHeight, fontSizeBasedOnWidth, maxFontSize);
};

export const TextWidgetEditor = ({
  widgets,
  onUpdateWidget,
  onDeleteWidget,
  onColorChange,
  containerWidth,
  containerHeight,
}: TextWidgetEditorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {widgets.map((widget) => {
        const isSelected = selectedId === widget.id;
        const fontSize = calculateFontSize(widget.width, widget.height);

        return (
          <div key={widget.id} className="absolute pointer-events-auto">
            <Rnd
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
              onMouseDown={() => setSelectedId(widget.id)}
            >
              <div
                style={{
                  outline: isSelected ? `1px solid ${colorToCSS(widget.fill)}` : "none",
                }}
                className="h-full w-full"
              >
                <ContentEditable
                  html={widget.content || "Text"}
                  onChange={(e: ContentEditableEvent) => {
                    onUpdateWidget(widget.id, { content: e.target.value });
                  }}
                  className={cn(
                    "h-full w-full flex items-center justify-center text-center drop-shadow-md outline-none",
                    font.className
                  )}
                  style={{
                    fontSize: `${fontSize}px`,
                    color: colorToCSS(widget.fill),
                  }}
                />
              </div>
            </Rnd>

            {/* Selection Tools - Same as canvas */}
            {isSelected && (
              <div
                className="absolute p-3 rounded-xl bg-white shadow-sm border flex select-none"
                style={{
                  transform: `translate(calc(${widget.x}px - 50%), calc(${widget.y - 16}px - 100%))`,
                }}
              >
                <div className="flex items-center gap-x-0.5">
                  <Hint label="Bring to front">
                    <Button variant="board" size="icon">
                      <BringToFront />
                    </Button>
                  </Hint>
                  <Hint label="Send to back">
                    <Button variant="board" size="icon">
                      <SendToBack />
                    </Button>
                  </Hint>
                </div>
                <div className="flex items-center pl-2 ml-2 border-l border-neutral-200">
                  <Hint label="Delete">
                    <Button
                      variant="board"
                      size="icon"
                      onClick={() => onDeleteWidget(widget.id)}
                    >
                      <Trash2 />
                    </Button>
                  </Hint>
                </div>
                <div className="flex items-center pl-2 ml-2 border-l border-neutral-200">
                  <input
                    type="color"
                    value={colorToCSS(widget.fill)}
                    onChange={(e) => {
                      const hex = e.target.value;
                      const r = parseInt(hex.slice(1, 3), 16);
                      const g = parseInt(hex.slice(3, 5), 16);
                      const b = parseInt(hex.slice(5, 7), 16);
                      onColorChange(widget.id, { r, g, b });
                    }}
                    className="w-8 h-8 cursor-pointer border-none"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
