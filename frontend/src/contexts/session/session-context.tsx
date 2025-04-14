"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/auth/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { sessionService, fileService, SessionItem, CreateSessionData, UpdateSessionData } from '@/services/api'

// Development mode flag
const isDevelopment = process.env.NODE_ENV === 'development' || true

// Session types
export type SessionStatus = 'to-start' | 'in-progress' | 'completed'
export type SessionType = 'report' | 'recording' | 'upload'

export interface SessionFile {
  id: string
  name: string
  type: string
  size: number
  url?: string
  transcription?: string
}

export interface SessionData {
  id: string
  name: string
  description?: string
  type: SessionType
  status: SessionStatus
  createdAt: Date
  updatedAt: Date
  userId: string
  files: SessionFile[]
  reportType?: string
  progress?: number
  audioUrl?: string
  transcript?: string
  duration?: number
  recordingId?: string
  settings?: {
    language?: 'en' | 'ar'
    outputFormat?: string
    fields?: string[]
  }
  content?: {
    rawContent?: string
    processedContent?: string
    highlights?: {
      id: string
      text: string
      startIndex: number
      endIndex: number
      note?: string
    }[]
  }
}

interface SessionContextType {
  sessions: SessionData[]
  currentSession: SessionData | null
  isLoading: boolean
  loadSessions: () => Promise<void>
  createSession: (data: Partial<SessionData>) => Promise<SessionData>
  updateSession: (id: string, data: Partial<SessionData>) => Promise<SessionData>
  deleteSession: (id: string) => Promise<void>
  setCurrentSession: (session: SessionData | null) => void
  addFileToSession: (sessionId: string, file: Omit<SessionFile, 'id'>) => Promise<void>
  removeFileFromSession: (sessionId: string, fileId: string) => Promise<void>
  updateSessionStatus: (sessionId: string, status: SessionStatus) => Promise<void>
  filterSessionsByStatus: (status: SessionStatus) => SessionData[]
  sortSessionsByDate: (ascending?: boolean) => SessionData[]
  saveSessionToStorage: () => Promise<void>
}

// Default context value
const defaultSessionContext: SessionContextType = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  loadSessions: async () => {},
  createSession: async () => ({} as SessionData),
  updateSession: async () => ({} as SessionData),
  deleteSession: async () => {},
  setCurrentSession: () => {},
  addFileToSession: async () => {},
  removeFileFromSession: async () => {},
  updateSessionStatus: async () => {},
  filterSessionsByStatus: () => [],
  sortSessionsByDate: () => [],
  saveSessionToStorage: async () => {}
}

// Create context
const SessionContext = createContext<SessionContextType>(defaultSessionContext)

// Session provider component
export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load sessions from local storage on mount or when user changes
  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  // Load sessions from storage or API if online
  const loadSessions = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Try to load from API first if we have a token
      if (user && user.id && !isDevelopment) {
        try {
          const token = localStorage.getItem('access_token')
          if (token) {
            // Fetch sessions from API
            const response = await sessionService.listSessions(token)
            
            // Convert API sessions to our SessionData format
            const apiSessions = response.results.map((apiSession: any) => ({
              id: apiSession.id,
              name: apiSession.name,
              description: apiSession.description || '',
              type: apiSession.type,
              status: apiSession.status,
              createdAt: new Date(apiSession.created_at),
              updatedAt: new Date(apiSession.updated_at),
              userId: apiSession.user_id,
              files: apiSession.files.map(file => ({
                id: file.id,
                name: file.name,
                type: file.file_type,
                size: file.size,
                url: file.url
              })),
              settings: apiSession.settings || {
                language: 'en',
                outputFormat: '',
                fields: []
              },
              content: apiSession.content || {
                rawContent: '',
                processedContent: '',
                highlights: []
              }
            }))
            
            setSessions(apiSessions)
            return
          }
        } catch (apiError) {
          if (!isDevelopment) {
            console.error('Failed to load sessions from API, falling back to local storage', apiError)
          }
          // Continue to try local storage as fallback
        }
      }
      
      // Fallback to localStorage if API fails or no token
      const storedSessions = localStorage.getItem(`ndisuite-sessions-${user.id}`)
      
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions) as SessionData[]
        
        // Convert string dates back to Date objects
        const sessionsWithDates = parsedSessions.map(session => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        }))
        
        setSessions(sessionsWithDates)
      } else {
        setSessions([])
      }
    } catch (error) {
      console.error('Failed to load sessions', error)
      toast({
        variant: 'destructive',
        title: 'Failed to load sessions',
        description: 'An error occurred while loading your sessions.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Save sessions to storage and sync with API if possible
  const saveSessionToStorage = async () => {
    if (!user) return
    
    try {
      // Save to localStorage first as reliable storage
      localStorage.setItem(`ndisuite-sessions-${user.id}`, JSON.stringify(sessions))
      
      // Try to sync with API if we have a token
      const token = localStorage.getItem('access_token')
      if (token && user.id && !isDevelopment) {
        try {
          // For each modified session, sync with API
          const sessionsToSync = sessions.filter((s: SessionData) => s.id.startsWith('local-'))
          
          for (const session of sessionsToSync) {
            // Convert our session format to API format for creation
            const sessionData: CreateSessionData = {
              name: session.name,
              description: session.description,
              type: session.type,
              status: session.status,
              files: session.files.map(f => f.id),
              settings: {
                language: session.settings?.language,
                output_format: session.settings?.outputFormat,
                fields: session.settings?.fields?.map((f: string | { name: string }) => typeof f === 'string' ? f : f.name)
              },
              content: {
                raw_content: session.content?.rawContent,
                processed_content: session.content?.processedContent
              }
            }
            
            // Create the session on the API
            const createdSession = await sessionService.createSession(sessionData, token)
            
            // Update our local session with the API ID
            const updatedSessions = sessions.map((s: SessionData) => 
              s.id === session.id ? {
                ...s,
                id: createdSession.id // Replace local ID with API ID
              } : s
            )
            
            setSessions(updatedSessions)
            
            // Update localStorage with the new IDs
            localStorage.setItem(`ndisuite-sessions-${user.id}`, JSON.stringify(updatedSessions))
          }
        } catch (apiError) {
          if (!isDevelopment) {
            console.error('Failed to sync sessions with API', apiError)
          }
          // Continue with local storage only
        }
      }
    } catch (error) {
      console.error('Failed to save sessions', error)
      toast({
        variant: 'destructive',
        title: 'Failed to save sessions',
        description: 'An error occurred while saving your sessions.'
      })
    }
  }

  // Create a new session - tries API first, falls back to local storage
  const createSession = async (data: Partial<SessionData>): Promise<SessionData> => {
    console.log('createSession called with data:', JSON.stringify(data, null, 2))
    if (!user) {
      console.error('No user found when creating session')
      throw new Error('User not authenticated')
    }

    setIsLoading(true)
    try {
      console.log('Creating new session with user:', user.id)
      // Create the session object
      const newSession: SessionData = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: data.name || `New Session ${sessions.length + 1}`,
        type: data.type || 'report',
        status: data.status || 'to-start',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
        files: data.files || [],
        description: data.description || '',
        reportType: data.reportType,
        recordingId: data.recordingId,
        transcript: data.transcript,
        audioUrl: data.audioUrl,
        duration: data.duration,
        settings: data.settings || {
          language: 'en',
          outputFormat: '',
          fields: []
        },
        content: data.content || {
          rawContent: '',
          processedContent: '',
          highlights: []
        }
      }

      // Try to create on API if we have a token
      const token = localStorage.getItem('access_token')
      if (token && !isDevelopment) {
        try {
          // Convert our session format to API format
          const sessionData: CreateSessionData = {
            name: newSession.name,
            description: newSession.description,
            type: newSession.type,
            status: newSession.status,
            files: newSession.files.map(f => f.id),
            report_type: newSession.reportType,
            recording_id: newSession.recordingId,
            transcript: newSession.transcript,
            audio_url: newSession.audioUrl,
            duration: newSession.duration,
            settings: {
              language: newSession.settings?.language,
              output_format: newSession.settings?.outputFormat,
              fields: newSession.settings?.fields?.map((f: string | { name: string }) => typeof f === 'string' ? f : f.name)
            },
            content: {
              raw_content: newSession.content?.rawContent,
              processed_content: newSession.content?.processedContent
            }
          }
          
          // Create the session on the API
          const apiSession = await sessionService.createSession(sessionData, token)
          
          // Use the API session ID instead of our local one
          newSession.id = apiSession.id
        } catch (apiError) {
          if (!isDevelopment) {
            console.error('Failed to create session on API, using local storage only', apiError)
          }
          // Continue with local ID only
        }
      }

      // Add to our sessions state
      const updatedSessions = [...sessions, newSession]
      setSessions(updatedSessions)
      setCurrentSession(newSession)
      
      // Save to storage
      await saveSessionToStorage()
      
      toast({
        title: 'Session created',
        description: `"${newSession.name}" has been created.`
      })
      
      return newSession
    } catch (error) {
      console.error('Failed to create session', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast({
        variant: 'destructive',
        title: 'Failed to create session',
        description: 'An error occurred while creating your session.'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Update an existing session - tries API first if it's an API session
  const updateSession = async (id: string, data: Partial<SessionData>): Promise<SessionData> => {
    setIsLoading(true)
    try {
      const sessionIndex = sessions.findIndex(s => s.id === id)
      
      if (sessionIndex === -1) {
        throw new Error('Session not found')
      }
      
      const existingSession = sessions[sessionIndex]
      const updatedSession = {
        ...existingSession,
        ...data,
        updatedAt: new Date()
      }
      
      // If this is an API session (ID doesn't start with 'local-'), try to update on API
      const token = localStorage.getItem('access_token')
      if (token && !id.startsWith('local-') && !isDevelopment) {
        try {
          // Convert our session format to API format for update
          const updateData: UpdateSessionData = {}
          
          // Only include fields that have been changed
          if (data.name) updateData.name = data.name
          if (data.description !== undefined) updateData.description = data.description
          if (data.status) updateData.status = data.status
          if (data.files) updateData.files = data.files.map((f: FileData) => f.id)
          
          if (data.settings) {
            updateData.settings = {
              language: data.settings.language,
              output_format: data.settings.outputFormat,
              fields: data.settings.fields?.map((f: string | { name: string }) => typeof f === 'string' ? f : f.name)
            }
          }
          
          if (data.content) {
            updateData.content = {
              raw_content: data.content.rawContent,
              processed_content: data.content.processedContent,
              highlights: data.content.highlights?.map((h: HighlightData) => ({
                id: h.id,
                text: h.text,
                start_index: h.startIndex,
                end_index: h.endIndex,
                note: h.note
              }))
            }
          }
          
          // Update the session on the API
          await sessionService.updateSession(id, updateData, token)
        } catch (apiError) {
          if (!isDevelopment) {
            console.error('Failed to update session on API, using local storage only', apiError)
          }
          // Continue with local update only
        }
      }
      
      // Update in local state regardless of API result
      const updatedSessions = [...sessions]
      updatedSessions[sessionIndex] = updatedSession
      
      setSessions(updatedSessions)
      
      // Update current session if it's being edited
      if (currentSession?.id === id) {
        setCurrentSession(updatedSession)
      }
      
      // Save to storage
      await saveSessionToStorage()
      
      toast({
        title: 'Session updated',
        description: `"${updatedSession.name}" has been updated.`
      })
      
      return updatedSession
    } catch (error) {
      if (!isDevelopment) {
        console.error('Failed to update session', error)
      }
      toast({
        variant: 'destructive',
        title: 'Failed to update session',
        description: 'An error occurred while updating your session.'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Delete a session - tries API first if it's an API session
  const deleteSession = async (id: string): Promise<void> => {
    setIsLoading(true)
    try {
      const sessionToDelete = sessions.find(s => s.id === id)
      
      if (!sessionToDelete) {
        throw new Error('Session not found')
      }
      
      // If this is an API session (ID doesn't start with 'local-'), try to delete on API
      const token = localStorage.getItem('access_token')
      if (token && !id.startsWith('local-')) {
        try {
          // Delete the session on the API
          await sessionService.deleteSession(id, token)
        } catch (apiError) {
          console.error('Failed to delete session on API, using local storage only', apiError)
          // Continue with local delete only
        }
      }
      
      // Remove from local state
      const updatedSessions = sessions.filter(s => s.id !== id)
      setSessions(updatedSessions)
      
      // Clear current session if it's being deleted
      if (currentSession?.id === id) {
        setCurrentSession(null)
      }
      
      // Save to storage
      await saveSessionToStorage()
      
      toast({
        title: 'Session deleted',
        description: `"${sessionToDelete.name}" has been deleted.`
      })
    } catch (error) {
      console.error('Failed to delete session', error)
      toast({
        variant: 'destructive',
        title: 'Failed to delete session',
        description: 'An error occurred while deleting your session.'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Add a file to a session
  const addFileToSession = async (sessionId: string, file: Omit<SessionFile, 'id'>): Promise<void> => {
    try {
      const sessionIndex = sessions.findIndex(s => s.id === sessionId)
      
      if (sessionIndex === -1) {
        throw new Error('Session not found')
      }
      
      const newFile: SessionFile = {
        ...file,
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }
      
      const updatedSession = {
        ...sessions[sessionIndex],
        files: [...sessions[sessionIndex].files, newFile],
        updatedAt: new Date()
      }
      
      const updatedSessions = [...sessions]
      updatedSessions[sessionIndex] = updatedSession
      
      setSessions(updatedSessions)
      
      // Update current session if it's being edited
      if (currentSession?.id === sessionId) {
        setCurrentSession(updatedSession)
      }
      
      // Save to storage
      await saveSessionToStorage()
      
      toast({
        title: 'File added',
        description: `"${file.name}" has been added to your session.`
      })
    } catch (error) {
      console.error('Failed to add file to session', error)
      toast({
        variant: 'destructive',
        title: 'Failed to add file',
        description: 'An error occurred while adding the file to your session.'
      })
      throw error
    }
  }

  // Remove a file from a session
  const removeFileFromSession = async (sessionId: string, fileId: string): Promise<void> => {
    try {
      const sessionIndex = sessions.findIndex(s => s.id === sessionId)
      
      if (sessionIndex === -1) {
        throw new Error('Session not found')
      }
      
      const fileToRemove = sessions[sessionIndex].files.find(f => f.id === fileId)
      
      if (!fileToRemove) {
        throw new Error('File not found')
      }
      
      const updatedSession = {
        ...sessions[sessionIndex],
        files: sessions[sessionIndex].files.filter(f => f.id !== fileId),
        updatedAt: new Date()
      }
      
      const updatedSessions = [...sessions]
      updatedSessions[sessionIndex] = updatedSession
      
      setSessions(updatedSessions)
      
      // Update current session if it's being edited
      if (currentSession?.id === sessionId) {
        setCurrentSession(updatedSession)
      }
      
      // Save to storage
      await saveSessionToStorage()
      
      toast({
        title: 'File removed',
        description: `"${fileToRemove.name}" has been removed from your session.`
      })
    } catch (error) {
      console.error('Failed to remove file from session', error)
      toast({
        variant: 'destructive',
        title: 'Failed to remove file',
        description: 'An error occurred while removing the file from your session.'
      })
      throw error
    }
  }

  // Update session status
  const updateSessionStatus = async (sessionId: string, status: SessionStatus): Promise<void> => {
    try {
      const sessionIndex = sessions.findIndex(s => s.id === sessionId)
      
      if (sessionIndex === -1) {
        throw new Error('Session not found')
      }
      
      const updatedSession = {
        ...sessions[sessionIndex],
        status,
        updatedAt: new Date()
      }
      
      const updatedSessions = [...sessions]
      updatedSessions[sessionIndex] = updatedSession
      
      setSessions(updatedSessions)
      
      // Update current session if it's being edited
      if (currentSession?.id === sessionId) {
        setCurrentSession(updatedSession)
      }
      
      // Save to storage
      await saveSessionToStorage()
      
      toast({
        title: 'Status updated',
        description: `Session status has been updated to "${status}".`
      })
    } catch (error) {
      console.error('Failed to update session status', error)
      toast({
        variant: 'destructive',
        title: 'Failed to update status',
        description: 'An error occurred while updating the session status.'
      })
      throw error
    }
  }

  // Filter sessions by status
  const filterSessionsByStatus = (status: SessionStatus): SessionData[] => {
    return sessions.filter(s => s.status === status)
  }

  // Sort sessions by date
  const sortSessionsByDate = (ascending = false): SessionData[] => {
    return [...sessions].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime()
      const dateB = new Date(b.updatedAt).getTime()
      return ascending ? dateA - dateB : dateB - dateA
    })
  }

  // Save sessions to storage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessionToStorage()
    }
  }, [sessions])

  const value = {
    sessions,
    currentSession,
    isLoading,
    loadSessions,
    createSession,
    updateSession,
    deleteSession,
    setCurrentSession,
    addFileToSession,
    removeFileFromSession,
    updateSessionStatus,
    filterSessionsByStatus,
    sortSessionsByDate,
    saveSessionToStorage,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// Custom hook to use session context
export const useSession = () => useContext(SessionContext)
