"use client";

import React, { useState } from "react";
import { Rnd } from "react-rnd";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { Kalam } from "next/font/google";
import { Hint } from "@/components/hint";
import { BringToFront, SendToBack, Trash2 } from "lucide-react";
import { cn, colorToCSS } from "@/lib/utils";
import type { Color } from "@/types/canvas";
import { ColorPicker } from "./color-picker";

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
  onReorderWidget: (id: string, direction: "front" | "back") => void;
  onColorChange: (id: string, color: Color) => void;
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
  onReorderWidget,
  onColorChange,
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
                <ColorPicker onChange={(color) => onColorChange(widget.id, color)} />

                <div className="flex flex-col gap-y-0.5">
                  <Hint label="Bring to front">
                    <button
                      type="button"
                      onClick={() => onReorderWidget(widget.id, "front")}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-blue-500/20 hover:text-blue-800 h-10 w-10"
                    >
                      <BringToFront />
                    </button>
                  </Hint>
                  <Hint label="Send to back" side="bottom">
                    <button
                      type="button"
                      onClick={() => onReorderWidget(widget.id, "back")}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-blue-500/20 hover:text-blue-800 h-10 w-10"
                    >
                      <SendToBack />
                    </button>
                  </Hint>
                </div>

                <div className="flex items-center pl-2 ml-2 border-l border-neutral-200">
                  <Hint label="Delete">
                    <button
                      type="button"
                      onClick={() => onDeleteWidget(widget.id)}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-blue-500/20 hover:text-blue-800 h-10 w-10"
                    >
                      <Trash2 />
                    </button>
                  </Hint>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
