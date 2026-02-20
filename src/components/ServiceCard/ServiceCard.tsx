import React from 'react';

interface ServiceCardProps {
    title: string;
    description: string;
    price: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, price }) => {
    return (
        <div className="service-card">
            <h3>{title}</h3>
            <p>{description}</p>
            <p className="price">{price}</p>
        </div>
    );
};

export default ServiceCard;