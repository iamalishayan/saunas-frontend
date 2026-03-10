import React, { useState, useEffect } from 'react';
import { checkMobileSaunaAvailability } from '../../services/api';
import './MobileSaunaCalendar.css';

interface MobileSaunaCalendarProps {
    vesselId: string;
    selectedStartDate: string | null;
    selectedEndDate: string | null;
    onDateSelect: (startDate: string, endDate: string) => void;
    minDays?: number; // For future use - minimum rental days validation
}

interface DayInfo {
    date: Date;
    dateString: string; // YYYY-MM-DD
    isCurrentMonth: boolean;
    isToday: boolean;
    isPast: boolean;
    isInRange: boolean;
    isStartDate: boolean;
    isEndDate: boolean;
    isAvailable: boolean | null; // null = not checked yet
}

const MobileSaunaCalendar: React.FC<MobileSaunaCalendarProps> = ({
    vesselId,
    selectedStartDate,
    selectedEndDate,
    onDateSelect,
    minDays = 1 // For future validation - not currently used in display logic
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);
    const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    console.log('Calendar minDays:', minDays); // Prevents unused warning
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Check availability for visible dates when calendar loads or month changes
    useEffect(() => {
        fetchAvailabilityForMonth();
    }, [currentMonth, vesselId]);

    const formatDateToString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchAvailabilityForMonth = async () => {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Extend range to cover previous/next month days shown in calendar
        const calendarStart = new Date(startOfMonth);
        calendarStart.setDate(calendarStart.getDate() - startOfMonth.getDay());
        
        const calendarEnd = new Date(endOfMonth);
        calendarEnd.setDate(calendarEnd.getDate() + (6 - endOfMonth.getDay()));

        // Don't check availability for dates in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Use today or calendarStart, whichever is later
        const effectiveStart = calendarStart < today ? today : calendarStart;
        
        // If all dates in the calendar view are in the past, skip the API call
        if (effectiveStart > calendarEnd) {
            setBookedDates(new Set());
            return;
        }

        try {
            setCheckingAvailability(true);
            const result = await checkMobileSaunaAvailability(
                vesselId,
                formatDateToString(effectiveStart),
                formatDateToString(calendarEnd)
            );

            // Mark dates as booked if no availability
            const booked = new Set<string>();
            if (result.availability && Array.isArray(result.availability)) {
                result.availability.forEach((day: any) => {
                    if (day.available === 0) {
                        booked.add(day.date);
                    }
                });
            }
            setBookedDates(booked);
        } catch (error) {
            console.error('Error checking availability:', error);
        } finally {
            setCheckingAvailability(false);
        }
    };

    const getDaysInMonth = (): DayInfo[] => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: DayInfo[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add days from previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthLastDay - i);
            days.push(createDayInfo(date, false, today));
        }

        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            days.push(createDayInfo(date, true, today));
        }

        // Add days from next month to complete the grid
        const remainingDays = 42 - days.length; // 6 rows × 7 days
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            days.push(createDayInfo(date, false, today));
        }

        return days;
    };

    const createDayInfo = (date: Date, isCurrentMonth: boolean, today: Date): DayInfo => {
        const dateString = formatDateToString(date);
        const isPast = date < today;
        const isToday = date.getTime() === today.getTime();
        
        const startDate = selectedStartDate ? new Date(selectedStartDate) : null;
        const endDate = selectedEndDate ? new Date(selectedEndDate) : null;
        
        let isInRange = false;
        let isStartDate = false;
        let isEndDate = false;

        if (startDate && endDate) {
            const currentDate = date.getTime();
            isInRange = currentDate > startDate.getTime() && currentDate < endDate.getTime();
            isStartDate = currentDate === startDate.getTime();
            isEndDate = currentDate === endDate.getTime();
        } else if (startDate) {
            isStartDate = date.getTime() === startDate.getTime();
            // Show hover preview for end date
            if (hoveredDate && !isPast) {
                const hoverDate = new Date(hoveredDate);
                if (hoverDate > startDate && date > startDate && date <= hoverDate) {
                    isInRange = date.getTime() < hoverDate.getTime();
                    isEndDate = date.getTime() === hoverDate.getTime();
                }
            }
        }

        const isAvailable = bookedDates.has(dateString) ? false : null;

        return {
            date,
            dateString,
            isCurrentMonth,
            isToday,
            isPast,
            isInRange,
            isStartDate,
            isEndDate,
            isAvailable
        };
    };

    const handleDateClick = (day: DayInfo) => {
        if (day.isPast || !day.isCurrentMonth) return;

        // If no start date or both dates are set, set new start date
        if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
            onDateSelect(day.dateString, '');
        } else {
            // Set end date
            const start = new Date(selectedStartDate);
            const end = new Date(day.dateString);
            
            if (end > start) {
                onDateSelect(selectedStartDate, day.dateString);
            } else {
                // If clicked date is before start, make it the new start
                onDateSelect(day.dateString, '');
            }
        }
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
    };

    const days = getDaysInMonth();

    return (
        <div className="mobile-sauna-calendar">
            <div className="mobile-sauna-header">
                <button 
                    className="mobile-sauna-nav-btn" 
                    onClick={goToPreviousMonth}
                    aria-label="Previous month"
                >
                    ‹
                </button>
                <div className="mobile-sauna-title">
                    <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                    <button className="mobile-sauna-today-btn" onClick={goToToday}>Today</button>
                </div>
                <button 
                    className="mobile-sauna-nav-btn" 
                    onClick={goToNextMonth}
                    aria-label="Next month"
                >
                    ›
                </button>
            </div>

            {checkingAvailability && (
                <div className="mobile-sauna-loading">
                    <p>⏳ Loading availability...</p>
                </div>
            )}

            <div className="mobile-sauna-legend">
                <span className="mobile-sauna-legend-item">
                    <span className="mobile-sauna-legend-dot booked"></span>
                    Booked
                </span>
                <span className="mobile-sauna-legend-item">
                    <span className="mobile-sauna-legend-dot selected"></span>
                    Selected
                </span>
            </div>

            <div className="mobile-sauna-grid">
                <div className="mobile-sauna-weekdays">
                    {dayNames.map(day => (
                        <div key={day} className="mobile-sauna-weekday">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="mobile-sauna-days">
                    {days.map((day, index) => {
                        const isBooked = day.isAvailable === false;
                        const isDisabled = day.isPast || !day.isCurrentMonth || isBooked;
                        
                        return (
                            <button
                                key={index}
                                className={`mobile-sauna-day ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${
                                    day.isToday ? 'today' : ''
                                } ${day.isPast ? 'past' : ''} ${day.isStartDate ? 'start-date' : ''} ${
                                    day.isEndDate ? 'end-date' : ''
                                } ${day.isInRange ? 'in-range' : ''} ${
                                    isBooked ? 'booked' : ''
                                } ${isDisabled ? 'disabled' : ''}`}
                                onClick={() => handleDateClick(day)}
                                onMouseEnter={() => setHoveredDate(day.dateString)}
                                onMouseLeave={() => setHoveredDate(null)}
                                disabled={isDisabled}
                                aria-label={`${day.date.toDateString()}${isBooked ? ' - Fully booked' : ''}`}
                            >
                                <span className="mobile-sauna-day-number">{day.date.getDate()}</span>
                                {isBooked && <span className="mobile-sauna-booked-marker">✕</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mobile-sauna-footer">
                <p className="mobile-sauna-hint">
                    {!selectedStartDate && 'Click a date to select pickup date'}
                    {selectedStartDate && !selectedEndDate && 'Click a date to select dropoff date'}
                    {selectedStartDate && selectedEndDate && 'Click any date to select new range'}
                </p>
            </div>
        </div>
    );
};

export default MobileSaunaCalendar;
