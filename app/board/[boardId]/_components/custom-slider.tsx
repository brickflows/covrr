"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CustomSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label = 'Slider',
  disabled = false,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastPositionRef = useRef<number>(0);

  // Calculate percentage
  const percentage = ((value - min) / (max - min)) * 100;

  // Update value from position (smooth during drag, no stepping)
  const updateValueFromPosition = useCallback((clientX: number, applyStep = false) => {
    if (!trackRef.current || disabled) return;

    const rect = trackRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + position * (max - min);

    // Apply step only when requested (on mouse up or track click)
    const finalValue = applyStep
      ? Math.round(rawValue / step) * step
      : rawValue;
    const clampedValue = Math.max(min, Math.min(max, finalValue));

    // Always update during drag for smooth movement, check difference for non-drag updates
    if (applyStep) {
      // Only update if different (for clicks and keyboard)
      if (Math.abs(clampedValue - value) > 0.0001) {
        onChange(clampedValue);
      }
    } else {
      // Always update during drag for smoothness
      onChange(clampedValue);
    }
  }, [min, max, step, value, onChange, disabled]);

  // Mouse down handler (smooth during drag)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    lastPositionRef.current = e.clientX; // Store initial position
    setIsDragging(true);
    updateValueFromPosition(e.clientX, false); // No stepping during drag
  }, [disabled, updateValueFromPosition]);

  // Mouse move handler (smooth during drag, step on release)
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      lastPositionRef.current = e.clientX;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        updateValueFromPosition(lastPositionRef.current, false); // Smooth, no stepping
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Apply step on release for clean final value
      updateValueFromPosition(lastPositionRef.current, true);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDragging, updateValueFromPosition]);

  // Track click handler (apply step immediately on click)
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (disabled || e.target !== trackRef.current) return;
    updateValueFromPosition(e.clientX, true); // Apply step on click
  }, [disabled, updateValueFromPosition]);

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    let newValue = value;
    const largeStep = step * 10;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newValue = value - (e.shiftKey ? largeStep : step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newValue = value + (e.shiftKey ? largeStep : step);
        break;
      case 'Home':
        e.preventDefault();
        newValue = min;
        break;
      case 'End':
        e.preventDefault();
        newValue = max;
        break;
      default:
        return;
    }

    const clampedValue = Math.max(min, Math.min(max, newValue));
    if (clampedValue !== value) {
      onChange(clampedValue);
    }
  }, [value, min, max, step, onChange, disabled]);

  return (
    <div className={`relative ${className}`}>
      {/* Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`relative h-1 w-full cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}
        style={{
          borderRadius: '2px',
        }}
      >
        {/* Unfilled track */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: disabled ? '#F3F4F6' : '#E5E7EB',
            borderRadius: '2px',
          }}
        />

        {/* Filled track with gradient */}
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            width: `${percentage}%`,
            background: disabled
              ? '#E5E7EB'
              : '#000000',
            borderRadius: '2px',
            transition: isDragging ? 'none' : 'width 150ms ease-out', // No transition during drag
          }}
        />

        {/* Optional decorative start dot */}
        {!disabled && percentage > 0 && (
          <div
            className="absolute"
            style={{
              left: '0px',
              top: '-2px',
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              backgroundColor: '#000000',
              opacity: 0.4,
            }}
          />
        )}

        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${
            disabled ? 'cursor-not-allowed' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            left: `${percentage}%`,
            transition: isDragging ? 'none' : 'left 150ms ease-out', // No transition during drag
          }}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
          aria-disabled={disabled}
        >
          {/* Focus ring */}
          {isFocused && !disabled && (
            <>
              {/* Outer ring */}
              <div
                className="absolute inset-0 -m-1"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #C7D2FE',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              {/* Inner ring */}
              <div
                className="absolute inset-0"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '1px solid #3B82F6',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </>
          )}

          {/* Thumb circle */}
          <div
            className="transition-all duration-150"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: disabled ? '#E5E7EB' : '#FFFFFF',
              border: `1px solid ${isDragging ? '#000000' : '#D1D5DB'}`,
              boxShadow: disabled
                ? 'none'
                : isHovering || isDragging
                ? '0 2px 6px rgba(0,0,0,0.14)'
                : '0 1px 2px rgba(0,0,0,0.10)',
            }}
          />

        </div>
      </div>
    </div>
  );
};
