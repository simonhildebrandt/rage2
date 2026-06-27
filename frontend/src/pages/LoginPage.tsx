import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export default function LoginPage() {
  const [params] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()
  const isAuthError = params.get('error') === 'auth'
  const hasToken = !!params.get('lwl-token')

  useEffect(() => {
    const token = params.get('lwl-token')
    if (token) {
      login(token)
      navigate('/admin', { replace: true })
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#08080c', fontFamily: "'IBM Plex Mono',monospace",
    }}>
      <div style={{ textAlign: 'center' }}>
        {isAuthError ? (
          <>
            <div style={{ fontSize: 14, color: 'oklch(0.68 0.16 25)', marginBottom: 10, letterSpacing: '.06em' }}>
              AUTHENTICATION FAILED
            </div>
            <div style={{ fontSize: 13, color: '#6b727f' }}>
              Your session has expired or is invalid. Use the login link to sign in again.
            </div>
          </>
        ) : hasToken ? (
          <div style={{ fontSize: 14, color: '#6b727f', letterSpacing: '.06em' }}>SIGNING IN…</div>
        ) : null}
      </div>
    </div>
  )
}
