import React, { useEffect, useRef } from 'react';
import './AboutUs.css';

const AboutUs: React.FC = () => {
    const contentSectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
            window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        if (contentSectionRef.current) {
            observer.observe(contentSectionRef.current);
        }

        return () => {
            if (contentSectionRef.current) {
                observer.unobserve(contentSectionRef.current);
            }
        };
    }, []);

    return (
        <div className="aboutus-page">
            {/* Full Page Hero Section with Background Image */}
            <section className="aboutus-hero-full">
                <div className="aboutus-hero-overlay"></div>
                <div className="aboutus-hero-content">
                    <h1>ABOUT US</h1>
                    <p className="hero-subtitle">OUR COMMITMENT TO EXCELLENCE</p>
                    <p className="hero-description">
                        At Victoria Sauna Rentals, we pride ourselves on delivering only the finest saunas and accessories 
                        to elevate your relaxation experience. As a trusted reseller partner of top-tier suppliers, 
                        we ensure that every product meets the highest standards of craftsmanship, durability, and 
                        performance. When you choose Victoria Sauna Rentals, you're investing in unmatched quality and a 
                        superior sauna experience that stands the test of time.
                    </p>
                    
                    <div className="hero-section-box">
                        <h3>CUSTOMER-CENTRIC APPROACH</h3>
                        <p>
                            Your satisfaction is at the heart of everything we do. From the moment you visit our 
                            website to the day your sauna is installed, we're here to provide exceptional service 
                            every step of the way. Our knowledgeable team is dedicated to helping you find the 
                            perfect product to fit your needs and preferences. With responsive support and a 
                            commitment to exceeding expectations, we aim to make every interaction with Victoria Sauna 
                            Rentals truly memorable.
                        </p>
                    </div>

                    <div className="hero-section-box">
                        <h3>ECO-FRIENDLY AND TRUSTED SOLUTIONS</h3>
                        <p>
                            We believe in creating a better future through sustainable choices. That's why we 
                            partner with suppliers who share our passion for eco-friendly materials and 
                            energy-efficient designs. Not only do our saunas bring wellness into your life, but 
                            they also help reduce your environmental footprint. By building trust, offering premium 
                            products, and focusing on...
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
