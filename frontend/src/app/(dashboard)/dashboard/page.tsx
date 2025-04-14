"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Mic, 
  Upload, 
  Clock, 
  BarChart,
  Activity,
  Plus,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()
  
  // Add client-side only rendering state
  const [isClient, setIsClient] = useState(false)
  
  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Quick action items
  const quickActions = [
    {
      title: 'New Report',
      description: 'Start a new report from scratch',
      icon: <FileText className="h-5 w-5" />,
      href: '/dashboard/reports/new',
      color: 'bg-blue-500'
    },
    {
      title: 'Record Audio',
      description: 'Start a new audio recording',
      icon: <Mic className="h-5 w-5" />,
      href: '/dashboard/recordings/new',
      color: 'bg-green-500'
    },
    {
      title: 'Upload Files',
      description: 'Upload documents or audio files',
      icon: <Upload className="h-5 w-5" />,
      href: '/dashboard/uploads',
      color: 'bg-purple-500'
    }
  ]

  // Mock data for recent sessions
  const recentSessions = [
    {
      id: '1',
      title: 'Client Intake Report',
      type: 'report',
      lastUpdated: new Date(2025, 3, 12),
      progress: 75
    },
    {
      id: '2',
      title: 'Weekly Assessment Recording',
      type: 'recording',
      lastUpdated: new Date(2025, 3, 10),
      progress: 100
    },
    {
      id: '3',
      title: 'Treatment Plan Documentation',
      type: 'report',
      lastUpdated: new Date(2025, 3, 5),
      progress: 45
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {isClient ? (user?.first_name || 'User') : 'User'}
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your activity and quick actions to get started.
        </p>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-md ${action.color} text-white`}>
                    {action.icon}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild variant="ghost" className="w-full justify-between">
                  <Link href={action.href}>
                    Get Started <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats overview */}
      <section className="my-8">
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">12</div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recordings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">8</div>
                <Mic className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Processing Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">3.2 hrs</div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent sessions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Sessions</h2>
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" /> View All
          </Button>
        </div>
        <div className="space-y-4">
          {recentSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-md ${
                      session.type === 'report' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 
                      'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {session.type === 'report' ? 
                        <FileText className="h-5 w-5" /> : 
                        <Mic className="h-5 w-5" />
                      }
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {isClient ? session.lastUpdated.toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-4 text-sm">
                      {session.progress === 100 ? (
                        <span className="text-green-600 dark:text-green-400">Completed</span>
                      ) : (
                        <span>{session.progress}% complete</span>
                      )}
                    </div>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add new session button */}
          <Card className="hover:shadow-sm transition-shadow border-dashed">
            <CardContent className="p-4">
              <Button variant="ghost" className="w-full justify-center py-8" asChild>
                <Link href="/dashboard/reports/new">
                  <Plus className="h-5 w-5 mr-2" /> Start a new session
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
