import { Minus, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const ZoomControls = ({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) => {
  return (
    <div className="absolute bottom-2 right-2 bg-white rounded-md shadow-md p-1.5 flex gap-1 items-center">
      <Hint label="Zoom out" side="top">
        <Button
          onClick={onZoomOut}
          variant="board"
          size="icon"
          disabled={scale <= 0.1}
        >
          <Minus />
        </Button>
      </Hint>

      <div className="px-2 min-w-[60px] text-center text-sm font-medium">
        {Math.round(scale * 100)}%
      </div>

      <Hint label="Zoom in" side="top">
        <Button
          onClick={onZoomIn}
          variant="board"
          size="icon"
          disabled={scale >= 5}
        >
          <Plus />
        </Button>
      </Hint>

      <Hint label="Reset zoom" side="top">
        <Button onClick={onReset} variant="board" size="icon">
          <RotateCcw />
        </Button>
      </Hint>
    </div>
  );
};