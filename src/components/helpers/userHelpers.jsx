/**
 * Check if a user is an organizer
 * A user is considered an organizer if they have an organizer_code assigned
 */
export const isOrganizer = (user) => {
  if (!user) return false;
  return !!(user.organizer_code && user.organizer_code.trim().length > 0);
};

/**
 * Check if a user is a hiker
 * A user is considered a hiker if they exist but do NOT have an organizer_code
 */
export const isHiker = (user) => {
  if (!user) return false;
  return !isOrganizer(user);
};

/**
 * Check if a user is a verified organizer
 */
export const isVerifiedOrganizer = (user) => {
  if (!user) return false;
  return user.is_verified_organizer === true;
};