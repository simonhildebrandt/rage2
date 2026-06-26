import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ProtectedRoute from './components/ProtectedRoute'

const HomePage     = lazy(() => import('./pages/HomePage'))
const PlaylistPage = lazy(() => import('./pages/PlaylistPage'))
const AdminPage    = lazy(() => import('./pages/AdminPage'))
const LoginPage    = lazy(() => import('./pages/LoginPage'))

export const router = createBrowserRouter([
  { path: '/',             element: <Suspense fallback={null}><HomePage /></Suspense> },
  { path: '/playlist/:id', element: <Suspense fallback={null}><PlaylistPage /></Suspense> },
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
