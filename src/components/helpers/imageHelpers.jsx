// Unsplash hiking-themed images as fallbacks
const FALLBACK_HIKING_IMAGES = [
  'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', // Mountain hiking trail
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', // Mountain peak landscape
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', // Mountain scenery
  'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80', // Hiker on trail
  'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80', // Mountain hiking
  'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80', // Mountain landscape
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&q=80', // Mountain trail
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80', // Mountain peaks
  'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&q=80', // Wilderness trail
  'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=800&q=80', // Forest hiking trail
];

/**
 * Get a trip image URL with fallback to random hiking-themed image
 * @param {string|null|undefined} imageUrl - The trip's image URL
 * @param {string} tripId - Trip ID for consistent random selection
 * @returns {string} Valid image URL
 */
export const getTripImage = (imageUrl, tripId) => {
  // If image URL exists and is valid, return it
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
    return imageUrl;
  }
  
  // Otherwise, return a random fallback image
  // Use trip ID to ensure the same trip always gets the same fallback image
  const index = tripId ? Math.abs(hashString(tripId)) % FALLBACK_HIKING_IMAGES.length : 
                         Math.floor(Math.random() * FALLBACK_HIKING_IMAGES.length);
  
  return FALLBACK_HIKING_IMAGES[index];
};

/**
 * Simple string hash function for consistent random selection
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

/**
 * Handle image load errors by setting a fallback
 * @param {Event} event - Image error event
 * @param {string} tripId - Trip ID for consistent fallback
 */
export const handleImageError = (event, tripId) => {
  if (event.target && !event.target.dataset.fallbackApplied) {
    event.target.dataset.fallbackApplied = 'true';
    event.target.src = getTripImage(null, tripId);
  }
};