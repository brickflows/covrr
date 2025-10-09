export type Color = {
  r: number;
  g: number;
  b: number;
};

export type BookDetails = {
  title?: string;
  author?: string;
  genres?: string;      // comma-separated
  audience?: string;    // comma-separated
  keywords?: string;    // comma-separated
  mood?: string;        // comma-separated or descriptive
  synopsis?: string;
  coverRequirements?: string;
  thingsToAvoid?: string;
  otherDetails?: string;
  inspirations?: string;
};

export type Camera = {
  x: number;
  y: number;
  scale: number;
};

export enum LayerType {
  Rectangle,
  Ellipse,
  Path,
  Text,
  Note,
  Connection,
  Message,
  Image,
  ImageOverlay,
}

export type RectangleLayer = {
  type: LayerType.Rectangle;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type EllipseLayer = {
  type: LayerType.Ellipse;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type PathLayer = {
  type: LayerType.Path;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  points: number[][];
  value?: string;
};

export type TextLayer = {
  type: LayerType.Text;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type NoteLayer = {
  type: LayerType.Note;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type ConnectionLayer = {
  type: LayerType.Connection;
  startId: string;
  endId: string;
  startPoint?: Point;
  endPoint?: Point;
  fill: Color;
};

export type MessageImage = {
  url: string;
  name: string;
  size: number;
  storageId?: string;
};

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
  width?: number;
  height?: number;
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

export type ImageOverlayLayer = {
  type: LayerType.ImageOverlay;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  parentImageId: string; // Reference to the image this overlay is on
  isVisible: boolean; // Whether this overlay is currently visible
  textWidgets?: TextWidget[]; // Text that can be added on the overlay
};

export type MessageLayer = {
  type: LayerType.Message;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
  negativePrompt?: string;
  images?: MessageImage[];
  author?: string;
  timestamp?: number;
  generatedImageSizes?: { width: number; height: number }[];
  generatedImageVisibility?: boolean[];
};

export type Point = {
  x: number;
  y: number;
};

export type XYWH = {
  x: number;
  y: number;
  height: number;
  width: number;
};

export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

export type CanvasState =
  | {
      mode: CanvasMode.None;
    }
  | {
      mode: CanvasMode.SelectionNet;
      origin: Point;
      current?: Point;
    }
  | {
      mode: CanvasMode.Translating;
      current: Point;
    }
  | {
      mode: CanvasMode.Inserting;
      layerType:
        | LayerType.Ellipse
        | LayerType.Rectangle
        | LayerType.Text
        | LayerType.Note
        | LayerType.Message
        | LayerType.Image;
    }
  | {
      mode: CanvasMode.Pencil;
    }
  | {
      mode: CanvasMode.Pressing;
      origin: Point;
    }
  | {
      mode: CanvasMode.Resizing;
      initialBounds: XYWH;
      corner: Side;
    }
  | {
      mode: CanvasMode.Connecting;
      startLayerId: string;
      startPoint: Point;
      currentPoint?: Point;
    }
  | {
      mode: CanvasMode.AddingOverlay;
    };

export enum CanvasMode {
  None,
  Pressing,
  SelectionNet,
  Translating,
  Inserting,
  Resizing,
  Pencil,
  Connecting,
  AddingOverlay,
}

export type Layer =
  | RectangleLayer
  | EllipseLayer
  | PathLayer
  | TextLayer
  | NoteLayer
  | ConnectionLayer
  | MessageLayer
  | ImageLayer
  | ImageOverlayLayer;
