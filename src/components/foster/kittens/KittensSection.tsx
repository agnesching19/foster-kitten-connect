import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { EmptyState } from '@/components/foster/ui/EmptyState'
import { KittenDot, TAG_COLOURS, type TagColour } from '@/components/foster/ui/KittenDot'
import { KittenAvatar } from '@/components/foster/ui/KittenAvatar'
import { kittensQueryOptions, type KittenRow } from '@/lib/foster-queries'
import { removeCatAvatars, uploadCatAvatar } from '@/lib/avatar-storage'

const inputClass =
  'min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

const iconButtonClass =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-lg text-muted transition hover:bg-brand-50 hover:text-ink disabled:opacity-40 disabled:pointer-events-none'

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

export function KittensSection({ litterId, canEdit }: { litterId: string; canEdit: boolean }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: kittens = [], isLoading } = useQuery(kittensQueryOptions(litterId))

  const [newName, setNewName] = useState('')
  const [newColour, setNewColour] = useState<TagColour | ''>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingColour, setEditingColour] = useState<TagColour | ''>('')
  const [editingAvatar, setEditingAvatar] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
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
      const nextOrder = kittens.length ? Math.max(...kittens.map((k) => k.sort_order)) + 1 : 1
      const { error } = await supabase.from('kittens').insert({
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

  const updateKitten = useMutation({
    mutationFn: async ({
      kitten,
      name,
      tagColour,
      avatar,
      removeExistingAvatar,
    }: {
      kitten: KittenRow
      name: string
      tagColour: TagColour | ''
      avatar: File | null
      removeExistingAvatar: boolean
    }) => {
      if (!user) throw new Error('You need to be signed in to edit a kitten.')

      let avatarPath = removeExistingAvatar ? null : kitten.avatar_path
      let uploadedPath: string | null = null

      if (avatar) {
        uploadedPath = await uploadCatAvatar(avatar, `${user.id}/kittens/${kitten.id}`)
        avatarPath = uploadedPath
      }

      const { error } = await supabase
        .from('kittens')
        .update({ name, tag_colour: tagColour || null, avatar_path: avatarPath })
        .eq('id', kitten.id)
      if (error) {
        if (uploadedPath) await removeCatAvatars([uploadedPath])
        throw error
      }

      if (kitten.avatar_path && kitten.avatar_path !== avatarPath) {
        try {
          await removeCatAvatars([kitten.avatar_path])
        } catch (removeError) {
          console.warn('Could not remove the previous kitten avatar', removeError)
        }
      }
    },
    onSuccess: async () => {
      setEditingId(null)
      setEditingAvatar(null)
      setRemoveAvatar(false)
      await refresh()
      toast.success('Kitten updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update the kitten'),
  })

  const deleteKitten = useMutation({
    mutationFn: async (kitten: KittenRow) => {
      const { error } = await supabase.from('kittens').delete().eq('id', kitten.id)
      if (error) throw error
      if (kitten.avatar_path) {
        try {
          await removeCatAvatars([kitten.avatar_path])
        } catch (removeError) {
          console.warn('Could not remove the kitten avatar', removeError)
        }
      }
    },
    onSuccess: async () => {
      setPendingDelete(null)
      await refresh()
      toast.success('Kitten removed')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not remove the kitten'),
  })

  return (
    <section aria-label="Kittens">
      <Card>
        <CardHeader title="Kittens" subtitle={`${kittens.length} recorded in this batch`} />

        {canEdit ? (
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
            You have read-only access to this batch.
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-muted">Loading kittens…</p>
        ) : kittens.length ? (
          <ul className="grid gap-2">
            {kittens.map((kitten, index) => (
              <li
                key={kitten.id}
                className={`flex min-w-0 items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 sm:gap-3 ${editingId === kitten.id ? 'flex-wrap sm:flex-nowrap' : ''}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-semibold text-brand-800">
                  {index + 1}
                </span>
                <KittenAvatar
                  name={kitten.name}
                  avatarPath={kitten.avatar_path}
                  colour={kitten.tag_colour}
                />

                {editingId === kitten.id ? (
                  <form
                    className="flex min-w-0 basis-full flex-1 flex-col gap-2 sm:basis-auto"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const name = editingName.trim()
                      if (!name) return
                      updateKitten.mutate({
                        kitten,
                        name,
                        tagColour: editingColour,
                        avatar: editingAvatar,
                        removeExistingAvatar: removeAvatar,
                      })
                    }}
                  >
                    <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(12rem,1fr)_12rem_auto] sm:items-center">
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
                      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                        <Button type="submit" size="md" disabled={updateKitten.isPending}>
                          {updateKitten.isPending ? 'Saving…' : 'Save'}
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
                    </div>
                    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 px-3 py-2">
                      <label className="min-w-0 flex-1 text-sm font-medium text-ink">
                        Avatar
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="mt-2 block w-full min-w-0 text-sm text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:font-medium file:text-brand-800 sm:ml-3 sm:mt-0 sm:inline sm:w-auto sm:max-w-56"
                          onChange={(event) => {
                            setEditingAvatar(event.target.files?.[0] ?? null)
                            setRemoveAvatar(false)
                          }}
                        />
                      </label>
                      {kitten.avatar_path && !editingAvatar ? (
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                          onClick={() => setRemoveAvatar((current) => !current)}
                        >
                          {removeAvatar ? 'Keep current photo' : 'Remove photo'}
                        </button>
                      ) : null}
                      {removeAvatar ? (
                        <span className="text-xs text-muted">
                          Photo will be removed when saved.
                        </span>
                      ) : null}
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="min-w-0 flex-1 truncate font-medium text-ink">{kitten.name}</p>
                    {canEdit ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          className={iconButtonClass}
                          aria-label={`Edit ${kitten.name}`}
                          disabled={!user}
                          onClick={() => {
                            setEditingId(kitten.id)
                            setEditingName(kitten.name)
                            setEditingColour(kitten.tag_colour ?? '')
                            setEditingAvatar(null)
                            setRemoveAvatar(false)
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
                    ) : null}
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="🐾"
            title="No kittens yet"
            description="Add the kittens in this batch to start tracking them."
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
                onClick={() => deleteKitten.mutate(pendingDelete)}
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
