"use client";

import React, { useState } from "react";
import { Search, Layout, Sparkles, BookOpen } from "lucide-react";

type FontSelectorProps = {
  onClose?: () => void;
  onFontSelect?: (fontFamily: string) => void;
};

type TabType = "search" | "combinations" | "apps" | "styles";

export const FontSelector = ({ onClose, onFontSelect }: FontSelectorProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("search");

  const tabs = [
    { id: "search" as TabType, label: "Search fonts", icon: Search },
    { id: "combinations" as TabType, label: "Font combinations", icon: Layout },
    { id: "apps" as TabType, label: "Font apps", icon: Sparkles },
    { id: "styles" as TabType, label: "Book styles", icon: BookOpen },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="grid grid-cols-2 gap-2 p-4 border-b bg-gray-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium text-center">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "search" && <SearchFontsTab onFontSelect={onFontSelect} />}
        {activeTab === "combinations" && <FontCombinationsTab />}
        {activeTab === "apps" && <FontAppsTab />}
        {activeTab === "styles" && <BookStylesTab />}
      </div>
    </div>
  );
};

// Popular Google Fonts list
const POPULAR_GOOGLE_FONTS = [
  "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald",
  "Raleway", "PT Sans", "Merriweather", "Nunito", "Playfair Display",
  "Poppins", "Ubuntu", "Crimson Text", "Dancing Script", "Indie Flower",
  "Pacifico", "Bebas Neue", "Anton", "Lobster", "Righteous",
  "Archivo Black", "Permanent Marker", "Abril Fatface", "Russo One",
  "Fjalla One", "Quicksand", "Comfortaa", "Josefin Sans", "Yanone Kaffeesatz",
  "Shadows Into Light", "Caveat", "Cookie", "Great Vibes", "Satisfy",
  "Amatic SC", "Sacramento", "Bangers", "Kalam", "Courgette",
  "Yellowtail", "Cinzel", "Barlow", "Work Sans", "DM Sans",
  "Inter", "Lexend", "Space Grotesk", "Outfit", "Manrope", "Sora"
];

// Search Fonts Tab (Google Fonts integration)
const SearchFontsTab = ({ onFontSelect }: { onFontSelect?: (fontFamily: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  const filteredFonts = searchQuery
    ? POPULAR_GOOGLE_FONTS.filter(font =>
        font.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_GOOGLE_FONTS;

  const loadFont = (fontName: string) => {
    if (!loadedFonts.has(fontName)) {
      const link = document.createElement("link");
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);
      setLoadedFonts(prev => new Set([...prev, fontName]));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Google Fonts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredFonts.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            <Search size={32} className="mx-auto mb-2 opacity-50" />
            <p>No fonts found</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredFonts.map((fontName) => {
              loadFont(fontName);
              return (
                <button
                  key={fontName}
                  onClick={() => {
                    if (onFontSelect) {
                      onFontSelect(fontName);
                    }
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                  onMouseEnter={() => loadFont(fontName)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{fontName}</span>
                    <span className="text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: `'${fontName}', sans-serif`,
                      fontSize: "18px",
                    }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Font Combinations Tab
const FontCombinationsTab = () => {
  return (
    <div className="p-4">
      <div className="text-center text-gray-400 text-sm py-8">
        <Layout size={32} className="mx-auto mb-2 opacity-50" />
        <p>Pre-designed font pairings</p>
        <p className="text-xs mt-1">(Coming soon)</p>
      </div>
    </div>
  );
};

// Font Apps Tab
const FontAppsTab = () => {
  return (
    <div className="p-4">
      <div className="text-center text-gray-400 text-sm py-8">
        <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
        <p>Custom font apps</p>
        <p className="text-xs mt-1">(Coming soon)</p>
      </div>
    </div>
  );
};

// Book Styles Tab
const BookStylesTab = () => {
  return (
    <div className="p-4">
      <div className="text-center text-gray-400 text-sm py-8">
        <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
        <p>Book cover style templates</p>
        <p className="text-xs mt-1">(Coming soon)</p>
      </div>
    </div>
  );
};
