import React, { useState, useEffect, useRef } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaClock, FaCheck } from 'react-icons/fa';
import { submitContactForm } from '../services/api';
import './Contact.css';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  inquiryType: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  subject?: string;
  inquiryType?: string;
  message?: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    inquiryType: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const heroRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const infoRef = useRef<HTMLElement>(null);

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
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    if (formRef.current) observer.observe(formRef.current);
    if (infoRef.current) observer.observe(infoRef.current);

    return () => {
      if (heroRef.current) observer.unobserve(heroRef.current);
      if (formRef.current) observer.unobserve(formRef.current);
      if (infoRef.current) observer.unobserve(infoRef.current);
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.inquiryType) {
      newErrors.inquiryType = 'Please select an inquiry type';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Call the backend API
      await submitContactForm(formData);
      
      setShowSuccess(true);

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        inquiryType: '',
        message: ''
      });

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);

    } catch (error: any) {
      console.error('Contact form submission error:', error);
      // You could add error state here to show error message to user
      alert(error.message || 'Failed to submit form. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inquiryTypes = [
    { value: '', label: 'Select inquiry type' },
    { value: 'booking', label: 'Booking Inquiry' },
    { value: 'sauna-boats', label: 'Sauna Boat Trips' },
    { value: 'mobile-rental', label: 'Mobile Sauna Rental' },
    { value: 'private-events', label: 'Private Events' },
    { value: 'corporate', label: 'Corporate Wellness' },
    { value: 'partnership', label: 'Partnership Opportunities' },
    { value: 'general', label: 'General Question' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero" ref={heroRef}>
        <div className="contact-hero-overlay"></div>
        <div className="contact-hero-content">
          <div className="hero-icon-wrapper">
            <FaEnvelope />
          </div>
          <h1>Get In Touch</h1>
          <p>We'd love to hear from you. Let's create your perfect sauna experience together.</p>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,90 1440,60 L1440,120 L0,120 Z" fill="currentColor"/>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <div className="contact-content">
        <div className="contact-container">
          {/* Contact Form Section */}
          <section className="contact-form-section" ref={formRef}>
            <div className="form-container glass-form">
              <div className="form-header">
                <div className="form-header-icon">
                  <FaPaperPlane />
                </div>
                <h2>Send Us a Message</h2>
                <p>Fill out the form below and we'll get back to you as soon as possible.</p>
              </div>

              {/* Success Message */}
              {showSuccess && (
                <div className="success-message">
                  <FaCheck />
                  <span>Your message has been sent successfully! We'll be in touch soon.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Name Row */}
                <div className="form-row">
                  <div className={`form-group ${focusedField === 'firstName' ? 'focused' : ''} ${errors.firstName ? 'error' : ''}`}>
                    <label htmlFor="firstName">
                      First Name<span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your first name"
                      className={errors.firstName ? 'input-error' : ''}
                    />
                    {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                  </div>

                  <div className={`form-group ${focusedField === 'lastName' ? 'focused' : ''} ${errors.lastName ? 'error' : ''}`}>
                    <label htmlFor="lastName">
                      Last Name<span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your last name"
                      className={errors.lastName ? 'input-error' : ''}
                    />
                    {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                  </div>
                </div>

                {/* Contact Row */}
                <div className="form-row">
                  <div className={`form-group ${focusedField === 'email' ? 'focused' : ''} ${errors.email ? 'error' : ''}`}>
                    <label htmlFor="email">
                      Email Address<span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="your@email.com"
                      className={errors.email ? 'input-error' : ''}
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>

                  <div className={`form-group ${focusedField === 'phone' ? 'focused' : ''}`}>
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                {/* Subject Row */}
                <div className="form-row">
                  <div className={`form-group ${focusedField === 'subject' ? 'focused' : ''} ${errors.subject ? 'error' : ''}`}>
                    <label htmlFor="subject">
                      Subject<span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('subject')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="What's this about?"
                      className={errors.subject ? 'input-error' : ''}
                    />
                    {errors.subject && <span className="error-text">{errors.subject}</span>}
                  </div>

                  <div className={`form-group ${focusedField === 'inquiryType' ? 'focused' : ''} ${errors.inquiryType ? 'error' : ''}`}>
                    <label htmlFor="inquiryType">
                      Inquiry Type<span className="required">*</span>
                    </label>
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('inquiryType')}
                      onBlur={() => setFocusedField(null)}
                      className={errors.inquiryType ? 'input-error' : ''}
                    >
                      {inquiryTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.inquiryType && <span className="error-text">{errors.inquiryType}</span>}
                  </div>
                </div>

                {/* Message */}
                <div className={`form-group full-width ${focusedField === 'message' ? 'focused' : ''} ${errors.message ? 'error' : ''}`}>
                  <label htmlFor="message">
                    Message<span className="required">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Tell us about your inquiry... We'd love to help create your perfect sauna experience."
                    rows={5}
                    className={errors.message ? 'input-error' : ''}
                  />
                  {errors.message && <span className="error-text">{errors.message}</span>}
                  <p className="help-text">The more details you provide, the better we can assist you.</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
          {/* Contact Info Cards */}
          <section className="contact-info-section" ref={infoRef}>
            <div className="contact-info-grid">
              <div className="contact-card glass-card">
                <div className="card-icon">
                  <FaPhone />
                </div>
                <h3>Call Us</h3>
                <p className="card-value">250-885-4955</p>
                <p className="card-subtitle">Mon-Fri, 9am-6pm PST</p>
              </div>

              <div className="contact-card glass-card">
                <div className="card-icon">
                  <FaEnvelope />
                </div>
                <h3>Email Us</h3>
                <p className="card-value">Info@victoriasaunarentals.ca</p>
                <p className="card-subtitle">We reply within 24 hours</p>
              </div>

              <div className="contact-card glass-card">
                <div className="card-icon">
                  <FaMapMarkerAlt />
                </div>
                <h3>Visit Us</h3>
                <p className="card-value">Vancouver Island, BC</p>
                <p className="card-subtitle">By appointment only</p>
              </div>

              <div className="contact-card glass-card">
                <div className="card-icon">
                  <FaClock />
                </div>
                <h3>Operating Hours</h3>
                <p className="card-value">7 Days a Week</p>
                <p className="card-subtitle">Sunrise to Sunset</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Contact;
