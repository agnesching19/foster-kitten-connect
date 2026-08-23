-- Traffic monitoring is a separate administrative permission from live cams.
CREATE OR REPLACE FUNCTION public.is_traffic_monitor_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT lower(COALESCE(auth.jwt() ->> 'email', '')) IN (
    'agnesching19@gmail.com',
    'simon.r.clark@gmail.com'
  );
$$;

REVOKE ALL ON FUNCTION public.is_traffic_monitor_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_traffic_monitor_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS "Traffic metrics are visible to the app admin"
  ON public.traffic_metrics_daily;

CREATE POLICY "Traffic metrics are visible to traffic admins"
  ON public.traffic_metrics_daily FOR SELECT TO authenticated
  USING (public.is_traffic_monitor_admin());

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
  IF NOT public.is_traffic_monitor_admin() THEN
    RAISE EXCEPTION 'Only a traffic monitoring admin can view traffic metrics'
      USING ERRCODE = '42501';
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
