"use client";

import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  ChevronRight,
  Type
} from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import * as Select from "@radix-ui/react-select";
import * as Slider from "@radix-ui/react-slider";

type FabricImageCanvasProps = {
  imageUrl: string;
};

const FONT_SIZE_DEFAULT = 32;
const FONT_FAMILY_DEFAULT = "Arial";
const FILL_COLOR_DEFAULT = "#000000";

// Popular Google Fonts
const GOOGLE_FONTS = [
  "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald",
  "Raleway", "PT Sans", "Merriweather", "Nunito", "Playfair Display",
  "Poppins", "Ubuntu", "Crimson Text", "Dancing Script", "Indie Flower",
  "Pacifico", "Bebas Neue", "Anton", "Lobster", "Righteous",
];

const TEXT_EFFECTS = [
  { name: "Extrude type", color: "bg-orange-400" },
  { name: "another style", color: "bg-green-400" },
  { name: "shadow effect", color: "bg-blue-400" },
  { name: "outline style", color: "bg-purple-400" },
];

export const FabricImageCanvasV2 = ({ imageUrl }: FabricImageCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      preserveObjectStacking: true,
      controlsAboveOverlay: true,
    });

    fabricCanvasRef.current = canvas;

    // Load background image
    fabric.Image.fromURL(imageUrl, (img) => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      const scaleX = containerWidth / (img.width || 1);
      const scaleY = containerHeight / (img.height || 1);
      const scale = Math.min(scaleX, scaleY);

      img.set({
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });

      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      canvas.setWidth(containerWidth);
      canvas.setHeight(containerHeight);
    });

    canvas.on("selection:created", (e) => setSelectedObject(e.selected?.[0] || null));
    canvas.on("selection:updated", (e) => setSelectedObject(e.selected?.[0] || null));
    canvas.on("selection:cleared", () => setSelectedObject(null));

    return () => canvas.dispose();
  }, [imageUrl]);

  const addText = (text = "THIS IS THE TITLE OF THE BOOK", fontFamily = FONT_FAMILY_DEFAULT) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const textbox = new fabric.Textbox(text, {
      left: 100,
      top: 100,
      fontSize: 40,
      fontFamily,
      fill: "#FFFFFF",
      width: 300,
      fontWeight: "bold",
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
  };

  const updateTextProperty = (property: string, value: any) => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      (activeObject as any).set({ [property]: value });
      canvas?.renderAll();
    }
  };

  const toggleStyle = (style: "bold" | "italic" | "underline" | "linethrough") => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject() as fabric.Textbox;
    if (!activeObject || activeObject.type !== "textbox") return;

    if (style === "bold") {
      const current = activeObject.fontWeight;
      updateTextProperty("fontWeight", current === "bold" || current === 700 ? "normal" : "bold");
    } else if (style === "italic") {
      updateTextProperty("fontStyle", activeObject.fontStyle === "italic" ? "normal" : "italic");
    } else if (style === "underline") {
      updateTextProperty("underline", !activeObject.underline);
    } else if (style === "linethrough") {
      updateTextProperty("linethrough", !activeObject.linethrough);
    }
  };

  const textObj = selectedObject?.type === "textbox" ? (selectedObject as fabric.Textbox) : null;

  return (
    <div className="flex h-full w-full">
      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 relative bg-gray-100">
        <canvas ref={canvasRef} />
      </div>

      {/* Properties Panel */}
      <div className="bg-white border-l overflow-y-auto" style={{ width: "280px" }}>
        <Accordion.Root type="multiple" defaultValue={["fonts", "effects", "properties"]} className="w-full">

          {/* Fonts Section */}
          <Accordion.Item value="fonts" className="border-b">
            <Accordion.Trigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <Type size={16} />
                Fonts
              </div>
              <ChevronRight size={16} className="transform transition-transform data-[state=open]:rotate-90" />
            </Accordion.Trigger>
            <Accordion.Content className="px-2 py-2 max-h-48 overflow-y-auto">
              <div className="space-y-1">
                {GOOGLE_FONTS.map((font) => (
                  <button
                    key={font}
                    onClick={() => addText(undefined, font)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 rounded transition-colors"
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </Accordion.Content>
          </Accordion.Item>

          {/* Effects Section */}
          <Accordion.Item value="effects" className="border-b">
            <Accordion.Trigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold hover:bg-gray-50">
              Effects
              <ChevronRight size={16} className="transform transition-transform data-[state=open]:rotate-90" />
            </Accordion.Trigger>
            <Accordion.Content className="px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                {TEXT_EFFECTS.map((effect) => (
                  <button
                    key={effect.name}
                    className={`${effect.color} text-white px-3 py-2 rounded text-xs font-medium hover:opacity-90 transition-opacity`}
                  >
                    {effect.name}
                  </button>
                ))}
              </div>
            </Accordion.Content>
          </Accordion.Item>

          {/* Properties Section */}
          <Accordion.Item value="properties" className="border-b">
            <Accordion.Trigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold hover:bg-gray-50">
              Properties
              <ChevronRight size={16} className="transform transition-transform data-[state=open]:rotate-90" />
            </Accordion.Trigger>
            <Accordion.Content className="px-4 py-4">
              {textObj ? (
                <div className="space-y-4">
                  {/* Text Content */}
                  <div>
                    <input
                      type="text"
                      value={textObj.text || ""}
                      onChange={(e) => updateTextProperty("text", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter text..."
                    />
                  </div>

                  {/* Font Family */}
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={textObj.fontFamily || "Arial"}
                      onChange={(e) => updateTextProperty("fontFamily", e.target.value)}
                      className="col-span-2 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {GOOGLE_FONTS.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={Math.round(textObj.fontSize || 32)}
                      onChange={(e) => updateTextProperty("fontSize", Number(e.target.value))}
                      className="px-2 py-1.5 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Spacing Controls */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Letter Spacing</label>
                      <input
                        type="number"
                        value={textObj.charSpacing || 0}
                        onChange={(e) => updateTextProperty("charSpacing", Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Line Height</label>
                      <input
                        type="number"
                        step="0.1"
                        value={textObj.lineHeight || 1.16}
                        onChange={(e) => updateTextProperty("lineHeight", Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Color */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div
                        className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                        style={{ backgroundColor: typeof textObj.fill === 'string' ? textObj.fill : "#000" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = typeof textObj.fill === 'string' ? textObj.fill : "#000000";
                          input.onchange = (e) => updateTextProperty("fill", (e.target as HTMLInputElement).value);
                          input.click();
                        }}
                      />
                      <span className="text-xs text-gray-600">100%</span>
                    </div>
                  </div>

                  {/* Text Alignment */}
                  <div className="flex gap-1">
                    {[
                      { align: "left", icon: AlignLeft },
                      { align: "center", icon: AlignCenter },
                      { align: "right", icon: AlignRight },
                    ].map(({ align, icon: Icon }) => (
                      <button
                        key={align}
                        onClick={() => updateTextProperty("textAlign", align)}
                        className={`flex-1 p-2 border rounded ${
                          textObj.textAlign === align
                            ? "bg-gray-200 border-gray-300"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={16} className="mx-auto" />
                      </button>
                    ))}
                  </div>

                  {/* Font Styles */}
                  <div className="flex gap-1">
                    {[
                      { style: "bold" as const, icon: Bold, active: textObj.fontWeight === "bold" || textObj.fontWeight === 700 },
                      { style: "italic" as const, icon: Italic, active: textObj.fontStyle === "italic" },
                      { style: "underline" as const, icon: Underline, active: textObj.underline },
                      { style: "linethrough" as const, icon: Strikethrough, active: textObj.linethrough },
                    ].map(({ style, icon: Icon, active }) => (
                      <button
                        key={style}
                        onClick={() => toggleStyle(style)}
                        className={`flex-1 p-2 border rounded ${
                          active ? "bg-gray-200 border-gray-300" : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={14} className="mx-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">
                  Select a text to edit properties
                </p>
              )}
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </div>
    </div>
  );
};
