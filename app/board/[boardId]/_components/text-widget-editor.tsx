"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<Map<string, HTMLElement>>(new Map());
  const previousIds = useRef<string[]>([]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setSelectedId(null);
        setEditingId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditingId(null);
        setSelectedId(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const previous = previousIds.current;
    if (widgets.length > previous.length) {
      const newWidget = widgets.find((widget) => !previous.includes(widget.id));
      if (newWidget) {
        setSelectedId(newWidget.id);
        setEditingId(newWidget.id);
        requestAnimationFrame(() => {
          const node = contentRefs.current.get(newWidget.id);
          node?.focus();
          const selection = window.getSelection();
          if (selection && node?.firstChild) {
            selection.selectAllChildren(node);
            selection.collapseToEnd();
          }
        });
      }
    }
    previousIds.current = widgets.map((widget) => widget.id);
  }, [widgets]);

  const resizeConfig = useMemo(
    () => ({
      enabled: {
        top: true,
        topRight: true,
        right: true,
        bottomRight: true,
        bottom: true,
        bottomLeft: true,
        left: true,
        topLeft: true,
      },
      disabled: {
        top: false,
        topRight: false,
        right: false,
        bottomRight: false,
        bottom: false,
        bottomLeft: false,
        left: false,
        topLeft: false,
      },
    }),
    []
  );

  const handleStyles = useMemo(() => {
    const base = {
      width: 10,
      height: 10,
      background: "#ffffff",
      border: "1px solid #3b82f6",
      borderRadius: 2,
      boxSizing: "border-box" as const,
    };

    return {
      top: { ...base, cursor: "ns-resize" },
      topRight: { ...base, cursor: "nesw-resize" },
      right: { ...base, cursor: "ew-resize" },
      bottomRight: { ...base, cursor: "nwse-resize" },
      bottom: { ...base, cursor: "ns-resize" },
      bottomLeft: { ...base, cursor: "nesw-resize" },
      left: { ...base, cursor: "ew-resize" },
      topLeft: { ...base, cursor: "nwse-resize" },
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {widgets.map((widget) => {
        const isSelected = selectedId === widget.id;
        const isEditing = editingId === widget.id;
        const fontSize = calculateFontSize(widget.width, widget.height);
        const resizeHandles = isSelected && !isEditing ? handleStyles : undefined;

        return (
          <div key={widget.id} className="absolute pointer-events-auto">
            <Rnd
              size={{ width: widget.width, height: widget.height }}
              position={{ x: widget.x, y: widget.y }}
              minWidth={80}
              minHeight={48}
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
              disableDragging={isEditing}
              enableResizing={
                isSelected && !isEditing
                  ? resizeConfig.enabled
                  : resizeConfig.disabled
              }
              resizeHandleStyles={resizeHandles}
              dragHandleClassName="text-widget-drag-surface"
              className={cn(
                "text-widget-wrapper",
                isSelected
                  ? "ring-1 ring-blue-500"
                  : "ring-1 ring-transparent"
              )}
              style={{
                zIndex: isSelected ? 1000 : undefined,
              }}
              onDragStart={() => {
                setSelectedId(widget.id);
              }}
              onResizeStart={() => {
                setSelectedId(widget.id);
              }}
            >
              <div
                onPointerDown={() => {
                  setSelectedId(widget.id);
                }}
                onDoubleClick={() => {
                  setSelectedId(widget.id);
                  setEditingId(widget.id);
                  const node = contentRefs.current.get(widget.id);
                  requestAnimationFrame(() => {
                    node?.focus();
                    const selection = window.getSelection();
                    if (selection && node?.firstChild) {
                      selection.selectAllChildren(node);
                      selection.collapseToEnd();
                    }
                  });
                }}
                style={{
                  outline: isSelected ? "1px solid #3b82f6" : "none",
                }}
                className={cn(
                  "text-widget-drag-surface relative h-full w-full select-none rounded-sm",
                  isEditing ? "cursor-text" : "cursor-move"
                )}
              >
                <ContentEditable
                  html={widget.content || "Text"}
                  onChange={(e: ContentEditableEvent) => {
                    onUpdateWidget(widget.id, { content: e.target.value });
                  }}
                  onBlur={() => {
                    setEditingId((current) =>
                      current === widget.id ? null : current
                    );
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setEditingId(null);
                    }
                  }}
                  disabled={!isEditing}
                  className={cn(
                    "h-full w-full flex items-center justify-center text-center drop-shadow-md outline-none",
                    font.className
                  )}
                  style={{
                    fontSize: `${fontSize}px`,
                    color: colorToCSS(widget.fill),
                    pointerEvents: isEditing ? "auto" : "none",
                  }}
                  innerRef={(node) => {
                    if (node) contentRefs.current.set(widget.id, node);
                    else contentRefs.current.delete(widget.id);
                  }}
                  suppressContentEditableWarning
                />

                {isSelected && (
                  <div className="pointer-events-none absolute -left-5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-blue-500 bg-white text-blue-500 shadow-sm">
                    <span className="text-[10px] leading-none font-semibold">::</span>
                  </div>
                )}
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
