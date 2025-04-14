"use client"

import React from 'react'
import { useSession } from '@/contexts/session/session-context'
import { SessionManager } from '@/components/session/session-manager'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Session, FileText, Mic, Upload, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default function SessionsPage() {
  const { sessions } = useSession()
  
  // Count sessions by type
  const reportSessions = sessions.filter(s => s.type === 'report').length
  const recordingSessions = sessions.filter(s => s.type === 'recording').length
  const uploadSessions = sessions.filter(s => s.type === 'upload').length
  
  // Count sessions by status
  const toStartSessions = sessions.filter(s => s.status === 'to-start').length
  const inProgressSessions = sessions.filter(s => s.status === 'in-progress').length
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
        <p className="text-muted-foreground">
          Manage your reports, recordings, and uploads
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Session className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">
              All your sessions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reports
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportSessions}</div>
            <p className="text-xs text-muted-foreground">
              AI-generated report sessions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recordings
            </CardTitle>
            <Mic className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recordingSessions}</div>
            <p className="text-xs text-muted-foreground">
              Audio recording sessions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Uploads
            </CardTitle>
            <Upload className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uploadSessions}</div>
            <p className="text-xs text-muted-foreground">
              Document upload sessions
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              To Start
            </CardTitle>
            <div className="rounded-full bg-yellow-100 p-1 dark:bg-yellow-900/20">
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toStartSessions}</div>
            <div className="mt-2 flex items-center">
              <p className="text-xs text-muted-foreground">
                Sessions you haven't started yet
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              In Progress
            </CardTitle>
            <div className="rounded-full bg-blue-100 p-1 dark:bg-blue-900/20">
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressSessions}</div>
            <div className="mt-2 flex items-center">
              <p className="text-xs text-muted-foreground">
                Sessions you're currently working on
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed
            </CardTitle>
            <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSessions}</div>
            <div className="mt-2 flex items-center">
              <p className="text-xs text-muted-foreground">
                Sessions you've completed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <SessionManager />
      </div>
    </div>
  )
}
