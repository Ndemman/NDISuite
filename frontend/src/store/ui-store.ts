import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Sidebar state
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  // Theme state
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Language state
  language: 'en' | 'ar'
  setLanguage: (language: 'en' | 'ar') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar state
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Theme state
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      
      // Language state
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'ndisuite-ui-settings',
    }
  )
)
