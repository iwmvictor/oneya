CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TYPE public.transcript_status AS ENUM ('queued', 'capturing', 'processing', 'available', 'failed');

-- A continuous listening/program session that consecutive audio windows belong to.
CREATE TABLE public.transcription_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id text NOT NULL,
  program text,
  presenter text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transcription_sessions TO anon, authenticated;
GRANT ALL ON public.transcription_sessions TO service_role;
ALTER TABLE public.transcription_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sessions" ON public.transcription_sessions FOR SELECT TO anon, authenticated USING (true);

-- One transcript per captured audio window.
CREATE TABLE public.transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.transcription_sessions(id) ON DELETE SET NULL,
  station_id text NOT NULL,
  program text,
  presenter text,
  sequence integer NOT NULL DEFAULT 0,
  status public.transcript_status NOT NULL DEFAULT 'queued',
  window_start timestamptz,
  window_end timestamptz,
  duration_seconds numeric,
  audio_format text,
  audio_bytes integer,
  language text,
  languages text[] NOT NULL DEFAULT '{}',
  full_text text,
  quality text,
  provider text,
  model text,
  error text,
  requested_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transcripts_station_idx ON public.transcripts (station_id, created_at DESC);
CREATE INDEX transcripts_session_idx ON public.transcripts (session_id, sequence);
GRANT SELECT ON public.transcripts TO anon, authenticated;
GRANT ALL ON public.transcripts TO service_role;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read transcripts" ON public.transcripts FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.transcript_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id uuid NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  position integer NOT NULL,
  start_time numeric NOT NULL,
  end_time numeric NOT NULL,
  speaker text,
  language text,
  text text NOT NULL,
  confidence numeric,
  UNIQUE (transcript_id, position)
);
GRANT SELECT ON public.transcript_segments TO anon, authenticated;
GRANT ALL ON public.transcript_segments TO service_role;
ALTER TABLE public.transcript_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read segments of available transcripts" ON public.transcript_segments FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.transcripts t WHERE t.id = transcript_id AND t.status = 'available'));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER transcripts_touch BEFORE UPDATE ON public.transcripts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();