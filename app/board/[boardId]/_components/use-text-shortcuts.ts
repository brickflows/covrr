import { useEffect } from "react";

interface UseTextShortcutsProps {
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignJustify: () => void;
  onDecreaseFontSize: () => void;
  onIncreaseFontSize: () => void;
  onDelete: () => void;
  enabled: boolean;
}

export const useTextShortcuts = ({
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignJustify,
  onDecreaseFontSize,
  onIncreaseFontSize,
  onDelete,
  enabled,
}: UseTextShortcutsProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + B - Bold
      if (cmdOrCtrl && e.key === "b") {
        e.preventDefault();
        onToggleBold();
        return;
      }

      // Cmd/Ctrl + I - Italic
      if (cmdOrCtrl && e.key === "i") {
        e.preventDefault();
        onToggleItalic();
        return;
      }

      // Cmd/Ctrl + U - Underline
      if (cmdOrCtrl && e.key === "u") {
        e.preventDefault();
        onToggleUnderline();
        return;
      }

      // Cmd/Ctrl + Shift + L - Align Left
      if (cmdOrCtrl && e.shiftKey && e.key === "L") {
        e.preventDefault();
        onAlignLeft();
        return;
      }

      // Cmd/Ctrl + Shift + C - Align Center
      if (cmdOrCtrl && e.shiftKey && e.key === "C") {
        e.preventDefault();
        onAlignCenter();
        return;
      }

      // Cmd/Ctrl + Shift + R - Align Right
      if (cmdOrCtrl && e.shiftKey && e.key === "R") {
        e.preventDefault();
        onAlignRight();
        return;
      }

      // Cmd/Ctrl + Shift + J - Align Justify
      if (cmdOrCtrl && e.shiftKey && e.key === "J") {
        e.preventDefault();
        onAlignJustify();
        return;
      }

      // [ - Decrease font size
      if (e.key === "[" && !cmdOrCtrl && !e.shiftKey) {
        e.preventDefault();
        onDecreaseFontSize();
        return;
      }

      // ] - Increase font size
      if (e.key === "]" && !cmdOrCtrl && !e.shiftKey) {
        e.preventDefault();
        onIncreaseFontSize();
        return;
      }

      // Delete or Backspace - Delete textbox (only when not editing)
      if ((e.key === "Delete" || e.key === "Backspace") && !isEditingText()) {
        e.preventDefault();
        onDelete();
        return;
      }

      // Escape - handled by Fabric.js (exit editing)
    };

    // Helper to check if currently editing text
    const isEditingText = () => {
      const activeElement = document.activeElement;
      return (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        (activeElement as HTMLElement)?.isContentEditable
      );
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    onToggleBold,
    onToggleItalic,
    onToggleUnderline,
    onAlignLeft,
    onAlignCenter,
    onAlignRight,
    onAlignJustify,
    onDecreaseFontSize,
    onIncreaseFontSize,
    onDelete,
  ]);
};
