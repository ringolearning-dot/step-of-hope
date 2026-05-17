import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import OurStory from './pages/OurStory';
import MissionPage from './pages/MissionPage';
import Impact from './pages/Impact';
import YNO from './pages/YNO';
import EventsServices from './pages/EventsServices';
import Donate from './pages/Donate';
import Volunteer from './pages/Volunteer';
import Contact from './pages/Contact';
import ReservationPage from './pages/ReservationPage';

import AdminLogin from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import DonationsAdmin from './pages/admin/DonationsAdmin';
import ImagesAdmin from './pages/admin/ImagesAdmin';
import VolunteersAdmin from './pages/admin/VolunteersAdmin';
import ContactsAdmin from './pages/admin/ContactsAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';
import ContentAdmin from './pages/admin/ContentAdmin';
import ReservationsAdmin from './pages/admin/ReservationsAdmin';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1B2A4A', color: '#fff', borderRadius: '12px' },
          }}
        />
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/our-story" element={<OurStory />} />
          <Route path="/mission" element={<MissionPage />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/yno" element={<YNO />} />
          <Route path="/events" element={<EventsServices />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/reserve/:type" element={<ReservationPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="donations" element={<DonationsAdmin />} />
            <Route path="images" element={<ImagesAdmin />} />
            <Route path="content" element={<ContentAdmin />} />
            <Route path="volunteers" element={<VolunteersAdmin />} />
            <Route path="contacts" element={<ContactsAdmin />} />
            <Route path="reservations" element={<ReservationsAdmin />} />
            <Route path="settings" element={<SettingsAdmin />} />
          </Route>
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
