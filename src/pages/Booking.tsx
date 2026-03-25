import React, { useState, useEffect, lazy, Suspense } from 'react';

import { getUpcomingTrips, createBooking, createMobileSaunaBooking, initiatePayment, checkMobileSaunaAvailability, getMobileSaunaPricingPreview, getPublicWaiverPDF } from '../services/api';
import { Trip, BookingFormData, PricingPreviewResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
// Lazy load calendar component for better performance
const MobileSaunaCalendar = lazy(() => import('../components/MobileSaunaCalendar/MobileSaunaCalendar'));
import GuestCheckoutFlow from '../components/GuestCheckout/GuestCheckoutFlow';
import VesselImageCarousel from '../components/VesselImageCarousel/VesselImageCarousel';
import { clearGuestToken, getGuestEmail, isTokenExpired, getGuestToken } from '../services/guestAuth';
import './Booking.css';

interface MobileSaunaBookingData {
    startDate: string; // YYYY-MM-DD format
    endDate: string; // YYYY-MM-DD format
    customerName: string;
    customerEmail: string; // NEW: Required
    customerBirthdate: string; // NEW: YYYY-MM-DD format
    customerPhone: string;
    deliveryAddress: string;
    additionalWoodBins: number; // NEW: 0-10 range
}

const Booking: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
    
    // Guest OTP verification state
    const [guestVerified, setGuestVerified] = useState<boolean>(false); // Start as false, validate in useEffect
    const [showGuestCheckout, setShowGuestCheckout] = useState<boolean>(false);
    const [guestEmail, setGuestEmail] = useState<string>('');
    const [, setGuestToken] = useState<string>('');
    const [bookingData, setBookingData] = useState<BookingFormData>({
        tripId: '',
        vesselId: '',
        seatsBooked: 1,
        isGroup: false,
        customerName: '',
        customerEmail: '',
        customerPhone: ''
    });
    const [mobileSaunaData, setMobileSaunaData] = useState<MobileSaunaBookingData>({
        startDate: '',
        endDate: '',
        customerName: '',
        customerEmail: '',
        customerBirthdate: '',
        customerPhone: '',
        deliveryAddress: '',
        additionalWoodBins: 0
    });
    const [processing, setProcessing] = useState<boolean>(false);
    
    // Availability checking state
    const [checkingAvailability, setCheckingAvailability] = useState<boolean>(false);
    const [availabilityData, setAvailabilityData] = useState<{
        available: number;
        booked: number;
        total: number;
        message?: string;
    } | null>(null);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);

    // Pricing preview state
    const [pricingPreview, setPricingPreview] = useState<PricingPreviewResponse | null>(null);
    const [loadingPricing, setLoadingPricing] = useState<boolean>(false);
    const [pricingError, setPricingError] = useState<string | null>(null);

    // Calendar visibility state
    const [showCalendar, setShowCalendar] = useState<boolean>(true);

    // Agreement state (inline, not modal)
    const [bookingCreated, setBookingCreated] = useState<boolean>(false);
    const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
    const [waiverPreAccepted, setWaiverPreAccepted] = useState<boolean>(false);
    const [agreementAccepted, setAgreementAccepted] = useState<boolean>(false);
    const [agreementHtml, setAgreementHtml] = useState<string>('');
    const [waiverPdfLoading, setWaiverPdfLoading] = useState<boolean>(false);
    const [waiverPdfError, setWaiverPdfError] = useState<string | null>(null);

    // Validate guest token on mount
    useEffect(() => {
        const token = getGuestToken();
        const email = getGuestEmail();
        
        if (token && email && !isTokenExpired(token)) {
            setGuestVerified(true);
            setGuestEmail(email);
            setGuestToken(token);
        } else if (token) {
            // Token exists but is expired - clear it
            clearGuestToken();
            setGuestVerified(false);
            setGuestEmail('');
            setGuestToken('');
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            fetchUpcomingTrips();
        }
    }, [authLoading]);

    const fetchUpcomingTrips = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUpcomingTrips();
            // Filter out trips with null vessels (orphaned trips)
            const validTrips = data.filter((trip: any) => trip.vessel != null);
            setTrips(validTrips);
        } catch (err: any) {
            console.error('Error fetching trips:', err);
            
            // Check if error is token expiration
            if (err.response?.status === 401 && guestVerified) {
                // Guest token expired
                handleClearGuestState();
                setError('Your session expired. Please verify your email again to continue.');
            } else {
                setError(err.message || 'Failed to fetch upcoming trips');
            }
        } finally {
            setLoading(false);
        }
    };

    // Clear guest verification state
    const handleClearGuestState = () => {
        clearGuestToken();
        setGuestVerified(false);
        setGuestEmail('');
        setGuestToken('');
        setBookingCreated(false);
        setPendingBookingId(null);
        setWaiverPreAccepted(false);
        setAgreementAccepted(false);
        setAgreementHtml('');
    };



    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const formatPrice = (priceCents: number): string => {
        return `$${(priceCents / 100).toFixed(2)}`;
    };

    const getMinimumAdultBirthdate = (): string => {
        const today = new Date();
        const minAdultDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        return minAdultDate.toISOString().split('T')[0];
    };

    const isAtLeast18 = (birthdate: string): boolean => {
        if (!birthdate) return false;

        const birth = new Date(birthdate);
        if (Number.isNaN(birth.getTime())) return false;

        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age -= 1;
        }

        return age >= 18;
    };

    const handleBookTrip = (trip: Trip) => {
        // Allow everyone to view booking form - login required only at submission
        // Clear any previous errors
        setError(null);
        setAvailabilityData(null);
        setAvailabilityError(null);
        
        // Reset booking and agreement states
        setBookingCreated(false);
        setPendingBookingId(null);
        setWaiverPreAccepted(false);
        setAgreementAccepted(false);
        setAgreementHtml('');

        // Initialize appropriate booking data based on vessel type
        if (trip.vessel.type === 'mobile_sauna') {
            // Initialize with empty dates - user will select from calendar
            const today = new Date();
            today.setDate(today.getDate() + 1); // Default to tomorrow
            const tomorrow = today.toISOString().split('T')[0];
            
            setMobileSaunaData({
                startDate: tomorrow,
                endDate: tomorrow,
                customerName: '',
                customerEmail: guestVerified ? guestEmail : '',
                customerBirthdate: '',
                customerPhone: '',
                deliveryAddress: '',
                additionalWoodBins: 0
            });
        } else {
            setBookingData({
                tripId: trip._id,
                vesselId: trip.vessel._id,
                seatsBooked: 1,
                isGroup: false,
                customerName: '',
                customerEmail: guestVerified ? guestEmail : '',
                customerPhone: ''
            });
        }
        
        setSelectedTrip(trip);
        
        // If not authenticated and not verified as guest, show OTP flow first
        if (!isAuthenticated && !guestVerified) {
            setShowGuestCheckout(true);
        } else {
            setShowBookingForm(true);
        }
    };

    // Check availability when dates change
    const checkAvailability = async (vesselId: string, startDate: string, endDate: string) => {
        if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
            setAvailabilityData(null);
            return;
        }

        setCheckingAvailability(true);
        setAvailabilityError(null);

        try {
            const result = await checkMobileSaunaAvailability(vesselId, startDate, endDate);
            setAvailabilityData(result);
            
            if (result.available === 0) {
                setAvailabilityError(`No units available for selected dates. All ${result.total} unit(s) are booked.`);
            }
        } catch (err: any) {
            console.error('Error checking availability:', err);
            setAvailabilityError(err.message || 'Failed to check availability');
            setAvailabilityData(null);
        } finally {
            setCheckingAvailability(false);
        }
    };

    // Get pricing preview when dates or relevant fields change
    const fetchPricingPreview = async (
        vesselId: string,
        startDate: string,
        endDate: string,
        deliveryAddress?: string,
        additionalWoodBins?: number
    ) => {
        if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
            setPricingPreview(null);
            return;
        }

        setLoadingPricing(true);
        setPricingError(null);

        try {
            const result = await getMobileSaunaPricingPreview(
                vesselId,
                startDate,
                endDate,
                deliveryAddress,
                additionalWoodBins
            );
            setPricingPreview(result);
        } catch (err: any) {
            console.error('Error fetching pricing:', err);
            setPricingError(err.message || 'Failed to calculate pricing');
            setPricingPreview(null);
        } finally {
            setLoadingPricing(false);
        }
    };

    // Effect to check availability when dates change
    useEffect(() => {
        if (selectedTrip?.vessel.type === 'mobile_sauna' && mobileSaunaData.startDate && mobileSaunaData.endDate) {
            checkAvailability(selectedTrip.vessel._id, mobileSaunaData.startDate, mobileSaunaData.endDate);
        }
    }, [mobileSaunaData.startDate, mobileSaunaData.endDate, selectedTrip]);

    // Effect to fetch pricing preview when dates, delivery address, or wood bins change
    useEffect(() => {
        if (selectedTrip?.vessel.type === 'mobile_sauna' && mobileSaunaData.startDate && mobileSaunaData.endDate) {
            fetchPricingPreview(
                selectedTrip.vessel._id,
                mobileSaunaData.startDate,
                mobileSaunaData.endDate,
                mobileSaunaData.deliveryAddress || undefined,
                mobileSaunaData.additionalWoodBins
            );
        }
    }, [
        mobileSaunaData.startDate,
        mobileSaunaData.endDate,
        mobileSaunaData.deliveryAddress,
        mobileSaunaData.additionalWoodBins,
        selectedTrip
    ]);

    const isValidMobileSaunaForm = (): boolean => {
        if (!selectedTrip) return false;
        
        return (
            mobileSaunaData.startDate !== '' &&
            mobileSaunaData.endDate !== '' &&
            mobileSaunaData.customerName.trim() !== '' &&
            mobileSaunaData.customerEmail.trim() !== '' &&
            mobileSaunaData.customerBirthdate !== '' &&
            isAtLeast18(mobileSaunaData.customerBirthdate) &&
            mobileSaunaData.customerPhone.trim() !== '' &&
            mobileSaunaData.deliveryAddress.trim() !== '' &&
            waiverPreAccepted &&
            mobileSaunaData.additionalWoodBins >= 0 &&
            mobileSaunaData.additionalWoodBins <= 10
        );
    };

    const isValidBoatTrailerForm = (): boolean => {
        if (!selectedTrip) return false;
        
        return (
            bookingData.customerName?.trim() !== '' &&
            bookingData.customerEmail?.trim() !== '' &&
            bookingData.customerPhone?.trim() !== '' &&
            (bookingData.seatsBooked || 0) > 0
        );
    };

    const handleMobileSaunaBooking = async () => {
        // Allow both authenticated users and verified guests to book
        if ((!isAuthenticated && !guestVerified) || !selectedTrip) return;

        // Clear any previous error
        setError(null);

        // Validate mobile sauna booking data
        if (!mobileSaunaData.startDate) {
            setError('Please select a pickup date');
            return;
        }
        if (!mobileSaunaData.endDate) {
            setError('Please select a drop-off date');
            return;
        }
        if (new Date(mobileSaunaData.endDate) < new Date(mobileSaunaData.startDate)) {
            setError('Drop-off date must be after pickup date');
            return;
        }
        // Check availability before allowing booking
        if (availabilityData && availabilityData.available === 0) {
            setError(`No units available for selected dates. All ${availabilityData.total} unit(s) are booked. Please select different dates.`);
            return;
        }
        if (checkingAvailability) {
            setError('Please wait while we check availability...');
            return;
        }
        if (!mobileSaunaData.customerName || !mobileSaunaData.customerName.trim()) {
            setError('Please enter your full name');
            return;
        }
        if (!mobileSaunaData.customerEmail || !mobileSaunaData.customerEmail.trim()) {
            setError('Please enter your email address');
            return;
        }
        if (!mobileSaunaData.customerBirthdate) {
            setError('Please enter your birthdate');
            return;
        }
        if (!isAtLeast18(mobileSaunaData.customerBirthdate)) {
            setError('You must be at least 18 years old to book a mobile sauna');
            return;
        }
        if (!mobileSaunaData.customerPhone || !mobileSaunaData.customerPhone.trim()) {
            setError('Please enter your phone number');
            return;
        }
        if (!mobileSaunaData.deliveryAddress || !mobileSaunaData.deliveryAddress.trim()) {
            setError('Please enter delivery address');
            return;
        }
        if (mobileSaunaData.additionalWoodBins < 0 || mobileSaunaData.additionalWoodBins > 10) {
            setError('Additional wood bins must be between 0 and 10');
            return;
        }
        if (!waiverPreAccepted) {
            setError('Please accept the rental terms and waiver before continuing');
            return;
        }

        // If we get here, validation passed
        setProcessing(true);

        try {
            // Create mobile sauna booking (agreement will be accepted in modal)
            const bookingResponse = await createMobileSaunaBooking({
                tripId: selectedTrip._id,
                startDate: mobileSaunaData.startDate,
                endDate: mobileSaunaData.endDate,
                customerName: mobileSaunaData.customerName,
                customerEmail: mobileSaunaData.customerEmail,
                customerBirthdate: mobileSaunaData.customerBirthdate,
                customerPhone: mobileSaunaData.customerPhone,
                deliveryAddress: mobileSaunaData.deliveryAddress,
                additionalWoodBins: mobileSaunaData.additionalWoodBins,
                rulesAgreed: false,
                waiverSigned: false
            });
            const booking = bookingResponse.booking;
            
            // Use booking.id (not _id) as per backend response
            const bookingId = booking.id || booking._id;

            // Store booking ID for fallback/manual flow
            setPendingBookingId(bookingId);

            // Auto-accept agreement (user has already accepted pre-booking waiver)
            // and proceed directly to Stripe to avoid requiring a second click.
            try {
                const { acceptAgreement } = await import('../services/api');
                await acceptAgreement(bookingId);
                setAgreementAccepted(true);

                const paymentResponse = await initiatePayment({
                    bookingId,
                    successUrl: `${window.location.origin}/booking/success?bookingId=${bookingId}`,
                    cancelUrl: `${window.location.origin}/booking/cancel?bookingId=${bookingId}`
                });

                if (paymentResponse.url) {
                    window.location.href = paymentResponse.url;
                    return;
                }
            } catch (paymentErr: any) {
                // Fallback to existing manual agreement/payment flow if auto step fails.
                setBookingCreated(true);
                setError(paymentErr.message || 'Booking created, but automatic payment redirect failed. Please continue manually.');

                try {
                    const { previewAgreement } = await import('../services/api');
                    const html = await previewAgreement(bookingId);
                    setAgreementHtml(html);
                } catch (previewErr: any) {
                    console.error('Failed to load agreement preview after payment failure:', previewErr);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create mobile sauna booking');
        } finally {
            setProcessing(false);
        }
    };

    const handleProceedToPayment = async () => {
        if (!pendingBookingId || !agreementAccepted) return;

        setProcessing(true);
        try {
            // Accept agreement first
            const { acceptAgreement } = await import('../services/api');
            await acceptAgreement(pendingBookingId);

            // Initiate payment
            const paymentResponse = await initiatePayment({
                bookingId: pendingBookingId,
                successUrl: `${window.location.origin}/booking/success?bookingId=${pendingBookingId}`,
                cancelUrl: `${window.location.origin}/booking/cancel?bookingId=${pendingBookingId}`
            });

            // Redirect to Stripe Checkout
            if (paymentResponse.url) {
                window.location.href = paymentResponse.url;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to initiate payment');
            setProcessing(false);
        }
    };

    const handlePreviewAgreement = () => {
        if (!agreementHtml) return;
        
        // Open agreement in new tab
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Rental Agreement - Booking ${pendingBookingId}</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            max-width: 900px;
                            margin: 40px auto;
                            padding: 20px;
                            line-height: 1.6;
                            color: #333;
                        }
                        h1, h2, h3 { color: #8B4513; }
                        @media print {
                            body { margin: 20px; }
                        }
                    </style>
                </head>
                <body>
                    ${agreementHtml}
                </body>
                </html>
            `);
            newWindow.document.close();
        }
    };

    const handleOpenWaiverPdf = async () => {
        if (waiverPdfLoading) return;

        setWaiverPdfLoading(true);
        setWaiverPdfError(null);

        const popup = window.open('about:blank', '_blank');

        if (!popup) {
            setWaiverPdfLoading(false);
            setWaiverPdfError('Please allow pop-ups to view the waiver PDF.');
            return;
        }

        popup.document.write('<p style="font-family: sans-serif; padding: 1rem;">Loading waiver PDF...</p>');

        try {
            const pdfBlob = await getPublicWaiverPDF();
            const blobUrl = URL.createObjectURL(pdfBlob);
            popup.location.href = blobUrl;

            // Give the browser enough time to open/use the object URL before cleanup.
            window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        } catch (err: any) {
            popup.close();
            setWaiverPdfError(err.message || 'Unable to load waiver PDF right now. Please try again.');
        } finally {
            setWaiverPdfLoading(false);
        }
    };

    const handleBookingSubmit = async () => {
        // Allow both authenticated users and verified guests to book
        if ((!isAuthenticated && !guestVerified) || !selectedTrip) return;

        // Validate customer information for boat/trailer bookings
        if (!bookingData.customerName?.trim()) {
            setError('Please enter your full name');
            return;
        }
        if (!bookingData.customerEmail?.trim()) {
            setError('Please enter your email address');
            return;
        }
        if (!bookingData.customerPhone?.trim()) {
            setError('Please enter your phone number');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            // Create booking
            const bookingResponse = await createBooking(bookingData);
            const booking = bookingResponse.booking;

            // Initiate payment
            const paymentResponse = await initiatePayment({
                bookingId: booking._id,
                successUrl: `${window.location.origin}/booking/success?bookingId=${booking._id}`,
                cancelUrl: `${window.location.origin}/booking/cancel?bookingId=${booking._id}`
            });

            // Redirect to Stripe Checkout
            if (paymentResponse.url) {
                window.location.href = paymentResponse.url;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create booking');
        } finally {
            setProcessing(false);
        }
    };

    const handleGroupBooking = (trip: Trip) => {
        // Allow everyone to view booking form - login required only at submission
        // Clear any previous errors
        setError(null);

        // Initialize booking data for group booking with customer fields
        setBookingData({
            tripId: trip._id,
            vesselId: trip.vessel._id,
            isGroup: true,
            seatsBooked: trip.vessel.capacity, // Full capacity for group booking
            customerName: '',
            customerEmail: guestVerified ? guestEmail : '',
            customerPhone: ''
        });
        
        setSelectedTrip(trip);
        
        // If not authenticated and not verified as guest, show OTP flow first
        if (!isAuthenticated && !guestVerified) {
            setShowGuestCheckout(true);
        } else {
            setShowBookingForm(true);
        }
    };

    if (authLoading) {
        return (
            <div className="booking-page booking-glass">
                <div className="bookingPage-content">
                    <div className="container">
                    <div className="loading-container booking-glass-panel">
                        <div className="loading-spinner"></div>
                        <p>Loading authentication...</p>
                    </div>
                </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="booking-page booking-glass">
                <div className="bookingPage-content">
                    <div className="container">
                    <div className="loading-container booking-glass-panel">
                        <div className="loading-spinner"></div>
                        <p>Loading available trips...</p>
                    </div>
                </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="booking-page booking-glass">
                <div className="bookingPage-content">
                    <div className="container">
                    <div className="error-container booking-glass-panel">
                        <h2>Unable to Load Trips</h2>
                        <p>{error}</p>
                        {error.includes('session expired') || error.includes('verify your email') ? (
                            <button 
                                className="btn btn-primary" 
                                onClick={() => {
                                    handleClearGuestState();
                                    setError(null);
                                }}
                            >
                                Verify Email
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={fetchUpcomingTrips}>
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-page booking-glass">
            {/* Hero Section with Background Image */}
            <section className="booking-hero">
                <div className="booking-hero-overlay"></div>
                <div className="booking-hero-content">
                    <h1>Book Your Experience</h1>
                    <p>Ready to embark on your wellness journey? Choose from our available sauna experiences!</p>
                </div>
            </section>

            {/* Main Content with Solid Background */}
            <div className="bookingPage-content">
                <div className="container">
                <div className="booking-intro booking-glass-panel">
                    <h2 className="booking-intro__title">Choose a Trip or Rental</h2>
                    <p className="booking-intro__subtitle">
                        Explore upcoming sauna boat trips or reserve a mobile sauna rental — designed for calm, comfort, and a seamless checkout.
                    </p>
                </div>
                
                {error && (
                    <div className="error-message booking-glass-alert booking-glass-alert--error">
                        <p><strong>Error:</strong> {error}</p>
                        <div>
                            <button className="btn btn-secondary" onClick={() => setError(null)}>Dismiss</button>
                            <button className="btn btn-primary" onClick={fetchUpcomingTrips} style={{marginLeft: '10px'}}>
                                Retry
                            </button>
                        </div>
                    </div>
                )}



                {!isAuthenticated && !guestVerified && (
                    <div className="auth-notice booking-glass-alert booking-glass-alert--info">
                        <p>When ready to book, we'll verify your email with a quick code.</p>
                    </div>
                )}
                
                {!isAuthenticated && guestVerified && (
                    <div className="auth-notice booking-glass-alert booking-glass-alert--success" style={{background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)', border: '1px solid #c3e6cb'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                            <p style={{margin: 0}}>✓ <strong>Email verified!</strong> You're all set to complete your booking as <strong>{guestEmail}</strong></p>
                            <button 
                                onClick={handleClearGuestState}
                                className="btn-secondary"
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '0.85rem',
                                    whiteSpace: 'nowrap',
                                    marginLeft: '15px'
                                }}
                            >
                                Use Different Email
                            </button>
                        </div>
                    </div>
                )}
                
                {trips.length === 0 ? (
                    <div className="no-trips-container">
                        <h3>No trips available</h3>
                        <p>We currently don't have any scheduled trips. Please check back later or contact us directly.</p>
                        <p><em>For immediate bookings, please contact us directly.</em></p>
                    </div>
                ) : (
                    <div className="booking-options">
                        {trips.map(trip => (
                            <div key={trip._id} className="booking-option trip-card booking-card">
                                {/* Vessel Image */}
                                {trip.vessel.images && trip.vessel.images.length > 0 ? (
                                    <div className="trip-card-image-container">
                                        <VesselImageCarousel
                                            images={trip.vessel.images}
                                            imageVariants={trip.vessel.imageVariants}
                                            vesselName={trip.vessel.name}
                                            autoRotate={true}
                                            rotateInterval={20000}
                                        />
                                    </div>
                                ) : (
                                    <div className={`trip-card-image-placeholder ${trip.vessel.type === 'mobile_sauna' ? 'sauna-placeholder' : 'boat-placeholder'}`}>
                                        <div className="placeholder-content">
                                            <div className="placeholder-icon">
                                                📷
                                            </div>
                                            <div className="placeholder-text">No Photo Available</div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="trip-header">
                                    <h3>{trip.vessel.name}</h3>
                                    <div className="trip-badges">
                                        <span className={`vessel-type ${trip.vessel.type === 'mobile_sauna' ? 'mobile-sauna-badge' : ''}`}>
                                            {trip.vessel.type === 'mobile_sauna' ? 'Mobile Sauna' : trip.vessel.type}
                                        </span>
                                        {trip.vessel.type === 'mobile_sauna' ? (
                                            <span className="availability available">Available for Rental</span>
                                        ) : (
                                            <>
                                                {trip.remainingSeats > 0 ? (
                                                    <span className="availability available">
                                                        {trip.remainingSeats} seats available
                                                    </span>
                                                ) : (
                                                    <span className="availability full">Fully booked</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {trip.vessel.type === 'mobile_sauna' ? (
                                    // Mobile Sauna Rental Information
                                    <div className="trip-details">
                                        <p><strong>Type:</strong> Mobile Sauna Rental</p>
                                        <p><strong>Capacity:</strong> Up to {trip.vessel.capacity} people</p>
                                        <p><strong>Minimum Rental:</strong> {trip.vessel.minimumDays || 1} day{(trip.vessel.minimumDays || 1) > 1 ? 's' : ''}</p>
                                        {(trip.vessel.inventory ?? 1) > 1 && (
                                            <p><strong>Units Available:</strong> {trip.vessel.inventory}</p>
                                        )}
                                        {trip.vessel.enforceWeeklyBoundary && trip.vessel.pickupDropoffDay !== undefined && (
                                            <p><strong>Pickup / Drop-off Day:</strong> {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][trip.vessel.pickupDropoffDay]}</p>
                                        )}

                                        {/* Smart pricing breakdown */}
                                        {trip.vessel.pricingTiers ? (() => {
                                            const pt = trip.vessel.pricingTiers!;

                                            // Build raw tiers: [minDay, maxDay, totalPriceCents]
                                            const rawTiers: Array<[number, number, number]> = [
                                                [1, 3, pt.days1to3],
                                                ...(pt.day4 ? [[4, 4, pt.day4] as [number, number, number]] : []),
                                                ...(pt.day5 ? [[5, 5, pt.day5] as [number, number, number]] : []),
                                                ...(pt.day6 ? [[6, 6, pt.day6] as [number, number, number]] : []),
                                                ...(pt.day7 ? [[7, 7, pt.day7] as [number, number, number]] : []),
                                            ];

                                            // Group consecutive tiers with the same total price
                                            type TierGroup = { min: number; max: number; price: number };
                                            const groups: TierGroup[] = [];
                                            for (const [min, max, price] of rawTiers) {
                                                const prev = groups[groups.length - 1];
                                                if (prev && prev.price === price && prev.max + 1 === min) {
                                                    prev.max = max; // extend range
                                                } else {
                                                    groups.push({ min, max, price });
                                                }
                                            }

                                            // Best value = lowest price per max-day in group
                                            const bestIdx = groups.length > 1
                                                ? groups.reduce((bi, g, i) =>
                                                    g.price / g.max < groups[bi].price / groups[bi].max ? i : bi, 0)
                                                : -1;

                                            return (
                                                <div className="pricing-tiers">
                                                    <p><strong>Rental Pricing:</strong></p>
                                                    <div className="pricing-tier-list">
                                                        {groups.map((g, i) => {
                                                            const isFlat = g.min === 1 && g.max === 3;
                                                            const label = isFlat
                                                                ? '1–3 days'
                                                                : g.min === g.max
                                                                    ? `${g.min} day${g.min > 1 ? 's' : ''}`
                                                                    : `${g.min}–${g.max} days`;

                                                            return (
                                                                <div key={i} className={`pricing-tier-row${i === bestIdx ? ' best-value' : ''}`}>
                                                                    <div className="tier-left">
                                                                        <span className="tier-label">{label}</span>
                                                                    </div>
                                                                    <div className="tier-right">
                                                                        <span className="tier-price">{formatPrice(g.price)}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <p><strong>Starting Price:</strong> {formatPrice(trip.vessel.basePriceCents)}</p>
                                        )}

                                        {(trip.vessel.discountThreshold ?? 0) > 0 && (trip.vessel.discountPercent ?? 0) > 0 && (
                                            <p className="discount-info">
                                                🎉 <strong>{trip.vessel.discountPercent}% off</strong> for rentals of {trip.vessel.discountThreshold}+ days
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    // Boat/Trailer Trip Information
                                    <div className="trip-details">
                                        <p><strong>Departure:</strong> {formatDate(trip.departureTime)}</p>
                                        <p><strong>Duration:</strong> {formatDuration(trip.durationMinutes)}</p>
                                        <p><strong>Capacity:</strong> Up to {trip.vessel.capacity} people</p>
                                        <p><strong>Price:</strong> {formatPrice(trip.vessel.basePriceCents)} per person</p>
                                    </div>
                                )}

                                {/* <div className="trip-description">
                                    <p>Experience the ultimate relaxation with our authentic sauna boat journey. 
                                    Perfect for groups, families, or special occasions.</p>
                                </div> */}
                                
                                <div className="trip-actions">
                                    {trip.vessel.type === 'mobile_sauna' ? (
                                        // Mobile Sauna Action Button
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => handleBookTrip(trip)}
                                            disabled={processing}
                                        >
                                            {processing ? 'Processing...' : 'Book Rental'}
                                        </button>
                                    ) : (
                                        // Boat/Trailer Action Buttons
                                        <>
                                            <button 
                                                className={`btn ${trip.remainingSeats > 0 ? 'btn-primary' : 'btn-disabled'}`}
                                                onClick={() => handleBookTrip(trip)}
                                                disabled={trip.remainingSeats === 0 || processing}
                                            >
                                                {processing ? 'Processing...' : 
                                                 trip.remainingSeats > 0 ? 'Book Seats' : 'Fully Booked'}
                                            </button>
                                            
                                            {trip.remainingSeats > 0 && (
                                                <button 
                                                    className="btn btn-secondary"
                                                    onClick={() => handleGroupBooking(trip)}
                                                    disabled={processing}
                                                >
                                                    {processing ? 'Processing...' : 'Book Entire Trip'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Guest OTP Checkout Modal */}
                {showGuestCheckout && !isAuthenticated && !guestVerified && (
                    <div className="trip-details-modal">
                        <div className="modal-content booking-modal booking-glass-panel" style={{maxWidth: '600px'}}>
                            <GuestCheckoutFlow
                                onVerified={(email, token) => {
                                    setGuestEmail(email);
                                    setGuestToken(token);
                                    setGuestVerified(true);
                                    setShowGuestCheckout(false);
                                    // Auto-open booking form after verification
                                    setShowBookingForm(true);
                                }}
                                onCancel={() => {
                                    setShowGuestCheckout(false);
                                    setSelectedTrip(null);
                                }}
                            />
                        </div>
                    </div>
                )}

                {showBookingForm && selectedTrip && (isAuthenticated || guestVerified) && (
                    <div className="trip-details-modal">
                        <div className="modal-content booking-modal booking-glass-panel">
                            <div className="booking-modal__header">
                                <h3>
                                    {selectedTrip.vessel.type === 'mobile_sauna' 
                                        ? 'Mobile Sauna Rental - ' + selectedTrip.vessel.name
                                        : 'Book Trip - ' + selectedTrip.vessel.name}
                                </h3>
                                <button
                                    type="button"
                                    className="booking-modal__close"
                                    onClick={() => {
                                        setShowBookingForm(false);
                                        setSelectedTrip(null);
                                        setError(null);
                                    }}
                                    aria-label="Close booking dialog"
                                    disabled={processing}
                                >
                                    ×
                                </button>
                            </div>

                            {error && (
                                <div className="error-message modal-error booking-glass-alert booking-glass-alert--error">
                                    <p><strong>Error:</strong> {error}</p>
                                </div>
                            )}

                            {selectedTrip.vessel.type === 'mobile_sauna' ? (
                                // Mobile Sauna Booking Form
                                <>
                                    <div className="trip-details">
                                        <p><strong>Vessel:</strong> {selectedTrip.vessel.name}</p>
                                        <p><strong>Type:</strong> Mobile Sauna Rental</p>
                                        <p><strong>Minimum Days:</strong> {selectedTrip.vessel.minimumDays || 1}</p>
                                    </div>
                                    
                                    {/* Calendar Toggle Button */}
                                    <div className="calendar-toggle">
                                        <button
                                            type="button"
                                            className="btn btn-secondary calendar-toggle-btn"
                                            onClick={() => setShowCalendar(!showCalendar)}
                                        >
                                            {showCalendar ? '📅 Hide Calendar' : '📅 Show Calendar'}
                                        </button>
                                    </div>

                                    {/* Mobile Sauna Calendar */}
                                    {showCalendar && (
                                        <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Loading calendar...</div>}>
                                            <MobileSaunaCalendar
                                                vesselId={selectedTrip.vessel._id}
                                                selectedStartDate={mobileSaunaData.startDate || null}
                                                selectedEndDate={mobileSaunaData.endDate || null}
                                                onDateSelect={(startDate, endDate) => {
                                                    setMobileSaunaData({
                                                        ...mobileSaunaData,
                                                        startDate: startDate,
                                                        endDate: endDate
                                                    });
                                                }}
                                                minDays={selectedTrip.vessel.minimumDays || 1}
                                            />
                                        </Suspense>
                                    )}

                                    <div className="booking-form mobile-sauna-form">
                                        <div className="form-group booking-field">
                                            <label htmlFor="startDate">Pickup Date: *</label>
                                            <input
                                                className="booking-input"
                                                type="date"
                                                id="startDate"
                                                value={mobileSaunaData.startDate}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    setMobileSaunaData({
                                                        ...mobileSaunaData,
                                                        startDate: e.target.value
                                                    });
                                                }}
                                                required
                                            />
                                            <small>Pickups are typically on Fridays. Check with us for other days.</small>
                                        </div>

                                        <div className="form-group booking-field">
                                            <label htmlFor="endDate">Drop-off Date: *</label>
                                            <input
                                                className="booking-input"
                                                type="date"
                                                id="endDate"
                                                value={mobileSaunaData.endDate}
                                                min={mobileSaunaData.startDate || new Date().toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    setMobileSaunaData({
                                                        ...mobileSaunaData,
                                                        endDate: e.target.value
                                                    });
                                                }}
                                                required
                                            />
                                            <small>For multi-week rentals, drop-off must be on Friday.</small>
                                        </div>

                                        {/* Availability Status Display */}
                                        {(checkingAvailability || availabilityData || availabilityError) && (
                                            <div className="availability-status booking-glass-panel">
                                                {checkingAvailability && (
                                                    <p className="availability-checking">
                                                        ⏳ Checking availability...
                                                    </p>
                                                )}
                                                {availabilityData && !checkingAvailability && (
                                                    <div className={`availability-info ${availabilityData.available > 0 ? 'available' : 'unavailable'}`}>
                                                        {availabilityData.available > 0 ? (
                                                            <>
                                                                <p className="availability-success">
                                                                    ✅ <strong>{availabilityData.available}</strong> of <strong>{availabilityData.total}</strong> unit(s) available
                                                                </p>
                                                                {availabilityData.booked > 0 && (
                                                                    <p className="availability-note">
                                                                        ({availabilityData.booked} already booked)
                                                                    </p>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <p className="availability-error">
                                                                ❌ No units available - All {availabilityData.total} unit(s) are booked for these dates
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {availabilityError && !checkingAvailability && (
                                                    <p className="availability-error">
                                                        ⚠️ {availabilityError}
                                                    </p>
                                                )}
                                            </div>
                                        )}


                                        <div className="form-group booking-field">
                                            <label htmlFor="customerName">Full Name: *</label>
                                            <input
                                                className="booking-input"
                                                type="text"
                                                id="customerName"
                                                value={mobileSaunaData.customerName}
                                                onChange={(e) => setMobileSaunaData({
                                                    ...mobileSaunaData,
                                                    customerName: e.target.value
                                                })}
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>

                                        <div className="form-group booking-field">
                                            <label htmlFor="customerEmail">Email Address: *</label>
                                            <input
                                                className="booking-input"
                                                type="email"
                                                id="customerEmail"
                                                value={mobileSaunaData.customerEmail}
                                                onChange={(e) => setMobileSaunaData({
                                                    ...mobileSaunaData,
                                                    customerEmail: e.target.value
                                                })}
                                                placeholder="your.email@example.com"
                                                required
                                            />
                                        </div>

                                        <div className="form-group booking-field">
                                            <label htmlFor="customerBirthdate">Birthdate: *</label>
                                            <input
                                                className="booking-input"
                                                type="date"
                                                id="customerBirthdate"
                                                value={mobileSaunaData.customerBirthdate}
                                                max={getMinimumAdultBirthdate()}
                                                onChange={(e) => setMobileSaunaData({
                                                    ...mobileSaunaData,
                                                    customerBirthdate: e.target.value
                                                })}
                                                required
                                            />
                                        </div>

                                        <div className="form-group booking-field">
                                            <label htmlFor="customerPhone">Phone Number: *</label>
                                            <input
                                                className="booking-input"
                                                type="tel"
                                                id="customerPhone"
                                                value={mobileSaunaData.customerPhone}
                                                onChange={(e) => setMobileSaunaData({
                                                    ...mobileSaunaData,
                                                    customerPhone: e.target.value
                                                })}
                                                placeholder="Enter your phone number"
                                                required
                                                />
                                        </div>
                                        <div className="form-group booking-field">
                                            <label htmlFor="deliveryAddress">Delivery Address: *</label>
                                            <textarea
                                                className="booking-input booking-textarea"
                                                id="deliveryAddress"
                                                value={mobileSaunaData.deliveryAddress}
                                                onChange={(e) => setMobileSaunaData({
                                                    ...mobileSaunaData,
                                                    deliveryAddress: e.target.value
                                                })}
                                                placeholder="Enter complete address: Street, City, Province, Postal Code"
                                                rows={3}
                                                required
                                            />
                                            <small>Delivery fee: Free within 20km of Hillside Mall, $3/km beyond that</small>
                                        </div>

                                        <div className="form-group booking-field">
                                            <label htmlFor="additionalWoodBins">Additional Wood Bins (2 included free): *</label>
                                            <input
                                                className="booking-input"
                                                type="number"
                                                id="additionalWoodBins"
                                                min="0"
                                                max="10"
                                                value={mobileSaunaData.additionalWoodBins}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 0;
                                                    if (value >= 0 && value <= 10) {
                                                        setMobileSaunaData({
                                                            ...mobileSaunaData,
                                                            additionalWoodBins: value
                                                        });
                                                    }
                                                }}
                                                required
                                            />
                                            <small>$15 per additional bin (maximum 10 additional)</small>
                                            {mobileSaunaData.additionalWoodBins > 0 && (
                                                <p className="wood-bins-cost">
                                                    Total: {mobileSaunaData.additionalWoodBins + 2} bins ({mobileSaunaData.additionalWoodBins} × $15 = ${mobileSaunaData.additionalWoodBins * 15})
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pre-booking waiver acceptance */}
                                    {!bookingCreated && (
                                        <div className="agreement-section booking-glass-panel pre-booking-agreement">
                                            <h4>Rental Terms and Waiver</h4>
                                            <p className="pre-booking-agreement__intro">
                                                Please review and accept these terms before creating your booking.
                                                The full personalized agreement is generated at checkout.
                                            </p>
                                            <ul className="pre-booking-agreement__list">
                                                <li>You must be 18+ to complete this booking.</li>
                                                <li>Security deposit is refundable and auto-refunded 2 days after rental end (unless damages are reported).</li>
                                                <li>You agree to follow all safety and operating instructions in the final rental agreement.</li>
                                            </ul>
                                            <div className="pre-booking-agreement__actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary pre-booking-agreement__pdf-btn"
                                                    onClick={handleOpenWaiverPdf}
                                                    disabled={waiverPdfLoading}
                                                >
                                                    {waiverPdfLoading ? 'Opening Waiver...' : 'Read Waiver PDF'}
                                                </button>
                                                <p className="pre-booking-agreement__note">
                                                    Review this general waiver before you agree. Your personalized agreement is still generated at checkout.
                                                </p>
                                                {waiverPdfError && (
                                                    <p className="pre-booking-agreement__error" role="alert">
                                                        {waiverPdfError}
                                                    </p>
                                                )}
                                            </div>
                                            <label className="pre-booking-agreement__checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={waiverPreAccepted}
                                                    onChange={(e) => {
                                                        setWaiverPreAccepted(e.target.checked);
                                                        setError(null);
                                                    }}
                                                />
                                                <span>
                                                    I have read and accept the rental terms and liability waiver. *
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                    
                                    {/* Agreement Section - Show after booking is created */}
                                    {bookingCreated && pendingBookingId && (
                                        <div className="agreement-section booking-glass-panel" style={{
                                            marginBottom: '1.5rem',
                                            padding: '1.5rem',
                                            border: '2px solid #8B4513',
                                            borderRadius: '12px',
                                            backgroundColor: '#fff3e0'
                                        }}>
                                            <h4 style={{ 
                                                marginTop: 0, 
                                                marginBottom: '1rem',
                                                color: '#8B4513',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                📋 Rental Agreement
                                            </h4>
                                            
                                            <div style={{ marginBottom: '1rem' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={handlePreviewAgreement}
                                                    disabled={!agreementHtml}
                                                    style={{ width: '100%', marginBottom: '1rem' }}
                                                >
                                                    🔗 Preview Agreement in New Tab
                                                </button>
                                                
                                                <label style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '0.75rem',
                                                    cursor: 'pointer',
                                                    padding: '1rem',
                                                    backgroundColor: 'white',
                                                    borderRadius: '8px',
                                                    border: agreementAccepted ? '2px solid #4CAF50' : '2px solid #ddd'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={agreementAccepted}
                                                        onChange={(e) => {
                                                            setAgreementAccepted(e.target.checked);
                                                            setError(null);
                                                        }}
                                                        style={{
                                                            marginTop: '0.25rem',
                                                            width: '20px',
                                                            height: '20px',
                                                            cursor: 'pointer'
                                                        }}
                                                    />
                                                    <span style={{ flex: 1, fontSize: '0.95rem' }}>
                                                        <strong>I have read and agree to the terms and conditions</strong> of this rental agreement, 
                                                        including the Mobile Sauna Rules and Liability Waiver. *
                                                    </span>
                                                </label>
                                            </div>
                                            
                                            {!agreementAccepted && (
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '0.9rem',
                                                    color: '#ff9800',
                                                    fontWeight: 600
                                                }}>
                                                    ⚠️ Please accept the agreement to proceed to payment
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Pricing Preview Display */}
                                                {(loadingPricing || pricingPreview || pricingError) && (
                                                    <div className="pricing-preview booking-glass-panel">
                                                        <h4>💰 Pricing Breakdown</h4>
                                                        {loadingPricing && (
                                                            <p className="pricing-loading">
                                                                ⏳ Calculating pricing...
                                                            </p>
                                                        )}
                                                        {pricingPreview && !loadingPricing && (
                                                            <div className="pricing-details">
                                                                <div className="pricing-summary">
                                                                    {parseFloat(pricingPreview.pricing.breakdown.rentalDiscount || '0') > 0 && (
                                                                        <div className="pricing-row">
                                                                            <span className="pricing-label">Rental Price (Before Discount):</span>
                                                                            <span className="pricing-value">${pricingPreview.pricing.breakdown.rentalBase || pricingPreview.pricing.breakdown.rental}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="pricing-row">
                                                                        <span className="pricing-label">
                                                                            {parseFloat(pricingPreview.pricing.breakdown.rentalDiscount || '0') > 0
                                                                                ? `Rental (${pricingPreview.dateRange.days} days, After Discount):`
                                                                                : `Rental (${pricingPreview.dateRange.days} days):`}
                                                                        </span>
                                                                        <span className="pricing-value">${pricingPreview.pricing.breakdown.rental}</span>
                                                                    </div>
                                                                    {parseFloat(pricingPreview.pricing.breakdown.rentalDiscount || '0') > 0 && (
                                                                        <div className="pricing-row pricing-discount">
                                                                            <span className="pricing-label">Discount:</span>
                                                                            <span className="pricing-value">-${pricingPreview.pricing.breakdown.rentalDiscount}</span>
                                                                        </div>
                                                                    )}
                                                                    {pricingPreview.deliveryDetails && (
                                                                        <div className="pricing-row">
                                                                            <span className="pricing-label">
                                                                                Delivery ({pricingPreview.deliveryDetails.distanceKm}km):
                                                                                {pricingPreview.deliveryDetails.isFree && <span className="pricing-note"> - FREE within {pricingPreview.deliveryDetails.freeRadiusKm}km!</span>}
                                                                                {!pricingPreview.deliveryDetails.isFree && <span className="pricing-note"> - ${pricingPreview.deliveryDetails.pricePerKm}/km after {pricingPreview.deliveryDetails.freeRadiusKm}km</span>}
                                                                            </span>
                                                                            <span className="pricing-value">${pricingPreview.pricing.breakdown.delivery}</span>
                                                                        </div>
                                                                    )}
                                                                    {pricingPreview.woodBinsDetails.additionalBins > 0 && (
                                                                        <div className="pricing-row">
                                                                            <span className="pricing-label">
                                                                                Wood Bins ({pricingPreview.woodBinsDetails.totalBins} total):
                                                                                <span className="pricing-note"> - {pricingPreview.woodBinsDetails.freeBins} free + {pricingPreview.woodBinsDetails.additionalBins} @ ${pricingPreview.woodBinsDetails.pricePerBin}/bin</span>
                                                                            </span>
                                                                            <span className="pricing-value">${pricingPreview.pricing.breakdown.woodBins}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="pricing-row pricing-subtotal">
                                                                        <span className="pricing-label">Taxable Subtotal:</span>
                                                                        <span className="pricing-value">${pricingPreview.pricing.breakdown.taxableSubtotal || pricingPreview.pricing.breakdown.total}</span>
                                                                    </div>
                                                                    <div className="pricing-row pricing-gst">
                                                                        <span className="pricing-label">GST (5%):</span>
                                                                        <span className="pricing-value">${pricingPreview.pricing.breakdown.gst || '0.00'}</span>
                                                                    </div>
                                                                    <div className="pricing-row pricing-subtotal">
                                                                        <span className="pricing-label">Total Before Deposit:</span>
                                                                        <span className="pricing-value">${pricingPreview.pricing.breakdown.total}</span>
                                                                    </div>
                                                                    <div className="pricing-row pricing-deposit">
                                                                        <span className="pricing-label">
                                                                            🛡️ Security Deposit (Refundable):
                                                                            <span className="pricing-note"> - Auto-refunded 2 days after rental ends</span>
                                                                        </span>
                                                                        <span className="pricing-value">${pricingPreview.pricing.breakdown.deposit || '250.00'}</span>
                                                                    </div>
                                                                    <div className="pricing-row pricing-total">
                                                                        <span className="pricing-label"><strong>Total Due Now:</strong></span>
                                                                        <span className="pricing-value">
                                                                            <strong>${pricingPreview.pricing.breakdown.totalDueNow || (parseFloat(pricingPreview.pricing.breakdown.total) + parseFloat(pricingPreview.pricing.breakdown.deposit || '250.00')).toFixed(2)}</strong>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <p className="pricing-info">
                                                                    📅 {pricingPreview.dateRange.pickupDay} to {pricingPreview.dateRange.dropoffDay}
                                                                </p>
                                                                <div className="deposit-info-banner">
                                                                    <p><strong>ℹ️ About the Security Deposit:</strong></p>
                                                                    <p>Your $250 security deposit will be automatically refunded 2 days after your rental ends, unless there are damages. You'll receive an email confirmation when the refund is processed.</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {pricingError && !loadingPricing && (
                                                            <p className="pricing-error">
                                                                ⚠️ {pricingError}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                    <div className="modal-actions">
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => {
                                                setShowBookingForm(false);
                                                setSelectedTrip(null);
                                                setError(null);
                                                setBookingCreated(false);
                                                setPendingBookingId(null);
                                                setWaiverPreAccepted(false);
                                                setAgreementAccepted(false);
                                                setAgreementHtml('');
                                            }}
                                            disabled={processing}
                                        >
                                            Cancel
                                        </button>
                                        
                                        {!bookingCreated ? (
                                            <button 
                                                className={`btn ${(isAuthenticated || guestVerified) && isValidMobileSaunaForm() && !processing && !checkingAvailability && (availabilityData?.available || 0) > 0 ? 'btn-primary' : 'btn-disabled'}`}
                                                onClick={handleMobileSaunaBooking}
                                                disabled={(!isAuthenticated && !guestVerified) || processing || !isValidMobileSaunaForm() || checkingAvailability || (availabilityData?.available || 0) === 0}
                                            >
                                                {(!isAuthenticated && !guestVerified) ? '🔒 Verify Email Required' : processing ? 'Creating Booking...' : checkingAvailability ? 'Checking Availability...' : (availabilityData?.available || 0) === 0 ? 'No Units Available' : !waiverPreAccepted ? 'Accept Waiver to Continue' : 'Create Booking & Proceed to Payment'}
                                            </button>
                                        ) : (
                                            <button 
                                                className={`btn ${agreementAccepted && !processing ? 'btn-primary' : 'btn-disabled'}`}
                                                onClick={handleProceedToPayment}
                                                disabled={!agreementAccepted || processing}
                                            >
                                                {processing ? 'Processing...' : '💳 Proceed to Payment'}
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                // Regular Boat/Trailer Booking Form
                                <>
                                    <div className="trip-details">
                                        <p><strong>Departure:</strong> {formatDate(selectedTrip.departureTime)}</p>
                                        <p><strong>Duration:</strong> {formatDuration(selectedTrip.durationMinutes)}</p>
                                        <p><strong>Available Seats:</strong> {selectedTrip.remainingSeats}</p>
                                        <p><strong>Price:</strong> {formatPrice(selectedTrip.vessel.basePriceCents)} per person</p>
                                    </div>

                                    {/* Customer Information Section */}
                                    <div className="booking-form booking-form--glass">
                                        <h4 className="booking-form__title">Contact Information</h4>
                                        
                                        <div className="booking-field">
                                            <label htmlFor="customerName">
                                                Full Name <span className="booking-required">*</span>
                                            </label>
                                            <input
                                                className="booking-input"
                                                type="text"
                                                id="customerName"
                                                value={bookingData.customerName || ''}
                                                onChange={(e) => setBookingData({
                                                    ...bookingData,
                                                    customerName: e.target.value
                                                })}
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>

                                        <div className="booking-field">
                                            <label htmlFor="customerEmail">
                                                Email Address <span className="booking-required">*</span>
                                            </label>
                                            <input
                                                className="booking-input"
                                                type="email"
                                                id="customerEmail"
                                                value={bookingData.customerEmail || ''}
                                                onChange={(e) => setBookingData({
                                                    ...bookingData,
                                                    customerEmail: e.target.value
                                                })}
                                                placeholder="your.email@example.com"
                                                required
                                            />
                                        </div>

                                        <div className="booking-field">
                                            <label htmlFor="customerPhone">
                                                Phone Number <span className="booking-required">*</span>
                                            </label>
                                            <input
                                                className="booking-input"
                                                type="tel"
                                                id="customerPhone"
                                                value={bookingData.customerPhone || ''}
                                                onChange={(e) => setBookingData({
                                                    ...bookingData,
                                                    customerPhone: e.target.value
                                                })}
                                                placeholder="(123) 456-7890"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {!bookingData.isGroup && (
                                        <div className="booking-form booking-form--glass">
                                            <h4 className="booking-form__title">Booking Details</h4>
                                            <label htmlFor="seatsBooked">Number of Seats:</label>
                                            <select
                                                className="booking-input"
                                                id="seatsBooked"
                                                value={bookingData.seatsBooked || 1}
                                                onChange={(e) => setBookingData({
                                                    ...bookingData,
                                                    seatsBooked: parseInt(e.target.value)
                                                })}
                                            >
                                                {Array.from({ length: selectedTrip.remainingSeats }, (_, i) => i + 1).map(num => (
                                                    <option key={num} value={num}>{num} seat{num > 1 ? 's' : ''}</option>
                                                ))}
                                            </select>
                                            <p className="total-price">
                                                <strong>Total: {formatPrice(selectedTrip.vessel.basePriceCents * (bookingData.seatsBooked || 1))}</strong>
                                            </p>
                                        </div>
                                    )}

                                    {bookingData.isGroup && (
                                        <div className="group-booking-info">
                                            <p><strong>Group Booking - Entire Trip</strong></p>
                                            <p>Seats: {selectedTrip.vessel.capacity} (Full Capacity)</p>
                                            <p className="total-price">
                                                <strong>Total: {formatPrice(selectedTrip.vessel.basePriceCents * selectedTrip.vessel.capacity)}</strong>
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="modal-actions">
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => {
                                                setShowBookingForm(false);
                                                setSelectedTrip(null);
                                                setError(null);
                                            }}
                                            disabled={processing}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            className={`btn ${(isAuthenticated || guestVerified) && isValidBoatTrailerForm() && !processing ? 'btn-primary' : 'btn-disabled'}`}
                                            onClick={handleBookingSubmit}
                                            disabled={(!isAuthenticated && !guestVerified) || processing || !isValidBoatTrailerForm()}
                                        >
                                            {(!isAuthenticated && !guestVerified) ? '🔒 Verify Email Required' : processing ? 'Creating Booking...' : 'Proceed to Payment'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
                
                {/* <div className="booking-note">
                    <p><em>Booking system integration coming soon! For immediate bookings, please contact us directly.</em></p>
                </div> */}
                </div>
            </div>
        </div>
    );
};

export default Booking;