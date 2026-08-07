import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Card } from '@/components/foster/ui/Card'
import { CatAvatar } from '@/components/foster/ui/CatAvatar'
import { KittensSection } from '@/components/foster/kittens/KittensSection'
import { NewLitterDialog } from '@/components/foster/litters/NewLitterDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import { littersQueryOptions, type LitterRow } from '@/lib/foster-queries'
import { removeCatAvatars } from '@/lib/avatar-storage'
import { formatDate } from '@/utils/formatDate'
import { useLitterAccess } from '@/hooks/useLitterAccess'

export const Route = createFileRoute('/litters/$litterId')({
  head: () => ({
    meta: [
      { title: 'Batch details | Kitty Tracker' },
      {
        name: 'description',
        content: 'Manage a foster batch: view arrival details and add, rename or remove kittens.',
      },
      { property: 'og:title', content: 'Batch details | Kitty Tracker' },
      {
        property: 'og:description',
        content: 'Manage the kittens in a foster batch and keep their details up to date.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: LitterDetailPage,
  errorComponent: ({ error }) => (
    <Card className="py-12 text-center">
      <p role="alert" className="text-sm text-muted">
        {error.message}
      </p>
    </Card>
  ),
  notFoundComponent: () => (
    <Card className="py-12 text-center">
      <p className="text-sm text-muted">Batch not found.</p>
    </Card>
  ),
})

function LitterDetailPage() {
  const { litterId } = Route.useParams()
  const { data: litters = [], isLoading } = useQuery(littersQueryOptions)
  const litter = litters.find((item) => item.id === litterId)
  const { canEdit, isOwner } = useLitterAccess(litter)

  if (isLoading) {
    return (
      <Card className="py-12 text-center">
        <p className="text-sm text-muted">Loading batch…</p>
      </Card>
    )
  }

  if (!litter) {
    return (
      <Card className="py-12 text-center">
        <p className="font-medium text-ink">Batch not found</p>
        <Link to="/" className="mt-2 inline-block text-sm font-semibold text-brand-700">
          Back to dashboard
        </Link>
      </Card>
    )
  }

  return (
    <div>
      <Link to="/" className="mb-3 inline-block text-sm font-semibold text-brand-700">
        ← Back to dashboard
      </Link>
      <PageHeader
        title={litter.litter_name || litter.mother_name}
        subtitle={`Arrived ${formatDate(litter.arrived)}${litter.left_date ? ` · Left ${formatDate(litter.left_date)}` : ''}`}
        avatar={
          <CatAvatar name={litter.mother_name} avatarPath={litter.mother_avatar_path} size="lg" />
        }
        action={isOwner ? <LitterActions litter={litter} /> : null}
      />
      <KittensSection litterId={litter.id} canEdit={canEdit} />
    </div>
  )
}

function LitterActions({ litter }: { litter: LitterRow }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [menuOpen])

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('litters').delete().eq('id', litter.id)
      if (error) throw error
      try {
        await removeCatAvatars([
          litter.mother_avatar_path,
          ...litter.kittens.map((kitten) => kitten.avatar_path),
        ])
      } catch (removeError) {
        console.warn('Could not remove all litter avatar files', removeError)
      }
    },
    onSuccess: async () => {
      setConfirmOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['litters'] })
      toast.success('Batch deleted')
      navigate({ to: '/' })
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete the batch'),
  })

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Batch actions"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink"
      >
        ⋯
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2.5 text-left text-sm text-ink transition hover:bg-brand-50"
            onClick={() => {
              setMenuOpen(false)
              setEditOpen(true)
            }}
          >
            Edit batch
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2.5 text-left text-sm text-ink transition hover:bg-brand-50"
            onClick={() => {
              setMenuOpen(false)
              setConfirmOpen(true)
            }}
          >
            Delete batch
          </button>
        </div>
      ) : null}

      <NewLitterDialog open={editOpen} litter={litter} onClose={() => setEditOpen(false)} />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this batch?"
        description={
          <>
            <p>This cannot be undone. Deleting this batch also deletes its:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>kittens</li>
              <li>feedings</li>
              <li>poop entries</li>
              <li>litter box changes</li>
              <li>weigh-ins</li>
              <li>weights</li>
              <li>notes</li>
            </ul>
          </>
        }
        confirmLabel="Delete batch"
        busy={remove.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}
