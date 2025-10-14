# Quick Test Guide - Font System

## ✅ Setup is Complete!

Your font system is installed and running. Here's how to test it:

---

## 🚀 Testing Steps

### 1. Open the App
**URL:** http://localhost:3005

### 2. Open Browser Console
Press `F12` or Right-click → Inspect → Console tab

### 3. Create/Open a Board
- Click "Create organization" if needed
- Create or open an existing board

### 4. Add a Text Widget
- Look for the text tool in the toolbar
- Click on the canvas to add text
- Type something (e.g., "Hello World")

### 5. Open Text Properties Panel
- Click on the text you just created
- The text properties panel should open on the right side

### 6. Test Font Loading
**Watch the console!**

- **Hover over "Kablammo"** font in the list
- You should see in console:
  ```
  ✅ Google Font loaded: Kablammo
     URL: https://fonts.googleapis.com/css2?family=Kablammo:wght@400&display=swap
  ```

- **Hover over other fonts** - each should load on-demand

### 7. Test Filtering

#### Filter by Style:
1. Click the **Filter button** (icon next to search bar)
2. Click **"Display"** chip
3. **Result:** Should show 8 fonts (all display fonts)

#### Filter by Mood:
1. Click **"Playful"** chip
2. **Result:** Should show 10 fonts

#### Combine Filters:
1. Click **"Display"** + **"Vintage"**
2. **Result:** Should show 2 fonts (Barrio, Rubik Dirt)

#### Reset Filters:
- Click **"Reset"** button at bottom of filter popover

### 8. Test Search
1. Type "Rubik" in the search bar
2. **Result:** Should show 3 fonts:
   - Rubik Gemstones
   - Rubik Wet Paint
   - Rubik Dirt

### 9. Test Font Selection
1. Click on **"Barrio"** font
2. Your text should change to Barrio font
3. Console should show:
   ```
   ✅ Google Font loaded: Barrio
   ```

---

## 🎯 What to Look For

### ✅ Success Indicators:

1. **Fonts appear in the list** (11 fonts total)
2. **Hover loads fonts** (console shows "✅ Font loaded")
3. **Filters work** (fonts disappear/appear based on tags)
4. **Search works** (typing filters the list)
5. **Font selection works** (text changes when you click a font)
6. **Tags appear on hover** (small text under font name)

### ❌ Potential Issues:

#### Issue: "Failed to load Google Font"
**What you'll see:**
```
❌ Failed to load Google Font: Kablammo
   URL: https://fonts.googleapis.com/css2...
```

**Why it happens:**
- Incorrect Google Font name encoding
- Font doesn't exist on Google Fonts
- Network issue

**Solution:**
- Check the URL in console
- Verify font exists on fonts.google.com
- The app will continue working (won't crash)

#### Issue: Fonts not filtering
**Check:**
- Are tags lowercase? (should be: "display", not "Display")
- Do tags match? (filter button says "Display", tag should have "display")

#### Issue: No fonts showing
**Check:**
- Is `STATIC_FONT_REGISTRY` imported?
- Check browser console for errors
- Try refreshing the page

---

## 🧪 Advanced Testing

### Test Font Caching:
1. Hover on "Kablammo" → Loads
2. Hover away and back on "Kablammo" → Should see:
   ```
   ✅ Font already loaded: Kablammo
   ```

### Test Multiple Filters:
1. Click "Display" + "Playful" + "Latin"
2. Should show fonts that match ALL filters

### Test Filter Badge:
1. Click 3 filter chips
2. Filter button should show badge with "3"

### Test Font Variants:
1. Select "Edu NSW ACT Cursive" (variable font)
2. Try changing weight (100-700)
3. Font should render at different weights

---

## 📊 Expected Results

### Font Count by Category:
- **Total:** 11 fonts
- **Handwritten:** 3 fonts
- **Display:** 8 fonts
- **Sans:** 1 font

### Font Count by Mood:
- **Playful:** 10 fonts
- **Elegant:** 2 fonts
- **Vintage:** 2 fonts
- **Seasonal:** 1 font (Butcherman)
- **Tech:** 1 font (BBH Sans Bartle)

### Font Count by Source:
- **Google:** 11 fonts
- **Local:** 0 fonts (add your own!)
- **Uploaded:** 0 fonts (not yet implemented)

---

## 🐛 Troubleshooting Commands

### Clear Browser Cache:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Check Font Registry:
Open console and type:
```javascript
import { STATIC_FONT_REGISTRY } from './app/lib/font-registry'
console.log(STATIC_FONT_REGISTRY)
```

### Check Loaded Fonts:
```javascript
console.log(document.fonts)
```

### Manually Load a Font:
```javascript
import { loadFont } from './app/lib/font-loader'
await loadFont('Kablammo')
```

---

## ✅ Checklist

- [ ] Dev server running (http://localhost:3005)
- [ ] Browser console open (F12)
- [ ] Created/opened a board
- [ ] Added text widget
- [ ] Text properties panel visible
- [ ] Fonts listed (11 fonts)
- [ ] Hover loads fonts (check console)
- [ ] Filter by "Display" works
- [ ] Filter by "Playful" works
- [ ] Search for "Rubik" works
- [ ] Font selection changes text
- [ ] Tags appear on hover
- [ ] Filter badge shows count

---

## 🎉 If All Tests Pass

**Congratulations!** Your font system is fully working!

Next steps:
1. Add more fonts (see [FONT_SYSTEM_INTEGRATION_GUIDE.md](FONT_SYSTEM_INTEGRATION_GUIDE.md))
2. Customize tags for your use case
3. Build user upload UI (when ready)

---

## 📝 Notes

- Fonts load **on-demand** (not all at once)
- Failed fonts won't crash the app (just logs error)
- Font loading has 5-second timeout
- Filters are case-insensitive
- Tags can have multiple values

---

**Happy Testing!** 🚀
