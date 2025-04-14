"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, ArrowLeft, Loader2, Mic, Upload, ChevronRight, FileAudio } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useSession } from '@/contexts/session/session-context'
import ReportService from '@/services/api/reportService'

export default function NewReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { createSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [reportType, setReportType] = useState('ndis')
  const [reportTitle, setReportTitle] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [recordingData, setRecordingData] = useState<{
    id: string;
    name: string;
    transcript: string;
  } | null>(null)

  // Check for recording data in URL parameters on component mount
  useEffect(() => {
    const recordingId = searchParams.get('recordingId')
    const recordingName = searchParams.get('recordingName')
    const transcript = searchParams.get('transcript')
    
    if (recordingId && recordingName) {
      // Set recording data from URL parameters
      setRecordingData({
        id: recordingId,
        name: recordingName,
        transcript: transcript || ''
      })
      
      // Pre-fill report title based on recording name
      setReportTitle(`Report based on: ${recordingName}`)
      
      // Pre-fill report description with transcript summary if available
      if (transcript) {
        const truncatedTranscript = transcript.length > 100 
          ? transcript.substring(0, 100) + '...' 
          : transcript
        setReportDescription(`This report is based on the recording "${recordingName}" with the following transcript:\n\n${truncatedTranscript}`)
      }
    }
  }, [searchParams])

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reportTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please provide a title for your report",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      // Create a new session with the report data
      const sessionData: any = {
        name: reportTitle,
        type: 'report',
        reportType: reportType,
        description: reportDescription,
        status: 'to-start'
      }
      
      // Add recording data if available
      if (recordingData) {
        console.log('Adding recording data to report:', recordingData)
        sessionData.recordingId = recordingData.id
        sessionData.transcript = recordingData.transcript
      }
      
      console.log('Creating session with data:', sessionData)
      const sessionId = await createSession(sessionData)
      
      toast({
        title: "Report Created",
        description: "Your new report has been created successfully",
      })
      
      // Redirect to the report editor
      router.push(`/dashboard/report-generator/${sessionId}`)
    } catch (error) {
      console.error("Error creating report:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      toast({
        title: "Error",
        description: "There was an error creating your report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Create New Report</h1>
      </div>
      
      {/* Input Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Record Audio Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2 text-green-500" />
              Record Audio
            </CardTitle>
            <CardDescription>
              Record audio for transcription and report generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use your microphone to record interviews, assessments, or notes that will be transcribed and used in your report.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full justify-between bg-green-500 hover:bg-green-600"
              onClick={() => router.push('/dashboard/recordings/new')}
            >
              Start Recording
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
        
        {/* Upload Files Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2 text-purple-500" />
              Upload Files
            </CardTitle>
            <CardDescription>
              Upload documents or audio files for processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload existing audio recordings, PDFs, Word documents, or text files to use as source material for your report.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full justify-between bg-purple-500 hover:bg-purple-600"
              onClick={() => router.push('/dashboard/uploads')}
            >
              Upload Files
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Or create a report manually</h2>
        <p className="text-muted-foreground">Fill in the details below to create a new report from scratch</p>
      </div>
      
      {recordingData && (
        <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-blue-600">
              <FileAudio className="h-5 w-5 mr-2" />
              Using Recording: {recordingData.name}
            </CardTitle>
            <CardDescription>
              This report will be created using data from your recording
            </CardDescription>
          </CardHeader>
          {recordingData.transcript && (
            <CardContent>
              <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  <span className="font-medium">Transcript excerpt:</span> {recordingData.transcript.substring(0, 150)}...
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            New Report Details
          </CardTitle>
          <CardDescription>
            Provide basic information about the report you want to create
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateReport}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input 
                id="title" 
                placeholder="Enter a descriptive title for your report" 
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Report Type</Label>
              <Select 
                value={reportType} 
                onValueChange={setReportType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ndis">NDIS Progress Report</SelectItem>
                  <SelectItem value="behavioral">Behavioral Assessment</SelectItem>
                  <SelectItem value="treatment">Treatment Plan</SelectItem>
                  <SelectItem value="clinical">Clinical Notes</SelectItem>
                  <SelectItem value="custom">Custom Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                placeholder="Add any additional details or notes about this report"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Report'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
