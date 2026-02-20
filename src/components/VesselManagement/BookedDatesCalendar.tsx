import React, { useState, useEffect } from 'react';
import { getVesselBookedDates } from '../../services/api';
import './BookedDatesCalendar.css';

interface BookedPeriod {
    startDate: string;
    endDate: string;
    status: string;
    customerName: string;
}

interface BookedDatesCalendarProps {
    vesselId: string;
    vesselName: string;
    onClose: () => void;
}

const BookedDatesCalendar: React.FC<BookedDatesCalendarProps> = ({ vesselId, vesselName, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookedPeriods, setBookedPeriods] = useState<BookedPeriod[]>([]);
    const [totalUnits, setTotalUnits] = useState(1);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        fetchBookedDates();
    }, [vesselId]);

    const fetchBookedDates = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getVesselBookedDates(vesselId);
            setBookedPeriods(data.bookedPeriods || []);
            setTotalUnits(data.vessel?.totalUnits || 1);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch booked dates');
        } finally {
            setLoading(false);
        }
    };

    const isDateBooked = (date: Date): BookedPeriod[] => {
        const dateStr = date.toISOString().split('T')[0];
        return bookedPeriods.filter(period => {
            if (!period.startDate || !period.endDate) return false;
            return dateStr >= period.startDate && dateStr <= period.endDate;
        });
    };

    const generateCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const calendar: (Date | null)[] = [];
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendar.push(null);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            calendar.push(new Date(year, month, day));
        }

        return calendar;
    };

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="calendar-overlay">
            <div className="calendar-modal">
                <div className="calendar-header">
                    <h2>📅 Booked Dates - {vesselName}</h2>
                    <button className="calendar-close-btn" onClick={onClose}>×</button>
                </div>

                {error && (
                    <div className="calendar-error">
                        {error}
                        <button onClick={fetchBookedDates}>Retry</button>
                    </div>
                )}

                {loading ? (
                    <div className="calendar-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading bookings...</p>
                    </div>
                ) : (
                    <>
                        <div className="calendar-stats">
                            <div className="stat-card">
                                <span className="stat-label">Total Units</span>
                                <span className="stat-value">{totalUnits}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Active Bookings</span>
                                <span className="stat-value">{bookedPeriods.length}</span>
                            </div>
                        </div>

                        <div className="calendar-navigation">
                            <button className="nav-btn" onClick={previousMonth}>‹</button>
                            <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                            <button className="nav-btn" onClick={nextMonth}>›</button>
                        </div>

                        <div className="calendar-grid">
                            {dayNames.map(day => (
                                <div key={day} className="calendar-day-header">{day}</div>
                            ))}
                            
                            {generateCalendar().map((date, index) => {
                                if (!date) {
                                    return <div key={`empty-${index}`} className="calendar-cell empty"></div>;
                                }

                                const bookings = isDateBooked(date);
                                const isBooked = bookings.length > 0;
                                const isFullyBooked = bookings.length >= totalUnits;
                                const isToday = date.toDateString() === new Date().toDateString();

                                return (
                                    <div 
                                        key={date.toISOString()} 
                                        className={`calendar-cell ${isBooked ? 'booked' : ''} ${isFullyBooked ? 'fully-booked' : ''} ${isToday ? 'today' : ''}`}
                                        title={bookings.map(b => `${b.customerName} (${b.status})`).join(', ')}
                                    >
                                        <span className="day-number">{date.getDate()}</span>
                                        {isBooked && (
                                            <div className="booking-indicators">
                                                <span className="booking-count">{bookings.length}/{totalUnits}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="calendar-legend">
                            <div className="legend-item">
                                <span className="legend-box today-box"></span>
                                <span>Today</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-box booked-box"></span>
                                <span>Partially Booked</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-box fully-booked-box"></span>
                                <span>Fully Booked</span>
                            </div>
                        </div>

                        {bookedPeriods.length > 0 && (
                            <div className="bookings-list">
                                <h4>Upcoming Bookings</h4>
                                <div className="bookings-scroll">
                                    {bookedPeriods.map((period, index) => (
                                        <div key={index} className={`booking-item status-${period.status}`}>
                                            <div className="booking-customer">{period.customerName}</div>
                                            <div className="booking-dates">
                                                {period.startDate} → {period.endDate}
                                            </div>
                                            <div className={`booking-status ${period.status}`}>
                                                {period.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default BookedDatesCalendar;
