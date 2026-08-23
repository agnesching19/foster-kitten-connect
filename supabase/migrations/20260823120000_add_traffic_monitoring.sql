-- Privacy-preserving daily aggregates. No URLs, record contents, emails or
-- per-user browsing history are stored.
CREATE TABLE public.traffic_metrics_daily (
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  metric TEXT NOT NULL CHECK (metric ~ '^(api|image):[a-z-]+$'),
  request_count BIGINT NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  error_count BIGINT NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  response_bytes BIGINT NOT NULL DEFAULT 0 CHECK (response_bytes >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (day, metric)
);

GRANT SELECT ON public.traffic_metrics_daily TO authenticated;
GRANT ALL ON public.traffic_metrics_daily TO service_role;
ALTER TABLE public.traffic_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Traffic metrics are visible to the app admin"
  ON public.traffic_metrics_daily FOR SELECT TO authenticated
  USING (public.is_live_cam_admin());

CREATE OR REPLACE FUNCTION public.record_traffic_metrics(metric_batch JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  item JSONB;
  metric_name TEXT;
  metric_count BIGINT;
  metric_errors BIGINT;
  metric_bytes BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(metric_batch) <> 'array' OR jsonb_array_length(metric_batch) > 20 THEN
    RAISE EXCEPTION 'Invalid metric batch';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(metric_batch)
  LOOP
    metric_name := item ->> 'metric';
    metric_count := LEAST(GREATEST(COALESCE((item ->> 'count')::BIGINT, 0), 0), 10000);
    metric_errors := LEAST(GREATEST(COALESCE((item ->> 'errors')::BIGINT, 0), 0), metric_count);
    metric_bytes := LEAST(GREATEST(COALESCE((item ->> 'bytes')::BIGINT, 0), 0), 10737418240);
    IF metric_name !~ '^(api|image):[a-z-]+$' THEN
      RAISE EXCEPTION 'Invalid metric name';
    END IF;

    INSERT INTO public.traffic_metrics_daily (
      day, metric, request_count, error_count, response_bytes, updated_at
    ) VALUES (
      CURRENT_DATE, metric_name, metric_count, metric_errors, metric_bytes, now()
    )
    ON CONFLICT (day, metric) DO UPDATE SET
      request_count = traffic_metrics_daily.request_count + EXCLUDED.request_count,
      error_count = traffic_metrics_daily.error_count + EXCLUDED.error_count,
      response_bytes = traffic_metrics_daily.response_bytes + EXCLUDED.response_bytes,
      updated_at = now();
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.record_traffic_metrics(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_traffic_metrics(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_traffic_metrics(JSONB) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.traffic_metrics_summary(days_back INTEGER DEFAULT 14)
RETURNS TABLE (
  day DATE,
  metric TEXT,
  request_count BIGINT,
  error_count BIGINT,
  response_bytes BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_live_cam_admin() THEN
    RAISE EXCEPTION 'Only the app admin can view traffic metrics' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT traffic.day, traffic.metric, traffic.request_count, traffic.error_count, traffic.response_bytes
  FROM public.traffic_metrics_daily AS traffic
  WHERE traffic.day >= CURRENT_DATE - LEAST(GREATEST(days_back, 1), 90) + 1
  ORDER BY traffic.day DESC, traffic.metric;
END;
$$;

REVOKE ALL ON FUNCTION public.traffic_metrics_summary(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.traffic_metrics_summary(INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.traffic_metrics_summary(INTEGER) TO authenticated, service_role;
