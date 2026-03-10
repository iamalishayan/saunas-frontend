/**
 * Responsive image utilities
 * 
 * Generates srcSet and sizes attributes for responsive image loading.
 * Works with both self-hosted image variants (stored paths) and
 * legacy external URLs (Cloudinary or other).
 */

interface ImageVariants {
  mobile: string;
  tablet: string;
  desktop: string;
}

interface ResponsiveImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * Get responsive image props (src, srcSet, sizes) for a service post image.
 * 
 * If imageVariants are provided (from backend), uses those directly for srcSet.
 * Otherwise, returns just the original src (no transformation possible for
 * external URLs or legacy data without variants).
 */
export const getResponsiveImageProps = (
  imageUrl: string,
  imageVariants?: ImageVariants | null,
  sizesHint: string = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
): ResponsiveImageProps => {
  if (!imageUrl) {
    return { src: imageUrl };
  }

  // Use stored variants if available
  if (imageVariants?.mobile && imageVariants?.tablet && imageVariants?.desktop) {
    return {
      src: imageUrl,
      srcSet: `${imageVariants.mobile} 400w, ${imageVariants.tablet} 800w, ${imageVariants.desktop} 1200w`,
      sizes: sizesHint,
    };
  }

  // No variants available — return original URL
  return { src: imageUrl };
};

/**
 * Get the best single URL for a given target width.
 * Useful for CSS background-image where srcSet isn't available.
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  imageVariants?: ImageVariants | null,
  targetWidth: 'mobile' | 'tablet' | 'desktop' = 'desktop'
): string => {
  if (!imageUrl) return imageUrl;

  // Use stored variant if available
  if (imageVariants?.[targetWidth]) {
    return imageVariants[targetWidth];
  }

  // No variant — return original
  return imageUrl;
};

/**
 * Get responsive image props for vessel images.
 * Uses relative paths (same as blog images) since uploads are served from the same origin.
 */
export const getVesselImageProps = (
  imagePath: string | undefined,
  imageVariants?: ImageVariants | null,
  sizesHint: string = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
): ResponsiveImageProps | null => {
  if (!imagePath) return null;

  // Use stored variants if available
  if (imageVariants?.mobile && imageVariants?.tablet && imageVariants?.desktop) {
    return {
      src: imagePath,
      srcSet: `${imageVariants.mobile} 400w, ${imageVariants.tablet} 800w, ${imageVariants.desktop} 1200w`,
      sizes: sizesHint,
    };
  }

  // No variants available — return path directly
  return { src: imagePath };
};

