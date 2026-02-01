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
import Calendar from './pages/Calendar';
import CreateTrip from './pages/CreateTrip';
import EditOrganizerProfile from './pages/EditOrganizerProfile';
import EditProfile from './pages/EditProfile';
import EditTrip from './pages/EditTrip';
import HikerProfile from './pages/HikerProfile';
import Home from './pages/Home';
import MyBookings from './pages/MyBookings';
import MyProfile from './pages/MyProfile';
import MyTrips from './pages/MyTrips';
import OrganizerProfile from './pages/OrganizerProfile';
import OrganizersList from './pages/OrganizersList';
import RequestVerification from './pages/RequestVerification';
import RoleSelection from './pages/RoleSelection';
import TempImageUploader from './pages/TempImageUploader';
import TermsOfUse from './pages/TermsOfUse';
import TripDetails from './pages/TripDetails';
import Guides from './pages/Guides';
import GuideProfile from './pages/GuideProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Calendar": Calendar,
    "CreateTrip": CreateTrip,
    "EditOrganizerProfile": EditOrganizerProfile,
    "EditProfile": EditProfile,
    "EditTrip": EditTrip,
    "HikerProfile": HikerProfile,
    "Home": Home,
    "MyBookings": MyBookings,
    "MyProfile": MyProfile,
    "MyTrips": MyTrips,
    "OrganizerProfile": OrganizerProfile,
    "OrganizersList": OrganizersList,
    "RequestVerification": RequestVerification,
    "RoleSelection": RoleSelection,
    "TempImageUploader": TempImageUploader,
    "TermsOfUse": TermsOfUse,
    "TripDetails": TripDetails,
    "Guides": Guides,
    "GuideProfile": GuideProfile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};