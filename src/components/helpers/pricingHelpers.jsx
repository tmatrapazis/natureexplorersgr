/**
 * Helper functions for handling trip pricing options
 */

/**
 * Get the lowest price from pricing options or fallback to legacy price field
 */
export const getLowestPrice = (trip) => {
  if (trip.pricing_options && Array.isArray(trip.pricing_options) && trip.pricing_options.length > 0) {
    const prices = trip.pricing_options.map(option => option.price).filter(price => price != null);
    return prices.length > 0 ? Math.min(...prices) : null;
  }
  return trip.price != null ? trip.price : null;
};

/**
 * Get the highest price from pricing options or fallback to legacy price field
 */
export const getHighestPrice = (trip) => {
  if (trip.pricing_options && Array.isArray(trip.pricing_options) && trip.pricing_options.length > 0) {
    const prices = trip.pricing_options.map(option => option.price).filter(price => price != null);
    return prices.length > 0 ? Math.max(...prices) : null;
  }
  return trip.price != null ? trip.price : null;
};

/**
 * Format price display for trip cards — always shows "From €X"
 */
export const formatPriceForCard = (trip, language = 'en') => {
  const lowestPrice = getLowestPrice(trip);
  if (lowestPrice === null) return language === 'el' ? 'ΤΒΑ' : 'TBA';
  return language === 'el' ? `Από €${lowestPrice}` : `From €${lowestPrice}`;
};

/**
 * Get all pricing options for display on trip details / booking form
 */
export const getPricingOptions = (trip) => {
  if (trip.pricing_options && Array.isArray(trip.pricing_options) && trip.pricing_options.length > 0) {
    return trip.pricing_options;
  }
  if (trip.price != null) {
    return [{ label: 'Standard', price: trip.price }];
  }
  return [];
};

/**
 * Get remaining available slots for a specific pricing tier.
 * Returns null if the tier has no slot limit defined (no per-tier cap).
 *
 * @param {Object} trip - The trip object (needs pricing_options and id)
 * @param {Array}  bookings - Array of booking objects
 * @param {string} tierLabel - The label of the pricing tier to check
 * @returns {number|null} Remaining slots, or null if no per-tier limit
 */
export const getTierAvailability = (trip, bookings, tierLabel) => {
  const tier = (trip.pricing_options || []).find(t => t.label === tierLabel);
  if (!tier || !tier.slots) return null;

  const confirmedForTier = (bookings || [])
    .filter(b =>
      b.trip_id === trip.id &&
      b.status === 'confirmed' &&
      b.pricing_option_label === tierLabel
    )
    .reduce((sum, b) => sum + (b.number_of_people || 0), 0);

  return Math.max(0, tier.slots - confirmedForTier);
};
