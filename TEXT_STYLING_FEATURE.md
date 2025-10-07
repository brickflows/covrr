# Text Styling Feature for Cartoon Trite

## Overview

This feature allows users to add custom text, typography, and styling to MidJourney-generated images on the canvas. The implementation follows a right-panel approach for optimal user experience.

## Architecture

### Components

1. **Image Layer** (`image.tsx`)
   - New layer type for displaying images with text overlays
   - Renders base image and text widgets on canvas
   - Supports selection and interaction

2. **Image Editor Panel** (`image-editor-panel.tsx`)
   - Right-side panel that opens when an Image layer is selected
   - Shows full-size image preview regardless of canvas zoom
   - Allows adding, positioning, and styling multiple text widgets
   - Features:
     - Add/delete text widgets
     - Drag-and-drop text positioning
     - Font family selection (14+ fonts)
     - Font size (8-120px)
     - Font weight (Thin to Black)
     - Color picker
     - Text alignment (left/center/right)
     - Rotation (-180° to 180°)
     - Letter spacing
     - Line height
     - Download styled image as PNG

3. **Image Upload Dialog** (`image-upload-dialog.tsx`)
   - Modal for adding images to canvas
   - Two modes:
     - URL input
     - File upload
   - Appears when user clicks Image tool and then clicks on canvas

4. **Message Component Updates** (`message.tsx`)
   - "Add Text" button on generated MidJourney images
   - Converts Message layer images to Image layers for text editing
   - Preserves position and size during conversion

## User Workflow

### Adding Images to Canvas

1. Click Image tool in toolbar (icon with image)
2. Click anywhere on canvas
3. Upload dialog appears:
   - Enter image URL, OR
   - Upload image file
4. Image layer is created at clicked position

### Styling Text on Images

#### Option 1: From Canvas Images
1. Generate images using Message layer (MidJourney integration)
2. Hover over generated image
3. Click "Add Text" button
4. Image converts to Image layer with text editor panel open

#### Option 2: From Uploaded Images
1. Add image to canvas using Image tool
2. Click the image to select it
3. Click again to open text editor panel

### Text Editor Panel Features

**Adding Text:**
- Click "Add Text" button
- New text widget appears on image
- Drag to position

**Styling Text:**
- Select text widget by clicking
- Use right panel controls:
  - Edit content (textarea)
  - Choose font family (dropdown)
  - Adjust size (slider)
  - Set weight (dropdown)
  - Pick color (color picker + hex input)
  - Align text (left/center/right buttons)
  - Rotate (slider)
  - Letter spacing (slider)
  - Line height (slider)

**Downloading:**
- Click "Download Image" button
- Canvas-to-image conversion with text baked in
- Downloads as PNG with original image quality

### Canvas Behavior

**Right Panel Benefits:**
- Fixed workspace for editing (no zoom issues)
- Select tiny canvas images → panel shows full-size view
- Multiple text widgets can be added per image
- Real-time preview on canvas
- Changes sync instantly via Liveblocks

**Canvas Integration:**
- Images are regular canvas layers
- Support selection, moving, resizing
- Text widgets scale proportionally with image
- Compatible with existing tools (connections, etc.)

## Types

### New Types (in `types/canvas.ts`)

```typescript
export type TextWidget = {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  rotation: number;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
};

export type ImageLayer = {
  type: LayerType.Image;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  imageUrl: string;
  imageName?: string;
  textWidgets?: TextWidget[];
};

enum LayerType {
  // ... existing types
  Image,
}
```

## Key Features

### Optimization
- **Right panel approach** prevents issues with small canvas images
- Panel shows fixed-size preview, canvas shows actual layer
- No need to zoom in/out for text editing

### Real-time Sync
- Uses Liveblocks mutations for instant updates
- Text widgets persist across sessions
- Collaborative editing support

### Export Quality
- Canvas-to-image conversion maintains original resolution
- Text rendered at full quality
- Scales properly regardless of canvas zoom

## File Structure

```
app/board/[boardId]/_components/
├── image.tsx                    # Image layer component
├── image-editor-panel.tsx       # Right panel editor
├── image-upload-dialog.tsx      # Upload modal
├── message.tsx                  # Updated with conversion
├── canvas.tsx                   # Updated with Image layer support
├── layer-preview.tsx            # Updated to render Image layers
└── toolbar.tsx                  # Updated with Image tool

types/
└── canvas.ts                    # Updated with Image types
```

## Usage Tips

1. **For best results**: Use high-resolution images from MidJourney
2. **Text positioning**: Drag text widgets directly on the preview image
3. **Multiple texts**: Add as many text widgets as needed per image
4. **Canvas workflow**:
   - Generate 4 images → pick best one → Add Text → style → download
5. **Collaboration**: Changes sync in real-time with other users

## Technical Notes

- Text widgets use relative positioning within image bounds
- Download function uses HTML Canvas API for rendering
- Cross-origin images may require CORS configuration
- File uploads create local object URLs
- Panel uses React hooks for drag-and-drop

## Future Enhancements

Potential additions:
- Text effects (shadow, outline, gradient)
- Text templates/presets
- Font upload support
- Image filters/adjustments
- Batch text application to multiple images
- Text animation presets
