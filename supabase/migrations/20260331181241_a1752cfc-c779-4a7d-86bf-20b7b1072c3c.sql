-- Create vehicles table for ambulance tracking
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_name TEXT NOT NULL,
  vehicle_number TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'en_route', 'on_scene', 'completed')),
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  route_coords JSONB,
  destination TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update vehicles" ON public.vehicles FOR UPDATE USING (true);

-- Create hospitals table
CREATE TABLE public.hospitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  icu_available BOOLEAN NOT NULL DEFAULT true,
  emergency_open BOOLEAN NOT NULL DEFAULT true,
  speciality TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hospitals" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert hospitals" ON public.hospitals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update hospitals" ON public.hospitals FOR UPDATE USING (true);

-- Create hospital_notifications table
CREATE TABLE public.hospital_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambulance_id UUID REFERENCES public.vehicles(id),
  eta TEXT,
  condition TEXT,
  hospital_id UUID REFERENCES public.hospitals(id),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'ready')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hospital_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hospital_notifications" ON public.hospital_notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert hospital_notifications" ON public.hospital_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update hospital_notifications" ON public.hospital_notifications FOR UPDATE USING (true);

-- Create backup_requests table
CREATE TABLE public.backup_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id),
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read backup_requests" ON public.backup_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert backup_requests" ON public.backup_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update backup_requests" ON public.backup_requests FOR UPDATE USING (true);

-- Enable realtime for vehicles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_notifications;

-- Insert default hospitals
INSERT INTO public.hospitals (name, lat, lng, icu_available, emergency_open, speciality) VALUES
  ('Government Hospital Madanapalle', 13.5580, 78.8758, true, true, 'General'),
  ('Apollo Clinic', 13.5520, 78.8720, true, true, 'Cardiology'),
  ('Care Hospital', 13.5565, 78.8715, true, true, 'Emergency'),
  ('Sri Venkateswara Hospital', 13.5545, 78.8780, false, true, 'Trauma'),
  ('RIMS Hospital Kadapa', 14.4674, 78.8241, true, true, 'Multi-Speciality'),
  ('Kurnool General Hospital', 15.8281, 78.0373, true, true, 'General');

-- Enable realtime for vehicles
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;