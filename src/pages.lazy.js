/**
 * pages.lazy.js - Route-level code splitting
 *
 * This file provides the same Pages registry as pages.config.js, but uses
 * React.lazy() with dynamic imports so that each page becomes a separate
 * JS chunk. Vite/Rollup will split the bundle at every import() call,
 * meaning users only download the code for the pages they actually visit.
 *
 * Layout and mainPage are still sourced from the auto-generated
 * pages.config.js so this file never needs to be kept in sync with it.
 */
import React from 'react';
import __Layout from './Layout.jsx';

// Each lazy() call becomes its own chunk in the production build
const About               = React.lazy(() => import('./pages/About'));
const Calendar            = React.lazy(() => import('./pages/Calendar'));
const CookiePolicy        = React.lazy(() => import('./pages/CookiePolicy'));
const CreateGuideProfile  = React.lazy(() => import('./pages/CreateGuideProfile'));
const CreateTrip          = React.lazy(() => import('./pages/CreateTrip'));
const EditGuideProfile    = React.lazy(() => import('./pages/EditGuideProfile'));
const EditOrganizerProfile= React.lazy(() => import('./pages/EditOrganizerProfile'));
const EditProfile         = React.lazy(() => import('./pages/EditProfile'));
const EditTrip            = React.lazy(() => import('./pages/EditTrip'));
const GreekRefuges        = React.lazy(() => import('./pages/GreekRefuges'));
const GuideProfile        = React.lazy(() => import('./pages/GuideProfile'));
const Guides              = React.lazy(() => import('./pages/Guides'));
const HikerProfile        = React.lazy(() => import('./pages/HikerProfile'));
const Home                = React.lazy(() => import('./pages/Home'));
const ManageBookings      = React.lazy(() => import('./pages/ManageBookings'));
const MyBookings          = React.lazy(() => import('./pages/MyBookings'));
const MyTrips               = React.lazy(() => import('./pages/MyTrips'));
const OrganizerAnalytics    = React.lazy(() => import('./pages/OrganizerAnalytics'));
const OrganizerPlans        = React.lazy(() => import('./pages/OrganizerPlans'));
const OrganizerProfile      = React.lazy(() => import('./pages/OrganizerProfile'));
const OrganizersList      = React.lazy(() => import('./pages/OrganizersList'));
const PrivacyPolicy       = React.lazy(() => import('./pages/PrivacyPolicy'));
const RequestVerification = React.lazy(() => import('./pages/RequestVerification'));
const RoleSelection       = React.lazy(() => import('./pages/RoleSelection'));
const TempImageUploader   = React.lazy(() => import('./pages/TempImageUploader'));
const TermsOfUse          = React.lazy(() => import('./pages/TermsOfUse'));
const TripDetails         = React.lazy(() => import('./pages/TripDetails'));
const TripForm            = React.lazy(() => import('./pages/TripForm'));

export const LAZY_PAGES = {
  About,
  Calendar,
  CookiePolicy,
  CreateGuideProfile,
  CreateTrip,
  EditGuideProfile,
  EditOrganizerProfile,
  EditProfile,
  EditTrip,
  GreekRefuges,
  GuideProfile,
  Guides,
  HikerProfile,
  Home,
  ManageBookings,
  MyBookings,
  MyTrips,
  OrganizerAnalytics,
  OrganizerPlans,
  OrganizerProfile,
  OrganizersList,
  PrivacyPolicy,
  RequestVerification,
  RoleSelection,
  TempImageUploader,
  TermsOfUse,
  TripDetails,
  TripForm,
};

export const lazyPagesConfig = {
  mainPage: 'Home',
  Pages: LAZY_PAGES,
  Layout: __Layout,
};
