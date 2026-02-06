/**
 * Helper functions for handling trip pricing options
 */

/**
 * Get the lowest price from pricing options or fallback to legacy price field
 * @param {Object} trip - The trip object
 * @returns {number|null} - The lowest price or null if no price available
 */
export const getLowestPrice = (trip) => {
  // Check if trip has pricing_options array
  if (trip.pricing_options && Array.isArray(trip.pricing_options) && trip.pricing_options.length > 0) {
    const prices = trip.pricing_options.map(option => option.price).filter(price => price != null);
    return prices.length > 0 ? Math.min(...prices) : null;
  }
  
  // Fallback to legacy price field
  return trip.price != null ? trip.price : null;
};

/**
 * Get the highest price from pricing options or fallback to legacy price field
 * @param {Object} trip - The trip object
 * @returns {number|null} - The highest price or null if no price available
 */
export const getHighestPrice = (trip) => {
  // Check if trip has pricing_options array
  if (trip.pricing_options && Array.isArray(trip.pricing_options) && trip.pricing_options.length > 0) {
    const prices = trip.pricing_options.map(option => option.price).filter(price => price != null);
    return prices.length > 0 ? Math.max(...prices) : null;
  }
  
  // Fallback to legacy price field
  return trip.price != null ? trip.price : null;
};

/**
 * Format price display for trip cards (shows "From €X" for multiple options or "€X" for single price)
 * @param {Object} trip - The trip object
 * @param {string} language - Current language ('en' or 'el')
 * @returns {string} - Formatted price string
 */
export const formatPriceForCard = (trip, language = 'en') => {
  const lowestPrice = getLowestPrice(trip);
  const highestPrice = getHighestPrice(trip);
  
  if (lowestPrice === null) {
    return 'TBA';
  }
  
  // If there are multiple pricing options and they differ, show "From €X"
  if (trip.pricing_options && trip.pricing_options.length > 1 && lowestPrice !== highestPrice) {
    return language === 'el' ? `Από €${lowestPrice}` : `From €${lowestPrice}`;
  }
  
  // Single price or all same price
  return `€${lowestPrice}`;
};

/**
 * Get all pricing options for display on trip details page
 * @param {Object} trip - The trip object
 * @returns {Array} - Array of pricing options with label and price
 */
export const getPricingOptions = (trip) => {
  // Return pricing_options if available
  if (trip.pricing_options && Array.isArray(trip.pricing_options) && trip.pricing_options.length > 0) {
    return trip.pricing_options;
  }
  
  // Fallback: create a single option from legacy price field
  if (trip.price != null) {
    return [{ label: 'Standard', price: trip.price }];
  }
  
  return [];
};