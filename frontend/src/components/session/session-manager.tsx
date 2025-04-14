"use client"

import React, { useState } from 'react'
import { useSession, SessionData, SessionStatus } from '@/contexts/session/session-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/utilities/utils'
import { Save, FileText, Mic, Upload, Clock, CheckCircle2, AlertCircle, Trash, Edit, Plus } from 'lucide-react'

interface SessionCardProps {
  session: SessionData
  onSelect: (session: SessionData) => void
  onDelete: (id: string) => void
  onEdit: (session: SessionData) => void
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onSelect, onDelete, onEdit }) => {
  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'to-start':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'report':
        return <FileText className="h-5 w-5" />
      case 'recording':
        return <Mic className="h-5 w-5" />
      case 'upload':
        return <Upload className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case 'to-start':
        return <Clock className="h-4 w-4 mr-1" />
      case 'in-progress':
        return <AlertCircle className="h-4 w-4 mr-1" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-md ${
            session.type === 'report' 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              : session.type === 'recording'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
          }`}>
            {getTypeIcon(session.type)}
          </div>
          <Badge className={getStatusColor(session.status)}>
            <span className="flex items-center">
              {getStatusIcon(session.status)}
              {session.status === 'to-start' ? 'To Start' : 
               session.status === 'in-progress' ? 'In Progress' : 'Completed'}
            </span>
          </Badge>
        </div>
        <CardTitle className="text-lg">{session.name}</CardTitle>
        <CardDescription>
          Last updated: {formatDate(new Date(session.updatedAt))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {session.description || 'No description provided.'}
        </p>
        <div className="mt-2 text-xs text-muted-foreground">
          Files: {session.files.length}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit(session)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-destructive hover:text-destructive/90"
            onClick={() => onDelete(session.id)}
          >
            <Trash className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onSelect(session)}
        >
          Open
        </Button>
      </CardFooter>
    </Card>
  )
}

// Dialog for creating/editing a session
interface SessionFormDialogProps {
  session?: SessionData
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<SessionData>) => void
}

const SessionFormDialog: React.FC<SessionFormDialogProps> = ({ 
  session, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: session?.name || '',
    description: session?.description || '',
    type: session?.type || 'report',
    status: session?.status || 'to-start'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{session ? 'Edit Session' : 'Create New Session'}</DialogTitle>
            <DialogDescription>
              {session 
                ? 'Update your session details.' 
                : 'Fill in the details to create a new session.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Session Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="My Awesome Report"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of this session..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="report">Report</option>
                  <option value="recording">Recording</option>
                  <option value="upload">Upload</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="to-start">To Start</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {session ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Main session manager component
export function SessionManager() {
  const { sessions, createSession, updateSession, deleteSession, setCurrentSession, updateSessionStatus } = useSession()
  const { toast } = useToast()
  
  const [isNewSessionDialogOpen, setIsNewSessionDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<SessionData | null>(null)
  
  // Handle creating a new session
  const handleCreateSession = (data: Partial<SessionData>) => {
    createSession(data)
      .then(() => {
        setIsNewSessionDialogOpen(false)
      })
      .catch(error => {
        console.error('Failed to create session', error)
      })
  }
  
  // Handle editing a session
  const handleEditSession = (data: Partial<SessionData>) => {
    if (!editingSession) return
    
    updateSession(editingSession.id, data)
      .then(() => {
        setEditingSession(null)
      })
      .catch(error => {
        console.error('Failed to update session', error)
      })
  }
  
  // Handle deleting a session
  const handleDeleteSession = (id: string) => {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      deleteSession(id)
        .catch(error => {
          console.error('Failed to delete session', error)
        })
    }
  }
  
  // Handle selecting a session
  const handleSelectSession = (session: SessionData) => {
    setCurrentSession(session)
    
    // In a real app, this would navigate to the appropriate view
    // based on session type and status
    toast({
      title: 'Session opened',
      description: `"${session.name}" has been opened.`
    })
  }
  
  // Filter sessions by status
  const toStartSessions = sessions.filter(s => s.status === 'to-start')
  const inProgressSessions = sessions.filter(s => s.status === 'in-progress')
  const completedSessions = sessions.filter(s => s.status === 'completed')
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sessions</h2>
        <Button onClick={() => setIsNewSessionDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>
      
      <Tabs defaultValue="in-progress" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="to-start" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            To Start
            {toStartSessions.length > 0 && (
              <Badge className="ml-2" variant="secondary">{toStartSessions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            In Progress
            {inProgressSessions.length > 0 && (
              <Badge className="ml-2" variant="secondary">{inProgressSessions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Completed
            {completedSessions.length > 0 && (
              <Badge className="ml-2" variant="secondary">{completedSessions.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="to-start">
          {toStartSessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No sessions to start</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create a new session to get started
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsNewSessionDialogOpen(true)}
                >
                  Create New Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {toStartSessions.map(session => (
                <SessionCard 
                  key={session.id}
                  session={session}
                  onSelect={handleSelectSession}
                  onDelete={handleDeleteSession}
                  onEdit={setEditingSession}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="in-progress">
          {inProgressSessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <AlertCircle className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No sessions in progress</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  All your active sessions will appear here
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsNewSessionDialogOpen(true)}
                >
                  Create New Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressSessions.map(session => (
                <SessionCard 
                  key={session.id}
                  session={session}
                  onSelect={handleSelectSession}
                  onDelete={handleDeleteSession}
                  onEdit={setEditingSession}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {completedSessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No completed sessions</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Completed sessions will appear here
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsNewSessionDialogOpen(true)}
                >
                  Create New Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedSessions.map(session => (
                <SessionCard 
                  key={session.id}
                  session={session}
                  onSelect={handleSelectSession}
                  onDelete={handleDeleteSession}
                  onEdit={setEditingSession}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* New Session Dialog */}
      {isNewSessionDialogOpen && (
        <SessionFormDialog 
          isOpen={isNewSessionDialogOpen}
          onClose={() => setIsNewSessionDialogOpen(false)}
          onSave={handleCreateSession}
        />
      )}
      
      {/* Edit Session Dialog */}
      {editingSession && (
        <SessionFormDialog 
          session={editingSession}
          isOpen={!!editingSession}
          onClose={() => setEditingSession(null)}
          onSave={handleEditSession}
        />
      )}
    </div>
  )
}
