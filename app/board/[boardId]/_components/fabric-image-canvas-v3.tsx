import React, { useEffect, useRef, useState } from "react";
import type { Textbox as FabricTextbox, Canvas as FabricCanvas } from "fabric/fabric-impl";
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    ChevronRight,
    Type,
    Trash2,
    ArrowUp,
    ArrowDown,
    Copy,
    CaseSensitive,
    Plus
} from "lucide-react";

const GOOGLE_FONTS = [
    "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald",
    "Raleway", "PT Sans", "Merriweather", "Nunito", "Playfair Display",
    "Poppins", "Ubuntu", "Crimson Text", "Dancing Script", "Indie Flower",
    "Pacifico", "Bebas Neue", "Anton", "Lobster", "Righteous",
];

const TEXT_EFFECTS = [
    { name: "Extrude type", color: "bg-orange-400" },
    { name: "another style", color: "bg-green-400" },
    { name: "shadow effect", color: "bg-blue-400" },
    { name: "outline style", color: "bg-purple-400" },
];

// Simple Accordion using individual state per item
const AccordionItem = ({ value, defaultOpen = false, trigger, children }: { value: string; defaultOpen?: boolean; trigger: React.ReactNode; children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold hover:bg-gray-50"
            >
                <div className="flex items-center gap-2">{trigger}</div>
                <ChevronRight
                    size={16}
                    className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
            </button>
            <div className={`overflow-hidden transition-all ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
                {children}
            </div>
        </div>
    );
};

export default function FabricTextEditor({ imageUrl }: { imageUrl: string }) {
    type ExtendedTextbox = FabricTextbox & {
        _frameWidth?: number;
        _frameHeight?: number;
        _clipWidth?: number;
        _clipHeight?: number;
        _originalFontSize?: number;
    };

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);
    const [selectedObject, setSelectedObject] = useState<ExtendedTextbox | null>(null);
    const [, forceUpdate] = useState({});
    const [fabricLoaded, setFabricLoaded] = useState(false);

    // Load Fabric.js
    useEffect(() => {
        if (window.fabric) {
            setFabricLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js';
        script.onload = () => setFabricLoaded(true);
        document.head.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    // Initialize canvas
    useEffect(() => {
        if (!fabricLoaded || !canvasRef.current || !containerRef.current || !window.fabric) return;

        const fabric = window.fabric;
        const canvas = new fabric.Canvas(canvasRef.current, {
            preserveObjectStacking: true,
            controlsAboveOverlay: true,
            selectionColor: 'transparent', // No fill, just border
            selectionBorderColor: '#3b82f6', // Blue border
            selectionLineWidth: 1, // Thin border like in the image
        });
        fabricCanvasRef.current = canvas;

        // Set global control styles to match the selection box style
        fabric.Object.prototype.set({
            borderColor: '#3b82f6', // Blue border
            cornerColor: '#ffffff', // White fill for handles
            cornerStrokeColor: '#3b82f6', // Blue stroke around handles
            cornerStyle: 'rect', // Square handles like in your image
            cornerSize: 8, // 8px like HANDLE_WIDTH
            transparentCorners: false, // Solid fill
            borderScaleFactor: 1, // Match the stroke width
            padding: 0,
        });

        fabricCanvasRef.current = canvas;

        // Load background image
        fabric.Image.fromURL(imageUrl, (img) => {
            const container = containerRef.current;
            if (!container) return;

            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;

            const scaleX = containerWidth / (img.width || 1);
            const scaleY = containerHeight / (img.height || 1);
            const scale = Math.min(scaleX, scaleY);

            img.set({
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false,
            });

            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
            canvas.setWidth(containerWidth);
            canvas.setHeight(containerHeight);
        });

        canvas.on("selection:created", (e) => {
            const selected = (e.selected?.[0] as ExtendedTextbox | undefined) ?? null;
            setSelectedObject(selected);
        });
        canvas.on("selection:updated", (e) => {
            const selected = (e.selected?.[0] as ExtendedTextbox | undefined) ?? null;
            setSelectedObject(selected);
        });
        canvas.on("selection:cleared", () => setSelectedObject(null));

        // Store which control is being used
        let currentControl: string | null = null;

        canvas.on("object:scaling", (e) => {
            const obj = e.target as FabricTextbox | undefined;
            if (obj && obj.type === "textbox") {
                const transform = (e as any).transform as { corner?: string } | undefined;
                if (transform?.corner && !currentControl) {
                    currentControl = transform.corner;
                }
                forceUpdate({});
            }
        });

        // Handle text scaling/resizing when done
        canvas.on("object:modified", (e) => {
            const obj = e.target as ExtendedTextbox | undefined;
            if (obj && obj.type === "textbox") {
                const textbox = obj;
                const isCornerHandle = currentControl && ['tl', 'tr', 'bl', 'br'].includes(currentControl);
                const isMiddleHandle = currentControl && ['ml', 'mr'].includes(currentControl);

                const scaleX = textbox.scaleX ?? 1;
                const scaleY = textbox.scaleY ?? 1;
                const baseFontSize = textbox.fontSize ?? 16;
                const baseWidth = textbox.width ?? textbox.getScaledWidth();
                const baseHeight = textbox.height ?? textbox.getScaledHeight();

                if (scaleX !== 1 || scaleY !== 1) {
                    if (isCornerHandle) {
                        // Corner handles: scale BOTH text and frame together
                        const scaleFactor = Math.max(scaleX, scaleY);
                        const newFontSize = Math.round(baseFontSize * scaleFactor);
                        const newWidth = baseWidth * scaleX;

                        textbox.set("fontSize", newFontSize);
                        textbox.set("width", newWidth);
                        textbox.set("scaleX", 1);
                        textbox.set("scaleY", 1);

                        // Store the widget frame dimensions
                        textbox._frameWidth = newWidth;
                        textbox._frameHeight = baseHeight;

                        // Remove clipping for corner resize (we want to see all text)
                        textbox.clipPath = undefined;
                    } else if (isMiddleHandle) {
                        // Middle handles (ml, mr only): resize FRAME width only, text stays same size
                        const newWidth = baseWidth * scaleX;

                        // Store original fontSize if not already stored
                        if (!textbox._originalFontSize) {
                            textbox._originalFontSize = baseFontSize;
                        }

                        // Keep text size the same, just change container width
                        textbox.set("width", newWidth);
                        textbox.set("fontSize", textbox._originalFontSize ?? baseFontSize);
                        textbox.set("scaleX", 1);
                        textbox.set("scaleY", 1);

                        // Store frame dimensions
                        textbox._frameWidth = newWidth;
                        textbox._frameHeight = baseHeight;

                        // Create clipping mask to hide overflow
                        const clipRect = new fabric.Rect({
                            left: -newWidth / 2,
                            top: -baseHeight / 2,
                            width: newWidth,
                            height: baseHeight,
                            absolutePositioned: true
                        });

                        textbox.clipPath = clipRect;
                    }

                    canvas.renderAll();
                    forceUpdate({});
                }

                // Reset control tracking
                currentControl = null;
            }
        });

        return () => {
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, [fabricLoaded, imageUrl]);

    const addText = (text = "THIS IS THE TITLE OF THE BOOK", fontFamily = "Arial") => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !window.fabric) return;

        const textbox = new window.fabric.Textbox(text, {
            left: 100,
            top: 100,
            fontSize: 40,
            fontFamily,
            fill: "#FFFFFF",
            width: 300,
            fontWeight: "bold",
            splitByGrapheme: true,
        }) as ExtendedTextbox;

        // Disable middle top and bottom handles only
        textbox.setControlsVisibility({
            mt: false, // middle top - disabled
            mb: false, // middle bottom - disabled
            ml: true,  // middle left - enabled
            mr: true,  // middle right - enabled
            tl: true,  // top-left corner - enabled
            tr: true,  // top-right corner - enabled
            bl: true,  // bottom-left corner - enabled
            br: true,  // bottom-right corner - enabled
        });

        // Store clip dimensions
        textbox._clipWidth = 300;
        textbox._clipHeight = textbox.height ?? textbox.getScaledHeight();

        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        canvas.renderAll();
    };

    const updateTextProperty = (property: string, value: unknown) => {
        const canvas = fabricCanvasRef.current;
        const activeObject = canvas?.getActiveObject() as ExtendedTextbox | undefined;
        if (activeObject && activeObject.type === "textbox") {
            if (property === "fontSize") {
                activeObject.set("fontSize", value as number);
                activeObject.set("scaleX", 1);
                activeObject.set("scaleY", 1);
            } else {
                (activeObject as any).set(property, value);
            }
            canvas?.renderAll();
            forceUpdate({});
        }
    };

    const duplicateText = () => {
        const canvas = fabricCanvasRef.current;
        const activeObject = canvas?.getActiveObject();
        if (activeObject && activeObject.type === "textbox") {
            (activeObject as ExtendedTextbox).clone((cloned: ExtendedTextbox) => {
                const newLeft = (activeObject.left ?? 0) + 20;
                const newTop = (activeObject.top ?? 0) + 20;
                cloned.set({
                    left: newLeft,
                    top: newTop,
                });
                canvas?.add(cloned);
                canvas?.setActiveObject(cloned);
                canvas?.renderAll();
                setSelectedObject(cloned);
            });
        }
    };

    const deleteText = () => {
        const canvas = fabricCanvasRef.current;
        const activeObject = canvas?.getActiveObject();
        if (activeObject) {
            canvas?.remove(activeObject);
            canvas?.discardActiveObject();
            canvas?.renderAll();
            setSelectedObject(null);
        }
    };

    const bringToFront = () => {
        const canvas = fabricCanvasRef.current;
        const activeObject = canvas?.getActiveObject();
        if (activeObject) {
            canvas?.bringToFront(activeObject);
            canvas?.renderAll();
        }
    };

    const sendToBack = () => {
        const canvas = fabricCanvasRef.current;
        const activeObject = canvas?.getActiveObject();
        if (activeObject) {
            canvas?.sendToBack(activeObject);
            canvas?.renderAll();
        }
    };

    const toggleStyle = (style: "bold" | "italic" | "underline" | "linethrough") => {
        const canvas = fabricCanvasRef.current;
        const activeObject = canvas?.getActiveObject() as ExtendedTextbox | undefined;
        if (!activeObject || activeObject.type !== "textbox") return;

        if (style === "bold") {
            const current = activeObject.fontWeight;
            updateTextProperty("fontWeight", current === "bold" || current === 700 ? "normal" : "bold");
        } else if (style === "italic") {
            updateTextProperty("fontStyle", activeObject.fontStyle === "italic" ? "normal" : "italic");
        } else if (style === "underline") {
            updateTextProperty("underline", !activeObject.underline);
        } else if (style === "linethrough") {
            updateTextProperty("linethrough", !activeObject.linethrough);
        }
    };

    const textObj = selectedObject?.type === "textbox" ? selectedObject : null;
    const fillColor = textObj && typeof textObj.fill === "string" ? textObj.fill : "#FFFFFF";
    const safeScaleX = textObj?.scaleX ?? 1;
    const safeScaleY = textObj?.scaleY ?? 1;
    const displayFontSize = textObj
        ? Math.round((textObj.fontSize ?? 32) * (Math.abs(safeScaleX - safeScaleY) < 0.01 ? safeScaleY : 1))
        : 32;

    if (!fabricLoaded) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-gray-600">Loading Fabric.js...</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full">
            {/* Canvas Container */}
            <div ref={containerRef} className="flex-1 relative bg-gray-100">
                <canvas ref={canvasRef} />
            </div>

            {/* Properties Panel */}
            <div className="bg-white border-l overflow-y-auto h-screen" style={{ width: "280px" }}>
                {/* Add Text Button */}
                <div className="p-4 border-b">
                    <button
                        onClick={() => addText()}
                        className="w-full bg-black text-white px-4 py-2.5 rounded-md flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        Add Text
                    </button>
                </div>

                {/* Fonts Section */}
                <AccordionItem
                    value="fonts"
                    defaultOpen={true}
                    trigger={
                        <>
                            <Type size={16} />
                            Fonts
                        </>
                    }
                >
                    <div className="px-2 py-2 max-h-48 overflow-y-auto">
                                <div className="space-y-1">
                                    {GOOGLE_FONTS.map((font) => (
                                        <button
                                            key={font}
                                            onClick={() => {
                                                if (textObj) {
                                                    updateTextProperty("fontFamily", font);
                                                }
                                            }}
                                            disabled={!textObj}
                                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${textObj
                                                ? "hover:bg-purple-50 cursor-pointer"
                                                : "opacity-50 cursor-not-allowed"
                                                } ${textObj?.fontFamily === font ? "bg-purple-100" : ""}`}
                                            style={{ fontFamily: font }}
                                        >
                                            {font}
                                        </button>
                                    ))}
                                </div>
                            </div>
                </AccordionItem>

                {/* Effects Section */}
                <AccordionItem
                    value="effects"
                    defaultOpen={true}
                    trigger={<>Effects</>}
                >
                    <div className="px-4 py-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {TEXT_EFFECTS.map((effect) => (
                                        <button
                                            key={effect.name}
                                            className="bg-white border border-black text-black px-2.5 py-1.5 text-sm inline-flex items-center justify-center hover:bg-gray-50 transition-all duration-150"
                                        >
                                            {effect.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                </AccordionItem>

                {/* Properties Section */}
                {textObj && (
                    <AccordionItem
                        value="properties"
                        defaultOpen={true}
                        trigger={<>Properties</>}
                    >
                                <div className="px-4 py-4 pb-8">
                                    <div className="space-y-4">
                                        {/* Selection Tools - Reorganized */}
                                        <div className="pb-4 border-b space-y-2">
                                            {/* Row 1: Color, Duplicate, Front, Back, Delete, Bold, Italic */}
                                            <div className="flex items-center gap-1">
                                                {/* Current Color Picker */}
                                                <div className="relative">
                                                    <input
                                                        type="color"
                                                        value={fillColor}
                                                        onChange={(e) => updateTextProperty("fill", e.target.value)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        title="Pick color"
                                                    />
                                                    <div
                                                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
                                                        style={{ backgroundColor: fillColor }}
                                                    />
                                                </div>

                                                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                                                {/* Duplicate */}
                                                <button
                                                    onClick={duplicateText}
                                                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                                    title="Duplicate"
                                                >
                                                    <Copy size={16} />
                                                </button>

                                                {/* Bring to Front */}
                                                <button
                                                    onClick={bringToFront}
                                                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                                    title="Bring to front"
                                                >
                                                    <ArrowUp size={16} />
                                                </button>

                                                {/* Send to Back */}
                                                <button
                                                    onClick={sendToBack}
                                                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                                    title="Send to back"
                                                >
                                                    <ArrowDown size={16} />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={deleteText}
                                                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                                                {/* Bold */}
                                                <button
                                                    onClick={() => toggleStyle("bold")}
                                                    className={`p-1.5 rounded transition-colors ${textObj.fontWeight === "bold" || textObj.fontWeight === 700
                                                        ? "bg-gray-200"
                                                        : "hover:bg-gray-100"
                                                        }`}
                                                    title="Bold"
                                                >
                                                    <Bold size={16} />
                                                </button>

                                                {/* Italic */}
                                                <button
                                                    onClick={() => toggleStyle("italic")}
                                                    className={`p-1.5 rounded transition-colors ${textObj.fontStyle === "italic"
                                                        ? "bg-gray-200"
                                                        : "hover:bg-gray-100"
                                                        }`}
                                                    title="Italic"
                                                >
                                                    <Italic size={16} />
                                                </button>
                                            </div>

                                            {/* Row 2: Underline, Strikethrough & Text Case (left) | Alignments (right) */}
                                            <div className="flex items-center justify-between">
                                                {/* Left side: Underline, Strikethrough and Text Case */}
                                                <div className="flex items-center gap-1">
                                                    {/* Underline */}
                                                    <button
                                                        onClick={() => toggleStyle("underline")}
                                                        className={`p-1.5 rounded transition-colors ${textObj.underline
                                                            ? "bg-gray-200"
                                                            : "hover:bg-gray-100"
                                                            }`}
                                                        title="Underline"
                                                    >
                                                        <Underline size={16} />
                                                    </button>

                                                    {/* Strikethrough */}
                                                    <button
                                                        onClick={() => toggleStyle("linethrough")}
                                                        className={`p-1.5 rounded transition-colors ${textObj.linethrough
                                                            ? "bg-gray-200"
                                                            : "hover:bg-gray-100"
                                                            }`}
                                                        title="Strikethrough"
                                                    >
                                                        <Strikethrough size={16} />
                                                    </button>

                                                    {/* Text Case */}
                                                    <button
                                                        onClick={() => {
                                                            const currentText = textObj.text || "";
                                                            const isUpperCase = currentText === currentText.toUpperCase();
                                                            updateTextProperty("text", isUpperCase ? currentText.toLowerCase() : currentText.toUpperCase());
                                                        }}
                                                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                                        title="Toggle case"
                                                    >
                                                        <CaseSensitive size={16} />
                                                    </button>
                                                </div>

                                                {/* Right side: Alignment buttons */}
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => updateTextProperty("textAlign", "left")}
                                                        className={`p-1.5 rounded transition-colors ${textObj.textAlign === "left"
                                                            ? "bg-gray-200"
                                                            : "hover:bg-gray-100"
                                                            }`}
                                                        title="Align left"
                                                    >
                                                        <AlignLeft size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() => updateTextProperty("textAlign", "center")}
                                                        className={`p-1.5 rounded transition-colors ${textObj.textAlign === "center"
                                                            ? "bg-gray-200"
                                                            : "hover:bg-gray-100"
                                                            }`}
                                                        title="Align center"
                                                    >
                                                        <AlignCenter size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() => updateTextProperty("textAlign", "right")}
                                                        className={`p-1.5 rounded transition-colors ${textObj.textAlign === "right"
                                                            ? "bg-gray-200"
                                                            : "hover:bg-gray-100"
                                                            }`}
                                                        title="Align right"
                                                    >
                                                        <AlignRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Text Content */}
                                        <div>
                                            <textarea
                                                value={textObj.text || ""}
                                                onChange={(e) => {
                                                    updateTextProperty("text", e.target.value);
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                }}
                                                className="w-full bg-white border border-black text-black resize-none overflow-hidden caret-gray-800 outline-none"
                                                placeholder=""
                                                rows={1}
                                                style={{
                                                    minHeight: '40px',
                                                    padding: '8px',
                                                    fontFamily: 'basier-square, ui-sans-serif, system-ui, sans-serif',
                                                    fontSize: '16px',
                                                    lineHeight: '22px',
                                                    overflowWrap: 'break-word',
                                                    whiteSpace: 'pre-wrap',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>

                                        {/* Font Weight & Font Size */}
                                        <div className="flex items-center" style={{ gap: '20px' }}>
                                            <select
                                                value={textObj.fontWeight || "normal"}
                                                onChange={(e) => updateTextProperty("fontWeight", e.target.value)}
                                                className="flex-1 bg-white border border-black text-black cursor-pointer outline-none"
                                                style={{
                                                    minHeight: '40px',
                                                    paddingTop: '8px',
                                                    paddingBottom: '8px',
                                                    paddingLeft: '8px',
                                                    paddingRight: '8px',
                                                    fontSize: '16px',
                                                    lineHeight: '22px',
                                                    boxSizing: 'border-box'
                                                }}
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="bold">Bold</option>
                                                <option value="100">Thin (100)</option>
                                                <option value="200">Extra Light (200)</option>
                                                <option value="300">Light (300)</option>
                                                <option value="400">Normal (400)</option>
                                                <option value="500">Medium (500)</option>
                                                <option value="600">Semi Bold (600)</option>
                                                <option value="700">Bold (700)</option>
                                                <option value="800">Extra Bold (800)</option>
                                                <option value="900">Black (900)</option>
                                            </select>
                                            <input
                                                type="number"
                                                value={displayFontSize}
                                                onChange={(e) => updateTextProperty("fontSize", Number(e.target.value))}
                                                className="bg-white border border-black text-black text-center outline-none"
                                                style={{
                                                    width: '84px',
                                                    minHeight: '40px',
                                                    paddingTop: '8px',
                                                    paddingBottom: '8px',
                                                    paddingLeft: '8px',
                                                    paddingRight: '8px',
                                                    fontSize: '16px',
                                                    lineHeight: '22px',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>

                                        {/* Letter Spacing Control */}
                                        <div className="py-1">
                                            <div className="gap-2 flex flex-col">
                                                <label className="text-xs font-mono text-neutral-700">
                                                    Letter Spacing
                                                </label>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="number"
                                                        value={Math.round(textObj.charSpacing || 0)}
                                                        onChange={(e) => updateTextProperty("charSpacing", Number(e.target.value))}
                                                        min="0"
                                                        max="1000"
                                                        step="10"
                                                        className="w-20 bg-white border border-black text-black px-2 py-1.5 text-xs"
                                                        style={{ boxShadow: 'none' }}
                                                    />
                                                    <input
                                                        type="range"
                                                        value={textObj.charSpacing || 0}
                                                        onChange={(e) => updateTextProperty("charSpacing", Number(e.target.value))}
                                                        min="0"
                                                        max="1000"
                                                        step="10"
                                                        className="flex-1 h-3 bg-neutral-300 cursor-pointer appearance-none outline-none"
                                                        style={{
                                                            background: `linear-gradient(to right, rgb(0, 0, 0) 0%, rgb(0, 0, 0) ${((textObj.charSpacing || 0) / 1000) * 100}%, rgb(200, 200, 200) ${((textObj.charSpacing || 0) / 1000) * 100}%, rgb(200, 200, 200) 100%)`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Line Height Control */}
                                        <div className="py-1">
                                            <div className="gap-2 flex flex-col">
                                                <label className="text-xs font-mono text-neutral-700">
                                                    Line Height
                                                </label>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="number"
                                                        value={(textObj.lineHeight || 1.16).toFixed(2)}
                                                        onChange={(e) => updateTextProperty("lineHeight", Number(e.target.value))}
                                                        min="0.5"
                                                        max="3"
                                                        step="0.1"
                                                        className="w-20 bg-white border border-black text-black px-2 py-1.5 text-xs"
                                                        style={{ boxShadow: 'none' }}
                                                    />
                                                    <input
                                                        type="range"
                                                        value={textObj.lineHeight || 1.16}
                                                        onChange={(e) => updateTextProperty("lineHeight", Number(e.target.value))}
                                                        min="0.5"
                                                        max="3"
                                                        step="0.1"
                                                        className="flex-1 h-3 bg-neutral-300 cursor-pointer appearance-none outline-none"
                                                        style={{
                                                            background: `linear-gradient(to right, rgb(0, 0, 0) 0%, rgb(0, 0, 0) ${(((textObj.lineHeight || 1.16) - 0.5) / 2.5) * 100}%, rgb(200, 200, 200) ${(((textObj.lineHeight || 1.16) - 0.5) / 2.5) * 100}%, rgb(200, 200, 200) 100%)`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transparency Control */}
                                        <div className="py-1">
                                            <div className="gap-2 flex flex-col">
                                                <label className="text-xs font-mono text-neutral-700">
                                                    Transparency
                                                </label>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="number"
                                                        value={(textObj.opacity !== undefined ? textObj.opacity : 1).toFixed(2)}
                                                        onChange={(e) => updateTextProperty("opacity", Number(e.target.value))}
                                                        min="0"
                                                        max="1"
                                                        step="0.01"
                                                        className="w-20 bg-white border border-black text-black px-2 py-1.5 text-xs"
                                                        style={{ boxShadow: 'none' }}
                                                    />
                                                    <input
                                                        type="range"
                                                        value={textObj.opacity !== undefined ? textObj.opacity : 1}
                                                        onChange={(e) => updateTextProperty("opacity", Number(e.target.value))}
                                                        min="0"
                                                        max="1"
                                                        step="0.01"
                                                        className="flex-1 h-3 bg-neutral-300 cursor-pointer appearance-none outline-none"
                                                        style={{
                                                            background: `linear-gradient(to right, rgb(0, 0, 0) 0%, rgb(0, 0, 0) ${((textObj.opacity !== undefined ? textObj.opacity : 1) * 100)}%, rgb(200, 200, 200) ${((textObj.opacity !== undefined ? textObj.opacity : 1) * 100)}%, rgb(200, 200, 200) 100%)`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                    </AccordionItem>
                )}
            </div>
        </div>
    );
}
