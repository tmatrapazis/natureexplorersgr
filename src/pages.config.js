/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';

// Lazy-loaded pages for code splitting and performance
const Calendar = lazy(() => import('./pages/Calendar'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const CreateGuideProfile = lazy(() => import('./pages/CreateGuideProfile'));
const CreateTrip = lazy(() => import('./pages/CreateTrip'));
const EditGuideProfile = lazy(() => import('./pages/EditGuideProfile'));
const EditOrganizerProfile = lazy(() => import('./pages/EditOrganizerProfile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const EditTrip = lazy(() => import('./pages/EditTrip'));
const GreekRefuges = lazy(() => import('./pages/GreekRefuges'));
const GuideProfile = lazy(() => import('./pages/GuideProfile'));
const Guides = lazy(() => import('./pages/Guides'));
const HikerProfile = lazy(() => import('./pages/HikerProfile'));
const Home = lazy(() => import('./pages/Home'));
const MyTrips = lazy(() => import('./pages/MyTrips'));
const OrganizerProfile = lazy(() => import('./pages/OrganizerProfile'));
const OrganizersList = lazy(() => import('./pages/OrganizersList'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const RequestVerification = lazy(() => import('./pages/RequestVerification'));
const RoleSelection = lazy(() => import('./pages/RoleSelection'));
const TempImageUploader = lazy(() => import('./pages/TempImageUploader'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const TripDetails = lazy(() => import('./pages/TripDetails'));
const TripForm = lazy(() => import('./pages/TripForm'));

export const PAGES = {
    "Calendar": Calendar,
    "CookiePolicy": CookiePolicy,
    "CreateGuideProfile": CreateGuideProfile,
    "CreateTrip": CreateTrip,
    "EditGuideProfile": EditGuideProfile,
    "EditOrganizerProfile": EditOrganizerProfile,
    "EditProfile": EditProfile,
    "EditTrip": EditTrip,
    "GreekRefuges": GreekRefuges,
    "GuideProfile": GuideProfile,
    "Guides": Guides,
    "HikerProfile": HikerProfile,
    "Home": Home,
    "MyTrips": MyTrips,
    "OrganizerProfile": OrganizerProfile,
    "OrganizersList": OrganizersList,
    "PrivacyPolicy": PrivacyPolicy,
    "RequestVerification": RequestVerification,
    "RoleSelection": RoleSelection,
    "TempImageUploader": TempImageUploader,
    "TermsOfUse": TermsOfUse,
    "TripDetails": TripDetails,
    "TripForm": TripForm,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};