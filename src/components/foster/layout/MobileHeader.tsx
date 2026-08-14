import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import { Layers, MoreHorizontal, NotebookPen, Settings, Video } from 'lucide-react'
import { batchDisplayName, littersQueryOptions, pickCurrentLitter } from '@/lib/foster-queries'
import { useLiveCamAccess } from '@/hooks/useLiveCamAccess'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AuthStatus } from './AuthStatus'
import { batchRouteForPathname, communityNavItem } from './navItems'

export function MobileHeader() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { canAccess: canAccessLiveCams } = useLiveCamAccess()
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const current = pickCurrentLitter(litters)

  return (
    <div className="border-b border-border bg-brand-50/90 px-4 py-3 backdrop-blur-md pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Kitty Tracker
          </p>
          {current ? (
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-medium text-ink">{batchDisplayName(current)}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${current.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-muted'}`}
              >
                {current.status === 'active' ? 'Active' : 'Completed'}
              </span>
            </div>
          ) : (
            <p className="text-sm font-medium text-ink">No active batch</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <AuthStatus variant="mobile" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open more options"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-muted transition hover:bg-brand-100 hover:text-ink"
              >
                <MoreHorizontal aria-hidden className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              collisionPadding={12}
              className="w-[min(20rem,calc(100vw-1.5rem))] p-2"
            >
              <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wide text-muted">
                <Layers aria-hidden />
                View batch
              </DropdownMenuLabel>
              {litters.map((litter) => (
                <DropdownMenuItem
                  key={litter.id}
                  asChild
                  className="min-h-11 min-w-0 cursor-pointer rounded-lg px-3"
                >
                  <Link to={batchRouteForPathname(pathname)} params={{ litterId: litter.id }}>
                    <span className="min-w-0 flex-1 truncate">{batchDisplayName(litter)}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {litter.status === 'completed' ? 'Completed' : 'Active'}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="min-h-11 cursor-pointer rounded-lg px-3">
                <Link to="/notes">
                  <NotebookPen aria-hidden />
                  Notes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="min-h-11 cursor-pointer rounded-lg px-3">
                <Link to="/settings">
                  <Settings aria-hidden />
                  Settings
                </Link>
              </DropdownMenuItem>
              {canAccessLiveCams ? (
                <DropdownMenuItem asChild className="min-h-11 cursor-pointer rounded-lg px-3">
                  <a href="https://kittycams.bosh.me/" target="_blank" rel="noreferrer">
                    <Video aria-hidden />
                    Live cams
                    <span className="ml-auto text-xs" aria-hidden>
                      ↗
                    </span>
                  </a>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="min-h-11 cursor-pointer rounded-lg px-3">
                <Link to="/community">
                  {communityNavItem.icon(false)}
                  Community
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
