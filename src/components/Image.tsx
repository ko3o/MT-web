import React from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export const Image: React.FC<ImageProps> = ({ src, fallback = 'https://picsum.photos/seed/tea/400/300', alt, ...props }) => {
  // 防呆：如果 src 為空或 undefined，使用 fallback
  const imageSrc = src && src.trim() !== '' ? src : fallback;

  return (
    <img
      src={imageSrc}
      alt={alt || 'Me & Tea Image'}
      referrerPolicy="no-referrer"
      onError={(e) => {
        // 如果載入失敗，也使用 fallback
        const target = e.target as HTMLImageElement;
        target.onerror = null;
        target.src = fallback;
      }}
      {...props}
    />
  );
};
