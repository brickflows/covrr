/**
 * Event tracking utilities for text panel interactions
 * Emits events for analytics and debugging
 */

export type TextPanelEventType =
  | "text_created"
  | "text_selected"
  | "text_updated"
  | "text_moved"
  | "text_resized"
  | "text_rotated"
  | "text_deleted"
  | "text_panel_input_changed"
  | "text_panel_fontsize_changed"
  | "layer_autosaved"
  | "layer_restored"
  | "effects_placeholder_clicked"
  | "font_favorited"
  | "font_unfavorited"
  | "font_search"
  | "alignment_cycled"
  | "case_cycled"
  | "style_toggled";

export interface TextPanelEvent {
  type: TextPanelEventType;
  timestamp: number;
  data?: any;
}

class TextPanelEventEmitter {
  private listeners: Map<TextPanelEventType, Set<(event: TextPanelEvent) => void>> = new Map();

  on(eventType: TextPanelEventType, callback: (event: TextPanelEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(callback);
  }

  off(eventType: TextPanelEventType, callback: (event: TextPanelEvent) => void) {
    this.listeners.get(eventType)?.delete(callback);
  }

  emit(eventType: TextPanelEventType, data?: any) {
    const event: TextPanelEvent = {
      type: eventType,
      timestamp: Date.now(),
      data,
    };

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[TextPanel Event] ${eventType}`, data);
    }

    // Notify listeners
    this.listeners.get(eventType)?.forEach(callback => callback(event));
  }
}

export const textPanelEvents = new TextPanelEventEmitter();

// Helper functions for common events
export const emitTextCreated = (textbox: any) => {
  textPanelEvents.emit("text_created", { textbox });
};

export const emitTextSelected = (textbox: any) => {
  textPanelEvents.emit("text_selected", { textbox });
};

export const emitTextUpdated = (property: string, value: any) => {
  textPanelEvents.emit("text_updated", { property, value });
};

export const emitTextMoved = (position: { left: number; top: number }) => {
  textPanelEvents.emit("text_moved", position);
};

export const emitTextResized = (size: { width: number; height: number }) => {
  textPanelEvents.emit("text_resized", size);
};

export const emitTextRotated = (angle: number) => {
  textPanelEvents.emit("text_rotated", { angle });
};

export const emitTextDeleted = (textbox: any) => {
  textPanelEvents.emit("text_deleted", { textbox });
};

export const emitFontSizeChanged = (oldSize: number, newSize: number) => {
  textPanelEvents.emit("text_panel_fontsize_changed", { oldSize, newSize });
};

export const emitLayerAutosaved = (layerId: string) => {
  textPanelEvents.emit("layer_autosaved", { layerId });
};

export const emitLayerRestored = (layerId: string) => {
  textPanelEvents.emit("layer_restored", { layerId });
};

export const emitEffectsPlaceholderClicked = (effectName: string) => {
  textPanelEvents.emit("effects_placeholder_clicked", { effectName });
};

export const emitFontFavorited = (fontFamily: string) => {
  textPanelEvents.emit("font_favorited", { fontFamily });
};

export const emitFontUnfavorited = (fontFamily: string) => {
  textPanelEvents.emit("font_unfavorited", { fontFamily });
};

export const emitFontSearch = (query: string) => {
  textPanelEvents.emit("font_search", { query });
};

export const emitAlignmentCycled = (alignment: string) => {
  textPanelEvents.emit("alignment_cycled", { alignment });
};

export const emitCaseCycled = (caseType: string) => {
  textPanelEvents.emit("case_cycled", { caseType });
};

export const emitStyleToggled = (style: string, enabled: boolean) => {
  textPanelEvents.emit("style_toggled", { style, enabled });
};
