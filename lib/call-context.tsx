"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface CallData {
  callerId: string
  callerName: string
  callerImage: string
  roomUrl: string
}

interface CallContextType {
  pendingCall: CallData | null
  setPendingCall: (call: CallData | null) => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [pendingCall, setPendingCall] = useState<CallData | null>(null)

  return (
    <CallContext.Provider
      value={{
        pendingCall,
        setPendingCall,
      }}
    >
      {children}
    </CallContext.Provider>
  )
}

export function useCall() {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error("useCall must be used within CallProvider")
  }
  return context
}
