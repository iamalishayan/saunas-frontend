import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import './App.css';

// Eagerly load Home - it's the landing page and critical for LCP
import Home from './pages/Home';

// Lazy load all other pages for better performance (code splitting)
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Services = lazy(() => import('./pages/Services'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Booking = lazy(() => import('./pages/Booking'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
const BookingCancel = lazy(() => import('./pages/BookingCancel'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const TrackBooking = lazy(() => import('./pages/TrackBooking'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '60vh',
    fontSize: '1.2rem',
    color: '#666'
  }}>
    <div>Loading...</div>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:slug" element={<BlogPost />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/booking/success" element={<BookingSuccess />} />
              <Route path="/booking/cancel" element={<BookingCancel />} />
              <Route path="/track-booking" element={<TrackBooking />} />
              <Route path="/my-bookings" element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              } />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} /> {/* Admin login only - Backend enforces role check */}
              {/* Register route removed - Only one admin needed. Guests use OTP, Staff created by admin */}
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;