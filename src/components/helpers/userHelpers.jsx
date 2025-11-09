/**
 * Check if a user is an organizer
 * A user is considered an organizer if:
 * 1. Their role is 'admin' (set by platform admin)
 * 2. OR they have requested to be an organizer (verification_status is not 'none')
 */
export const isOrganizer = (user) => {
  if (!user) return false;
  return user.role === 'admin' || (user.verification_status && user.verification_status !== 'none');
};

/**
 * Check if a user is a verified organizer
 */
export const isVerifiedOrganizer = (user) => {
  if (!user) return false;
  return user.is_verified_organizer === true;
};