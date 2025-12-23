import Calendar from './pages/Calendar';
import CreateTrip from './pages/CreateTrip';
import EditProfile from './pages/EditProfile';
import EditTrip from './pages/EditTrip';
import HikerProfile from './pages/HikerProfile';
import Home from './pages/Home';
import ManageBookings from './pages/ManageBookings';
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
import __Layout from './Layout.jsx';


export const PAGES = {
    "Calendar": Calendar,
    "CreateTrip": CreateTrip,
    "EditProfile": EditProfile,
    "EditTrip": EditTrip,
    "HikerProfile": HikerProfile,
    "Home": Home,
    "ManageBookings": ManageBookings,
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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};