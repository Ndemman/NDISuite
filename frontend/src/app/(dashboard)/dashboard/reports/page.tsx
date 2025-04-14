"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Plus, Search, Filter, ArrowUpDown, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSession, SessionData, SessionType, SessionStatus } from '@/contexts/session/session-context'
import { useToast } from '@/components/ui/use-toast'

// Define report interface that extends SessionData with additional fields
interface Report extends Partial<SessionData> {
  id: string;
  name: string;
  type: SessionType;
  createdAt: Date;
  updatedAt: Date;
  status: SessionStatus;
  progress?: number;
  reportType?: string;
}

export default function ReportsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { sessions, loadSessions, createSession } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [activeTab, setActiveTab] = useState('all')
  
  // Load reports on component mount
  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true)
      try {
        // Load sessions if they haven't been loaded yet
        await loadSessions()
        
        // Filter only report type sessions
        const reportSessions = sessions
          .filter((session: SessionData) => session.type === 'report')
          .map((session: SessionData) => ({
            id: session.id,
            name: session.name,
            type: session.type,
            reportType: session.reportType || 'general',
            createdAt: new Date(session.createdAt || Date.now()),
            updatedAt: new Date(session.updatedAt || Date.now()),
            status: session.status,
            progress: session.progress || 0
          } as Report))
        
        // If no sessions exist, create mock data for demonstration
        const mockReports: Report[] = reportSessions.length > 0 ? reportSessions : [
          {
            id: '1',
            name: 'NDIS Progress Report - Q1 2025',
            type: 'report' as SessionType,
            reportType: 'ndis',
            createdAt: new Date(2025, 2, 15),
            updatedAt: new Date(2025, 3, 10),
            status: 'completed' as SessionStatus,
            progress: 100
          },
          {
            id: '2',
            name: 'Behavioral Assessment - Client #4582',
            type: 'report' as SessionType,
            reportType: 'behavioral',
            createdAt: new Date(2025, 3, 5),
            updatedAt: new Date(2025, 3, 12),
            status: 'in-progress' as SessionStatus,
            progress: 75
          },
          {
            id: '3',
            name: 'Treatment Plan - Therapy Sessions',
            type: 'report' as SessionType,
            reportType: 'treatment',
            createdAt: new Date(2025, 3, 8),
            updatedAt: new Date(2025, 3, 8),
            status: 'to-start' as SessionStatus,
            progress: 30
          },
          {
            id: '4',
            name: 'Clinical Notes - Weekly Summary',
            type: 'report' as SessionType,
            reportType: 'clinical',
            createdAt: new Date(2025, 3, 11),
            updatedAt: new Date(2025, 3, 11),
            status: 'to-start' as SessionStatus,
            progress: 10
          }
        ]
        
        setReports(mockReports)
        setFilteredReports(mockReports)
      } catch (error) {
        console.error('Error loading reports:', error)
        toast({
          title: 'Error',
          description: 'Failed to load reports. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadReports()
  }, [loadSessions, sessions, toast])
  
  // Filter reports based on search query and active tab
  useEffect(() => {
    let filtered = [...reports]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(report => 
        report.name.toLowerCase().includes(query) || 
        (report.reportType && report.reportType.toLowerCase().includes(query))
      )
    }
    
    // Apply tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(report => report.status === activeTab as SessionStatus)
    }
    
    setFilteredReports(filtered)
  }, [searchQuery, activeTab, reports])
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }
  
  // Get status badge style based on report status
  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'to-start':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button onClick={() => router.push('/dashboard/reports/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Reports list */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading reports...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No reports found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No reports match your search "${searchQuery}"`
                : "You haven't created any reports yet"}
            </p>
            <Button onClick={() => router.push('/dashboard/reports/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b">
                  <div className="flex items-center">
                    <div className="mr-4">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{report.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <span className="capitalize mr-2">{report.reportType}</span>
                        <span>•</span>
                        <span className="mx-2">Created {formatDate(report.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center mt-4 sm:mt-0">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(report.status)} mr-4`}>
                      {report.status === 'in-progress' ? 'In Progress' : 
                       report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/report-generator/${report.id}`)}
                    >
                      {report.status === 'completed' ? 'View' : 'Edit'}
                    </Button>
                  </div>
                </div>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Last updated: {formatDate(report.updatedAt)}</span>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center">
                    <div className="w-full sm:w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${report.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs whitespace-nowrap">
                      {report.progress}% complete
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
