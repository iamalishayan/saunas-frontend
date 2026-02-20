import { useState } from 'react';
import { Booking } from '../types';

const useBooking = () => {
    const [bookingData, setBookingData] = useState<Booking | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const submitBooking = async (data: Booking) => {
        setLoading(true);
        setError(null);
        try {
            // Call the API to submit the booking
            // await api.submitBooking(data);
            setBookingData(data);
        } catch (err) {
            setError('Failed to submit booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return {
        bookingData,
        error,
        loading,
        submitBooking,
    };
};

export default useBooking;