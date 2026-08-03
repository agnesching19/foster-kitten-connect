import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { KittenDot, TAG_COLOURS, type TagColour } from '@/components/foster/ui/KittenDot'
import { kittensQueryOptions, type KittenRow } from '@/lib/foster-queries'

const inputClass =
  'min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-sm text-muted transition hover:bg-brand-50 hover:text-ink disabled:opacity-40 disabled:pointer-events-none'

function ColourSelect({
  value,
  onChange,
  label,
}: {
  value: TagColour | ''
  onChange: (value: TagColour | '') => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 sm:w-44">
      <span className="sr-only">{label}</span>
      <KittenDot colour={value || null} size="md" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TagColour | '')}
        className={inputClass}
        aria-label={label}
      >
        <option value="">No colour</option>
        {TAG_COLOURS.map((colour) => (
          <option key={colour} value={colour} className="capitalize">
            {colour[0]!.toUpperCase() + colour.slice(1)}
          </option>
        ))}
      </select>
    </label>
  )
}

export function KittensSection({ litterId }: { litterId: string }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: kittens = [], isLoading } = useQuery(kittensQueryOptions(litterId))

  const [newName, setNewName] = useState('')
  const [newColour, setNewColour] = useState<TagColour | ''>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingColour, setEditingColour] = useState<TagColour | ''>('')
  const [pendingDelete, setPendingDelete] = useState<KittenRow | null>(null)

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['kittens', litterId] }),
      queryClient.invalidateQueries({ queryKey: ['litters'] }),
    ])
  }

  const addKitten = useMutation({
    mutationFn: async ({ name, tagColour }: { name: string; tagColour: TagColour | '' }) => {
      if (!user) throw new Error('You need to be signed in to add a kitten.')
      const nextOrder = kittens.length
        ? Math.max(...kittens.map((k) => k.sort_order)) + 1
        : 1
      const { error } = await supabase
        .from('kittens')
        .insert({
          user_id: user.id,
          litter_id: litterId,
          name,
          sort_order: nextOrder,
          tag_colour: tagColour || null,
        })
      if (error) throw error
    },
    onSuccess: async () => {
      setNewName('')
      setNewColour('')
      await refresh()
      toast.success('Kitten added')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not add the kitten'),
  })

  const renameKitten = useMutation({
    mutationFn: async ({
      id,
      name,
      tagColour,
    }: {
      id: string
      name: string
      tagColour: TagColour | ''
    }) => {
      const { error } = await supabase
        .from('kittens')
        .update({ name, tag_colour: tagColour || null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      setEditingId(null)
      await refresh()
      toast.success('Kitten updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update the kitten'),
  })

  const deleteKitten = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kittens').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      setPendingDelete(null)
      await refresh()
      toast.success('Kitten removed')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not remove the kitten'),
  })

  const moveKitten = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const target = index + direction
      const a = kittens[index]
      const b = kittens[target]
      if (!a || !b) return
      const results = await Promise.all([
        supabase.from('kittens').update({ sort_order: b.sort_order }).eq('id', a.id),
        supabase.from('kittens').update({ sort_order: a.sort_order }).eq('id', b.id),
      ])
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message || 'Could not reorder kittens'),
  })

  return (
    <section aria-label="Kittens">
      <Card>
        <CardHeader
          title="Kittens"
          subtitle={`${kittens.length} recorded in this litter`}
        />

        {user ? (
          <form
            className="mb-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              const name = newName.trim()
              if (!name) return
              addKitten.mutate({ name, tagColour: newColour })
            }}
          >
            <label className="flex-1">
              <span className="sr-only">Kitten name</span>
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Kitten name, e.g. Pink"
                className={inputClass}
              />
            </label>
            <ColourSelect value={newColour} onChange={setNewColour} label="Tag colour" />
            <Button type="submit" size="md" disabled={addKitten.isPending || !newName.trim()}>
              {addKitten.isPending ? 'Adding…' : 'Add kitten'}
            </Button>
          </form>
        ) : (
          <p className="mb-4 rounded-xl bg-gray-50 px-3 py-3 text-sm text-muted">
            Sign in to add or edit kittens.
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-muted">Loading kittens…</p>
        ) : kittens.length ? (
          <ul className="grid gap-2">
            {kittens.map((kitten, index) => (
              <li
                key={kitten.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-semibold text-brand-800">
                  {index + 1}
                </span>
                <KittenDot colour={kitten.tag_colour} size="md" />

                {editingId === kitten.id ? (
                  <form
                    className="flex flex-1 flex-col gap-2 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const name = editingName.trim()
                      if (!name) return
                      renameKitten.mutate({ id: kitten.id, name, tagColour: editingColour })
                    }}
                  >
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      className={inputClass}
                      aria-label={`Rename ${kitten.name}`}
                    />
                    <ColourSelect
                      value={editingColour}
                      onChange={setEditingColour}
                      label={`Tag colour for ${kitten.name}`}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="md" disabled={renameKitten.isPending}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="min-w-0 flex-1 truncate font-medium text-ink">{kitten.name}</p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label={`Move ${kitten.name} up`}
                        disabled={index === 0 || moveKitten.isPending || !user}
                        onClick={() => moveKitten.mutate({ index, direction: -1 })}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label={`Move ${kitten.name} down`}
                        disabled={index === kittens.length - 1 || moveKitten.isPending || !user}
                        onClick={() => moveKitten.mutate({ index, direction: 1 })}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label={`Edit ${kitten.name}`}
                        disabled={!user}
                        onClick={() => {
                          setEditingId(kitten.id)
                          setEditingName(kitten.name)
                          setEditingColour(kitten.tag_colour ?? '')
                        }}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label={`Delete ${kitten.name}`}
                        disabled={!user}
                        onClick={() => setPendingDelete(kitten)}
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="🐾"
            title="No kittens yet"
            description="Add the kittens in this litter to start tracking them."
          />
        )}
      </Card>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-kitten-title"
            className="w-full max-w-sm rounded-t-2xl border border-border bg-surface-raised p-5 shadow-lg sm:rounded-2xl"
          >
            <h2 id="delete-kitten-title" className="text-lg font-semibold text-ink">
              Delete {pendingDelete.name}?
            </h2>
            <p className="mt-1 text-sm text-muted">
              This also removes their weight entries. This cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                size="md"
                fullWidth
                disabled={deleteKitten.isPending}
                onClick={() => deleteKitten.mutate(pendingDelete.id)}
              >
                {deleteKitten.isPending ? 'Deleting…' : 'Delete'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setPendingDelete(null)}
                disabled={deleteKitten.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
