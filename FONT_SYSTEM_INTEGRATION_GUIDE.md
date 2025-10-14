# Font System Integration Guide

## ✅ What's Been Completed

I've built a complete font management system with:

1. **Font Registry** (`app/lib/font-registry.ts`)
   - All your 11 Google Fonts from currentprompt.txt
   - Tags for filtering (styles, moods, languages)
   - Helper functions for searching and filtering

2. **Dynamic Font Loader** (`app/lib/font-loader.ts`)
   - On-demand loading (fonts load when hovered/selected)
   - Prevents duplicate loading
   - Supports Google Fonts, custom fonts, and user uploads

3. **Convex Schema** (`convex/schema.ts`)
   - New `fonts` table for user-uploaded fonts
   - Full metadata support

4. **Convex API** (`convex/fonts.ts`)
   - Functions for uploading/managing user fonts
   - Search and query functions

---

## 🎯 How the System Works

### Font Registry Structure

```typescript
// Each font has this structure:
{
  name: "Kablammo",
  family: "Kablammo",
  category: "display",
  source: "google",
  googleFontName: "Kablammo",
  variants: {
    weights: [400],           // Available weights
    styles: ["normal"],       // Can it be italic?
    hasVariable: true,
    variableAxes: ["MORF"]   // Special axes (Kablammo has morphing)
  },
  tags: {
    styles: ["display"],
    moods: ["playful", "headline", "awkward"],
    languages: ["latin"]
  }
}
```

###  Tag System (Matches Your Filter UI)

**Styles** (what your filter calls "Styles"):
- `serif`, `sans`, `slab`, `script`, `display`, `mono`, `handwritten`

**Moods** (what your filter calls "Moods/Use-cases"):
- `elegant`, `playful`, `tech`, `vintage`, `headline`, `body`, `awkward`, `seasonal`

**Languages**:
- `latin`, `cyrillic`, `arabic`, `devanagari`

**Source** (what your filter calls "Foundry/Source"):
- `google`, `admin-custom` (Local), `user-upload` (Uploaded)

---

## 🔧 Integration Steps

### Step 1: Update Your Text Panel Component

In `fabric-text-properties-panel-enhanced.tsx`, make these changes:

#### A. Replace imports at the top:

```typescript
// Add these imports
import { STATIC_FONT_REGISTRY, filterFonts, type FontStyle, type FontMood, type FontLanguage } from "@/app/lib/font-registry";
import { loadFont } from "@/app/lib/font-loader";
```

#### B. Replace the old `FONT_LIST` with:

```typescript
// Remove this:
const FONT_LIST = [
  { name: "Yeseva ONE", family: "Yeseva One" },
  // ... old list
];

// The fonts now come from STATIC_FONT_REGISTRY instead!
```

#### C. Update the filtered fonts logic:

Find your `filteredFonts` useMemo (around line 267) and replace it with:

```typescript
// Filter fonts by search query AND active filters
const filteredFonts = useMemo(() => {
  let fonts = STATIC_FONT_REGISTRY;

  // Apply search
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    fonts = fonts.filter(font =>
      font.name.toLowerCase().includes(lowerQuery) ||
      font.family.toLowerCase().includes(lowerQuery)
    );
  }

  // Apply filters from your filter UI
  const hasActiveFilters =
    activeFilters.styles.length > 0 ||
    activeFilters.moods.length > 0 ||
    activeFilters.languages.length > 0;

  if (hasActiveFilters) {
    fonts = filterFonts({
      styles: activeFilters.styles as FontStyle[],
      moods: activeFilters.moods as FontMood[],
      languages: activeFilters.languages as FontLanguage[],
    });
  }

  return fonts;
}, [searchQuery, activeFilters]);
```

#### D. Add on-demand font loading to your font list:

Find where you render the font list (around line 545-586) and update it:

```typescript
{filteredFonts.slice(0, visibleFonts).map((font) => {
  const isFavorite = favoriteFonts.has(font.family);
  const isSelected = fontFamily === font.family;

  return (
    <div
      key={font.family}
      className={`relative group p-3 cursor-pointer transition-colors ${
        isSelected ? "bg-blue-50 border border-blue-300" : "bg-gray-50 hover:bg-gray-100"
      }`}
      onClick={() => onUpdateTextbox("fontFamily", font.family)}
      onMouseEnter={() => loadFont(font.family)}  // 👈 LOAD ON HOVER!
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div
            className="text-lg font-medium"
            style={{ fontFamily: font.family }}
          >
            {font.name}
          </div>
          {/* Show tags */}
          <div className="text-xs text-gray-500 mt-1">
            {font.tags.moods.join(", ")}
          </div>
        </div>

        {/* Star Favorite */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(font.family);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Image
            src={isFavorite ? "/icons/star-solid-full.svg" : "/icons/star-regular-full.svg"}
            alt="Favorite"
            width={18}
            height={18}
            className={isFavorite ? "" : "opacity-50"}
          />
        </button>
      </div>
    </div>
  );
})}
```

---

### Step 2: Update Your Filter Logic

Your existing filter UI should work! Just make sure:

1. When user clicks a filter chip (e.g., "Serif"), update `activeFilters.styles`
2. When user clicks a mood chip (e.g., "Playful"), update `activeFilters.moods`
3. The `filteredFonts` useMemo will automatically re-filter

Example filter toggle function:

```typescript
const toggleFilter = (category: 'styles' | 'moods' | 'languages', value: string) => {
  setActiveFilters(prev => {
    const current = prev[category];
    const newValues = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    return { ...prev, [category]: newValues };
  });
};
```

---

## 📝 Adding New Fonts Daily

### Option 1: Add Google Font (2 minutes)

1. Open `app/lib/font-registry.ts`
2. Add to the `GOOGLE_FONTS` array:

```typescript
{
  name: "Your Font Name",
  family: "Your Font Name",
  displayName: "Your Font Name - Description",
  category: "sans",  // or "serif", "display", etc.
  source: "google",
  googleFontName: "Your+Font+Name",  // URL-encoded
  variants: {
    weights: [400, 700],  // Check Google Fonts page!
    styles: ["normal", "italic"],  // Check if italic exists
    hasVariable: false,
  },
  tags: {
    styles: ["sans"],
    moods: ["tech", "headline"],
    languages: ["latin"],
  },
},
```

3. **Done!** The font will appear in your app and load on-demand.

### Option 2: Add Free Non-Google Font (10 minutes)

1. Download font from Font Squirrel
2. Convert to `.woff2` if needed
3. Create folder: `public/fonts/font-name/`
4. Place files:
   ```
   public/fonts/league-spartan/
   ├── league-spartan-400.woff2
   ├── league-spartan-700.woff2
   ```
5. Add to `ADMIN_CUSTOM_FONTS` in font-registry.ts:

```typescript
{
  name: "League Spartan",
  family: "League Spartan",
  displayName: "League Spartan - Premium",
  category: "sans",
  source: "admin-custom",
  filePath: "/fonts/league-spartan",
  variants: {
    weights: [400, 700],
    styles: ["normal"],
    hasVariable: false,
  },
  tags: {
    styles: ["sans"],
    moods: ["tech", "headline"],
    languages: ["latin"],
  },
},
```

---

## 🎨 Tagging Guide

When adding fonts, choose tags that match your filter UI:

### Styles (Primary Category)
- **Serif**: Traditional, elegant fonts (e.g., Playfair Display, Times New Roman)
- **Sans**: Clean, modern without serifs (e.g., Inter, Helvetica)
- **Slab**: Serif fonts with thick, blocky serifs (e.g., Roboto Slab)
- **Script**: Handwritten, flowing (e.g., Pacifico, Dancing Script)
- **Display**: Big, bold, decorative - for headlines only
- **Mono**: Fixed-width, code fonts (e.g., Courier New)
- **Handwritten**: Natural handwriting style

### Moods (Use Cases)
- **elegant**: Sophisticated, classy
- **playful**: Fun, casual, quirky
- **tech**: Modern, digital, professional
- **vintage**: Retro, old-school
- **headline**: Bold, attention-grabbing
- **body**: Readable for long paragraphs
- **awkward**: Weird, unconventional
- **seasonal**: Holiday/theme specific

### Languages
- **latin**: English, most European languages
- **cyrillic**: Russian, Ukrainian
- **arabic**: Arabic script
- **devanagari**: Hindi, Sanskrit

---

## 🚀 Testing

1. Start your dev server: `npm run dev`
2. Open a board and create a text widget
3. Open the text properties panel
4. **Hover over a font** → Should load on-demand (check console for "✅ Font loaded" message)
5. **Click a filter** → Fonts should filter by tags
6. **Search for a font** → Should filter by name

---

## 🔮 Future: User Font Upload

When you're ready to add user uploads:

1. Create upload UI component (button + file input)
2. Use `convex/fonts.ts` functions:
   ```typescript
   // Generate upload URL
   const uploadUrl = await generateUploadUrl.mutate();

   // Upload file
   const result = await fetch(uploadUrl, {
     method: "POST",
     body: fontFile,
   });

   const { storageId } = await result.json();

   // Save to database
   await uploadFont.mutate({
     name: "My Custom Font",
     family: "My Custom Font",
     // ... other fields
     storageId,
   });
   ```

3. User fonts will appear in the font list automatically!

---

## 📊 Current Font List

Your app now has **11 Google Fonts**:

1. Edu NSW ACT Cursive (handwritten)
2. BBH Sans Bartle (sans)
3. Playwrite US Modern (handwritten)
4. Playwrite DE Grund Guides (handwritten)
5. Barrio (display)
6. Oi (display)
7. Kablammo (display - with morphing!)
8. Rubik Gemstones (display)
9. Rubik Wet Paint (display)
10. Butcherman (display)
11. Rubik Dirt (display)

All fonts load **on-demand** when hovered!

---

## 🐛 Troubleshooting

**Fonts not loading?**
- Check browser console for errors
- Verify `googleFontName` is URL-encoded (spaces = `+`)
- Make sure weights match what's available on Google Fonts

**Filters not working?**
- Check that `activeFilters` state is being updated
- Verify tags match exactly (case-sensitive)
- Console.log `filteredFonts` to debug

**Custom fonts not appearing?**
- Check file paths match exactly
- Verify `.woff2` files are in `/public/fonts/`
- Check browser Network tab for 404 errors

---

## 📞 Next Steps

To fully integrate:

1. Update your `fabric-text-properties-panel-enhanced.tsx` with the changes above
2. Test font loading by hovering
3. Test filters by clicking filter chips
4. Add more fonts to `font-registry.ts` as needed

Let me know if you need help with any of these steps!
