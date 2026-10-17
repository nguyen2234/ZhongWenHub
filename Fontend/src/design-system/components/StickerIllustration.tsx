import React from 'react';
import {
  STICKERS,
  STICKER_SIZES,
  STICKER_METADATA,
  type StickerName,
  type StickerSizePreset,
} from '../../assets/stickers';

export {
  STICKERS,
  STICKER_SIZES,
  STICKER_METADATA,
  type StickerName,
  type StickerSizePreset,
};

export interface StickerIllustrationProps {
  /** Identifier of the sticker asset */
  name: StickerName;
  /** Size preset ('xs'=32, 'sm'=48, 'md'=72, 'lg'=104, 'xl'=136) or custom pixel size */
  size?: StickerSizePreset | number;
  /** Accessible description for screen readers (if not decorative) */
  alt?: string;
  /** Optional custom CSS class */
  className?: string;
  /** When true, marks image as purely decorative (alt="", aria-hidden="true") */
  decorative?: boolean;
  /** Browser image loading behavior */
  loading?: 'lazy' | 'eager';
  /** Additional inline styles */
  style?: React.CSSProperties;
}

export const StickerIllustration: React.FC<StickerIllustrationProps> = ({
  name,
  size = 'md',
  alt = '',
  className = '',
  decorative = false,
  loading = 'lazy',
  style,
}) => {
  const src = STICKERS[name];
  const pixelSize = typeof size === 'number' ? size : STICKER_SIZES[size] || 72;

  if (!src) {
    return null;
  }

  const resolvedAlt = decorative ? '' : (alt || STICKER_METADATA[name]?.label || '');

  return (
    <img
      src={src}
      width={pixelSize}
      height={pixelSize}
      alt={resolvedAlt}
      aria-hidden={decorative ? 'true' : undefined}
      loading={loading}
      className={`zh-sticker-illustration ${className}`.trim()}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    />
  );
};
