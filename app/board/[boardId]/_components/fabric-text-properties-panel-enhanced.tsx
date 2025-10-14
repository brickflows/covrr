"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import type { Textbox as FabricTextbox } from "fabric/fabric-impl";
import { useTextShortcuts } from "./use-text-shortcuts";
import { CustomSlider } from "./custom-slider";
import {
  emitTextUpdated,
  emitFontSizeChanged,
  emitFontFavorited,
  emitFontUnfavorited,
  emitFontSearch,
  emitAlignmentCycled,
  emitCaseCycled,
  emitStyleToggled,
  emitEffectsPlaceholderClicked,
} from "./text-panel-events";
import { STATIC_FONT_REGISTRY, filterFonts, type FontStyle, type FontMood, type FontLanguage } from "@/app/lib/font-registry";
import { loadFont } from "@/app/lib/font-loader";

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

// Filter state types
type FilterState = {
  styles: FontStyle[];
  moods: FontMood[];
  languages: FontLanguage[];
};

export const FabricTextPropertiesPanelEnhanced = ({
  textbox,
  onUpdateTextbox,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onClose,
}: FabricTextPropertiesPanelProps) => {
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteFonts, setFavoriteFonts] = useState<Set<string>>(new Set());
  const [visibleFonts, setVisibleFonts] = useState(12);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    styles: [] as string[],
    moods: [] as string[],
    languages: [] as string[],
    sources: [] as string[]
  });
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0, width: 0 });
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("fabric-favorite-fonts");
    if (stored) {
      try {
        setFavoriteFonts(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Failed to load favorite fonts:", e);
      }
    }
  }, []);

  // Calculate popover position when filter opens
  useEffect(() => {
    if (isFilterOpen && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      const searchBarContainer = filterButtonRef.current.parentElement;
      if (searchBarContainer) {
        const containerRect = searchBarContainer.getBoundingClientRect();
        setPopoverPosition({
          top: containerRect.bottom + 8, // 8px gap below the search bar
          left: containerRect.left + 16, // Match the 16px padding (left-4)
          width: containerRect.width - 32 // Account for left and right padding
        });
      }
    }
  }, [isFilterOpen]);

  // Handle click outside and ESC key for filter popover
  useEffect(() => {
    if (!isFilterOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const popover = document.querySelector('[data-filter-popover]');
      const filterButton = filterButtonRef.current;

      if (popover && !popover.contains(target) && filterButton && !filterButton.contains(target)) {
        setIsFilterOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFilterOpen(false);
      }
    };

    // Prevent scrolling on the font list container when popover is open
    const fontListContainer = document.querySelector('[data-font-list-container]') as HTMLElement;
    if (fontListContainer) {
      fontListContainer.style.overflow = 'hidden';
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);

      // Restore scrolling
      if (fontListContainer) {
        fontListContainer.style.overflow = '';
      }
    };
  }, [isFilterOpen]);

  // Delay rendering for smooth initialization
  useEffect(() => {
    if (!textbox) {
      setIsReady(false);
      return;
    }
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, [textbox]);

  // Extract properties with safe defaults (with null checks for hooks rule)
  const fillColor = textbox ? (typeof textbox.fill === "string" ? textbox.fill : "#000000") : "#000000";
  const fontSize = textbox ? Math.round(textbox.fontSize || 24) : 24;
  const fontFamily = textbox?.fontFamily || "Arial";
  const textAlign = textbox?.textAlign || "left";
  const charSpacing = textbox ? Math.round(textbox.charSpacing || 0) : 0;
  const lineHeight = textbox ? Number(textbox.lineHeight || 1.16).toFixed(2) : "1.16";
  const opacity = textbox?.opacity !== undefined ? textbox.opacity : 1;

  // Normalize fontWeight
  let fontWeightValue = 400;
  if (textbox) {
    if (typeof textbox.fontWeight === 'number') {
      fontWeightValue = textbox.fontWeight;
    } else if (textbox.fontWeight === 'bold') {
      fontWeightValue = 700;
    } else if (textbox.fontWeight === 'normal') {
      fontWeightValue = 400;
    }
  }

  // Check active states
  const isBold = textbox ? (textbox.fontWeight === "bold" || textbox.fontWeight === 700) : false;
  const isItalic = textbox?.fontStyle === "italic";
  const isUnderline = textbox?.underline === true;
  const isStrikethrough = textbox?.linethrough === true;

  // Toggle styles
  const toggleStyle = useCallback((style: "bold" | "italic" | "underline" | "strikethrough") => {
    if (!textbox) return;

    if (style === "bold") {
      const newValue = isBold ? 400 : 700;
      onUpdateTextbox("fontWeight", newValue);
      emitStyleToggled("bold", !isBold);
    } else if (style === "italic") {
      const newValue = isItalic ? "normal" : "italic";
      onUpdateTextbox("fontStyle", newValue);
      emitStyleToggled("italic", !isItalic);
    } else if (style === "underline") {
      onUpdateTextbox("underline", !isUnderline);
      emitStyleToggled("underline", !isUnderline);
    } else if (style === "strikethrough") {
      onUpdateTextbox("linethrough", !isStrikethrough);
      emitStyleToggled("strikethrough", !isStrikethrough);
    }
  }, [textbox, isBold, isItalic, isUnderline, isStrikethrough, onUpdateTextbox]);

  // Cycle text alignment
  const cycleAlignment = useCallback(() => {
    const alignments = ["left", "center", "right", "justify"];
    const currentIndex = alignments.indexOf(textAlign);
    const nextIndex = (currentIndex + 1) % alignments.length;
    const newAlignment = alignments[nextIndex];
    onUpdateTextbox("textAlign", newAlignment);
    emitAlignmentCycled(newAlignment);
  }, [textAlign, onUpdateTextbox]);

  // Get alignment icon path
  const getAlignmentIcon = () => {
    switch (textAlign) {
      case "center": return "/icons/align-center-solid-full.svg";
      case "right": return "/icons/align-right-solid-full.svg";
      case "justify": return "/icons/align-justify-solid-full.svg";
      default: return "/icons/align-left-solid-full.svg";
    }
  };

  // Cycle text case
  const cycleCase = useCallback(() => {
    if (!textbox) return;

    const currentText = textbox.text || "";
    let caseType = "";
    if (currentText === currentText.toLowerCase()) {
      onUpdateTextbox("text", currentText.toUpperCase());
      caseType = "UPPER";
    } else if (currentText === currentText.toUpperCase()) {
      onUpdateTextbox("text", currentText.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      ));
      caseType = "Title";
    } else {
      onUpdateTextbox("text", currentText.toLowerCase());
      caseType = "lower";
    }
    emitCaseCycled(caseType);
  }, [textbox, onUpdateTextbox]);

  // Set specific alignment
  const setAlignment = useCallback((align: string) => {
    onUpdateTextbox("textAlign", align);
  }, [onUpdateTextbox]);

  // Font size adjustments
  const adjustFontSize = useCallback((delta: number) => {
    const newSize = Math.max(8, Math.min(200, fontSize + delta));
    onUpdateTextbox("fontSize", newSize);
  }, [fontSize, onUpdateTextbox]);

  // Keyboard shortcuts - MUST be called before any return
  useTextShortcuts({
    onToggleBold: () => toggleStyle("bold"),
    onToggleItalic: () => toggleStyle("italic"),
    onToggleUnderline: () => toggleStyle("underline"),
    onAlignLeft: () => setAlignment("left"),
    onAlignCenter: () => setAlignment("center"),
    onAlignRight: () => setAlignment("right"),
    onAlignJustify: () => setAlignment("justify"),
    onDecreaseFontSize: () => adjustFontSize(-2),
    onIncreaseFontSize: () => adjustFontSize(2),
    onDelete: () => onDelete?.(),
    enabled: !!textbox && isReady,
  });

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    setFavoriteFonts(newFavorites);
    localStorage.setItem("fabric-favorite-fonts", JSON.stringify([...newFavorites]));
  };

  const toggleFavorite = (fontFamily: string) => {
    const newFavorites = new Set(favoriteFonts);
    if (newFavorites.has(fontFamily)) {
      newFavorites.delete(fontFamily);
      emitFontUnfavorited(fontFamily);
    } else {
      newFavorites.add(fontFamily);
      emitFontFavorited(fontFamily);
    }
    saveFavorites(newFavorites);
  };

  // Filter fonts by search query AND active filters
  const filteredFonts = useMemo(() => {
    let fonts = STATIC_FONT_REGISTRY;

    // Apply search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      fonts = fonts.filter(font =>
        font.name.toLowerCase().includes(lowerQuery) ||
        font.family.toLowerCase().includes(lowerQuery) ||
        font.displayName.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply tag filters
    const hasActiveFilters =
      activeFilters.styles.length > 0 ||
      activeFilters.moods.length > 0 ||
      activeFilters.languages.length > 0 ||
      activeFilters.sources.length > 0;

    if (hasActiveFilters) {
      fonts = fonts.filter(font => {
        // Filter by styles
        if (activeFilters.styles.length > 0) {
          const hasStyle = activeFilters.styles.some(style =>
            font.tags.styles.includes(style.toLowerCase() as FontStyle)
          );
          if (!hasStyle) return false;
        }

        // Filter by moods
        if (activeFilters.moods.length > 0) {
          const hasMood = activeFilters.moods.some(mood =>
            font.tags.moods.includes(mood.toLowerCase() as FontMood)
          );
          if (!hasMood) return false;
        }

        // Filter by languages
        if (activeFilters.languages.length > 0) {
          const hasLanguage = activeFilters.languages.some(lang =>
            font.tags.languages.includes(lang.toLowerCase() as FontLanguage)
          );
          if (!hasLanguage) return false;
        }

        // Filter by source
        if (activeFilters.sources.length > 0) {
          const sourceMap: Record<string, string> = {
            'Google': 'google',
            'Local': 'admin-custom',
            'Uploaded': 'user-upload'
          };
          const hasSources = activeFilters.sources.some(source =>
            font.source === sourceMap[source]
          );
          if (!hasSources) return false;
        }

        return true;
      });
    }

    return fonts;
  }, [searchQuery, activeFilters]);

  // Auto-load visible fonts when they appear in the viewport
  useEffect(() => {
    if (!isReady || filteredFonts.length === 0) return;

    // Load fonts that are currently visible (based on visibleFonts count)
    const fontsToLoad = filteredFonts.slice(0, visibleFonts);

    // Load all visible fonts
    fontsToLoad.forEach(font => {
      loadFont(font.family).catch(err => {
        console.warn(`Failed to preload font: ${font.family}`, err);
      });
    });
  }, [filteredFonts, visibleFonts, isReady]);

  // Icon button style helper
  const iconButtonClass = (isActive: boolean) =>
    `w-11 h-11 flex items-center justify-center border transition-all ${
      isActive
        ? "bg-black border-black"
        : "bg-white border-black hover:bg-gray-100"
    }`;

  // Early return AFTER all hooks
  if (!textbox || !isReady) {
    return null;
  }

  return (
    <div
      className="fixed right-0 top-0 bottom-0 overflow-hidden"
      style={{
        zIndex: 999999,
        width: "650px",
        fontFamily: 'var(--font-shantell-sans, "Shantell Sans", cursive)'
      }}
    >
      {/* Responsive Container */}
      <div className="h-full flex flex-col xl:flex-row xl:items-start">

        {/* Section A: Properties (Compact Toolbar) - 250px */}
        <div className="xl:w-[250px] lg:w-[250px] md:w-full border-2 border-black border-r-0 p-4 pb-8 xl:flex-shrink-0 bg-white shadow-md">
          <div className="space-y-4">

            {/* Inline Toggles - 4 buttons per row */}
            <div className="grid grid-cols-4 gap-2">
              {/* Row 1: Color + Bold + Italic + Underline + Strikethrough */}

              {/* Color Swatch */}
              <div className="relative">
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => onUpdateTextbox("fill", e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Pick color"
                />
                <div
                  className="w-11 h-11 border-2 border-gray-300 cursor-pointer"
                  style={{ backgroundColor: fillColor }}
                />
              </div>

              {/* Bold */}
              <button
                onClick={() => toggleStyle("bold")}
                className={iconButtonClass(isBold)}
                title="Bold (Cmd/Ctrl+B)"
              >
                <Image
                  src="/icons/b-solid-full.svg"
                  alt="Bold"
                  width={22}
                  height={22}
                  className={isBold ? "invert" : ""}
                />
              </button>

              {/* Italic */}
              <button
                onClick={() => toggleStyle("italic")}
                className={iconButtonClass(isItalic)}
                title="Italic (Cmd/Ctrl+I)"
              >
                <Image
                  src="/icons/italic-solid-full.svg"
                  alt="Italic"
                  width={22}
                  height={22}
                  className={isItalic ? "invert" : ""}
                />
              </button>

              {/* Underline */}
              <button
                onClick={() => toggleStyle("underline")}
                className={iconButtonClass(isUnderline)}
                title="Underline (Cmd/Ctrl+U)"
              >
                <Image
                  src="/icons/underline-solid-full.svg"
                  alt="Underline"
                  width={22}
                  height={22}
                  className={isUnderline ? "invert" : ""}
                />
              </button>

              {/* Strikethrough */}
              <button
                onClick={() => toggleStyle("strikethrough")}
                className={iconButtonClass(isStrikethrough)}
                title="Strikethrough"
              >
                <Image
                  src="/icons/strikethrough-solid-full.svg"
                  alt="Strikethrough"
                  width={22}
                  height={22}
                  className={isStrikethrough ? "invert" : ""}
                />
              </button>

              {/* Row 2: Case + Alignment + Clone */}

              {/* Case Toggle */}
              <button
                onClick={cycleCase}
                className={iconButtonClass(false)}
                title="Toggle case"
              >
                <Image
                  src="/icons/a-solid-full.svg"
                  alt="Case"
                  width={22}
                  height={22}
                />
              </button>

              {/* Alignment Cycle */}
              <button
                onClick={cycleAlignment}
                className={iconButtonClass(false)}
                title={`Align ${textAlign}`}
              >
                <Image
                  src={getAlignmentIcon()}
                  alt="Alignment"
                  width={22}
                  height={22}
                />
              </button>

              {/* Clone */}
              {onDuplicate && (
                <button
                  onClick={onDuplicate}
                  className={iconButtonClass(false)}
                  title="Duplicate"
                >
                  <Image
                    src="/icons/clone-regular-full.svg"
                    alt="Clone"
                    width={22}
                    height={22}
                  />
                </button>
              )}
            </div>

            {/* Letter Spacing */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700" style={{ fontFamily: 'var(--font-shantell-sans, "Shantell Sans", cursive)' }}>Letter spacing</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={charSpacing}
                  onChange={(e) => onUpdateTextbox("charSpacing", Number(e.target.value))}
                  min="-200"
                  max="400"
                  className="w-16 px-2 py-1 border border-black text-sm text-center"
                />
                <CustomSlider
                  value={charSpacing}
                  onChange={(value) => onUpdateTextbox("charSpacing", value)}
                  min={-200}
                  max={400}
                  step={5}
                  label="Letter spacing"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Line Spacing */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700" style={{ fontFamily: 'var(--font-shantell-sans, "Shantell Sans", cursive)' }}>Line spacing</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={lineHeight}
                  onChange={(e) => onUpdateTextbox("lineHeight", Number(e.target.value))}
                  min="0.5"
                  max="3"
                  step="0.1"
                  className="w-16 px-2 py-1 border border-black text-sm text-center"
                />
                <CustomSlider
                  value={Number(lineHeight)}
                  onChange={(value) => onUpdateTextbox("lineHeight", value)}
                  min={0.5}
                  max={3}
                  step={0.1}
                  label="Line spacing"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Transparency */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700" style={{ fontFamily: 'var(--font-shantell-sans, "Shantell Sans", cursive)' }}>Transparency</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={Math.round(opacity * 100)}
                  onChange={(e) => onUpdateTextbox("opacity", Number(e.target.value) / 100)}
                  min="0"
                  max="100"
                  className="w-16 px-2 py-1 border border-black text-sm text-center"
                />
                <CustomSlider
                  value={opacity * 100}
                  onChange={(value) => onUpdateTextbox("opacity", value / 100)}
                  min={0}
                  max={100}
                  step={1}
                  label="Transparency"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Weight & Size - Single Row */}
            <div className="flex items-center gap-3">
              {/* Weight */}
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-700 block mb-2" style={{ fontFamily: 'var(--font-shantell-sans, "Shantell Sans", cursive)' }}>Weight</label>
                <input
                  type="number"
                  value={fontWeightValue}
                  onChange={(e) => onUpdateTextbox("fontWeight", Number(e.target.value))}
                  min="100"
                  max="900"
                  step="100"
                  className="w-full px-3 py-2 border border-black text-sm text-center"
                />
              </div>

              {/* Size */}
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-700 block mb-2" style={{ fontFamily: 'var(--font-shantell-sans, "Shantell Sans", cursive)' }}>Size</label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    onUpdateTextbox("fontSize", newSize);
                    emitFontSizeChanged(fontSize, newSize);
                  }}
                  min="8"
                  max="200"
                  className="w-full px-3 py-2 border border-black text-sm text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section B: Fonts & Effects (Full Height) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white border-2 border-black shadow-md">

          {/* Fonts Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search Bar and Filter Button */}
            <div className="p-4 border-b border-gray-200 relative">
              <div className="flex items-center" style={{ gap: '12px' }}>
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Image
                    src="/icons/search-01-stroke-rounded.svg"
                    alt="Search"
                    width={16}
                    height={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setSearchQuery(query);
                      emitFontSearch(query);
                    }}
                    placeholder='Search "cursive font" or "Inter"'
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-100 border-2 border-gray-300 text-black text-sm placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors font-sans"
                    style={{ fontFamily: 'var(--font-shantell-sans)', lineHeight: '1.0' }}
                  />
                </div>

                {/* Filter Button */}
                <button
                  ref={filterButtonRef}
                  data-filter-button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`relative w-[41px] h-[41px] flex items-center justify-center border transition-colors ${
                    isFilterOpen
                      ? "bg-black border-black"
                      : "bg-white border-black hover:bg-[#F5F5F5]"
                  }`}
                  aria-label="Filter fonts"
                >
                  <img
                    src="/icons/filter-horizontal-stroke-rounded.svg"
                    alt="Filter"
                    className={`w-5 h-5 ${isFilterOpen ? "invert" : ""}`}
                  />
                  {/* Badge */}
                  {(activeFilters.styles.length > 0 || activeFilters.moods.length > 0 ||
                    activeFilters.languages.length > 0 || activeFilters.sources.length > 0) && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                      {activeFilters.styles.length + activeFilters.moods.length +
                       activeFilters.languages.length + activeFilters.sources.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Filter Popover */}
              {isFilterOpen && (
                <div
                  data-filter-popover
                  className="bg-white border border-black p-4 max-h-[60vh] overflow-y-auto"
                  style={{
                    position: 'fixed',
                    top: `${popoverPosition.top}px`,
                    left: `${popoverPosition.left}px`,
                    width: `${popoverPosition.width}px`,
                    animation: 'filterPopoverOpen 120ms ease-out',
                    transformOrigin: 'top',
                    zIndex: 999999,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Styles */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-shantell-sans)' }}>Styles</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Serif', 'Sans', 'Slab', 'Script', 'Display', 'Mono', 'Handwritten'].map((style) => (
                        <button
                          key={style}
                          onClick={() => {
                            setActiveFilters(prev => ({
                              ...prev,
                              styles: prev.styles.includes(style)
                                ? prev.styles.filter(s => s !== style)
                                : [...prev.styles, style]
                            }));
                          }}
                          className={`px-3 py-1.5 text-sm border transition-colors ${
                            activeFilters.styles.includes(style)
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                          }`}
                          style={{ fontFamily: 'var(--font-shantell-sans)', lineHeight: '1.0' }}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Moods */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-shantell-sans)' }}>Moods/Use-cases</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Elegant', 'Playful', 'Tech', 'Vintage', 'Headline', 'Body'].map((mood) => (
                        <button
                          key={mood}
                          onClick={() => {
                            setActiveFilters(prev => ({
                              ...prev,
                              moods: prev.moods.includes(mood)
                                ? prev.moods.filter(m => m !== mood)
                                : [...prev.moods, mood]
                            }));
                          }}
                          className={`px-3 py-1.5 text-sm border transition-colors ${
                            activeFilters.moods.includes(mood)
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                          }`}
                          style={{ fontFamily: 'var(--font-shantell-sans)', lineHeight: '1.0' }}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-shantell-sans)' }}>Language Support</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Latin', 'Cyrillic', 'Arabic', 'Devanagari'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setActiveFilters(prev => ({
                              ...prev,
                              languages: prev.languages.includes(lang)
                                ? prev.languages.filter(l => l !== lang)
                                : [...prev.languages, lang]
                            }));
                          }}
                          className={`px-3 py-1.5 text-sm border transition-colors ${
                            activeFilters.languages.includes(lang)
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                          }`}
                          style={{ fontFamily: 'var(--font-shantell-sans)', lineHeight: '1.0' }}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sources */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-shantell-sans)' }}>Foundry/Source</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Google', 'Local', 'Uploaded'].map((source) => (
                        <button
                          key={source}
                          onClick={() => {
                            setActiveFilters(prev => ({
                              ...prev,
                              sources: prev.sources.includes(source)
                                ? prev.sources.filter(s => s !== source)
                                : [...prev.sources, source]
                            }));
                          }}
                          className={`px-3 py-1.5 text-sm border transition-colors ${
                            activeFilters.sources.includes(source)
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                          }`}
                          style={{ fontFamily: 'var(--font-shantell-sans)', lineHeight: '1.0' }}
                        >
                          {source}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setActiveFilters({
                          styles: [],
                          moods: [],
                          languages: [],
                          sources: []
                        });
                      }}
                      className="text-sm text-gray-600 hover:text-black transition-colors"
                      style={{ fontFamily: 'var(--font-shantell-sans)', lineHeight: '1.0' }}
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
                      style={{ fontFamily: 'var(--font-shantell-sans)', lineHeight: '1.0' }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Add Font Button - New Row */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => console.log("Add font clicked")}
                  className="px-4 py-2.5 bg-black text-white text-sm font-medium whitespace-nowrap hover:bg-gray-800 transition-colors flex items-center justify-center"
                  style={{ fontFamily: 'var(--font-shantell-sans)', lineHeight: '1.0' }}
                >
                  Add font
                </button>
              </div>
            </div>

            {/* Font List - Adaptive Flex Layout */}
            <div data-font-list-container className="flex-1 overflow-y-auto px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {filteredFonts.slice(0, visibleFonts).map((font) => {
                  const isFavorite = favoriteFonts.has(font.family);
                  const isSelected = fontFamily === font.family;

                  return (
                    <div
                      key={font.family}
                      className={`relative group px-3 py-2 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => onUpdateTextbox("fontFamily", font.family)}
                      style={{ maxWidth: 'calc(50% - 0.25rem)', minWidth: '120px', flex: '1 1 auto' }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-base font-semibold truncate ${
                              isSelected ? "text-black" : "text-gray-900"
                            }`}
                            style={{ fontFamily: font.family }}
                            title={font.name}
                          >
                            {font.name}
                          </div>
                          {/* Show font tags on hover */}
                          <div className="text-[10px] text-gray-400 mt-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                            {font.tags.moods.slice(0, 2).join(", ")}
                          </div>
                        </div>

                        {/* Star Favorite - show on hover or if favorited */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(font.family);
                          }}
                          className={`flex-shrink-0 transition-opacity ${
                            isFavorite
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          <Image
                            src={isFavorite ? "/icons/star-solid-full.svg" : "/icons/star-regular-full.svg"}
                            alt="Favorite"
                            width={14}
                            height={14}
                            className="text-gray-600"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* More/Less Buttons - Single Row */}
              {(visibleFonts < filteredFonts.length || visibleFonts > 12) && (
                <div className="mt-3 flex gap-2">
                  {visibleFonts < filteredFonts.length && (
                    <button
                      onClick={() => setVisibleFonts(prev => prev + 12)}
                      className="flex-1 py-2.5 border border-gray-300 text-sm hover:bg-gray-50 flex items-center justify-center"
                      style={{ fontFamily: 'var(--font-shantell-sans)', lineHeight: '1.0' }}
                    >
                      more
                    </button>
                  )}
                  {visibleFonts > 12 && (
                    <button
                      onClick={() => setVisibleFonts(12)}
                      className="flex-1 py-2.5 border border-gray-300 text-sm hover:bg-gray-50 flex items-center justify-center"
                      style={{ fontFamily: 'var(--font-shantell-sans)', lineHeight: '1.0' }}
                    >
                      see less
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Effects Section */}
          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold mb-3">Effects</h3>

            {/* 3 Column Grid - 6 items (2 rows) */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "Extrude type", gradient: "from-blue-400 via-purple-400 to-pink-400" },
                { name: "another style", gradient: "from-purple-400 via-pink-400 to-purple-500" },
                { name: "Extrude type", gradient: "from-blue-400 via-purple-400 to-pink-400" },
                { name: "another style", gradient: "from-pink-400 via-purple-400 to-blue-400" },
                { name: "Shadow effect", gradient: "from-green-400 via-blue-400 to-purple-400" },
                { name: "Glow style", gradient: "from-yellow-400 via-orange-400 to-red-400" },
              ].map((effect, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    console.log("Effect placeholder clicked:", effect.name);
                    emitEffectsPlaceholderClicked(effect.name);
                  }}
                  className="group"
                >
                  <div className={`w-full aspect-[4/3] bg-gradient-to-br ${effect.gradient} mb-2 group-hover:scale-105 transition-transform`} />
                  <div className="text-xs text-center text-gray-600">{effect.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
