export interface Booking {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | string;
  trip?: {
    _id: string;
    title: string;
    departureTime: string;
    durationMinutes: number;
  };
  vessel: {
    _id: string;
    name: string;
    type: string;
    capacity: number;
  };
  status: 'pending' | 'confirmed' | 'cancelled';
  seatsBooked?: number;
  numberOfSeats?: number; // Alias for seatsBooked
  totalPriceCents: number;
  totalAmount?: number; // Alias for totalPriceCents (in cents)
  paymentStatus?: string; // Stripe payment status
  holdExpiresAt?: string;
  startTime?: string;
  endTime?: string;
  isGroup?: boolean;
  paymentIntentId?: string;
  // Mobile Sauna specific fields (NEW DATE-BASED SYSTEM)
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  pickupDate?: string; // Alternative naming from backend
  dropoffDate?: string; // Alternative naming from backend
  pickupDay?: string; // Day name (e.g., "Friday")
  dropoffDay?: string; // Day name
  days?: number; // Calculated by backend from date range
  requiresWeeklyPrice?: boolean; // Flag for Friday-to-Friday bookings
  customerName?: string;
  customerEmail?: string; // NEW: Required field
  customerBirthdate?: string; // NEW: YYYY-MM-DD format
  customerPhone?: string;
  deliveryAddress?: string;
  additionalWoodBins?: number; // NEW: 0-10 range
  deliveryFee?: number; // Delivery fee in cents
  woodBinsFee?: number; // Wood bins fee in cents
  rulesAgreed?: boolean;
  waiverSigned?: boolean;
  pricingBreakdown?: PricingBreakdown; // NEW: Detailed pricing info
  dateValidation?: DateValidation; // NEW: Date validation result
  // Deposit fields
  damageDepositCents?: number;
  damageDepositStatus?: 'held' | 'refunded' | 'forfeited';
  damageDepositRefundId?: string;
  damageDepositRefundDate?: string;
  damageDepositNotes?: string;
  stripePaymentIntentId?: string;
  rentalPriceCents?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFilters {
  status?: string;
  tripId?: string;
  userId?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isStaff: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  phone?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string; // Legacy field for backward compatibility
  accessToken?: string; // New enhanced session management
  refreshToken?: string; // New enhanced session management
  message?: string;
}

// Service Post Types
export interface ServicePost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  image?: string;
  imageVariants?: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  category: string;
  featured: boolean;
  published: boolean;
  readTime: string;
  views?: number;
  author: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostFormData {
  title: string;
  excerpt: string;
  content: string;
  readTime: string;
  category: string;
  image?: string;
  featured: boolean;
  published: boolean;
}

// Vessel Types
export interface Vessel {
  _id: string;
  name: string;
  type: 'boat' | 'trailer' | 'mobile_sauna';
  capacity?: number;
  basePriceCents: number;
  active: boolean;
  minimumDays?: number;
  discountThreshold?: number;
  discountPercent?: number;
  pricingTiers?: {
    days1to3: number;
    day4: number;
    day5: number;
    day6: number;
    day7: number;
  };
  inventory?: number; // Total units available
  pickupDropoffDay?: number; // Day of week (0=Sunday, 5=Friday)
  enforceWeeklyBoundary?: boolean; // Restrict bookings to designated day boundaries
  images?: string[]; // Array of image URLs
  imageVariants?: Array<{
    mobile?: string;
    tablet?: string;
    desktop?: string;
  }>; // Responsive image variants
  createdAt: string;
  updatedAt: string;
}

export interface VesselFormData {
  name: string;
  type: 'boat' | 'trailer' | 'mobile_sauna';
  capacity?: number;
  basePriceCents: number;
  minimumDays?: number;
  discountThreshold?: number;
  discountPercent?: number;
  pricingTiers?: {
    days1to3: number;
    day4: number;
    day5: number;
    day6: number;
    day7: number;
  };
  inventory?: number;
  pickupDropoffDay?: number; // Day of week (0-6)
  enforceWeeklyBoundary?: boolean;
  images?: File[]; // Image files for upload
  existingImages?: string[]; // Keep track of existing images when editing
}

// Trip Types
export interface Trip {
  _id: string;
  vessel: {
    _id: string;
    name: string;
    type: string;
    capacity: number;
    basePriceCents: number;
    active: boolean;
    minimumDays?: number;
    discountThreshold?: number;
    discountPercent?: number;
    pricingTiers?: {
      days1to3: number;
      day4: number;
      day5: number;
      day6: number;
      day7: number;
    };
    inventory?: number;
    pickupDropoffDay?: number; // Day of week (0=Sunday, 5=Friday)
    enforceWeeklyBoundary?: boolean;
    images?: string[];
    imageVariants?: Array<{
      mobile?: string;
      tablet?: string;
      desktop?: string;
    }>;
  };
  title: string;
  departureTime: string;
  durationMinutes: number;
  remainingSeats: number;
  groupBooked: boolean;
  assignedStaff: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    isStaff: boolean;
  }[];
  staffNotified: boolean;
  capacity?: number; // Virtual field from vessel
  createdAt: string;
  updatedAt: string;
  bookingStats?: {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
  };
}

export interface TripFormData {
  vesselId: string;
  title?: string;
  departureTime: string;
  durationMinutes: number;
  assignedStaff: string[];
}

export interface PostsResponse {
  posts: ServicePost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    postsPerPage: number;
  };
}

export interface Category {
  category: string;
  count: number;
}

// Dashboard Stats Types
export interface TripUtilization {
  title: string;
  vesselName?: string;
  capacity: number;
  booked: number;
  utilization: number;
}

export interface MobileSaunaUtilization {
  name: string;
  capacity: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  totalDaysBooked: number;
}

export interface DashboardStatsSummary {
  totalUsers: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
}

export interface DashboardStats {
  summary: DashboardStatsSummary;
  tripUtilization: TripUtilization[];
  mobileSaunaUtilization: MobileSaunaUtilization[];
}

// Additional Booking types for new functionality
export interface BookingFormData {
  tripId?: string;
  vesselId: string;
  seatsBooked?: number;
  startTime?: string;
  endTime?: string;
  isGroup?: boolean;
  // Customer information (for boat/trailer bookings)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentSession {
  sessionId: string;
  url: string;
  message: string;
}

export interface PaymentStatus {
  bookingId: string;
  paymentStatus: string;
  stripeSessionId?: string;
  sessionStatus?: string;
  paymentIntentStatus?: string;
  message: string;
}

// ===== NEW MOBILE SAUNA TYPES (DATE-BASED SYSTEM) =====

// Pricing Breakdown (returned by backend)
export interface PricingBreakdown {
  baseTierPrice: number; // Base rental price in cents
  discountAmount?: number; // Discount applied (if any)
  rentalPrice: number; // Final rental price after discount
  deliveryFee: number; // Delivery fee in cents
  deliveryDistance: number; // Distance in km
  deliveryFreeRadius: number; // Free delivery radius (20km)
  woodBins: {
    additional: number; // Number of additional bins ordered
    free: number; // Number of free bins (always 2)
    total: number; // Total bins
    cost: number; // Cost in cents for additional bins
  };
  finalPrice: number; // Total price in cents (rental + delivery + wood bins)
}

// Date Validation Result (returned by backend)
export interface DateValidation {
  isValid: boolean;
  message: string; // Validation message or error
  days?: number; // Calculated days
  requiresWeeklyPrice?: boolean; // True for Friday-to-Friday full weeks
  pickupDay?: string; // Day name (e.g., "Friday")
  dropoffDay?: string; // Day name
  suggestion?: string; // Suggestion for fixing invalid dates
}

// Pricing Preview Response (from backend pricing-preview endpoint)
export interface PricingPreviewResponse {
  vesselId: string;
  vesselName: string;
  dateRange: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    days: number;
    pickupDay: string;
    dropoffDay: string;
  };
  pricing: {
    rentalCostCents: number;
    deliveryFeeCents: number;
    woodBinsCostCents: number;
    totalCostCents: number;
    breakdown: {
      rental: string; // Formatted dollar amount
      delivery: string;
      woodBins: string;
      total: string;
    };
  };
  deliveryDetails: {
    distanceKm: number;
    freeRadiusKm: number;
    additionalKm: number;
    pricePerKm: number;
    isFree: boolean;
  } | null;
  woodBinsDetails: {
    freeBins: number;
    additionalBins: number;
    totalBins: number;
    pricePerBin: number;
  };
}

// Mobile Sauna Booking Request (sent to backend)
export interface MobileSaunaBookingRequest {
  tripId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  customerName: string;
  customerEmail: string; // NEW: Required
  customerBirthdate: string; // NEW: YYYY-MM-DD format
  customerPhone: string;
  deliveryAddress: string; // Full address for Google Maps API
  additionalWoodBins?: number; // NEW: 0-10 range, default 0
  rulesAgreed: boolean;
  waiverSigned: boolean;
}

// Mobile Sauna Booking Response
export interface MobileSaunaBookingResponse {
  message: string;
  booking: {
    id: string;
    trip: string;
    vessel: string;
    pickupDate: string;
    dropoffDate: string;
    pickupDay: string;
    dropoffDay: string;
    days: number;
    totalPriceCents: number;
    pricePerDay: number;
    deliveryAddress: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    requiresWeeklyPrice: boolean;
    pricingBreakdown: PricingBreakdown;
    dateValidation: DateValidation;
  };
}

// Availability Check Response
export interface AvailabilityResponse {
  available: number; // Number of available units
  booked: number; // Number of booked units
  total: number; // Total inventory
  dates: {
    start: string;
    end: string;
  };
  message?: string;
}

// Admin Booking Update Request
export interface BookingUpdateRequest {
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  additionalWoodBins?: number; // 0-10 range
  deliveryAddress?: string; // Full address
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

// Admin Booking Update Response
export interface BookingUpdateResponse {
  message: string;
  booking: Booking;
  priceRecalculated: boolean; // True if pricing changed
  newTotalPrice?: number; // New total in cents (if changed)
}

// Admin Rental Extension Request
export interface RentalExtensionRequest {
  newEndDate: string; // YYYY-MM-DD format
}

// Admin Rental Extension Response
export interface RentalExtensionResponse {
  message: string;
  booking: Booking;
  extensionDetails: {
    previousDays: number;
    newTotalDays: number;
    additionalDays: number;
    previousTotal: number; // In cents
    newTotal: number; // In cents
    additionalCharge: number; // In cents
  };
}

// Deposit Management Types
export interface DepositStatusResponse {
  bookingId: string;
  customerName: string;
  damageDepositCents: number;
  damageDepositStatus: 'held' | 'refunded' | 'forfeited';
  damageDepositRefundId?: string;
  damageDepositRefundDate?: string;
  damageDepositNotes?: string;
  rentalEndTime: string;
  daysUntilAutoRefund: number;
  hoursUntilAutoRefund: number;
  autoRefundDate: string;
}

export interface ForfeitDepositRequest {
  reason: string;
}

export interface ForfeitDepositResponse {
  message: string;
  booking: Booking;
}

export interface RefundDepositResponse {
  message: string;
  refundId: string;
  booking: Booking;
}

export interface TriggerRefundCheckResponse {
  message: string;
  processedCount: number;
  refundedBookings: string[];
}

// Guest OTP Authentication Types
export interface GuestToken {
  email: string;
  type: 'guest';
  token: string;
  expiresAt: string;
}

export interface OTPVerificationRequest {
  email: string;
  code: string;
}

export interface OTPVerificationResponse {
  message: string;
  email: string;
  token: string;
}

export interface SendOTPRequest {
  email: string;
  purpose?: 'booking' | 'staff-verification';
}

export interface SendOTPResponse {
  message: string;
  expiresIn: number; // seconds
}