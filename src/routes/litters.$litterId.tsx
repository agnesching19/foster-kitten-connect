import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { PageHeader } from '@/components/foster/layout/PageHeader'
import { Card } from '@/components/foster/ui/Card'
import { KittensSection } from '@/components/foster/kittens/KittensSection'
import { NewLitterDialog } from '@/components/foster/litters/NewLitterDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import { littersQueryOptions, type LitterRow } from '@/lib/foster-queries'
import { formatDate } from '@/utils/formatDate'

export const Route = createFileRoute('/litters/$litterId')({
  head: () => ({
    meta: [
      { title: 'Litter details | Foster Kitten Tracker' },
      {
        name: 'description',
        content:
          'Manage a foster litter: view arrival details and add, rename, reorder or remove kittens.',
      },
      { property: 'og:title', content: 'Litter details | Foster Kitten Tracker' },
      {
        property: 'og:description',
        content: 'Manage the kittens in a foster litter and keep their details up to date.',
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
      <p className="text-sm text-muted">Litter not found.</p>
    </Card>
  ),
})

function LitterDetailPage() {
  const { litterId } = Route.useParams()
  const { data: litters = [], isLoading } = useQuery(littersQueryOptions)
  const litter = litters.find((item) => item.id === litterId)

  if (isLoading) {
    return (
      <Card className="py-12 text-center">
        <p className="text-sm text-muted">Loading litter…</p>
      </Card>
    )
  }

  if (!litter) {
    return (
      <Card className="py-12 text-center">
        <p className="font-medium text-ink">Litter not found</p>
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
        action={<LitterActions litter={litter} />}
      />
      <KittensSection litterId={litter.id} />
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
    },
    onSuccess: async () => {
      setConfirmOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['litters'] })
      toast.success('Litter deleted')
      navigate({ to: '/' })
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete the litter'),
  })

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Litter actions"
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
            Edit litter
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
            Delete litter
          </button>
        </div>
      ) : null}

      <NewLitterDialog open={editOpen} litter={litter} onClose={() => setEditOpen(false)} />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this litter?"
        description={
          <>
            <p>This cannot be undone. Deleting this litter also deletes its:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>kittens</li>
              <li>feedings</li>
              <li>poop entries</li>
              <li>litter changes</li>
              <li>weigh-ins</li>
              <li>weights</li>
              <li>notes</li>
            </ul>
          </>
        }
        confirmLabel="Delete litter"
        busy={remove.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}
