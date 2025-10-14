"use client";

import React, { useState } from "react";
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
  FlipHorizontal,
  FlipVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Color = { r: number; g: number; b: number };

type TextWidget = {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: Color;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  locked?: boolean;
  rotation?: number;
  opacity?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  direction?: 'ltr' | 'rtl';
};

type TextPropertiesPanelProps = {
  widget: TextWidget | null;
  onUpdateWidget: (id: string, updates: Partial<TextWidget>) => void;
  onReorderWidget: (id: string, direction: "front" | "back") => void;
  onClose?: () => void;
};

const colorToCSS = (color: Color) => `rgb(${color.r}, ${color.g}, ${color.b})`;
const colorToHex = (color: Color) => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
};
const hexToColor = (hex: string): Color => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
};

const FONT_FAMILIES = [
  { name: 'Kalam', value: "'Kalam', cursive" },
  { name: 'Inter', value: "'Inter', sans-serif" },
  { name: 'Arial', value: "Arial, sans-serif" },
  { name: 'Times New Roman', value: "'Times New Roman', serif" },
  { name: 'Courier New', value: "'Courier New', monospace" },
  { name: 'Georgia', value: "Georgia, serif" },
  { name: 'Verdana', value: "Verdana, sans-serif" },
];

const FONT_WEIGHTS = [
  { name: 'Thin', value: 100 },
  { name: 'Extra Light', value: 200 },
  { name: 'Light', value: 300 },
  { name: 'Regular', value: 400 },
  { name: 'Medium', value: 500 },
  { name: 'Semi Bold', value: 600 },
  { name: 'Bold', value: 700 },
  { name: 'Extra Bold', value: 800 },
  { name: 'Black', value: 900 },
];

export const TextPropertiesPanel = ({
  widget,
  onUpdateWidget,
  onReorderWidget,
  onClose,
}: TextPropertiesPanelProps) => {
  const [expandedSections, setExpandedSections] = useState({
    appearance: true,
    typography: true,
    fill: true,
    arrange: true,
  });

  if (!widget) {
    return null;
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, section }: { title: string; section: keyof typeof expandedSections }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
    >
      <span className="font-semibold text-sm text-gray-700">{title}</span>
      {expandedSections[section] ? (
        <ChevronUp size={16} className="text-gray-500" />
      ) : (
        <ChevronDown size={16} className="text-gray-500" />
      )}
    </button>
  );

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white border-l border-gray-200 shadow-xl overflow-y-auto z-[9999]">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type size={20} className="text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Text Properties</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Appearance Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <SectionHeader title="Appearance" section="appearance" />
          {expandedSections.appearance && (
            <div className="p-4 space-y-4 border-t border-gray-200">
              {/* Opacity */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Opacity</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(widget.opacity ?? 100) * 100}
                    onChange={(e) => onUpdateWidget(widget.id, { opacity: parseInt(e.target.value) / 100 })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 w-12 text-right">
                    {Math.round((widget.opacity ?? 1) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Typography Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <SectionHeader title="Typography" section="typography" />
          {expandedSections.typography && (
            <div className="p-4 space-y-4 border-t border-gray-200">
              {/* Font Family */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Font Family</label>
                <select
                  value={widget.fontFamily || "'Kalam', cursive"}
                  onChange={(e) => onUpdateWidget(widget.id, { fontFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FONT_FAMILIES.map((font) => (
                    <option key={font.value} value={font.value}>{font.name}</option>
                  ))}
                </select>
              </div>

              {/* Font Weight */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Font Weight</label>
                <select
                  value={widget.fontWeight || 400}
                  onChange={(e) => onUpdateWidget(widget.id, { fontWeight: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FONT_WEIGHTS.map((weight) => (
                    <option key={weight.value} value={weight.value}>{weight.name}</option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Font Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="8"
                    max="96"
                    value={widget.fontSize || 16}
                    onChange={(e) => onUpdateWidget(widget.id, { fontSize: Math.max(8, parseInt(e.target.value) || 8) })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">px</span>
                </div>
              </div>

              {/* Line Height */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Line Height</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={widget.lineHeight || 1.2}
                    onChange={(e) => onUpdateWidget(widget.id, { lineHeight: parseFloat(e.target.value) || 1.2 })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Letter Spacing */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Letter Spacing</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="-5"
                    max="20"
                    step="0.5"
                    value={widget.letterSpacing || 0}
                    onChange={(e) => onUpdateWidget(widget.id, { letterSpacing: parseFloat(e.target.value) || 0 })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">px</span>
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Alignment</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateWidget(widget.id, { textAlign: 'left' })}
                    className={`flex-1 p-2 border rounded-lg transition-colors ${
                      (widget.textAlign || 'left') === 'left' ? 'bg-blue-50 border-blue-500' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    title="Align Left"
                  >
                    <AlignLeft size={18} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => onUpdateWidget(widget.id, { textAlign: 'center' })}
                    className={`flex-1 p-2 border rounded-lg transition-colors ${
                      widget.textAlign === 'center' ? 'bg-blue-50 border-blue-500' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    title="Align Center"
                  >
                    <AlignCenter size={18} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => onUpdateWidget(widget.id, { textAlign: 'right' })}
                    className={`flex-1 p-2 border rounded-lg transition-colors ${
                      widget.textAlign === 'right' ? 'bg-blue-50 border-blue-500' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    title="Align Right"
                  >
                    <AlignRight size={18} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => onUpdateWidget(widget.id, { textAlign: 'justify' })}
                    className={`flex-1 p-2 border rounded-lg transition-colors ${
                      widget.textAlign === 'justify' ? 'bg-blue-50 border-blue-500' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    title="Justify"
                  >
                    <AlignJustify size={18} className="mx-auto" />
                  </button>
                </div>
              </div>

              {/* Text Transform */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Text Transform</label>
                <select
                  value={widget.textTransform || 'none'}
                  onChange={(e) => onUpdateWidget(widget.id, { textTransform: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="lowercase">lowercase</option>
                  <option value="capitalize">Title Case</option>
                </select>
              </div>

              {/* Text Direction */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Direction</label>
                <select
                  value={widget.direction || 'ltr'}
                  onChange={(e) => onUpdateWidget(widget.id, { direction: e.target.value as 'ltr' | 'rtl' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ltr">Left to Right (LTR)</option>
                  <option value="rtl">Right to Left (RTL)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Fill Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <SectionHeader title="Fill" section="fill" />
          {expandedSections.fill && (
            <div className="p-4 space-y-4 border-t border-gray-200">
              {/* Text Color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Text Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorToHex(widget.fill)}
                    onChange={(e) => onUpdateWidget(widget.id, { fill: hexToColor(e.target.value) })}
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorToHex(widget.fill).toUpperCase()}
                    onChange={(e) => {
                      const hex = e.target.value;
                      if (/^#[0-9A-F]{6}$/i.test(hex)) {
                        onUpdateWidget(widget.id, { fill: hexToColor(hex) });
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Quick Color Palette */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Quick Colors</label>
                <div className="grid grid-cols-8 gap-2">
                  {[
                    { r: 0, g: 0, b: 0 },
                    { r: 255, g: 255, b: 255 },
                    { r: 239, g: 68, b: 68 },
                    { r: 249, g: 115, b: 22 },
                    { r: 234, g: 179, b: 8 },
                    { r: 34, g: 197, b: 94 },
                    { r: 59, g: 130, b: 246 },
                    { r: 168, g: 85, b: 247 },
                    { r: 236, g: 72, b: 153 },
                    { r: 148, g: 163, b: 184 },
                    { r: 100, g: 116, b: 139 },
                    { r: 51, g: 65, b: 85 },
                  ].map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => onUpdateWidget(widget.id, { fill: color })}
                      className="w-full aspect-square rounded border-2 border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: colorToCSS(color) }}
                      title={colorToHex(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Arrange Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <SectionHeader title="Arrange" section="arrange" />
          {expandedSections.arrange && (
            <div className="p-4 space-y-4 border-t border-gray-200">
              {/* Z-order */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Layer Order</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onReorderWidget(widget.id, 'front')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <BringToFront size={16} />
                    Bring to Front
                  </button>
                  <button
                    onClick={() => onReorderWidget(widget.id, 'back')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <SendToBack size={16} />
                    Send to Back
                  </button>
                </div>
              </div>

              {/* Lock/Unlock */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Lock</label>
                <button
                  onClick={() => onUpdateWidget(widget.id, { locked: !widget.locked })}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm ${
                    widget.locked
                      ? 'bg-red-50 border-red-500 text-red-700 hover:bg-red-100'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {widget.locked ? (
                    <>
                      <Lock size={16} />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Unlock size={16} />
                      Lock
                    </>
                  )}
                </button>
              </div>

              {/* Position & Size Info */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-xs font-medium text-gray-600 mb-2">Position & Size</label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">X:</span>
                    <span className="ml-2 font-medium">{Math.round(widget.x)}px</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Y:</span>
                    <span className="ml-2 font-medium">{Math.round(widget.y)}px</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Width:</span>
                    <span className="ml-2 font-medium">{Math.round(widget.width)}px</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Height:</span>
                    <span className="ml-2 font-medium">{Math.round(widget.height)}px</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Rotation:</span>
                    <span className="ml-2 font-medium">{Math.round(widget.rotation || 0)}°</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
