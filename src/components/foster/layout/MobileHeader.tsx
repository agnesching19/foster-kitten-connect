import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import { Layers, MoreHorizontal, NotebookPen, Settings, Video } from 'lucide-react'
import { littersQueryOptions, pickCurrentLitter } from '@/lib/foster-queries'
import { useLiveCamAccess } from '@/hooks/useLiveCamAccess'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AuthStatus } from './AuthStatus'
import { batchRouteForPathname } from './navItems'

export function MobileHeader() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { canAccess: canAccessLiveCams } = useLiveCamAccess()
  const { data: litters = [] } = useQuery(littersQueryOptions)
  const current = pickCurrentLitter(litters)
  const kittens = current?.kittens ?? []

  return (
    <div className="border-b border-border bg-brand-50/90 px-4 py-3 backdrop-blur-md pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Kitty Tracker
          </p>
          <p className="text-sm font-medium text-ink">
            {current
              ? `${litters.length} batches · ${current.mother_name} + ${kittens.length} active`
              : `${litters.length} batches`}
          </p>
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
            <DropdownMenuContent align="end" className="w-48 p-2">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="min-h-11 cursor-pointer rounded-lg px-3">
                  <Layers aria-hidden />
                  View batch
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-60 p-2">
                  {litters.map((litter) => (
                    <DropdownMenuItem
                      key={litter.id}
                      asChild
                      className="min-h-11 cursor-pointer rounded-lg px-3"
                    >
                      <Link to={batchRouteForPathname(pathname)} params={{ litterId: litter.id }}>
                        <span className="min-w-0 flex-1 truncate">
                          {litter.litter_name || litter.mother_name}
                        </span>
                        <span className="text-xs text-muted">
                          {litter.status === 'completed' ? 'Completed' : 'Active'}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem asChild className="min-h-11 cursor-pointer rounded-lg px-3">
                <Link to="/notes">
                  <NotebookPen aria-hidden />
                  Notes
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
              <DropdownMenuItem asChild className="min-h-11 cursor-pointer rounded-lg px-3">
                <Link to="/settings">
                  <Settings aria-hidden />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
