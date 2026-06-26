import React from 'react';

/**
 * Reusable loading overlay component.
 *
 * Props:
 * - loading: boolean → whether to show the overlay
 * - children: JSX.Element → page content
 * - text: optional string → spinner text
 * - size: optional number → spinner size
 * - contentOpacity: optional string → Tailwind opacity class for content (default: 'opacity-60')
 * - overlayOpacity: optional string → Tailwind bg-opacity class for overlay (default: 'bg-opacity-50')
 */
const LoadingIndicator = ({
  loading = false,
  children,
  text = 'Loading...',
  size = 16,
  contentOpacity = 'opacity-60',
  overlayOpacity = 'bg-opacity-50',
}) => {
  return (
    <div className="relative">
      {/* Page content, semi-transparent if loading */}
      <div className={loading ? `${contentOpacity} pointer-events-none` : ''}>
        {children}
      </div>

      {/* Overlay spinner */}
      {loading && (
        <div
          className={`absolute inset-0 z-50 flex items-center justify-center bg-white ${overlayOpacity}`}
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className="animate-spin rounded-full border-t-4 border-b-4 border-blue-600"
              style={{ width: size * 2, height: size * 2 }}
            ></div>
            {text && <span className="text-gray-600 text-sm">{text}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;
