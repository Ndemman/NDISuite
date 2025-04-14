"use client"

import React from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth/auth-context'
import { SessionProvider } from '@/contexts/session/session-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <SessionProvider>
          {children}
        </SessionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
