/**
 * Image Preview Component
 * Displays images with zoom and fullscreen controls
 */

import { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCw, X } from 'lucide-react';

interface ImagePreviewProps {
  /** Image source URL */
  src: string;
  /** Image file name */
  fileName: string;
  /** Alt text for accessibility */
  alt?: string;
}

export function ImagePreview({ src, fileName, alt }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      handleReset();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.25, Math.min(prev + delta, 5)));
  };

  return (
    <div
      className={`relative flex flex-col h-full ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-black'
          : 'bg-gray-50 dark:bg-gray-900'
      }`}
    >
      {/* Toolbar */}
      <div
        className={`flex items-center justify-between gap-2 p-3 ${
          isFullscreen
            ? 'bg-black/80 backdrop-blur-sm'
            : 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            onClick={handleRotate}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Rotate 90°"
            aria-label="Rotate image"
          >
            <RotateCw className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Reset View"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <X className="w-4 h-4 text-white" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={src}
          alt={alt || fileName}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          draggable={false}
        />
      </div>

      {/* Info Bar */}
      {isFullscreen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm">
          <p className="text-sm text-white text-center font-medium truncate">
            {fileName}
          </p>
        </div>
      )}
    </div>
  );
}
