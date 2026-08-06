# Kitty Tracker

A mobile-first, responsive web app for tracking foster cats across batches—including feedings, poops, weights, and litter changes.

**Production:** [kitty-tracker.lovable.app](https://kitty-tracker.lovable.app)

## Features

- Organise foster cats and kittens into active or completed litters
- Record feeding, weight, poop, and litter-change history
- Track kitten details and progress over time
- Import records from CSV, Google Sheets, and legacy backups
- Export data and create complete backups
- Sign in securely and sync records with Supabase

## Tech stack

- React 19 and TypeScript
- TanStack Start, Router, and Query
- Tailwind CSS
- Supabase for authentication and data storage
- Vite

## Getting started

Install the dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Environment variables

Create a local `.env.local` file with your Supabase project credentials:

```sh
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_URL=your-project-url
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-side and never expose it in client code or commit it to Git.

## Project structure

```text
src/
  components/
    foster/          # App pages, layouts, dialogs, and feature UI
    ui/              # Reusable UI primitives
  hooks/             # Authentication and responsive hooks
  integrations/
    supabase/        # Supabase clients, middleware, and generated types
  lib/               # Queries, data transfer, and shared utilities
  routes/            # TanStack file-based routes
  types/             # Shared TypeScript types
  styles.css         # Global styles and design tokens
supabase/
  migrations/        # Database schema migrations
```

## Available commands

```sh
npm run dev          # Start the local development server
npm run build        # Create a production build
npm run preview      # Preview the production build locally
npm run lint         # Run ESLint
```

## Deployment

Database changes live in `supabase/migrations` and should be applied to the linked Supabase project. The web app can be deployed to any host that supports the generated TanStack Start server build.

This repository is also connected to [Lovable](https://lovable.dev/projects/c70c2c34-7636-41cc-989d-f69a2f5e2519); changes pushed to `main` sync to the project there.
