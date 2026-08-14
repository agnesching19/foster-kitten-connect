import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/foster/ui/Button'
import { Card, CardHeader } from '@/components/foster/ui/Card'
import { inputClass } from '@/components/foster/ui/FormDialog'
import { ConfirmDialog } from '@/components/foster/settings/ConfirmDialog'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'

type FoodPreset = {
  created_by: string | null
  id: string
  name: string
}

export function FeedingFlavoursCard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<FoodPreset | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleting, setDeleting] = useState<FoodPreset | null>(null)

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['feeding-food-presets'],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feeding_food_presets')
        .select('id, name, created_by')
        .order('name')
      if (error) throw error
      return data
    },
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['feeding-food-presets'] })

  const addPreset = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('You need to be signed in.')
      const { error } = await supabase
        .from('feeding_food_presets')
        .insert({ name: name.trim().toLowerCase(), created_by: user.id })
      if (error) throw error
    },
    onSuccess: async () => {
      setNewName('')
      await refresh()
      toast.success('Flavour added')
    },
    onError: (error: Error) => toast.error(presetErrorMessage(error, 'add')),
  })

  const updatePreset = useMutation({
    mutationFn: async ({ id, name }: FoodPreset) => {
      const { error } = await supabase
        .from('feeding_food_presets')
        .update({ name: name.trim().toLowerCase() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      setEditing(null)
      setEditingName('')
      await refresh()
      toast.success('Flavour updated')
    },
    onError: (error: Error) => toast.error(presetErrorMessage(error, 'update')),
  })

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feeding_food_presets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      setDeleting(null)
      await refresh()
      toast.success('Flavour removed')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not remove the flavour'),
  })

  return (
    <>
      <Card>
        <CardHeader
          title="Wet-food flavours"
          subtitle="Manage the shared pouch flavours shown as quick options when logging wet food."
        />

        {user ? (
          <div className="grid gap-3">
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                if (newName.trim()) addPreset.mutate(newName)
              }}
            >
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className={inputClass}
                placeholder="Add another flavour"
                aria-label="New feeding flavour"
                maxLength={80}
              />
              <Button type="submit" size="md" disabled={!newName.trim() || addPreset.isPending}>
                {addPreset.isPending ? 'Adding…' : 'Add flavour'}
              </Button>
            </form>

            {isLoading ? (
              <p className="text-sm text-muted">Loading flavours…</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border px-3">
                {presets.map((preset) => (
                  <li key={preset.id} className="flex min-w-0 items-center gap-2 py-2.5">
                    {editing?.id === preset.id ? (
                      <form
                        className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row"
                        onSubmit={(event) => {
                          event.preventDefault()
                          if (editingName.trim()) {
                            updatePreset.mutate({ ...preset, name: editingName })
                          }
                        }}
                      >
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          className={inputClass}
                          aria-label={`Rename ${preset.name}`}
                          maxLength={80}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="md"
                            disabled={!editingName.trim() || updatePreset.isPending}
                          >
                            Save
                          </Button>
                          <Button size="md" variant="secondary" onClick={() => setEditing(null)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate text-sm capitalize text-ink">
                          {preset.name}
                        </span>
                        {preset.created_by === user.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(preset)
                                setEditingName(preset.name)
                              }}
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-brand-50 hover:text-brand-700"
                              aria-label={`Edit ${preset.name}`}
                            >
                              <Pencil aria-hidden="true" className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(preset)}
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-red-50 hover:text-red-600"
                              aria-label={`Delete ${preset.name}`}
                            >
                              <Trash2 aria-hidden="true" className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted">
              You can rename or remove flavours you added. Existing feeding records are unchanged.
            </p>
          </div>
        ) : (
          <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-muted">
            Sign in to manage feeding flavours.
          </p>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove this flavour?"
        description={
          deleting
            ? `“${deleting.name}” will no longer appear as a quick option. Existing feeding records will remain unchanged.`
            : undefined
        }
        confirmLabel="Remove flavour"
        busy={deletePreset.isPending}
        onConfirm={() => deleting && deletePreset.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}

function presetErrorMessage(error: Error, action: 'add' | 'update') {
  if ('code' in error && error.code === '23505') return 'That flavour is already in the list.'
  return error.message || `Could not ${action} the flavour`
}
