import React from 'react';

interface DepositStatusBadgeProps {
  status: 'held' | 'refunded' | 'forfeited';
}

const DepositStatusBadge: React.FC<DepositStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'held':
        return {
          icon: '⏳',
          label: 'HELD',
          className: 'deposit-badge-held'
        };
      case 'refunded':
        return {
          icon: '✅',
          label: 'REFUNDED',
          className: 'deposit-badge-refunded'
        };
      case 'forfeited':
        return {
          icon: '❌',
          label: 'FORFEITED',
          className: 'deposit-badge-forfeited'
        };
      default:
        return {
          icon: '❓',
          label: 'UNKNOWN',
          className: 'deposit-badge-unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`deposit-status-badge ${config.className}`}>
      {config.icon} {config.label}
    </span>
  );
};

export default DepositStatusBadge;
