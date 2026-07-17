"use client";

import { useState, useRef, useEffect } from "react";

interface ImageCropperProps {
  imageUrl: string;
  onSave: (croppedData: { url: string; crop: CropData }) => void;
  onReset: () => void;
  onCancel: () => void;
  initialCrop?: CropData;
}

export interface CropData {
  x: number; // percentage
  y: number; // percentage
  zoom: number; // 0.2 to 2
}

export default function ImageCropper({ imageUrl, onSave, onReset, onCancel, initialCrop }: ImageCropperProps) {
  const [crop, setCrop] = useState<CropData>(initialCrop || { x: 50, y: 50, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      // Convert pixel movement to percentage
      const percentX = (deltaX / containerWidth) * 100;
      const percentY = (deltaY / containerHeight) * 100;

      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100, prev.x + percentX)),
        y: Math.max(0, Math.min(100, prev.y + percentY))
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCrop(prev => ({ ...prev, zoom: parseFloat(e.target.value) }));
  };

  const handleSave = () => {
    onSave({ url: imageUrl, crop });
  };

  const handleReset = () => {
    setCrop({ x: 50, y: 50, zoom: 1 });
    onReset();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Crop Image for Mobile</h3>
        
        {/* Cropping area */}
        <div 
          ref={containerRef}
          className="relative bg-gray-100 rounded-lg overflow-hidden mb-4 cursor-move select-none"
          style={{ 
            width: '100%',
            aspectRatio: '9/16', // Mobile aspect ratio
            maxHeight: '60vh'
          }}
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute w-full h-full pointer-events-none"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${100 / crop.zoom}%`,
              backgroundPosition: `${crop.x}% ${crop.y}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
          
          {/* Crop overlay */}
          <div className="absolute inset-0 border-2 border-white/50 pointer-events-none">
            <div className="absolute inset-0 border border-dashed border-white/30" />
          </div>
          
          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
          </div>
        </div>

        {/* Zoom control */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zoom: {Math.round(crop.zoom * 100)}%
          </label>
          <input
            type="range"
            min="0.2"
            max="2"
            step="0.01"
            value={crop.zoom}
            onChange={handleZoomChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#b88a78]"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>20%</span>
            <span>200%</span>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-sm text-gray-600 mb-4">
          Drag the image to adjust position. Use the zoom slider to resize. This crop will only affect the mobile view.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#b88a78] text-white rounded-lg text-sm hover:bg-[#a67968] transition-colors"
            >
              Save Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
