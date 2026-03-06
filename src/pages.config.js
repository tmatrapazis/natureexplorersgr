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
import CookiePolicy from './pages/CookiePolicy';
import CreateGuideProfile from './pages/CreateGuideProfile';
import CreateTrip from './pages/CreateTrip';
import EditGuideProfile from './pages/EditGuideProfile';
import EditOrganizerProfile from './pages/EditOrganizerProfile';
import EditProfile from './pages/EditProfile';
import EditTrip from './pages/EditTrip';
import GreekRefuges from './pages/GreekRefuges';
import GuideProfile from './pages/GuideProfile';
import Guides from './pages/Guides';
import HikerProfile from './pages/HikerProfile';
import Home from './pages/Home';
import MyTrips from './pages/MyTrips';
import OrganizerProfile from './pages/OrganizerProfile';
import OrganizersList from './pages/OrganizersList';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RequestVerification from './pages/RequestVerification';
import RoleSelection from './pages/RoleSelection';
import TempImageUploader from './pages/TempImageUploader';
import TermsOfUse from './pages/TermsOfUse';
import TripDetails from './pages/TripDetails';
import TripForm from './pages/TripForm';
import Calendar from './pages/Calendar';
import __Layout from './Layout.jsx';


export const PAGES = {
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
    "Calendar": Calendar,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};