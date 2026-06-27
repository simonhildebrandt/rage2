import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import { Shell } from './components/Shell'

const HomePage     = lazy(() => import('./pages/HomePage'))
const SearchPage   = lazy(() => import('./pages/SearchPage'))
const PlaylistPage = lazy(() => import('./pages/PlaylistPage'))
const AdminPage    = lazy(() => import('./pages/AdminPage'))
const LoginPage    = lazy(() => import('./pages/LoginPage'))

function Shelled({ children }: { children: ReactNode }) {
  return <Shell><Suspense fallback={null}>{children}</Suspense></Shell>
}

export const router = createBrowserRouter([
  { path: '/',             element: <Shelled><HomePage /></Shelled> },
  { path: '/search',       element: <Shelled><SearchPage /></Shelled> },
  { path: '/playlist/:id/video/:videoId', element: <Shelled><PlaylistPage /></Shelled> },
  { path: '/playlist/:id', element: <Shelled><PlaylistPage /></Shelled> },
  { path: '/login',        element: <Suspense fallback={null}><LoginPage /></Suspense> },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <Suspense fallback={null}><AdminPage /></Suspense>
      </ProtectedRoute>
    ),
  },
])
