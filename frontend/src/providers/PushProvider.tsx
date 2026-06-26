import { createContext, useContext, type ReactNode } from 'react'
import { api } from '../api/client'

interface PushContextValue {
  subscribe: () => Promise<void>
}

const PushContext = createContext<PushContextValue | null>(null)

const VAPID_PUBLIC_KEY = import.meta.env.VAPID_PUBLIC_KEY as string

export function PushProvider({ children }: { children: ReactNode }) {
  const subscribe = async () => {
    const registration = await navigator.serviceWorker.register('/sw.js')
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    })
    await api.post('/api/push/subscribe', subscription.toJSON())
  }

  return (
    <PushContext.Provider value={{ subscribe }}>
      {children}
    </PushContext.Provider>
  )
}

export function usePush() {
  const ctx = useContext(PushContext)
  if (!ctx) throw new Error('usePush must be used within PushProvider')
  return ctx
}
