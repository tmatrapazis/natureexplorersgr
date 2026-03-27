import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabNavigation } from './TabNavigationContext';

/**
 * Human-readable labels for known route pathnames.
 * Used to populate the back-button label with the previous screen's name.
 */
const ROUTE_LABELS = {
  '/calendar':          'Calendar',
  '/organizerslist':    'Organizers',
  '/guides':            'Guides',
  '/greekrefuges':      'Refuges',
  '/mytrips':           'My Trips',
  '/editprofile':       'Profile',
  '/tripdetails':       'Trip',
  '/organizerprofile':  'Organizer',
  '/guideprofile':      'Guide Profile',
  '/tripform':          'Trip Form',   // unified create + edit page
  '/hikerprofile':      'My Bookings',
};

function labelForPath(path) {
  if (!path) return 'Back';
  const pathname = path.split('?')[0].toLowerCase();
  return ROUTE_LABELS[pathname] ?? 'Back';
}

/**
 * useBackNavigation — single source of truth for back-button logic across the app.
 *
 * Derives its state entirely from the TabNavigationContext stack so every
 * screen (AppLayout header AND in-page back buttons) behaves identically.
 *
 * @param {string|null} fallbackUrl  Where to navigate when the tab stack has no
 *                                    prior entry. Pass null to hide the button when
 *                                    there is no history.
 *
 * @returns {{
 *   canGoBack:        boolean,  // true if tab stack has ≥ 2 entries
 *   showBackButton:   boolean,  // canGoBack OR fallbackUrl is provided
 *   backLabel:        string,   // name of the previous screen (e.g. "Calendar")
 *   goBack:           () => void
 * }}
 */
export function useBackNavigation(fallbackUrl = null) {
  const { canGoBack, goBackInTab, tabStacks, currentTab } = useTabNavigation();
  const navigate = useNavigate();

  const backLabel = useMemo(() => {
    const stack = tabStacks[currentTab] || [];
    if (stack.length >= 2) return labelForPath(stack[stack.length - 2]);
    return fallbackUrl ? labelForPath(fallbackUrl) : 'Back';
  }, [tabStacks, currentTab, fallbackUrl]);

  const goBack = useCallback(() => {
    if (canGoBack) {
      goBackInTab();
    } else if (fallbackUrl) {
      navigate(fallbackUrl);
    }
  }, [canGoBack, goBackInTab, fallbackUrl, navigate]);

  const showBackButton = canGoBack || !!fallbackUrl;

  return { canGoBack, showBackButton, backLabel, goBack };
}
