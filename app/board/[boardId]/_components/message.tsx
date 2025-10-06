import React, { useState, useEffect, useRef, Fragment } from "react";
import ContentEditable from "react-contenteditable";
import { Paperclip, X, Loader2 } from "lucide-react";
import { useMutation as useConvexMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

import { colorToCSS } from "@/lib/utils";
import { useMutation, useStorage, useEventListener } from "@/liveblocks.config";
import { MessageLayer, LayerType, MessageImage } from "@/types/canvas";

interface MessageProps {
  id: string;
  layer: MessageLayer;
  onPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor?: string;
  boardId: string;
  onImageClick?: (imageUrl: string) => void;
}

export const Message = ({
  id,
  layer,
  onPointerDown,
  selectionColor,
  boardId,
  onImageClick,
}: MessageProps) => {
  const { x, y, width, height, fill, value, negativePrompt: savedNegativePrompt, images: savedImages } = layer;
  const [isEditing, setIsEditing] = useState(!value);
  const [tempValue, setTempValue] = useState(value || "");
  const [negativePrompt, setNegativePrompt] = useState(savedNegativePrompt || "");
  const [tempImages, setTempImages] = useState<MessageImage[]>(savedImages || []);
  const [showImageLimitAlert, setShowImageLimitAlert] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [clickedImage, setClickedImage] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const negativePromptRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastImageTapRef = useRef<{ index: number; time: number } | null>(null);

  const generateUploadUrl = useConvexMutation(api.images.generateUploadUrl);
  const storeImage = useConvexMutation(api.images.storeImage);

  // Fetch board data to get book details
  const boardData = useQuery(api.board.get, { id: boardId as Id<"boards"> });

  // Count incoming connections to this message node
  const incomingConnectionCount = useStorage((root) => {
    const layers = root.layers;
    let count = 0;

    layers.forEach((layer) => {
      if (layer.type === LayerType.Connection && layer.endId === id) {
        count++;
      }
    });

    return count;
  });

  useEffect(() => {
    if (negativePromptRef.current) {
      negativePromptRef.current.style.height = 'auto';
      negativePromptRef.current.style.height = negativePromptRef.current.scrollHeight + 'px';
    }
  }, [negativePrompt]);

  useEffect(() => {
    if (savedImages && savedImages.length > 0) {
      setTempImages(savedImages);
    }
  }, [savedImages]);

  // Listen for cover generation updates via Liveblocks broadcast
  useEventListener((eventData) => {
    if (eventData.event.type === "MESSAGE_IMAGE_UPDATED" && eventData.event.messageId === id) {
      console.log("📸 Cover generated!", eventData.event);

      // Update with the array of 4 individual images
      if (eventData.event.imageUrls && eventData.event.imageUrls.length > 0) {
        setGeneratedImages(eventData.event.imageUrls); // Array of 4 images
        setSelectedImage(0); // Auto-select first image
        setIsGenerating(false);
        toast.success("Cover generated successfully! Click on an image to select it.");
      }

    } else if (eventData.event.type === "MESSAGE_IMAGE_FAILED" && eventData.event.messageId === id) {
      console.error("❌ Generation failed:", eventData.event.error);
      setIsGenerating(false);
      toast.error(`Cover generation failed: ${eventData.event.error}`);
    }
  });

  const updateValue = useMutation(
    ({ storage }, newValue: string, newNegativePrompt: string, newImages: MessageImage[]) => {
      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(id);
      if (layer) {
        layer.set("value", newValue);
        layer.set("negativePrompt", newNegativePrompt);
        layer.set("images", newImages);
      }
    },
    [],
  );

  const handleSend = async () => {
    if (tempValue.trim() || tempImages.length > 0) {
      updateValue(tempValue, negativePrompt, tempImages);
      setIsEditing(false);

      // Call COVRR API to generate cover
      try {
        setIsGenerating(true);

        // Prepare book data from board details and message content
        // Use message content as title if no book title is provided
        const bookTitle = boardData?.bookDetails?.title || tempValue.slice(0, 100) || "Untitled Book";

        const bookData = {
          title: bookTitle,
          author: boardData?.bookDetails?.author,
          genre: boardData?.bookDetails?.genres, // Note: API expects 'genre' not 'genres'
          description: boardData?.bookDetails?.synopsis || tempValue, // Use message as additional context
          mood: boardData?.bookDetails?.mood,
          setting: boardData?.bookDetails?.otherDetails,
          themes: boardData?.bookDetails?.keywords ? boardData.bookDetails.keywords.split(',').map(k => k.trim()) : undefined,
        };

        // Show warning if no book details are filled
        if (!boardData?.bookDetails?.title) {
          toast.warning("Tip: Add book details (click the book icon) for better cover generation!");
        }

        // Add cover requirements and inspirations to description if available
        let enhancedDescription = bookData.description || '';
        if (boardData?.bookDetails?.coverRequirements) {
          enhancedDescription += `\n\nCover requirements: ${boardData.bookDetails.coverRequirements}`;
        }
        if (boardData?.bookDetails?.inspirations) {
          enhancedDescription += `\n\nInspirations: ${boardData.bookDetails.inspirations}`;
        }
        bookData.description = enhancedDescription;

        // Combine things to avoid with negative prompt
        let fullNegativePrompt = negativePrompt || '';
        if (boardData?.bookDetails?.thingsToAvoid) {
          if (fullNegativePrompt) {
            fullNegativePrompt += ', ' + boardData.bookDetails.thingsToAvoid;
          } else {
            fullNegativePrompt = boardData.bookDetails.thingsToAvoid;
          }
        }

        console.log("📚 Generating cover with book data:", bookData);
        console.log("📝 Prompt:", tempValue);
        console.log("🚫 Negative prompt:", fullNegativePrompt);

        // Call Railway backend
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL}/generate-cover`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              book_data: bookData,
              prompt: tempValue || "",  // Message content as prompt
              negative_prompt: fullNegativePrompt || "",  // Combined negative prompt
              mode: "fast", // You can make this configurable
              board_id: boardId,
              message_id: id,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || "Cover generation failed");
        }

        const result = await response.json();
        console.log("✅ Cover generation started:", result);

        toast.info(`Generating cover... (estimated ${result.estimated_time}s)`);

        // The webhook will handle the rest via broadcast events

      } catch (error) {
        console.error("Generation error:", error);
        setIsGenerating(false);
        toast.error(String(error));
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (tempImages.length + imageFiles.length > 5) {
      setShowImageLimitAlert(true);
      setTimeout(() => setShowImageLimitAlert(false), 3000);
      return;
    }

    setUploadingImage(true);

    try {
      for (const file of imageFiles) {
        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl({ boardId });

        // Upload the file to Convex storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (result.ok) {
          const { storageId } = await result.json();

          // Store image metadata and get URL
          const imageData = await storeImage({
            boardId,
            storageId: storageId as Id<"_storage">,
            name: file.name,
            size: file.size,
          });

          if (imageData) {
            const newImage: MessageImage = {
              url: imageData.url || "",
              name: imageData.name,
              size: imageData.size,
              storageId: storageId,
            };
            setTempImages(prev => [...prev, newImage]);
          }
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setTempImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-miro-image')) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (!isDragOver) {
        setIsDragOver(true);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isDragOver to false if we're actually leaving the element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsDraggingImage(false);

    const imageData = e.dataTransfer.getData('application/x-miro-image');
    if (imageData) {
      try {
        const image: MessageImage = JSON.parse(imageData);

        // Check if we're in editing mode, if not switch to it
        if (!isEditing) {
          setIsEditing(true);
          setTempValue(value || "");
          setNegativePrompt(savedNegativePrompt || "");
          setTempImages(savedImages || []);
        }

        // Check image limit
        const currentImages = isEditing ? tempImages : (savedImages || []);
        if (currentImages.length >= 5) {
          setShowImageLimitAlert(true);
          setTimeout(() => setShowImageLimitAlert(false), 3000);
          return;
        }

        // Check if image already exists
        const imageExists = currentImages.some(img => img.url === image.url);
        if (!imageExists) {
          setTempImages(prev => [...prev, image]);
        }
      } catch (error) {
        console.error("Error handling dropped image:", error);
      }
    }
  };

  const handleImageClick = (imageUrl: string) => {
    if (clickedImage === imageUrl) {
      // This is a double-click (second click on same image)
      if (onImageClick) {
        onImageClick(imageUrl);
      } else {
        // Open in new tab as fallback
        window.open(imageUrl, '_blank');
      }
      setClickedImage(null);
      setShowTooltip(null);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    } else {
      // First click
      setClickedImage(imageUrl);
      setShowTooltip(imageUrl);

      // Clear after 3 seconds
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clickTimeoutRef.current = setTimeout(() => {
        setClickedImage(null);
        setShowTooltip(null);
      }, 3000);
    }
  };

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => {
        if (!isDraggingImage) {
          onPointerDown(e, id);
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        outline: selectionColor ? `2px solid ${selectionColor}` : "none",
        borderRadius: "12px",
      }}
    >
      <div
        className={`h-full w-full bg-white rounded-xl shadow-md border flex flex-col overflow-visible transition-all ${
          isDragOver ? 'border-blue-500 border-2 shadow-lg' : 'border-gray-200'
        }`}
        style={{ backgroundColor: "white", minHeight: 'fit-content' }}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl z-10 flex items-center justify-center">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium">
              Drop image here
            </div>
          </div>
        )}

        {/* Image limit alert */}
        {showImageLimitAlert && (
          <div className="absolute top-2 left-2 right-2 bg-red-500 text-white px-3 py-2 rounded-md text-xs z-20">
            Maximum 5 images per message
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Message/Input section */}
          <div className="flex flex-col">
            {/* Text content */}
            <div className="p-4 overflow-hidden">
            {isEditing ? (
              <textarea
                className="w-full h-full resize-none outline-none text-gray-800 scrollbar-hide"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  letterSpacing: '-0.02px',
                  overflow: 'auto',
                  scrollbarWidth: 'none', // Firefox
                  msOverflowStyle: 'none', // IE/Edge
                }}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                autoFocus
              />
            ) : (
              <div
                className="text-gray-800 whitespace-pre-wrap"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  letterSpacing: '-0.02px',
                  cursor: value ? 'default' : 'text'
                }}
                onClick={() => !value && setIsEditing(true)}
              >
                {value || "Click to add message"}
              </div>
            )}
            </div>

            {/* Image thumbnails for editing - under text section */}
            {isEditing && tempImages.length > 0 && (
              <div className="px-4 pb-2 flex gap-2 flex-wrap mt-2">
                {tempImages.map((image, index) => (
                  <div key={index} className="relative group">
                    {showTooltip === image.url && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                        Click once more to open
                      </div>
                    )}
                    <img
                      src={image.url}
                      alt={image.name}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setIsDraggingImage(true);
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('application/x-miro-image', JSON.stringify({
                          url: image.url,
                          name: image.name,
                          size: image.size,
                          storageId: image.storageId
                        }));
                        const dragImage = new Image();
                        dragImage.src = image.url;
                        e.dataTransfer.setDragImage(dragImage, 32, 32);
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation();
                        setIsDraggingImage(false);
                      }}
                      className="w-16 h-16 object-cover rounded-md border border-gray-200 cursor-move hover:shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(image.url);
                      }}
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Image thumbnails for display (non-editing) - under text section */}
            {!isEditing && savedImages && savedImages.length > 0 && (
              <div className="px-4 pb-2 flex gap-2 flex-wrap mt-2">
                {savedImages.map((image, index) => (
                  <div key={index} className="relative inline-block">
                    {showTooltip === image.url && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                        Click once more to open
                      </div>
                    )}
                    <img
                      src={image.url}
                      alt={image.name}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setIsDraggingImage(true);
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('application/x-miro-image', JSON.stringify({
                          url: image.url,
                          name: image.name,
                          size: image.size,
                          storageId: image.storageId
                        }));
                        const dragImage = new Image();
                        dragImage.src = image.url;
                        e.dataTransfer.setDragImage(dragImage, 32, 32);
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation();
                        setIsDraggingImage(false);
                      }}
                      className="w-16 h-16 object-cover rounded-md border border-gray-200 cursor-move hover:opacity-90 transition-opacity hover:shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(image.url);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Show negative prompt after sending - under text section */}
            {!isEditing && savedNegativePrompt && (
              <div className="border-t border-gray-100 p-2 bg-gray-100 mt-2">
                <div className="text-xs text-gray-600" style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  letterSpacing: '-0.02px'
                }}>
                  <div className="font-semibold mb-1">Negative prompt</div>
                  <div>{savedNegativePrompt}</div>
                </div>
              </div>
            )}

            {/* Generated Images Section - Below message, inside message container */}
            {(isGenerating || generatedImages.length > 0) && !isEditing && (
              <div className="px-4 pb-3">
                {isGenerating ? (
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Generating covers...</p>
                    </div>
                  </div>
                ) : generatedImages.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {/* Horizontal row of images */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {generatedImages.map((imageUrl, index) => {
                        const isExpanded = expandedImageIndex === index;
                        const baseWidth = 240;
                        const baseHeight = 360;
                        const currentWidth = isExpanded ? baseWidth * imageScale : baseWidth;
                        const currentHeight = isExpanded ? baseHeight * imageScale : baseHeight;

                        return (
                          <div
                            key={index}
                            className={`relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 transition-all duration-200 ${
                              selectedImage === index ? 'ring-2 ring-blue-500' : ''
                            }`}
                            style={{
                              width: `${currentWidth}px`,
                              height: `${currentHeight}px`
                            }}
                            onClick={(e) => {
                              e.stopPropagation();

                              // Double-tap detection
                              const now = Date.now();
                              const lastTap = lastImageTapRef.current;

                              if (lastTap && lastTap.index === index && now - lastTap.time < 300) {
                                // Double tap - toggle expansion
                                if (isExpanded) {
                                  setExpandedImageIndex(null);
                                  setImageScale(1);
                                } else {
                                  setExpandedImageIndex(index);
                                  setImageScale(1);
                                }
                                lastImageTapRef.current = null;
                              } else {
                                // Single tap - select
                                setSelectedImage(index);
                                lastImageTapRef.current = { index, time: now };
                              }
                            }}
                            onWheel={(e) => {
                              if (isExpanded) {
                                e.stopPropagation();
                                const delta = -e.deltaY * 0.001;
                                setImageScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
                              }
                            }}
                          >
                            <img
                              src={imageUrl}
                              alt={`Generated variant ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                              draggable={false}
                            />
                            {/* Selection indicator */}
                            {selectedImage === index && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            {/* Hover overlay with number and expand hint */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                              <div className="text-center">
                                <span className="text-white text-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  {index + 1}
                                </span>
                                {!isExpanded && (
                                  <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                    Double-tap to expand
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Expanded indicator */}
                            {isExpanded && (
                              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                {Math.round(imageScale * 100)}%
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Bottom section with negative prompt and send button (spans full width when editing) */}
        {isEditing && (
          <div className="border-t border-gray-100 flex items-start gap-1 p-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Attach images (max 5)"
            >
              <Paperclip size={16} className="text-gray-600" />
            </button>
            <textarea
              ref={negativePromptRef}
              placeholder="Negative prompt..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="flex-1 px-2 py-2 text-xs outline-none bg-gray-100 text-gray-700 placeholder-gray-500 resize-none scrollbar-hide"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                letterSpacing: '-0.02px',
                border: 'none',
                minHeight: '32px',
                lineHeight: '1.4',
                overflow: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            <button
              onClick={handleSend}
              className="bg-black hover:bg-gray-900 text-white px-3 py-2 text-xs transition-colors flex-shrink-0"
              style={{
                borderRadius: '0px',
                fontFamily: 'Inter, sans-serif',
                minHeight: '32px',
              }}
            >
              Send
            </button>
          </div>
        )}

        {/* Connection count indicator */}
        {!isEditing && incomingConnectionCount > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {incomingConnectionCount}
          </div>
        )}
      </div>
    </foreignObject>
  );
};