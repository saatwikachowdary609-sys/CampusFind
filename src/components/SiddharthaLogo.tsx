import React from 'react';

interface SiddharthaLogoProps {
  className?: string;
  maxWidth?: number | string;
  alt?: string;
  style?: React.CSSProperties;
}

/**
 * Official Siddhartha Academy of Higher Education logo.
 * Rendered strictly as a single, complete, uncropped image file preserving
 * the original emblem, colors, typography, proportions, and layout.
 */
export const SiddharthaLogo: React.FC<SiddharthaLogoProps> = ({
  className = '',
  maxWidth = 320,
  alt = 'Siddhartha Academy of Higher Education (Deemed to be University) - Vijayawada',
  style = {},
}) => {
  return (
    <img
      src="/assets/siddhartha_logo.png"
      alt={alt}
      className={`object-contain bg-white select-none ${className}`}
      style={{
        width: '100%',
        maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
        height: 'auto',
        display: 'block',
        ...style,
      }}
      loading="eager"
    />
  );
};
