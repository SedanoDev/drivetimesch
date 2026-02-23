import type { Instructor, TimeSlot } from '../types';

export const INSTRUCTORS: Instructor[] = [
  {
    id: '1',
    name: 'Carlos Martinez',
    bio: 'Conducción urbana - Manual',
    vehicle_type: 'Manual',
    rating: 4.8,
    reviews_count: 128,
    image_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Carlos',
    is_active: true
  },
  {
    id: '2',
    name: 'Ana Lopez',
    bio: 'Autopista - Automatico',
    vehicle_type: 'Automatic',
    rating: 4.9,
    reviews_count: 94,
    image_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ana',
    is_active: true
  },
  {
    id: '3',
    name: 'Javier Ruiz',
    bio: 'Conducción nocturna',
    vehicle_type: 'Manual',
    rating: 4.7,
    reviews_count: 67,
    image_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Javier',
    is_active: true
  },
  {
    id: '4',
    name: 'Maria Garcia',
    bio: 'Maniobras - Manual',
    vehicle_type: 'Manual',
    rating: 5.0,
    reviews_count: 210,
    image_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maria',
    is_active: true
  }
];

export const TIME_SLOTS: TimeSlot[] = [
  { time: '09:00', available: true },
  { time: '10:00', available: false },
  { time: '11:00', available: true },
  { time: '12:00', available: false },
  { time: '13:00', available: true },
  { time: '16:00', available: true },
  { time: '17:00', available: false },
  { time: '18:00', available: true },
];
