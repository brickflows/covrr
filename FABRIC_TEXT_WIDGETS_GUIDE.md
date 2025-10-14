# Fabric.js Text Widgets Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Features](#features)
5. [How It Works](#how-it-works)
6. [File Structure](#file-structure)
7. [Key Concepts](#key-concepts)
8. [Implementation Details](#implementation-details)

---

## Overview

This guide documents the complete implementation of **Fabric.js Text Widgets** for the Miro Clone application. These are rich text editing widgets that overlay on generated images, allowing users to add and edit text with full typography control.

### What We Built

- **Fabric.js Canvas Overlay**: A canvas layer that sits on top of generated images
- **Text Widgets**: Editable textboxes with full typography controls
- **Properties Panel**: A comprehensive side panel for editing text properties
- **Persistence**: Auto-save functionality that persists text widgets across page refreshes
- **Responsive Sizing**: Canvas and text widgets scale proportionally when resizing images

---

## Architecture

### High-Level Flow

```
Message Node (canvas.tsx)
    └── Generated Images (message.tsx)
        └── Image Container (foreignObject)
            ├── Background Image
            └── FabricOverlayCanvas (fabric-overlay-canvas.tsx)
                ├── Fabric.js Canvas (HTML5 Canvas)
                ├── Background Image (Fabric.Image)
                └── Text Widgets (Fabric.Textbox objects)

Properties Panel (fabric-text-properties-panel.tsx)
    └── Rendered via React Portal to document.body
```

### Data Flow

```
User Action
    ↓
Fabric Canvas Event
    ↓
State Update (selectedTextbox)
    ↓
Properties Panel Updates
    ↓
User Changes Property
    ↓
Update Fabric Object
    ↓
Auto-save to Liveblocks
```

---

## Components

### 1. **FabricOverlayCanvas** (`fabric-overlay-canvas.tsx`)

**Purpose**: Core component that manages the Fabric.js canvas instance

**Key Features**:
- Initializes Fabric.js canvas with background image
- Creates and manages text widget objects
- Handles text selection and editing
- Manages canvas events (click, text:changed, object:modified, etc.)
- Auto-saves canvas state to Liveblocks
- Handles responsive resizing

**Props**:
```typescript
interface FabricOverlayCanvasProps {
  overlayId: string;              // Unique ID for this canvas
  imageUrl: string;               // Background image URL
  imageWidth: number;             // Canvas width
  imageHeight: number;            // Canvas height
  isActive: boolean;              // Whether canvas is interactive
  onTextSelect?: (textbox) => void;  // Callback when text is selected
  onCanvasReady?: (canvas) => void;  // Callback when canvas initializes
  initialFabricState?: any;       // Initial state to load
  onFabricStateChange?: (state) => void; // Callback when state changes
}
```

**Exposed Methods** (via useImperativeHandle):
- `addText(text, options)` - Creates a new text widget
- `getCanvas()` - Returns the Fabric canvas instance

**Key Implementation Details**:
```typescript
// Canvas initialization
const canvas = new window.fabric.Canvas(canvasRef.current, {
  width: imageWidth,
  height: imageHeight,
  selection: isActive,
  preserveObjectStacking: true,
});

// Background image setup
window.fabric.Image.fromURL(imageUrl, (img) => {
  img.set({
    scaleX: imageWidth / (img.width || 1),
    scaleY: imageHeight / (img.height || 1),
    selectable: false,
    evented: false,
  });
  canvas.setBackgroundImage(img, () => canvas.requestRenderAll());
});

// Text widget creation
const textbox = new window.fabric.Textbox(text, {
  left: imageWidth / 2,
  top: imageHeight / 2,
  fontSize: 24,
  fontFamily: 'Arial',
  fill: '#000000',
  textAlign: 'left',
  // ... other properties
});
canvas.add(textbox);
canvas.setActiveObject(textbox);
```

### 2. **FabricTextPropertiesPanel** (`fabric-text-properties-panel.tsx`)

**Purpose**: Side panel for editing text widget properties

**Key Features**:
- Full typography controls (font family, size, weight, alignment, etc.)
- Text styling (bold, italic, underline, strikethrough)
- Advanced controls (letter spacing, line height, opacity)
- Layer management (duplicate, bring to front, send to back, delete)
- Rendered via React Portal to escape SVG context

**Props**:
```typescript
interface FabricTextPropertiesPanelProps {
  textbox: ExtendedTextbox;           // Selected text widget
  onUpdateTextbox: (property, value) => void;  // Update callback
  onDuplicateTextbox: () => void;     // Duplicate action
  onDeleteTextbox: () => void;        // Delete action
  onBringToFront: () => void;         // Z-index: bring to front
  onSendToBack: () => void;           // Z-index: send to back
  onClose: () => void;                // Close panel
}
```

**Panel Width**: 400px (right-aligned, full height)

**Font Families** (20 options):
- Arial, Helvetica, Times New Roman, Georgia, Verdana, Courier New
- Roboto, Open Sans, Lato, Montserrat, Poppins, Playfair Display
- Merriweather, Raleway, Ubuntu, Nunito, Oswald, Source Sans Pro
- PT Sans, Crimson Text

**Font Weights** (9 options, displayed as 3x3 button grid):
- 100 (Thin), 200 (Extra Light), 300 (Light)
- 400 (Normal), 500 (Medium), 600 (Semi Bold)
- 700 (Bold), 800 (Extra Bold), 900 (Black)

**Controls Layout**:
```
┌─────────────────────────────────┐
│ Text Properties Panel           │ [X]
├─────────────────────────────────┤
│ Text Content                     │
│ [Text Input]                     │
├─────────────────────────────────┤
│ Font Size: [24]                  │
│ Font Family: [Arial ▼]          │
│ Font Weight: [Grid of buttons]   │
│ Alignment: [L][C][R][J]          │
├─────────────────────────────────┤
│ Style: [B][I][U][S]              │
├─────────────────────────────────┤
│ Letter Spacing: [0]              │
│ Line Height: [1.16]              │
│ Transparency: [100%]             │
├─────────────────────────────────┤
│ Actions:                         │
│ [Duplicate] [↑Front] [↓Back]    │
│ [Delete]                         │
└─────────────────────────────────┘
```

**React Portal Implementation**:
```typescript
// In message.tsx
{selectedTextbox && createPortal(
  <FabricTextPropertiesPanel
    textbox={selectedTextbox}
    onUpdateTextbox={handleUpdate}
    // ... other props
  />,
  document.body  // Escape SVG context
)}
```

### 3. **Message Component** (`message.tsx`)

**Purpose**: Manages message nodes with generated images and layer selection

**Key Responsibilities**:
- Renders generated images in a horizontal row
- Manages layer selection for each image
- Creates FabricOverlayCanvas instances for images with layers
- Handles text widget selection state
- Manages persistence (save/load from Liveblocks)
- Handles image resizing

**Generated Image Structure**:
```typescript
// Each generated image has:
{
  url: string;                    // Image URL
  layers: OverlayLayer[];         // Array of overlay layers
}

// Each overlay layer has:
{
  id: string;                     // Layer ID
  title: string;                  // Layer name
  visible: boolean;               // Visibility
  fabricState?: any;              // Saved Fabric.js state
}
```

**State Management**:
```typescript
// Selected text widget (for properties panel)
const [selectedTextbox, setSelectedTextbox] = useState<ExtendedTextbox | null>(null);

// Which image's textbox is selected
const [selectedTextboxImageIndex, setSelectedTextboxImageIndex] = useState<number | null>(null);

// Selected layer for each image
const [selectedLayerForImage, setSelectedLayerForImage] = useState<Record<number, string | null>>({});

// Image sizes (for responsive resizing)
const [imageSizes, setImageSizes] = useState<Array<{width: number, height: number}>>([]);
```

**Fabric Canvas Refs**:
```typescript
// Store ref to each image's canvas for method calls
const fabricRefs = useRef<Record<number, any>>({});

// Usage: Add text to canvas
fabricRefs.current[imageIndex]?.addText("Hello World");
```

---

## Features

### 1. **Text Widget Creation**

**How to Create**:
1. Click the "+" icon in an image's layer bottom bar
2. A new text widget appears at the center of the canvas
3. Default text: "Add your text"
4. Widget is automatically selected for editing

**Implementation**:
```typescript
// In message.tsx
const handleAddTextWidget = (imageIndex: number) => {
  const canvas = fabricRefs.current[imageIndex];
  if (canvas) {
    canvas.addText("Add your text", {
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
    });
  }
};
```

### 2. **Text Editing**

**Two Ways to Edit**:

**A) Direct Canvas Editing**:
- Double-click text widget on canvas
- Type directly in the textbox
- Changes sync to properties panel in real-time

**B) Properties Panel Editing**:
- Select text widget (single click)
- Edit in "Text Content" field in properties panel
- Changes sync to canvas in real-time

**Bidirectional Sync**:
```typescript
// Canvas → Panel
canvas.on("text:changed", (e) => {
  const textbox = e.target;
  setSelectedTextbox({ ...textbox }); // Force panel update
});

// Panel → Canvas
const onUpdateTextbox = (property: string, value: any) => {
  const activeObj = canvas.getActiveObject();
  if (activeObj && activeObj.type === "textbox") {
    activeObj.set(property, value);
    canvas.requestRenderAll();
    setSelectedTextbox({ ...activeObj }); // Update panel
  }
};
```

### 3. **Typography Controls**

**Font Size**:
- Range: 1-200px
- Input type: number
- Updates in real-time

**Font Family**:
- 20 font options
- Dropdown select
- Applies immediately

**Font Weight**:
- 9 weight options (100-900)
- 3x3 button grid layout (easier than dropdown)
- Active weight highlighted in blue

**Text Alignment**:
- Left, Center, Right, Justify
- Icon buttons in a row
- Updates alignment immediately

**Text Styles**:
- Bold (fontWeight: 700)
- Italic (fontStyle: 'italic')
- Underline (underline: true)
- Strikethrough (linethrough: true)
- Toggle buttons, can combine multiple styles

### 4. **Advanced Controls**

**Letter Spacing**:
- Range: -200 to 800
- Adjusts character spacing
- Useful for logos and headings

**Line Height**:
- Range: 0.5 to 3.0
- Step: 0.01
- Controls space between lines

**Transparency**:
- Range: 0-100%
- Step: 1%
- Sets opacity of text

### 5. **Layer Management**

**Duplicate**:
- Creates copy of text widget
- Offset by 20px to avoid overlap
- Copy is automatically selected

**Bring to Front**:
- Moves text to top layer
- Uses Fabric.js `bringToFront()`

**Send to Back**:
- Moves text to bottom layer
- Uses Fabric.js `sendToBack()`

**Delete**:
- Removes text widget from canvas
- Closes properties panel
- Clears selection

### 6. **Persistence**

**Auto-Save**:
- Saves on every change
- Triggers: object:added, object:modified, object:removed, text:changed
- Saves to Liveblocks storage

**Save Format**:
```typescript
const fabricState = canvas.toJSON([
  "layer_id",
  "_frameWidth",
  "_frameHeight",
  "_clipWidth",
  "_clipHeight",
  "_originalFontSize"
]);

// Saved to: layer.generatedImageLayers[index].fabricState
```

**Load on Mount**:
```typescript
if (initialFabricState?.objects?.length > 0) {
  canvas.loadFromJSON(initialFabricState, () => {
    canvas.requestRenderAll();
  });
}
```

### 7. **Responsive Resizing**

**How It Works**:
- User drags resize handles on image container
- `imageSizes` state updates with new width/height
- FabricOverlayCanvas receives new `imageWidth`/`imageHeight` props
- useEffect detects prop changes and scales canvas + all objects

**Implementation**:
```typescript
// In fabric-overlay-canvas.tsx
useEffect(() => {
  const canvas = fabricCanvasRef.current;
  const oldWidth = canvas.getWidth();
  const oldHeight = canvas.getHeight();

  // Calculate scale factors
  const scaleX = imageWidth / oldWidth;
  const scaleY = imageHeight / oldHeight;

  // Resize canvas
  canvas.setDimensions({ width: imageWidth, height: imageHeight });

  // Scale all objects proportionally
  canvas.getObjects().forEach((obj) => {
    obj.set({
      left: obj.left * scaleX,
      top: obj.top * scaleY,
      scaleX: obj.scaleX * scaleX,
      scaleY: obj.scaleY * scaleY,
    });
    obj.setCoords();
  });

  // Resize background image
  const backgroundImage = canvas.backgroundImage;
  if (backgroundImage) {
    backgroundImage.set({
      scaleX: imageWidth / (backgroundImage.width || 1),
      scaleY: imageHeight / (backgroundImage.height || 1),
    });
  }

  canvas.requestRenderAll();
}, [imageWidth, imageHeight]);
```

**Result**: Canvas, background image, and all text widgets scale together smoothly as one unit.

---

## How It Works

### Initialization Flow

```
1. User generates images in a message node
2. Images are stored in layer.generatedImages array
3. User creates overlay layers for images
4. Each layer can have a fabricState (saved canvas state)

5. When rendering:
   - message.tsx maps over generatedImages
   - For each image with layers, renders FabricOverlayCanvas
   - Canvas loads initialFabricState if exists
   - Background image loads and scales to fit

6. Canvas ready:
   - User can click "+" to add text widgets
   - User can select/edit text widgets
   - User can use properties panel for advanced editing
```

### Text Widget Lifecycle

```
CREATE:
User clicks "+"
  → fabricRefs.current[index].addText()
  → new Fabric.Textbox created
  → Added to canvas at center
  → Auto-selected
  → onTextSelect callback fires
  → Properties panel opens

EDIT:
User selects text widget
  → selection:created event
  → onTextSelect callback fires
  → setSelectedTextbox updates
  → Properties panel opens/updates

User types on canvas
  → text:changed event
  → Canvas state updates
  → onTextSelect callback fires
  → Properties panel syncs

User edits in properties panel
  → onUpdateTextbox callback
  → activeObj.set(property, value)
  → canvas.requestRenderAll()
  → setSelectedTextbox updates

SAVE:
Any change triggers event
  → canvas.on("object:modified")
  → onFabricStateChange callback
  → updateLayerFabricState mutation
  → Saved to Liveblocks

DELETE:
User clicks delete button
  → canvas.remove(activeObject)
  → object:removed event
  → onFabricStateChange callback
  → State saved
  → Properties panel closes
```

### Properties Panel Lifecycle

```
OPEN:
User selects text widget
  → onTextSelect callback fires
  → setSelectedTextbox(textbox)
  → selectedTextbox is not null
  → createPortal renders panel to document.body
  → 100ms delay for smooth appearance

UPDATE:
Text widget changes on canvas
  → setSelectedTextbox({ ...textbox })
  → Panel re-renders with new values
  → All inputs reflect current state

CLOSE:
User clicks X button
  → onClose callback
  → setSelectedTextbox(null)
  → Panel unmounts
```

---

## File Structure

```
app/board/[boardId]/_components/
├── canvas.tsx                          # Main board canvas
│   └── Removed: TextPropertiesPanel (regular text component panel)
│   └── Added: Ctrl+A prevention
│
├── message.tsx                         # Message nodes with images
│   ├── State: selectedTextbox
│   ├── State: selectedTextboxImageIndex
│   ├── State: selectedLayerForImage
│   ├── State: imageSizes (for resizing)
│   ├── Refs: fabricRefs (canvas instances)
│   ├── Mutation: updateLayerFabricState
│   └── Renders: FabricOverlayCanvas + Properties Panel
│
├── fabric-overlay-canvas.tsx           # Fabric.js canvas component
│   ├── Initializes Fabric.js canvas
│   ├── Loads background image
│   ├── Creates text widgets
│   ├── Handles events
│   ├── Auto-saves state
│   └── Handles responsive resizing
│
├── fabric-text-properties-panel.tsx    # Text widget properties panel
│   ├── Width: 400px
│   ├── 20 font families
│   ├── 9 font weights (button grid)
│   ├── All typography controls
│   └── Layer management actions
│
└── text-properties-panel.tsx           # Old panel (not used for Fabric widgets)
    └── Was for regular text component, now removed from canvas.tsx
```

---

## Key Concepts

### 1. **React Portal for Properties Panel**

**Problem**:
- Message component returns JSX starting with `<foreignObject>` (SVG element)
- SVG foreignObject clips content to its boundaries
- Properties panel was trapped inside and invisible

**Solution**:
- Use `createPortal(component, document.body)`
- Renders panel directly to document body
- Escapes SVG context completely

```typescript
import { createPortal } from 'react-dom';

{selectedTextbox && createPortal(
  <FabricTextPropertiesPanel {...props} />,
  document.body
)}
```

### 2. **Fabric.js Canvas Overlay**

**Concept**:
- HTML5 Canvas positioned absolutely over image
- Canvas renders background image + text widgets
- Text widgets are Fabric.js objects, not DOM elements
- Canvas handles all interactions (click, drag, edit)

**Advantages**:
- High performance rendering
- Rich text editing built-in
- Easy serialization (toJSON/loadFromJSON)
- Handles transforms, scaling, rotation automatically

### 3. **Liveblocks Persistence**

**Storage Structure**:
```typescript
layer: {
  id: string,
  type: LayerType.Message,
  generatedImages: string[],
  generatedImageLayers: {
    [imageIndex]: [
      {
        id: string,
        title: string,
        visible: boolean,
        fabricState: {           // ← Canvas state saved here
          version: '5.3.0',
          objects: [
            {
              type: 'textbox',
              text: 'Hello',
              left: 100,
              top: 100,
              fontSize: 24,
              // ... all properties
            }
          ]
        }
      }
    ]
  }
}
```

**Auto-Save Events**:
- `object:added` - New widget created
- `object:modified` - Widget moved/resized
- `object:removed` - Widget deleted
- `text:changed` - Text content edited

### 4. **Responsive Canvas Scaling**

**Challenge**:
- User resizes image container
- Canvas and all objects must scale proportionally
- No lag, smooth resize

**Solution**:
- Watch `imageWidth` and `imageHeight` props
- When changed, calculate scale factors
- Apply to canvas dimensions
- Apply to all objects' positions and scales
- Apply to background image scale

**Result**: Everything scales together as one unit.

### 5. **Bidirectional Editing**

**Challenge**:
- User can edit on canvas OR in properties panel
- Both must stay in sync

**Solution**:
```typescript
// Canvas → Panel: Listen to text:changed event
canvas.on("text:changed", (e) => {
  setSelectedTextbox({ ...e.target });
});

// Panel → Canvas: Update and refresh state
const onUpdateTextbox = (property, value) => {
  activeObj.set(property, value);
  canvas.requestRenderAll();
  setSelectedTextbox({ ...activeObj });
};
```

### 6. **Font Weight Button Grid**

**Why Not Dropdown?**:
- Original implementation used `<select>` dropdown
- Caused React DOM errors with `updateOptions`
- Error: "Cannot read properties of undefined (reading 'length')"

**Solution**: 3x3 Button Grid
```typescript
<div className="grid grid-cols-3 gap-2">
  {FONT_WEIGHTS.map((weight) => (
    <button
      key={weight.value}
      onClick={() => onUpdateTextbox("fontWeight", weight.value)}
      className={fontWeightValue === weight.value
        ? "bg-blue-500 text-white"
        : "bg-white text-gray-700"
      }
    >
      {weight.name}
    </button>
  ))}
</div>
```

**Benefits**:
- No React DOM errors
- Better UX (see all options at once)
- Clear visual feedback of active weight

---

## Implementation Details

### Canvas Initialization

```typescript
useEffect(() => {
  if (!canvasRef.current || !window.fabric || initializedRef.current) return;

  const canvas = new window.fabric.Canvas(canvasRef.current, {
    width: imageWidth,
    height: imageHeight,
    selection: isActive,
    preserveObjectStacking: true,
  });

  // Load background image
  window.fabric.Image.fromURL(imageUrl, (img) => {
    img.set({
      scaleX: imageWidth / (img.width || 1),
      scaleY: imageHeight / (img.height || 1),
      originX: 'center',
      originY: 'center',
      left: imageWidth / 2,
      top: imageHeight / 2,
      selectable: false,
      evented: false,
    });
    canvas.setBackgroundImage(img, () => canvas.requestRenderAll());
  });

  fabricCanvasRef.current = canvas;
  initializedRef.current = true;
  setFabricLoaded(true);
  onCanvasReady?.(canvas);
}, []);
```

### Text Widget Creation

```typescript
const addText = (text = "Add your text", options = {}) => {
  const canvas = fabricCanvasRef.current;

  const textbox = new window.fabric.Textbox(text, {
    left: imageWidth / 2,
    top: imageHeight / 2,
    fontSize: options.fontSize || 24,
    fontFamily: options.fontFamily || 'Arial',
    fontWeight: options.fontWeight || 400,
    fill: options.fill || '#000000',
    textAlign: options.textAlign || 'left',
    width: 200,
    editable: true,
    originX: 'center',
    originY: 'center',
  });

  canvas.add(textbox);
  canvas.setActiveObject(textbox);
  canvas.requestRenderAll();

  // Notify parent
  if (onTextSelect) {
    onTextSelect(textbox as ExtendedTextbox);
  }
};
```

### Event Handling

```typescript
// Selection events
canvas.on("selection:created", (e) => {
  const obj = e.selected?.[0];
  if (obj && obj.type === "textbox") {
    onTextSelect?.(obj as ExtendedTextbox);
  }
});

canvas.on("selection:updated", (e) => {
  const obj = e.selected?.[0];
  if (obj && obj.type === "textbox") {
    onTextSelect?.(obj as ExtendedTextbox);
  } else {
    onTextSelect?.(null);
  }
});

canvas.on("selection:cleared", () => {
  onTextSelect?.(null);
});

// Text editing
canvas.on("text:changed", (e) => {
  const textbox = e.target;
  if (textbox && textbox.type === "textbox") {
    onTextSelect?.(textbox as ExtendedTextbox);
  }
});

// Auto-save events
canvas.on("object:added", saveCanvasState);
canvas.on("object:modified", saveCanvasState);
canvas.on("object:removed", saveCanvasState);
canvas.on("text:changed", saveCanvasState);
```

### Persistence

```typescript
// Save canvas state
const saveCanvasState = () => {
  if (onFabricStateChange) {
    const json = canvas.toJSON([
      "layer_id",
      "_frameWidth",
      "_frameHeight",
      "_clipWidth",
      "_clipHeight",
      "_originalFontSize"
    ]);
    onFabricStateChange(json);
  }
};

// Load canvas state
if (initialFabricState?.objects?.length > 0) {
  canvas.loadFromJSON(initialFabricState, () => {
    canvas.requestRenderAll();

    // Select first textbox if any
    const textboxes = canvas.getObjects().filter(obj => obj.type === "textbox");
    if (textboxes.length > 0) {
      onTextSelect?.(textboxes[0] as ExtendedTextbox);
    }
  });
}
```

### Responsive Resizing

```typescript
useEffect(() => {
  const canvas = fabricCanvasRef.current;
  if (!canvas || !window.fabric) return;

  const oldWidth = canvas.getWidth();
  const oldHeight = canvas.getHeight();

  // Only resize if dimensions actually changed
  if (Math.abs(oldWidth - imageWidth) < 1 && Math.abs(oldHeight - imageHeight) < 1) {
    return;
  }

  // Calculate scale factors
  const scaleX = imageWidth / oldWidth;
  const scaleY = imageHeight / oldHeight;

  // Resize canvas
  canvas.setDimensions({ width: imageWidth, height: imageHeight });

  // Scale all objects proportionally
  canvas.getObjects().forEach((obj: any) => {
    obj.set({
      left: obj.left * scaleX,
      top: obj.top * scaleY,
      scaleX: obj.scaleX * scaleX,
      scaleY: obj.scaleY * scaleY,
    });
    obj.setCoords();
  });

  // Resize background image
  const backgroundImage = canvas.backgroundImage;
  if (backgroundImage && typeof backgroundImage === 'object') {
    const img = backgroundImage as any;
    img.set({
      scaleX: imageWidth / (img.width || 1),
      scaleY: imageHeight / (img.height || 1),
      left: imageWidth / 2,
      top: imageHeight / 2,
    });
  }

  canvas.requestRenderAll();

  // Save updated state
  if (onFabricStateChange) {
    const json = canvas.toJSON([
      "layer_id",
      "_frameWidth",
      "_frameHeight",
      "_clipWidth",
      "_clipHeight",
      "_originalFontSize"
    ]);
    onFabricStateChange(json);
  }
}, [imageWidth, imageHeight, onFabricStateChange]);
```

---

## Summary of Changes Made

### 1. **Created New Components**
- ✅ `fabric-overlay-canvas.tsx` - Fabric.js canvas component
- ✅ `fabric-text-properties-panel.tsx` - Text widget properties panel

### 2. **Modified Existing Components**
- ✅ `message.tsx` - Added Fabric canvas integration, state management, persistence
- ✅ `canvas.tsx` - Removed regular text properties panel, added Ctrl+A prevention

### 3. **Fixed Issues**
- ✅ Select element causing React DOM errors → Button grid
- ✅ Properties panel invisible → React Portal to document.body
- ✅ Text editing not syncing → Bidirectional updates
- ✅ No persistence → Auto-save to Liveblocks
- ✅ Image not scaling with container → Responsive resize with useEffect

### 4. **Features Implemented**
- ✅ Text widget creation
- ✅ Direct canvas editing
- ✅ Properties panel editing
- ✅ 20 font families
- ✅ 9 font weights (button grid)
- ✅ Text alignment (4 options)
- ✅ Text styles (bold, italic, underline, strikethrough)
- ✅ Letter spacing control
- ✅ Line height control
- ✅ Transparency control
- ✅ Duplicate widget
- ✅ Bring to front / Send to back
- ✅ Delete widget
- ✅ Auto-save to Liveblocks
- ✅ Load from saved state
- ✅ Responsive resizing
- ✅ Ctrl+A prevention on canvas

### 5. **Final Configuration**
- ✅ Properties panel width: 400px (changed from 480px)
- ✅ Text properties panel removed from regular text component
- ✅ Keyboard shortcuts: Ctrl+A disabled on canvas

---

## Common Operations

### How to Add Text Widget
1. Generate image in message node
2. Create overlay layer for image
3. Click "+" icon in layer bottom bar
4. Text widget appears at center
5. Start typing or use properties panel

### How to Edit Text Widget
**Method 1: Canvas**
1. Double-click text widget
2. Type directly
3. Click outside to finish

**Method 2: Properties Panel**
1. Single-click to select
2. Panel opens on right
3. Edit in "Text Content" field
4. Changes apply in real-time

### How to Style Text
1. Select text widget
2. Properties panel opens
3. Use controls:
   - Font Size: Enter value or use arrows
   - Font Family: Select from dropdown
   - Font Weight: Click weight button (100-900)
   - Alignment: Click L/C/R/J button
   - Style: Click B/I/U/S buttons
   - Letter Spacing: Adjust slider
   - Line Height: Adjust slider
   - Transparency: Adjust slider

### How to Manage Layers
1. Select text widget
2. Scroll to Actions section
3. Click:
   - **Duplicate**: Creates copy
   - **↑ Bring to Front**: Top layer
   - **↓ Send to Back**: Bottom layer
   - **Delete**: Remove widget

### How to Resize Image with Text
1. Select image container
2. Drag resize handles
3. Canvas and text scale together automatically
4. All proportions maintained

---

## Technical Notes

### Fabric.js Version
- Using Fabric.js 5.3.0
- Loaded via CDN in page.tsx

### Canvas Dimensions
- Match image dimensions exactly
- Passed as props: `imageWidth`, `imageHeight`
- Update triggers responsive resize

### Z-Index Management
- Fabric.js handles stacking order internally
- `bringToFront()` / `sendToBack()` methods
- `preserveObjectStacking: true` maintains order

### Performance Considerations
- Canvas renders on demand (`requestRenderAll()`)
- Auto-save throttled by Fabric.js events
- Only active canvas is interactive
- Background images cached by browser

### Browser Compatibility
- Requires HTML5 Canvas support
- Tested on modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile touch support via Fabric.js

---

## Future Enhancements (Potential)

### Text Features
- [ ] Text color picker
- [ ] Background color for text
- [ ] Text shadow/outline
- [ ] Gradient text fill
- [ ] Text effects (arc, wave, etc.)

### Canvas Features
- [ ] Multi-select text widgets
- [ ] Copy/paste between images
- [ ] Keyboard shortcuts (Ctrl+D duplicate, Ctrl+B bold, etc.)
- [ ] Text templates
- [ ] Text presets (save/load styles)

### UI/UX
- [ ] Keyboard shortcut help panel
- [ ] Undo/redo for text changes
- [ ] Text widget thumbnails in layers list
- [ ] Drag-and-drop text widgets between images
- [ ] Text search in canvas

### Performance
- [ ] Lazy load Fabric.js
- [ ] Canvas virtualization for many widgets
- [ ] Debounced auto-save
- [ ] Optimized re-renders

---

## Troubleshooting

### Text Widget Not Appearing
- Check: Canvas initialized? (`fabricLoaded` state)
- Check: Image loaded? (background visible?)
- Check: Layer selected? (bottom bar should show layer)
- Check: Canvas interactive? (`isActive` prop)

### Properties Panel Not Visible
- Check: Text widget selected? (`selectedTextbox` not null)
- Check: Portal target exists? (document.body available)
- Check: Z-index high enough? (999999)
- Check: 100ms delay passed? (useEffect timer)

### Text Not Saving
- Check: `onFabricStateChange` callback provided?
- Check: Liveblocks mutation working?
- Check: Console for errors during save?
- Check: Event listeners attached? (object:modified, etc.)

### Text Not Loading on Refresh
- Check: `initialFabricState` prop passed?
- Check: fabricState exists in layer data?
- Check: Fabric.js loaded before canvas creation?
- Check: `loadFromJSON` callback executing?

### Canvas Not Resizing Smoothly
- Check: `imageWidth`/`imageHeight` props updating?
- Check: useEffect dependencies correct?
- Check: Scale factors calculated properly?
- Check: All objects being scaled? (forEach loop)

---

## Conclusion

This implementation provides a complete, production-ready text editing solution for the Miro Clone application. The combination of Fabric.js for rendering, React Portal for UI, and Liveblocks for persistence creates a robust, performant system that handles all text editing needs.

The architecture is modular, maintainable, and extensible - making it easy to add new features or customize existing ones in the future.

---

**Last Updated**: January 2025
**Version**: 1.0
**Fabric.js Version**: 5.3.0
**React Version**: 18.x
**Next.js Version**: 14.x
