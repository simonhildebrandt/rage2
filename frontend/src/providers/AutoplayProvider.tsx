import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

const KEY = 'rage2:autoplay'

type AutoplayCtx = [boolean, (v: boolean) => void]
const AutoplayContext = createContext<AutoplayCtx>([true, () => {}])

export function AutoplayProvider({ children }: { children: ReactNode }) {
  const [autoplay, setAutoplayState] = useState<boolean>(() => {
    const stored = localStorage.getItem(KEY)
    return stored === null ? true : stored === 'true'
  })

  function setAutoplay(v: boolean) {
    localStorage.setItem(KEY, String(v))
    setAutoplayState(v)
  }

  return (
    <AutoplayContext.Provider value={[autoplay, setAutoplay]}>
      {children}
    </AutoplayContext.Provider>
  )
}

export const useAutoplay = () => useContext(AutoplayContext)
