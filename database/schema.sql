-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create instructors table
create table if not exists public.instructors (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  bio text,
  vehicle_type text check (vehicle_type in ('Manual', 'Automatic')),
  rating numeric(2, 1) default 5.0,
  reviews_count integer default 0,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create bookings table
create table if not exists public.bookings (
  id uuid default uuid_generate_v4() primary key,
  instructor_id uuid references public.instructors(id) not null,
  student_name text not null,
  booking_date date not null,
  start_time time without time zone not null,
  duration_minutes integer default 60,
  status text check (status in ('confirmed', 'cancelled', 'pending')) default 'confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for performance
create index if not exists idx_bookings_instructor_date on public.bookings(instructor_id, booking_date);

-- Enable Row Level Security (RLS)
alter table public.instructors enable row level security;
alter table public.bookings enable row level security;

-- Create policies (Example for public access to instructors)
create policy "Allow public read access to instructors"
  on public.instructors for select
  using (true);

-- Create policies (Example for creating bookings)
create policy "Allow public to create bookings"
  on public.bookings for insert
  with check (true);

-- Create policies (Example for reading own bookings - simplified for demo)
create policy "Allow public read access to bookings"
  on public.bookings for select
  using (true);

-- Insert sample data
insert into public.instructors (name, bio, vehicle_type, rating, reviews_count, image_url) values
('Carlos Martinez', 'Conducción urbana - Manual', 'Manual', 4.8, 128, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos'),
('Ana Lopez', 'Autopista - Automatico', 'Automatic', 4.9, 94, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana'),
('Javier Ruiz', 'Conducción nocturna', 'Manual', 4.7, 67, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Javier'),
('Maria Garcia', 'Maniobras - Manual', 'Manual', 5.0, 210, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria');
