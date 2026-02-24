export type VehicleType = 'Manual' | 'Automatic';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Instructor {
  id: string;
  name: string;
  bio: string;
  vehicle_type: VehicleType;
  rating: number;
  reviews_count: number;
  image_url: string;
  is_active?: boolean;
}

export interface Booking {
  id: string;
  instructor_id: string;
  student_name: string;
  booking_date: string; // ISO date string YYYY-MM-DD
  start_time: string; // HH:mm
  duration_minutes: number;
  status: BookingStatus;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
