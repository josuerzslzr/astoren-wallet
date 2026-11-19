import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, createBrowserRouter, RouterProvider, type RouteObject } from 'react-router'
import { Wallet } from 'lucide-react'

/** Single placeholder route. Screens, tokens and navigation land in Story 1.7. */
function PlaceholderPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-3 p-6 text-center">
      <Wallet aria-hidden="true" className="size-10" />
      <h1 className="text-2xl font-semibold">Astoren Wallet</h1>
      <p className="text-muted-foreground">Test money — no real value</p>
    </main>
  )
}

const routes: RouteObject[] = [{ path: '/', element: <PlaceholderPage /> }]

type AppProps = {
  /** Use an in-memory router (tests) instead of the browser history. */
  initialEntries?: string[]
}

export default function App({ initialEntries }: AppProps) {
  const [router] = useState(() =>
    initialEntries ? createMemoryRouter(routes, { initialEntries }) : createBrowserRouter(routes),
  )
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
