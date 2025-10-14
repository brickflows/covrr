"use client";

import React, { useState, useEffect } from "react";
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  CaseSensitive,
} from "lucide-react";
import type { Textbox as FabricTextbox } from "fabric/fabric-impl";

type ExtendedTextbox = FabricTextbox & {
  layer_id?: string;
};

interface FabricTextPropertiesPanelProps {
  textbox: ExtendedTextbox | null;
  onUpdateTextbox: (property: string, value: any) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onClose?: () => void;
}

const GOOGLE_FONTS = [
  "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald",
  "Raleway", "PT Sans", "Merriweather", "Nunito", "Playfair Display",
  "Poppins", "Ubuntu", "Arial", "Times New Roman", "Courier New",
  "Georgia", "Verdana", "Helvetica", "Comic Sans MS", "Impact",
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

export const FabricTextPropertiesPanel = ({
  textbox,
  onUpdateTextbox,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onClose,
}: FabricTextPropertiesPanelProps) => {
  const [expandedSections, setExpandedSections] = useState({
    fonts: true,
    properties: true,
  });
  const [isReady, setIsReady] = useState(false);

  // Use effect to delay rendering until textbox is fully initialized
  useEffect(() => {
    if (!textbox) {
      setIsReady(false);
      return;
    }

    // Small delay to ensure Fabric has fully initialized the textbox
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [textbox]);

  // Early return if not ready
  if (!textbox || !isReady) {
    return null;
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, section, icon }: { title: string; section: keyof typeof expandedSections; icon?: React.ReactNode }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold text-sm text-gray-700">{title}</span>
      </div>
      {expandedSections[section] ? (
        <ChevronUp size={16} className="text-gray-500" />
      ) : (
        <ChevronDown size={16} className="text-gray-500" />
      )}
    </button>
  );

  // Extract properties with safe defaults
  const fillColor = typeof textbox.fill === "string" ? textbox.fill : "#FFFFFF";
  const fontSize = Math.round((textbox.fontSize || 40) * (textbox.scaleY || 1));
  const fontFamily = textbox.fontFamily || "Arial";
  const textAlign = textbox.textAlign || "left";
  const charSpacing = Math.round(textbox.charSpacing || 0);
  const lineHeight = Number(textbox.lineHeight || 1.16).toFixed(2);
  const opacity = textbox.opacity !== undefined ? textbox.opacity : 1;

  // Normalize fontWeight to a valid number (400 default)
  let fontWeightValue = 400;
  if (typeof textbox.fontWeight === 'number') {
    fontWeightValue = textbox.fontWeight;
  } else if (textbox.fontWeight === 'bold') {
    fontWeightValue = 700;
  } else if (textbox.fontWeight === 'normal') {
    fontWeightValue = 400;
  }

  // Ensure fontWeight matches one of our options
  const validWeights = FONT_WEIGHTS.map(w => w.value);
  if (!validWeights.includes(fontWeightValue)) {
    // Find closest match
    fontWeightValue = validWeights.reduce((prev, curr) =>
      Math.abs(curr - fontWeightValue) < Math.abs(prev - fontWeightValue) ? curr : prev
    );
  }

  const toggleStyle = (style: "bold" | "italic" | "underline" | "linethrough") => {
    if (style === "bold") {
      const current = textbox.fontWeight;
      onUpdateTextbox("fontWeight", current === "bold" || current === 700 ? "normal" : "bold");
    } else if (style === "italic") {
      onUpdateTextbox("fontStyle", textbox.fontStyle === "italic" ? "normal" : "italic");
    } else if (style === "underline") {
      onUpdateTextbox("underline", !textbox.underline);
    } else if (style === "linethrough") {
      onUpdateTextbox("linethrough", !textbox.linethrough);
    }
  };

  return (
    <div
      className="fixed right-0 top-0 bottom-0 w-[400px] overflow-y-auto"
      style={{
        zIndex: 999999,
        backgroundColor: '#ffffff',
        borderLeft: '2px solid #E5E7EB',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)'
      }}
    >
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
              className="text-gray-500 hover:text-gray-700 transition-colors text-2xl leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
          {/* Color Picker */}
          <div className="relative">
            <input
              type="color"
              value={fillColor}
              onChange={(e) => onUpdateTextbox("fill", e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Pick color"
            />
            <div
              className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: fillColor }}
            />
          </div>

          <div className="w-px h-8 bg-gray-200"></div>

          {/* Duplicate */}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Duplicate"
            >
              <Copy size={18} />
            </button>
          )}

          {/* Bring to Front */}
          {onBringToFront && (
            <button
              onClick={onBringToFront}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Bring to front"
            >
              <ArrowUp size={18} />
            </button>
          )}

          {/* Send to Back */}
          {onSendToBack && (
            <button
              onClick={onSendToBack}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Send to back"
            >
              <ArrowDown size={18} />
            </button>
          )}

          {/* Delete */}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-100 rounded transition-colors text-red-600"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          )}

          <div className="w-px h-8 bg-gray-200"></div>

          {/* Bold */}
          <button
            onClick={() => toggleStyle("bold")}
            className={`p-2 rounded transition-colors ${
              textbox.fontWeight === "bold" || textbox.fontWeight === 700 ? "bg-gray-200" : "hover:bg-gray-100"
            }`}
            title="Bold"
          >
            <Bold size={18} />
          </button>

          {/* Italic */}
          <button
            onClick={() => toggleStyle("italic")}
            className={`p-2 rounded transition-colors ${
              textbox.fontStyle === "italic" ? "bg-gray-200" : "hover:bg-gray-100"
            }`}
            title="Italic"
          >
            <Italic size={18} />
          </button>

          {/* Underline */}
          <button
            onClick={() => toggleStyle("underline")}
            className={`p-2 rounded transition-colors ${
              textbox.underline ? "bg-gray-200" : "hover:bg-gray-100"
            }`}
            title="Underline"
          >
            <Underline size={18} />
          </button>

          {/* Strikethrough */}
          <button
            onClick={() => toggleStyle("linethrough")}
            className={`p-2 rounded transition-colors ${
              textbox.linethrough ? "bg-gray-200" : "hover:bg-gray-100"
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </button>
        </div>

        {/* Alignment buttons */}
        <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
          <span className="text-xs font-medium text-gray-600 mr-2">Align:</span>
          <button
            onClick={() => onUpdateTextbox("textAlign", "left")}
            className={`p-2 rounded transition-colors ${
              textAlign === "left" ? "bg-gray-200" : "hover:bg-gray-100"
            }`}
            title="Align left"
          >
            <AlignLeft size={18} />
          </button>

          <button
            onClick={() => onUpdateTextbox("textAlign", "center")}
            className={`p-2 rounded transition-colors ${
              textAlign === "center" ? "bg-gray-200" : "hover:bg-gray-100"
            }`}
            title="Align center"
          >
            <AlignCenter size={18} />
          </button>

          <button
            onClick={() => onUpdateTextbox("textAlign", "right")}
            className={`p-2 rounded transition-colors ${
              textAlign === "right" ? "bg-gray-200" : "hover:bg-gray-100"
            }`}
            title="Align right"
          >
            <AlignRight size={18} />
          </button>

          <div className="w-px h-8 bg-gray-200 ml-auto"></div>

          {/* Toggle Case */}
          <button
            onClick={() => {
              const currentText = textbox.text || "";
              const isUpperCase = currentText === currentText.toUpperCase();
              onUpdateTextbox("text", isUpperCase ? currentText.toLowerCase() : currentText.toUpperCase());
            }}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Toggle case"
          >
            <CaseSensitive size={18} />
          </button>
        </div>

        {/* Text Content */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Text Content</label>
          <textarea
            value={textbox.text || ""}
            onChange={(e) => {
              onUpdateTextbox("text", e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            style={{ minHeight: '60px' }}
          />
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Font Size</label>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => onUpdateTextbox("fontSize", Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Fonts Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <SectionHeader title="Font Family" section="fonts" icon={<Type size={16} />} />
          {expandedSections.fonts && (
            <div className="p-4 space-y-2 border-t border-gray-200 max-h-64 overflow-y-auto">
              {GOOGLE_FONTS.map((font) => (
                <button
                  key={font}
                  onClick={() => onUpdateTextbox("fontFamily", font)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors hover:bg-blue-50 ${
                    fontFamily === font ? "bg-blue-100 border border-blue-300" : "bg-white border border-gray-200"
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Weight */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Font Weight</label>
          <div className="grid grid-cols-3 gap-2">
            {FONT_WEIGHTS.map((weight) => (
              <button
                key={weight.value}
                onClick={() => onUpdateTextbox("fontWeight", weight.value)}
                className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                  fontWeightValue === weight.value
                    ? "bg-blue-500 text-white border-2 border-blue-600"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {weight.name}
              </button>
            ))}
          </div>
        </div>

        {/* Letter Spacing */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Letter Spacing</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={charSpacing}
              onChange={(e) => onUpdateTextbox("charSpacing", Number(e.target.value))}
              min="0"
              max="1000"
              step="10"
              className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="range"
              value={charSpacing}
              onChange={(e) => onUpdateTextbox("charSpacing", Number(e.target.value))}
              min="0"
              max="1000"
              step="10"
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Line Height */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Line Height</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={lineHeight}
              onChange={(e) => onUpdateTextbox("lineHeight", Number(e.target.value))}
              min="0.5"
              max="3"
              step="0.1"
              className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="range"
              value={lineHeight}
              onChange={(e) => onUpdateTextbox("lineHeight", Number(e.target.value))}
              min="0.5"
              max="3"
              step="0.1"
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Transparency */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Transparency</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={(opacity * 100).toFixed(0)}
              onChange={(e) => onUpdateTextbox("opacity", Number(e.target.value) / 100)}
              min="0"
              max="100"
              step="1"
              className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="range"
              value={opacity * 100}
              onChange={(e) => onUpdateTextbox("opacity", Number(e.target.value) / 100)}
              min="0"
              max="100"
              step="1"
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700 w-12 text-right">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
