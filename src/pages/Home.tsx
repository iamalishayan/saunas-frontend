import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel/ImageCarousel';
import { FaTruck, FaHandshake, FaShieldAlt, FaHeart, FaPlus, FaMinus, FaCalendar, FaClock, FaTag, FaArrowRight, FaQuoteLeft, FaStar } from 'react-icons/fa';
import { getFeaturedPosts } from '../services/api';
import { ServicePost } from '../types';
import './Home.css';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const servicesPreviewRef = useRef<HTMLElement>(null);
    const mobileRentalRef = useRef<HTMLElement>(null);
    const blogRef = useRef<HTMLElement>(null);
    const expectationsRef = useRef<HTMLElement>(null);
    const benefitsRef = useRef<HTMLElement>(null);
    const missionRef = useRef<HTMLElement>(null);
    const testimonialsRef = useRef<HTMLElement>(null);
    const faqRef = useRef<HTMLElement>(null);
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);
    const [featuredPosts, setFeaturedPosts] = useState<ServicePost[]>([]);
    const [blogLoading, setBlogLoading] = useState<boolean>(true);
    const carouselImages = [
        '/images/carousel/sauna1.png',
        '/images/carousel/sauna2.png',
        '/images/carousel/sauna3.png',
        '/images/carousel/sauna4.png'
    ];

    // Scroll to top when component mounts
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

        if (servicesPreviewRef.current) {
            observer.observe(servicesPreviewRef.current);
        }
        if (mobileRentalRef.current) {
            observer.observe(mobileRentalRef.current);
        }
        if (blogRef.current) {
            observer.observe(blogRef.current);
        }
        if (expectationsRef.current) {
            observer.observe(expectationsRef.current);
        }
        if (benefitsRef.current) {
            observer.observe(benefitsRef.current);
        }
        if (missionRef.current) {
            observer.observe(missionRef.current);
        }
        if (testimonialsRef.current) {
            observer.observe(testimonialsRef.current);
        }
        if (faqRef.current) {
            observer.observe(faqRef.current);
        }

        return () => {
            if (servicesPreviewRef.current) {
                observer.unobserve(servicesPreviewRef.current);
            }
            if (mobileRentalRef.current) {
                observer.unobserve(mobileRentalRef.current);
            }
            if (blogRef.current) {
                observer.unobserve(blogRef.current);
            }
            if (expectationsRef.current) {
                observer.unobserve(expectationsRef.current);
            }
            if (benefitsRef.current) {
                observer.unobserve(benefitsRef.current);
            }
            if (missionRef.current) {
                observer.unobserve(missionRef.current);
            }
            if (testimonialsRef.current) {
                observer.unobserve(testimonialsRef.current);
            }
            if (faqRef.current) {
                observer.unobserve(faqRef.current);
            }
        };
    }, []);

    // Fetch featured blog posts
    useEffect(() => {
        const fetchFeaturedPosts = async () => {
            try {
                setBlogLoading(true);
                const posts = await getFeaturedPosts(3);
                setFeaturedPosts(posts);
            } catch (error) {
                console.error('Error fetching featured posts:', error);
                setFeaturedPosts([]);
            } finally {
                setBlogLoading(false);
            }
        };

        fetchFeaturedPosts();
    }, []);

    const toggleFAQ = (index: number) => {
        setOpenFAQ(openFAQ === index ? null : index);
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handlePostClick = (slug: string) => {
        navigate(`/services/${slug}`);
    };

    const testimonials = [
        {
            name: "Sarah Mitchell",
            location: "Seattle, WA",
            rating: 5,
            review: "An absolutely incredible experience! The floating sauna was peaceful and rejuvenating. The team was professional and made sure we had everything we needed.",
            date: "November 2024"
        },
        {
            name: "James Rodriguez",
            location: "Portland, OR",
            rating: 5,
            review: "Best wellness experience I've had in years. The mobile sauna rental made our family reunion unforgettable. Highly recommended!",
            date: "October 2024"
        },
        {
            name: "Emily Chen",
            location: "Vancouver, BC",
            rating: 5,
            review: "The perfect blend of relaxation and nature. The views from the floating sauna were breathtaking, and the heat therapy helped my chronic pain immensely.",
            date: "September 2024"
        },
        {
            name: "Michael Thompson",
            location: "Tacoma, WA",
            rating: 5,
            review: "Outstanding service from start to finish. The sauna was pristine, and the staff went above and beyond to ensure our comfort. Will definitely return!",
            date: "November 2024"
        },
        {
            name: "Lisa Anderson",
            location: "Bellingham, WA",
            rating: 5,
            review: "We rented the mobile sauna for a corporate wellness event and it was a huge hit! Easy booking process and exceptional quality. Five stars all around.",
            date: "October 2024"
        },
        {
            name: "David Park",
            location: "Seattle, WA",
            rating: 5,
            review: "As someone who regularly uses saunas, I can say this is top-tier. The floating experience adds a whole new dimension. Absolutely worth every penny.",
            date: "September 2024"
        }
    ];

    const faqData = [
        {
            question: "What type of saunas are onboard?",
            answer: "Our floating saunas feature traditional Finnish-style dry saunas with high-quality cedar construction and electric heaters. Each sauna can reach temperatures between 160-190°F (70-88°C) for the authentic sauna experience."
        },
        {
            question: "What are the age requirements?",
            answer: "Participants must be at least 12 years old. Minors aged 12-17 must be accompanied by a parent or guardian. We recommend consulting with your physician before sauna use, especially for children, pregnant women, or those with medical conditions."
        },
        {
            question: "Do you accept walk-ins?",
            answer: "We primarily operate on a reservation basis to ensure availability and provide the best experience. However, we may accommodate walk-ins based on availability. We highly recommend booking in advance, especially during peak seasons."
        },
        {
            question: "What's your cancellation policy?",
            answer: "You can cancel or reschedule your booking up to 24 hours before your scheduled time for a full refund. Cancellations within 24 hours are subject to a 50% cancellation fee. No-shows will be charged the full amount."
        },
        {
            question: "How long will a sauna session take?",
            answer: "Our standard floating sauna experience lasts 3 hours, including time for relaxation, multiple sauna sessions, and cooling off in the water. Mobile sauna rentals can be customized from 2-8 hours based on your needs."
        },
        {
            question: "How is the facility cleaned?",
            answer: "We follow strict sanitation protocols between each session. All surfaces are thoroughly cleaned and disinfected, fresh towels are provided, and the sauna is heated to sanitizing temperatures. We use eco-friendly, non-toxic cleaning products."
        },
        {
            question: "What about poor weather conditions?",
            answer: "Safety is our top priority. In case of severe weather (thunderstorms, high winds, etc.), we may need to cancel or reschedule your booking. You'll receive a full refund or the option to reschedule at no additional cost."
        },
        {
            question: "Is parking available?",
            answer: "Yes, we provide complimentary parking at our marina location. The parking area is well-lit and secure. For mobile sauna services, we'll coordinate with you to ensure adequate space for setup and parking."
        }
    ];

    return (
        <>
            {/* Hero Carousel Section */}
            <ImageCarousel images={carouselImages} />
            
            <div className="page-content">
                <div className="container">
                {/* Services Bento Grid Section */}
                <section ref={servicesPreviewRef} className="services-preview">
                    <div className="section-header">
                        <h2 className="section-title">Our Unique Offerings</h2>
                        <p className="section-subtitle">Curated Wellness Experiences</p>
                    </div>
                    
                    <div className="bento-grid">
                        {/* Large Vertical Card - Floating Sauna */}
                        <div 
                            className="bento-card bento-card-large"
                            onClick={() => navigate('/booking')}
                        >
                            <img 
                                src="/images/home/floating-sauna.png" 
                                alt="Floating Sauna" 
                                className="card-bg"
                            />
                            <div className="card-overlay"></div>
                            <div className="card-content">
                                <h3>Floating Sauna</h3>
                                <p>Immerse yourself in nature with our signature floating sauna experience. 3-hour sessions for groups up to 8.</p>
                            </div>
                        </div>

                        {/* Small Card 1 - Mobile Rental */}
                        <div 
                            className="bento-card bento-card-small bento-card-events"
                            onClick={() => navigate('/booking')}
                        >
                            <img 
                                src="/images/booking/hero-bg.jpg" 
                                alt="Mobile Rental" 
                                className="card-bg"
                            />
                            <div className="card-overlay"></div>
                            <div className="card-content">
                                <h3>Mobile Rental</h3>
                                <p>We bring the heat to you. Premium sauna trailers delivered to your doorstep.</p>
                            </div>
                        </div>

                        {/* Small Card 2 - Private Events */}
                        <div 
                            className="bento-card bento-card-small bento-card-events"
                            onClick={() => navigate('/services')}
                        >
                            <img 
                                src="/images/home/private-events.png" 
                                alt="Private Events" 
                                className="card-bg"
                            />
                            <div className="card-overlay"></div>
                            <div className="card-content">
                                <h3>Private Events</h3>
                                <p>Custom wellness experiences for corporate retreats and special celebrations.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mobile Rental Sauna Section */}
                <section ref={mobileRentalRef} className="mobile-rental-section">
                    <div className="mobile-rental-content">
                        <div className="mobile-rental-text">
                            <p className="mobile-rental-subtitle">Premium Saunas, Direct to Your Door</p>
                            <h2>Mobile Sauna Rentals</h2>
                            <p className="mobile-rental-description">
                                At Havn Saunas, we believe your wellness experience should come to you. 
                                That's why we offer a carefully selected range of premium mobile saunas, 
                                all crafted with quality you can count on. Each sauna rental includes 
                                professional delivery, setup, and pickup, ensuring you can enjoy the 
                                comfort, health benefits, and relaxation of your own private spa experience 
                                right at your location.
                            </p>
                            <p className="mobile-rental-mission">
                                Our mission is to bring the benefits of wellness and relaxation into every 
                                space. Since our founding, we have helped countless customers create their 
                                own sanctuary with saunas designed for safety, durability, and long-term 
                                enjoyment. With a dedicated team of sauna experts, we guide each client 
                                with care and knowledge, making it simple to choose the right solution.
                            </p>
                            <a className="mobile-rental-btn" href="/booking">Book Now</a>
                        </div>
                        <div className="mobile-rental-image">
                            <img src="/images/mobile-rental/mobile-sauna-rental.png" alt="Mobile Sauna Rental" />
                        </div>
                    </div>
                </section>

                {/* What You Can Expect From Us Section */}
                <section ref={expectationsRef} className="expectations-section">
                    <div className="expectations-header">
                        <p className="expectations-subtitle">Why Premium Brands and Buyers Trust Us</p>
                        <h2>What You Can Expect From Us</h2>
                    </div>
                    <div className="experience-scroll-container">
                        <div className="experience-card">
                            <div className="exp-icon-wrapper"><FaTruck /></div>
                            <h3>Reliable Delivery</h3>
                            <p>Professional delivery and setup of our mobile saunas to your location with care and precision.</p>
                        </div>
                        <div className="experience-card">
                            <div className="exp-icon-wrapper"><FaHandshake /></div>
                            <h3>Personal Support</h3>
                            <p>Dedicated customer service to guide you through booking and ensure your sauna experience is perfect.</p>
                        </div>
                        <div className="experience-card">
                            <div className="exp-icon-wrapper"><FaShieldAlt /></div>
                            <h3>Secure Booking</h3>
                            <p>Your information is protected with bank-level encryption and 100% secure payment processing.</p>
                        </div>
                        <div className="experience-card">
                            <div className="exp-icon-wrapper"><FaHeart /></div>
                            <h3>Wellness First</h3>
                            <p>Every sauna experience is designed to support detox, recovery, and long-term health benefits.</p>
                        </div>
                    </div>
                </section>

                {/* Sauna Benefits Section */}
                <section ref={benefitsRef} className="sauna-benefits">
                    <h2>Why Choose Sauna Therapy?</h2>
                    <p className="benefits-subtitle">Discover the proven health benefits of regular sauna use</p>
                    <div className="benefits-grid">
                        <div className="benefit-card" style={{backgroundImage: 'url(/images/benefits/stress-relief.jpg)'}}>
                            <div className="benefit-content">
                                <h3>Stress Relief</h3>
                                <p>Reduce cortisol levels and promote deep relaxation through heat therapy</p>
                            </div>
                        </div>
                        <div className="benefit-card" style={{backgroundImage: 'url(/images/benefits/heart-health.png)'}}>
                            <div className="benefit-content">
                                <h3>Heart Health</h3>
                                <p>Improve cardiovascular function and circulation with regular sauna sessions</p>
                            </div>
                        </div>
                        <div className="benefit-card" style={{backgroundImage: 'url(/images/benefits/better-sleep.png)'}}>
                            <div className="benefit-content">
                                <h3>Better Sleep</h3>
                                <p>Enhance sleep quality through natural body temperature regulation</p>
                            </div>
                        </div>
                        <div className="benefit-card" style={{backgroundImage: 'url(/images/benefits/skin-health.jpg)'}}>
                            <div className="benefit-content">
                                <h3>Skin Health</h3>
                                <p>Cleanse pores deeply and improve skin elasticity through sweating</p>
                            </div>
                        </div>
                        <div className="benefit-card" style={{backgroundImage: 'url(/images/benefits/detoxification.jpg)'}}>
                            <div className="benefit-content">
                                <h3>Detoxification</h3>
                                <p>Eliminate toxins naturally while boosting your immune system</p>
                            </div>
                        </div>
                        <div className="benefit-card" style={{backgroundImage: 'url(/images/benefits/muscle-recovery.jpg)'}}>
                            <div className="benefit-content">
                                <h3>Muscle Recovery</h3>
                                <p>Accelerate recovery and reduce muscle soreness after workouts</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section ref={missionRef} className="mission-section">
                    <div className="mission-container">
                        <div className="mission-image">
                            <img src="/images/mission/mission-bg.png" alt="Luxury Sauna Interior" />
                        </div>
                        <div className="mission-content">
                            <h2>Our Mission</h2>
                            <p className="mission-description">
                                At Havn Saunas, our mission is to help you bring wellness home. We offer premium sauna experiences and curated services designed for relaxation, recovery, and everyday comfort. Whether you're seeking a floating sauna adventure or bringing our mobile saunas to your location, our goal is to help you create a personal sanctuary that feels both restorative and refined.
                            </p>
                            <div className="mission-features">
                                <div className="mission-feature">
                                    <h4>Premium Quality</h4>
                                    <p>Authentic Finnish saunas with the finest materials and craftsmanship</p>
                                </div>
                                <div className="mission-feature">
                                    <h4>Wellness First</h4>
                                    <p>Every experience designed to support your health and well-being journey</p>
                                </div>
                                <div className="mission-feature">
                                    <h4>Personalized Service</h4>
                                    <p>Tailored sauna experiences that meet your unique needs and preferences</p>
                                </div>
                            </div>
                            <button className="mission-cta-button" onClick={() => window.location.href = "/about"}>Learn More About Us</button>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section ref={testimonialsRef} className="testimonials-section">
                    <div className="section-header">
                        <h2 className="section-title">What Our Guests Say</h2>
                        <p className="section-subtitle">Real experiences from our sauna community</p>
                    </div>

                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="testimonial-glass-card"
                            >
                                <div className="quote-icon">
                                    <FaQuoteLeft />
                                </div>
                                
                                <div className="testimonial-stars">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <span key={i}>
                                            <FaStar className="star-icon" />
                                        </span>
                                    ))}
                                </div>

                                <p className="testimonial-review">{testimonial.review}</p>
                                
                                <div className="testimonial-author">
                                    <div className="author-info">
                                        <h4>{testimonial.name}</h4>
                                        <p>{testimonial.location}</p>
                                    </div>
                                    <span className="testimonial-date">{testimonial.date}</span>
                                </div>

                                <div className="testimonial-glow"></div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQ Section */}
                <section ref={faqRef} className="faq-section">
                    <div className="faq-header">
                        <h2>Frequently Asked Questions</h2>
                        <p className="faq-subtitle">Everything you need to know about our sauna experiences</p>
                    </div>
                    <div className="faq-container">
                        {faqData.map((faq, index) => (
                            <div key={index} className={`faq-item ${openFAQ === index ? 'active' : ''}`}>
                                <button 
                                    className="faq-question"
                                    onClick={() => toggleFAQ(index)}
                                    aria-expanded={openFAQ === index}
                                >
                                    <span>{faq.question}</span>
                                    <span className="faq-icon">
                                        {openFAQ === index ? <FaMinus /> : <FaPlus />}
                                    </span>
                                </button>
                                <div className={`faq-answer ${openFAQ === index ? 'open' : ''}`}>
                                    <div className="faq-answer-content">
                                        <p>{faq.answer}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Featured Blog Posts Section */}
                <section ref={blogRef} className="blog-section">
                    <div className="section-header-blog">
                        <h2 className="section-title-blog">Featured Posts</h2>
                        <p className="section-subtitle-blog">Stay updated with the latest insights, tips, and stories from our sauna experiences</p>
                    </div>
                    
                    {blogLoading ? (
                        <div className="blog-loading">
                            <div className="loading-glass-spinner"></div>
                            <p>Loading featured posts...</p>
                        </div>
                    ) : featuredPosts.length > 0 ? (
                        <div className="blog-glass-grid">
                            {featuredPosts.map((post) => (
                                <article 
                                    key={post._id} 
                                    className="blog-glass-card"
                                    onClick={() => handlePostClick(post.slug)}
                                >
                                    {post.image && (
                                        <div className="blog-image-container">
                                            <img src={post.image} alt={post.title} loading="lazy" />
                                            <div className="blog-image-overlay">
                                                <div className="featured-glass-badge">Featured</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="blog-glass-content">
                                        <div className="blog-meta">
                                            <div className="meta-glass-item">
                                                <FaCalendar className="meta-icon" />
                                                <span>{formatDate(post.createdAt)}</span>
                                            </div>
                                            <div className="meta-glass-item">
                                                <FaClock className="meta-icon" />
                                                <span>{post.readTime}</span>
                                            </div>
                                            <div className="meta-glass-item">
                                                <FaTag className="meta-icon" />
                                                <span>{post.category}</span>
                                            </div>
                                        </div>
                                        <h3 className="blog-glass-title">{post.title}</h3>
                                        <p className="blog-glass-excerpt">{post.excerpt}</p>
                                        <div className="blog-read-more-glass">
                                            <span>Read More</span>
                                            <FaArrowRight className="read-more-icon" />
                                        </div>
                                    </div>
                                    <div className="blog-hover-glow"></div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="no-blog-posts-glass">
                            <p>No featured posts available at the moment. Check back soon!</p>
                        </div>
                    )}
                </section>
                </div>
            </div>
        </>
    );
};

export default Home;