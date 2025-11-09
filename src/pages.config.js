import Calendar from './pages/Calendar';
import TripDetails from './pages/TripDetails';
import CreateTrip from './pages/CreateTrip';
import MyBookings from './pages/MyBookings';
import MyTrips from './pages/MyTrips';
import OrganizerProfile from './pages/OrganizerProfile';
import Home from './pages/Home';
import OrganizersList from './pages/OrganizersList';
import EditProfile from './pages/EditProfile';
import EditTrip from './pages/EditTrip';
import HikerProfile from './pages/HikerProfile';
import ManageBookings from './pages/ManageBookings';
import RequestVerification from './pages/RequestVerification';
import RoleSelection from './pages/RoleSelection';
import MyProfile from './pages/MyProfile';
import TempImageUploader from './pages/TempImageUploader';
import Layout from './Layout.jsx';


export const PAGES = {
    "Calendar": Calendar,
    "TripDetails": TripDetails,
    "CreateTrip": CreateTrip,
    "MyBookings": MyBookings,
    "MyTrips": MyTrips,
    "OrganizerProfile": OrganizerProfile,
    "Home": Home,
    "OrganizersList": OrganizersList,
    "EditProfile": EditProfile,
    "EditTrip": EditTrip,
    "HikerProfile": HikerProfile,
    "ManageBookings": ManageBookings,
    "RequestVerification": RequestVerification,
    "RoleSelection": RoleSelection,
    "MyProfile": MyProfile,
    "TempImageUploader": TempImageUploader,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};