import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/litters/$litterId')({
  component: Outlet,
})
