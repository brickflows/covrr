# Font Tagging Reference Card

Quick reference for tagging fonts when adding them to the registry.

---

## 📋 Tag Categories

### 1. Styles (Primary Category)

Choose **one primary + optional secondary**:

| Tag | Use For | Examples |
|-----|---------|----------|
| `serif` | Traditional fonts with serifs | Times New Roman, Georgia, Playfair Display |
| `sans` | Clean fonts without serifs | Arial, Helvetica, Inter, Roboto |
| `slab` | Blocky, thick serifs | Roboto Slab, Arvo, Zilla Slab |
| `script` | Flowing, cursive | Pacifico, Dancing Script, Sacramento |
| `display` | Decorative, headlines only | Bebas Neue, Abril Fatface, Kablammo |
| `mono` | Fixed-width, code fonts | Courier New, Roboto Mono, Fira Code |
| `handwritten` | Natural handwriting | Caveat, Permanent Marker, Shadows Into Light |

**Examples:**
```typescript
// A serif font might also be display
tags: { styles: ["serif", "display"] }

// A script font is often also handwritten
tags: { styles: ["script", "handwritten"] }

// A sans font used for code
tags: { styles: ["sans", "mono"] }
```

---

### 2. Moods (Use Cases)

Choose **1-3 moods** that describe the font's personality:

| Tag | Feeling | Best For | Examples |
|-----|---------|----------|----------|
| `elegant` | Sophisticated, classy, luxurious | Weddings, fashion, premium brands | Playfair Display, Cormorant Garamond |
| `playful` | Fun, casual, quirky, friendly | Kids, creative, casual brands | Pacifico, Comic Sans, Fredoka |
| `tech` | Modern, digital, professional, clean | Tech companies, startups, apps | Inter, Roboto, Work Sans |
| `vintage` | Retro, old-school, nostalgic | Classic brands, throwback designs | Abril Fatface, Bebas Neue |
| `headline` | Bold, attention-grabbing | Titles, posters, banners | Anton, Bebas Neue, Archivo Black |
| `body` | Readable, comfortable for long text | Articles, books, documentation | Lato, Open Sans, Merriweather |
| `awkward` | Weird, unconventional, experimental | Art projects, unique designs | Kablammo, Butcherman |
| `seasonal` | Holiday or event-specific | Halloween, Christmas, celebrations | Butcherman (Halloween), Creepster |

**Examples:**
```typescript
// A professional sans font
tags: { moods: ["tech", "body", "headline"] }

// A fun script font
tags: { moods: ["playful", "elegant"] }

// A weird display font
tags: { moods: ["playful", "awkward", "headline"] }
```

---

### 3. Languages (Script Support)

Choose **all that apply**:

| Tag | Languages | Script |
|-----|-----------|---------|
| `latin` | English, Spanish, French, German, most European | A-Z characters |
| `cyrillic` | Russian, Ukrainian, Bulgarian, Serbian | Cyrillic script |
| `arabic` | Arabic, Persian, Urdu | Arabic script (RTL) |
| `devanagari` | Hindi, Sanskrit, Marathi, Nepali | Devanagari script |

**How to check:**
1. Go to Google Fonts page for the font
2. Look for "Languages" section
3. Add all supported scripts

**Examples:**
```typescript
// Font supports multiple scripts
tags: { languages: ["latin", "cyrillic"] }

// Most fonts only support Latin
tags: { languages: ["latin"] }
```

---

## 🎯 Quick Decision Tree

### Step 1: Choose Primary Style

```
Is it decorative/big/bold? → display
Does it look handwritten? → handwritten
Does it have flowing curves? → script
Does it have serifs?
  ├─ Thick, blocky → slab
  └─ Traditional → serif
No serifs?
  ├─ Fixed-width → mono
  └─ Variable-width → sans
```

### Step 2: Add Moods (Pick 1-3)

```
What's the vibe?
├─ Professional/Modern → tech
├─ Fancy/Sophisticated → elegant
├─ Fun/Casual → playful
├─ Old-school → vintage
├─ Readable for paragraphs → body
├─ Good for titles → headline
└─ Weird/Unusual → awkward
```

### Step 3: Language Support

```
Check Google Fonts page → Add all supported languages
Most fonts support → latin
```

---

## 💡 Tagging Examples

### Example 1: Inter (Modern Sans-Serif)

```typescript
{
  name: "Inter",
  category: "sans",  // Primary: no serifs
  tags: {
    styles: ["sans"],
    moods: ["tech", "body", "headline"],  // Versatile!
    languages: ["latin", "cyrillic"],
  }
}
```
**Why?**
- **Sans**: No serifs, clean lines
- **Tech**: Modern, designed for UI/UX
- **Body**: Very readable for long text
- **Headline**: Also works for titles
- **Latin + Cyrillic**: Check Google Fonts page

---

### Example 2: Pacifico (Script Font)

```typescript
{
  name: "Pacifico",
  category: "script",
  tags: {
    styles: ["script", "handwritten"],
    moods: ["playful", "headline"],
    languages: ["latin"],
  }
}
```
**Why?**
- **Script + Handwritten**: Flowing, brush-style
- **Playful**: Casual, fun vibe
- **Headline**: Not readable for body text
- **Latin only**: No other language support

---

### Example 3: Kablammo (Experimental Display)

```typescript
{
  name: "Kablammo",
  category: "display",
  tags: {
    styles: ["display"],
    moods: ["playful", "headline", "awkward"],
    languages: ["latin"],
  }
}
```
**Why?**
- **Display**: Decorative, not for body text
- **Playful + Awkward**: Comic book style, unusual
- **Headline**: Only for titles/posters
- **Latin only**: Single language

---

### Example 4: Playfair Display (Elegant Serif)

```typescript
{
  name: "Playfair Display",
  category: "serif",
  tags: {
    styles: ["serif", "display"],
    moods: ["elegant", "headline"],
    languages: ["latin", "cyrillic"],
  }
}
```
**Why?**
- **Serif + Display**: Has serifs, but meant for headlines
- **Elegant**: Classic, sophisticated
- **Headline**: High contrast, not ideal for body
- **Latin + Cyrillic**: Supports both

---

## 🔍 How to Research a Font

### On Google Fonts:

1. **Check weight range** → Add to `variants.weights`
   - Example: If it says "300 – 900", add `[300, 400, 500, 600, 700, 800, 900]`

2. **Check italic availability** → Add to `variants.styles`
   - If italic toggle exists → `["normal", "italic"]`
   - If no italic → `["normal"]`

3. **Check if variable** → Set `hasVariable`
   - Says "Variable" → `hasVariable: true`
   - Says "Static" → `hasVariable: false`

4. **Check languages** → Add to `tags.languages`
   - Under "Languages" section
   - Add all supported scripts

5. **Read description** → Determine moods
   - Look for keywords: "modern", "elegant", "playful", etc.
   - Check sample text to feel the vibe

---

## ⚠️ Common Mistakes

### ❌ Wrong Category
```typescript
// Pacifico is NOT a display font, it's script!
category: "display"  // WRONG

category: "script"   // CORRECT
```

### ❌ Missing Moods
```typescript
// Too few moods - be descriptive!
tags: { moods: ["tech"] }  // WRONG

tags: { moods: ["tech", "body", "headline"] }  // BETTER
```

### ❌ Wrong Language
```typescript
// Always check Google Fonts page!
tags: { languages: ["latin", "arabic"] }  // WRONG if font doesn't support Arabic

tags: { languages: ["latin"] }  // CORRECT after checking
```

### ❌ Incomplete Weights
```typescript
// Font has weights 100-900 variable
variants: { weights: [400, 700] }  // WRONG - missing weights!

variants: { weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] }  // CORRECT
```

---

## 📝 Template for Adding New Fonts

```typescript
{
  name: "Font Name",
  family: "Font Name",
  displayName: "Font Name - Short Description",
  category: "___",  // serif/sans/slab/script/display/mono/handwritten
  source: "google",  // or "admin-custom"
  googleFontName: "Font+Name",  // URL-encoded

  variants: {
    weights: [400],  // Check Google Fonts!
    styles: ["normal"],  // or ["normal", "italic"]
    hasVariable: false,  // true if variable font
  },

  tags: {
    styles: ["___"],  // Primary category + optional secondary
    moods: ["___", "___"],  // 1-3 moods
    languages: ["latin"],  // Check Google Fonts Languages section
  },
},
```

---

## 🎓 Practice Examples

Try tagging these fonts yourself, then check answers:

### Practice 1: Bebas Neue
**Hints**: All caps, geometric, bold, great for headlines
<details>
<summary>Click for answer</summary>

```typescript
{
  category: "sans",
  tags: {
    styles: ["sans", "display"],
    moods: ["headline", "tech", "vintage"],
    languages: ["latin"],
  }
}
```
</details>

### Practice 2: Dancing Script
**Hints**: Cursive, flowing, elegant, looks handwritten
<details>
<summary>Click for answer</summary>

```typescript
{
  category: "script",
  tags: {
    styles: ["script", "handwritten"],
    moods: ["elegant", "playful", "headline"],
    languages: ["latin"],
  }
}
```
</details>

---

## 🚀 Pro Tips

1. **When in doubt, be generous with moods** - It's better to have more tags than too few
2. **Always check Google Fonts page** - Don't guess weights or language support
3. **Think about actual use cases** - Where would this font be used? Tag accordingly
4. **Test the font in your app** - Does it feel "tech" or "vintage"? Tag based on feeling

---

Happy tagging! 🎨
