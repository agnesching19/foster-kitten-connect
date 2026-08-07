import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { isLiveCamsAdmin } from '@/lib/live-cams'

export function useLiveCamAccess() {
  const { user, loading: authLoading } = useAuth()
  const admin = isLiveCamsAdmin(user?.email)

  const accessQuery = useQuery({
    queryKey: ['live-cam-access', user?.id],
    enabled: Boolean(user && !admin),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_cam_access')
        .select('user_id')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return Boolean(data)
    },
    staleTime: 5 * 60 * 1000,
  })

  return {
    canAccess: Boolean(user && (admin || accessQuery.data)),
    isLoading: authLoading || accessQuery.isLoading,
  }
}
