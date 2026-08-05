import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import type { LitterRow } from '@/lib/foster-queries'

export function useLitterAccess(litter: LitterRow | undefined) {
  const { user } = useAuth()
  const isOwner = Boolean(user && litter?.user_id === user.id)
  const { data: membership, isLoading } = useQuery({
    queryKey: ['litter-access', litter?.id, user?.id],
    enabled: Boolean(user && litter && !isOwner),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('litter_collaborators')
        .select('user_id')
        .eq('litter_id', litter!.id)
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  return {
    canEdit: isOwner || Boolean(membership),
    isOwner,
    isLoading: Boolean(user && litter && !isOwner && isLoading),
  }
}
