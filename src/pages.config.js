/**
 * pages.config.js - Refactored for Lazy Loading
 */
import __Layout from './Layout.jsx';

// We export the keys/names, but NOT the static imports.
// This allows pages.lazy.js to map these keys to lazy components.
export const PAGES = {
    "About": "About",
    "Calendar": "Calendar",
    "CookiePolicy": "CookiePolicy",
    "CreateGuideProfile": "CreateGuideProfile",
    "CreateTrip": "CreateTrip",
    "EditGuideProfile": "EditGuideProfile",
    "EditOrganizerProfile": "EditOrganizerProfile",
    "EditProfile": "EditProfile",
    "EditTrip": "EditTrip",
    "GreekRefuges": "GreekRefuges",
    "GuideProfile": "GuideProfile",
    "Guides": "Guides",
    "HikerProfile": "HikerProfile",
    "Home": "Home",
    "MyTrips": "MyTrips",
    "OrganizerProfile": "OrganizerProfile",
    "OrganizersList": "OrganizersList",
    "PrivacyPolicy": "PrivacyPolicy",
    "RequestVerification": "RequestVerification",
    "RoleSelection": "RoleSelection",
    "TermsOfUse": "TermsOfUse",
    "TripDetails": "TripDetails",
    "TripForm": "TripForm",
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};