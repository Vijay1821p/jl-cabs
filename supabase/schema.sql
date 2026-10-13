-- Run this in the Supabase SQL editor, or let the API create it on startup.

create table if not exists bookings (
  id bigserial primary key,
  booking_id text not null unique,
  customer_name text not null,
  mobile text not null,
  pickup text not null,
  drop_location text not null,
  trip_date date not null,
  trip_time text not null,
  trip_type text not null,
  vehicle_type text not null,
  distance_km integer,
  hours integer,
  days integer,
  fare integer not null,
  fare_lines jsonb not null default '[]'::jsonb,
  payment_status text not null default 'pending',
  payment_choice text not null default 'advance',
  amount_paid integer not null default 0,
  driver_name text not null default '',
  driver_mobile text not null default '',
  vehicle_number text not null default '',
  booking_status text not null default 'requested',
  razorpay_order_id text unique,
  razorpay_payment_id text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_mobile_idx on bookings (mobile);
create index if not exists bookings_created_idx on bookings (created_at desc);

create table if not exists site_settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists popular_trips (
  id bigserial primary key,
  from_place text not null,
  to_place text not null,
  fare integer not null,
  km integer,
  trip_type text not null default 'one_way',
  image_url text not null default '',
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
