import React, { useState, useEffect } from 'react';

interface DepositCountdownProps {
  endTime: string;
  daysOffset?: number; // Number of days after endTime for auto-refund (default: 2)
}

const DepositCountdown: React.FC<DepositCountdownProps> = ({ endTime, daysOffset = 2 }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [colorClass, setColorClass] = useState<string>('countdown-green');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime);
      const autoRefundDate = new Date(end.getTime() + (daysOffset * 24 * 60 * 60 * 1000));
      const now = new Date();
      const diff = autoRefundDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Overdue');
        setColorClass('countdown-red');
        return;
      }

      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Set color based on time remaining
      if (totalHours < 6) {
        setColorClass('countdown-red');
      } else if (totalHours < 24) {
        setColorClass('countdown-yellow');
      } else {
        setColorClass('countdown-green');
      }

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endTime, daysOffset]);

  return (
    <span className={`deposit-countdown ${colorClass}`}>
      {timeLeft}
    </span>
  );
};

export default DepositCountdown;
