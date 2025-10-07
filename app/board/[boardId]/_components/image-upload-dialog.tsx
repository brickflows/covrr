"use client";

import React, { useState } from "react";
import { X, Upload, Link as LinkIcon } from "lucide-react";

interface ImageUploadDialogProps {
  onSubmit: (imageUrl: string) => void;
  onCancel: () => void;
}

export const ImageUploadDialog = ({ onSubmit, onCancel }: ImageUploadDialogProps) => {
  const [imageUrl, setImageUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"url" | "upload">("url");

  const handleSubmit = () => {
    if (imageUrl.trim()) {
      onSubmit(imageUrl.trim());
      setImageUrl("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      // Create a local URL for the uploaded file
      const url = URL.createObjectURL(file);
      onSubmit(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[90vw]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Add Image</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("url")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "url"
                ? "text-black border-b-2 border-black"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <LinkIcon className="w-4 h-4 inline mr-2" />
            Image URL
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "upload"
                ? "text-black border-b-2 border-black"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload File
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === "url" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!imageUrl.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Image
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop an image, or click to browse
                </p>
                <label className="inline-block px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md cursor-pointer transition-colors">
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <button
                onClick={onCancel}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
