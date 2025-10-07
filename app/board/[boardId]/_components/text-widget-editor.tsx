"use client";

import React, { useEffect, useRef, useState } from "react";
import { BringToFront, SendToBack, Trash2 } from "lucide-react";

type Color = { r: number; g: number; b: number };

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
  onWidgetSelect?: (id: string | null) => void;
  selectedWidgetId?: string | null;
};

const MIN_WIDTH = 80;
const MIN_HEIGHT = 48;
const MAX_FONT_SIZE = 96;
const FONT_SCALE_FACTOR = 0.5;
const HANDLE_SIZE = 12;

const calculateFontSize = (width: number, height: number) => {
  const fontSizeBasedOnHeight = height * FONT_SCALE_FACTOR;
  const fontSizeBasedOnWidth = width * FONT_SCALE_FACTOR;
  return Math.min(fontSizeBasedOnHeight, fontSizeBasedOnWidth, MAX_FONT_SIZE);
};

const colorToCSS = (color: Color) => `rgb(${color.r}, ${color.g}, ${color.b})`;

const ColorPicker = ({ onChange }: { onChange: (color: Color) => void }) => {
  const colors = [
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 128, b: 255 },
    { r: 34, g: 197, b: 94 },
    { r: 234, g: 179, b: 8 },
  ];

  return (
    <div className="flex gap-1 pr-2">
      {colors.map((color, idx) => (
        <button
          key={idx}
          onClick={() => onChange(color)}
          className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
          style={{ backgroundColor: colorToCSS(color) }}
        />
      ))}
    </div>
  );
};

type ResizeHandle =
  | "top" | "topRight" | "right" | "bottomRight"
  | "bottom" | "bottomLeft" | "left" | "topLeft" | null;

export const TextWidgetEditor = ({
  widgets,
  onUpdateWidget,
  onDeleteWidget,
  onReorderWidget,
  onColorChange,
  onWidgetSelect,
  selectedWidgetId,
}: TextWidgetEditorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(selectedWidgetId || null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sync with external selectedWidgetId
  useEffect(() => {
    if (selectedWidgetId !== undefined) {
      setSelectedId(selectedWidgetId);
    }
  }, [selectedWidgetId]);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; handle: ResizeHandle; startX: number; startY: number; startWidth: number; startHeight: number; startPosX: number; startPosY: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const previousIds = useRef<string[]>([]);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const widget = widgets.find(w => w.id === dragging.id);
        if (widget) {
          const newX = e.clientX - dragging.offsetX;
          const newY = e.clientY - dragging.offsetY;
          onUpdateWidget(dragging.id, { x: newX, y: newY });
        }
      } else if (resizing) {
        const widget = widgets.find(w => w.id === resizing.id);
        if (!widget) return;

        const deltaX = e.clientX - resizing.startX;
        const deltaY = e.clientY - resizing.startY;

        let newWidth = resizing.startWidth;
        let newHeight = resizing.startHeight;
        let newX = resizing.startPosX;
        let newY = resizing.startPosY;

        switch (resizing.handle) {
          case "right":
            newWidth = Math.max(MIN_WIDTH, resizing.startWidth + deltaX);
            break;
          case "left":
            newWidth = Math.max(MIN_WIDTH, resizing.startWidth - deltaX);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
            break;
          case "bottom":
            newHeight = Math.max(MIN_HEIGHT, resizing.startHeight + deltaY);
            break;
          case "top":
            newHeight = Math.max(MIN_HEIGHT, resizing.startHeight - deltaY);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
            break;
          case "topRight":
            newWidth = Math.max(MIN_WIDTH, resizing.startWidth + deltaX);
            newHeight = Math.max(MIN_HEIGHT, resizing.startHeight - deltaY);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
            break;
          case "topLeft":
            newWidth = Math.max(MIN_WIDTH, resizing.startWidth - deltaX);
            newHeight = Math.max(MIN_HEIGHT, resizing.startHeight - deltaY);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
            break;
          case "bottomRight":
            newWidth = Math.max(MIN_WIDTH, resizing.startWidth + deltaX);
            newHeight = Math.max(MIN_HEIGHT, resizing.startHeight + deltaY);
            break;
          case "bottomLeft":
            newWidth = Math.max(MIN_WIDTH, resizing.startWidth - deltaX);
            newHeight = Math.max(MIN_HEIGHT, resizing.startHeight + deltaY);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
            break;
        }

        onUpdateWidget(resizing.id, {
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY,
        });
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      setResizing(null);
    };

    if (dragging || resizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, resizing, widgets, onUpdateWidget]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't deselect if clicking in the container or the right panel controls
      const target = e.target as HTMLElement;
      const isInContainer = containerRef.current?.contains(target);
      const isInRightPanel = target.closest('[style*="width: 280px"]') !== null;

      if (!isInContainer && !isInRightPanel) {
        setSelectedId(null);
        setEditingId(null);
        onWidgetSelect?.(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingId(null);
        setSelectedId(null);
        onWidgetSelect?.(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onWidgetSelect]);

  const handleDragStart = (e: React.MouseEvent, widget: TextWidget) => {
    if (editingId === widget.id) return;
    e.stopPropagation();
    setSelectedId(widget.id);
    onWidgetSelect?.(widget.id);
    setDragging({
      id: widget.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - widget.x,
      offsetY: e.clientY - widget.y,
    });
  };

  const handleResizeStart = (e: React.MouseEvent, widget: TextWidget, handle: ResizeHandle) => {
    e.stopPropagation();
    setResizing({
      id: widget.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: widget.width,
      startHeight: widget.height,
      startPosX: widget.x,
      startPosY: widget.y,
    });
  };

  const ResizeHandles = ({ widget }: { widget: TextWidget }) => {
    const handles: { position: ResizeHandle; cursor: string; style: React.CSSProperties }[] = [
      { position: "top", cursor: "ns-resize", style: { top: -HANDLE_SIZE / 2, left: "50%", transform: "translateX(-50%)" } },
      { position: "topRight", cursor: "nesw-resize", style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 } },
      { position: "right", cursor: "ew-resize", style: { top: "50%", right: -HANDLE_SIZE / 2, transform: "translateY(-50%)" } },
      { position: "bottomRight", cursor: "nwse-resize", style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 } },
      { position: "bottom", cursor: "ns-resize", style: { bottom: -HANDLE_SIZE / 2, left: "50%", transform: "translateX(-50%)" } },
      { position: "bottomLeft", cursor: "nesw-resize", style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 } },
      { position: "left", cursor: "ew-resize", style: { top: "50%", left: -HANDLE_SIZE / 2, transform: "translateY(-50%)" } },
      { position: "topLeft", cursor: "nwse-resize", style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 } },
    ];

    return (
      <>
        {handles.map(({ position, cursor, style }) => (
          <div
            key={position}
            onMouseDown={(e) => handleResizeStart(e, widget, position)}
            style={{
              ...style,
              position: "absolute",
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: "#ffffff",
              border: "2px solid #3b82f6",
              borderRadius: "3px",
              cursor,
              zIndex: 10,
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {widgets.map((widget) => {
        const isSelected = selectedId === widget.id;
        const isEditing = editingId === widget.id;
        const fontSize = calculateFontSize(widget.width, widget.height);

        return (
          <div key={widget.id} style={{ position: "absolute", pointerEvents: "auto", zIndex: isSelected ? 1000 : 1 }}>
            <div
              style={{
                position: "absolute",
                left: widget.x,
                top: widget.y,
                width: widget.width,
                height: widget.height,
                border: isSelected ? "2px solid #3b82f6" : "2px solid transparent",
                borderRadius: "4px",
                cursor: isEditing ? "text" : "move",
              }}
              onMouseDown={(e) => !isEditing && handleDragStart(e, widget)}
              onDoubleClick={() => {
                setSelectedId(widget.id);
                setEditingId(widget.id);
                onWidgetSelect?.(widget.id);
                requestAnimationFrame(() => {
                  const node = contentRefs.current.get(widget.id);
                  node?.focus();
                  const selection = window.getSelection();
                  if (selection && node?.firstChild) {
                    selection.selectAllChildren(node);
                    selection.collapseToEnd();
                  }
                });
              }}
            >
              <div
                ref={(el) => {
                  if (el) contentRefs.current.set(widget.id, el);
                  else contentRefs.current.delete(widget.id);
                }}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onInput={(e) => {
                  onUpdateWidget(widget.id, { content: e.currentTarget.textContent || "" });
                }}
                onBlur={() => {
                  setEditingId((current) => (current === widget.id ? null : current));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setEditingId(null);
                  }
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  outline: "none",
                  fontSize: `${fontSize}px`,
                  color: colorToCSS(widget.fill),
                  fontFamily: "'Kalam', cursive",
                  fontWeight: 400,
                  textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  userSelect: isEditing ? "text" : "none",
                  pointerEvents: isEditing ? "auto" : "none",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "4px",
                }}
                dangerouslySetInnerHTML={{ __html: widget.content || "Text" }}
              />

              {isSelected && !isEditing && <ResizeHandles widget={widget} />}
            </div>

            {isSelected && !isEditing && (
              <div
                style={{
                  position: "absolute",
                  left: widget.x + widget.width / 2,
                  top: Math.max(widget.y - 70, 10),
                  transform: "translateX(-50%)",
                  zIndex: 1001,
                  pointerEvents: "auto",
                }}
                className="p-3 rounded-xl bg-white shadow-lg border flex gap-2"
              >
                <ColorPicker onChange={(color) => onColorChange(widget.id, color)} />

                <div className="flex gap-1 border-l pl-2">
                  <button
                    onClick={() => onReorderWidget(widget.id, "front")}
                    className="p-2 hover:bg-blue-100 rounded transition-colors"
                    title="Bring to front"
                  >
                    <BringToFront size={20} />
                  </button>
                  <button
                    onClick={() => onReorderWidget(widget.id, "back")}
                    className="p-2 hover:bg-blue-100 rounded transition-colors"
                    title="Send to back"
                  >
                    <SendToBack size={20} />
                  </button>
                </div>

                <div className="flex border-l pl-2">
                  <button
                    onClick={() => onDeleteWidget(widget.id)}
                    className="p-2 hover:bg-red-100 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};