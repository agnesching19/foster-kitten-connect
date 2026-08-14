import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { batchDisplayName, littersQueryOptions, pickCurrentLitter } from '@/lib/foster-queries'
import { KittenAvatar } from '@/components/foster/ui/KittenAvatar'
import { CatAvatar } from '@/components/foster/ui/CatAvatar'
import { useLiveCamAccess } from '@/hooks/useLiveCamAccess'
import {
  batchRouteForPathname,
  communityNavItem,
  getNavLinkClass,
  liveCamsNavItem,
  navItems,
  settingsNavItem,
} from './navItems'
import { AuthStatus } from './AuthStatus'

export function SidebarNav() {
  const navigate = useNavigate()
  const { canAccess: canAccessLiveCams } = useLiveCamAccess()
  const pathname = useLocation({ select: (location) => location.pathname })
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const totalCats = litters.reduce(
    (sum, litter) => sum + litter.kittens.length + (litter.primary_cat ? 1 : 0),
    0,
  )
  const current = pickCurrentLitter(litters)
  const isActivePath = (to: string) =>
    to === '/'
      ? pathname === '/' || /^\/litters\/[^/]+$/.test(pathname)
      : pathname === to || pathname.startsWith(`${to}/`) || pathname.endsWith(to)
  const selectedBatchId = pathname.match(/^\/litters\/([^/]+)/)?.[1] ?? ''
  const selectedBatch = litters.find((litter) => litter.id === selectedBatchId) ?? current
  const kittens = selectedBatch?.kittens ?? []

  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-surface-raised lg:w-72">
      <div className="border-b border-border px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Kitty Tracker
        </p>
        <p className="mt-1 text-base font-semibold text-ink">My foster batches</p>
        <p className="text-sm text-muted">
          {litters.length} batches · {totalCats} cats
        </p>
      </div>

      <nav aria-label="Main navigation" className="px-3 pt-4">
        <div className="mb-4">
          <label
            htmlFor="sidebar-batch-selector"
            className="mb-1.5 block px-2 text-xs font-semibold uppercase tracking-wide text-muted"
          >
            View batch
          </label>
          <select
            id="sidebar-batch-selector"
            value={selectedBatchId}
            onChange={(event) => {
              if (!event.target.value) return
              navigate({
                to: batchRouteForPathname(pathname),
                params: { litterId: event.target.value },
              })
            }}
            className="min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-ink"
          >
            <option value="" disabled>
              Select a batch…
            </option>
            {litters.map((litter) => (
              <option key={litter.id} value={litter.id}>
                {batchDisplayName(litter)} ·{' '}
                {litter.status === 'completed' ? 'Completed' : 'Active'}
              </option>
            ))}
          </select>
        </div>
        <ul className="space-y-1">
          {navItems
            .filter((item) => item.to !== communityNavItem.to)
            .map((item) => {
              const isActive = isActivePath(item.to)
              const batchDestination = item.batchSection
                ? (`/litters/$litterId/${item.batchSection}` as const)
                : '/litters/$litterId'
              return (
                <li key={item.to}>
                  <Link
                    to={selectedBatchId ? batchDestination : item.to}
                    params={{ litterId: selectedBatchId }}
                    className={getNavLinkClass(isActive, 'sidebar')}
                  >
                    {item.icon(isActive)}
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
        </ul>

        <ul className="mt-4 space-y-1 border-t border-border pt-2">
          <li>
            <Link
              to={settingsNavItem.to}
              className={getNavLinkClass(pathname.startsWith(settingsNavItem.to), 'sidebar')}
            >
              {settingsNavItem.icon(pathname.startsWith(settingsNavItem.to))}
              <span>{settingsNavItem.label}</span>
            </Link>
          </li>
          {canAccessLiveCams && (
            <li>
              <a
                href={liveCamsNavItem.href}
                target="_blank"
                rel="noreferrer"
                className={getNavLinkClass(false, 'sidebar')}
              >
                {liveCamsNavItem.icon}
                <span>{liveCamsNavItem.label}</span>
                <span className="ml-auto text-xs" aria-hidden>
                  ↗
                </span>
              </a>
            </li>
          )}
          <li className="border-t border-border pt-2 pb-2">
            <Link
              to={communityNavItem.to}
              className={getNavLinkClass(pathname.startsWith(communityNavItem.to), 'sidebar')}
            >
              {communityNavItem.icon(pathname.startsWith(communityNavItem.to))}
              <span>{communityNavItem.label}</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {selectedBatch?.status === 'completed' ? 'Selected batch' : 'Active batch'}
        </p>
        {selectedBatch ? (
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CatAvatar
                name={batchDisplayName(selectedBatch)}
                avatarPath={
                  selectedBatch.primary_cat?.avatar_path ?? selectedBatch.mother_avatar_path
                }
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                {batchDisplayName(selectedBatch)}
              </span>
              <span className="shrink-0 text-xs text-muted">
                {selectedBatch.batch_type === 'single' ? 'Foster cat' : 'Momma'}
              </span>
            </li>
            {kittens.map((kitten) => (
              <li key={kitten.id} className="flex items-center gap-2">
                <KittenAvatar
                  name={kitten.name}
                  avatarPath={kitten.avatar_path}
                  colour={kitten.tag_colour}
                  size="sm"
                />
                <span className="truncate text-sm text-ink">{kitten.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No batch selected</p>
        )}
      </div>

      <div className="border-t border-border px-5 py-4">
        <AuthStatus variant="sidebar" />
      </div>
    </aside>
  )
}
