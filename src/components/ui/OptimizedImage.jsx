import React from 'react';

/**
 * Performance-optimized image component for PageSpeed
 * - Implements responsive sizing with srcset
 * - Prevents CLS with explicit dimensions
 * - Lazy loading for below-the-fold images
 * - WebP format with JPG fallback
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = "",
  objectFit = "cover",
  sizes = "100vw",
  onError,
}) {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Generate responsive srcset for Unsplash images
  const generateSrcSet = (url) => {
    if (!url || !url.includes('unsplash.com')) return '';
    
    const baseUrl = url.split('?')[0];
    return `
      ${baseUrl}?w=400&q=75&fm=webp 400w,
      ${baseUrl}?w=800&q=75&fm=webp 800w,
      ${baseUrl}?w=1200&q=75&fm=webp 1200w,
      ${baseUrl}?w=1600&q=75&fm=webp 1600w
    `.trim();
  };

  const handleError = (e) => {
    if (onError) {
      onError(e);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Calculate aspect ratio for CLS prevention
  const aspectRatio = width && height ? `${width}/${height}` : 'auto';

  return (
    <div
      className={`relative overflow-hidden bg-muted ${className}`}
      style={{
        aspectRatio,
        width: '100%',
        height: '100%'
      }}
    >
      <img
        src={imgSrc}
        srcSet={generateSrcSet(imgSrc)}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onError={handleError}
        onLoad={handleLoad}
        className={`w-full h-full transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          objectFit: /** @type {import('react').CSSProperties['objectFit']} */ (objectFit),
          width: '100%',
          height: '100%'
        }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-muted/60" />
      )}
    </div>
  );
}