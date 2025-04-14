"use client"

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OutputConfiguration, OutputConfigurationData } from '@/components/report-generator/output-configuration'
import { RAGGenerator, RAGResult } from '@/components/report-generator/rag-generator'
import { useSession, SessionData, SessionFile } from '@/contexts/session/session-context'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, ArrowRight, CheckCircle2, FileCheck, FileText, Mic, Upload } from 'lucide-react'

export default function ReportGeneratorPage() {
  const { sessions, currentSession, setCurrentSession, updateSession, createSession } = useSession()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('sources')
  const [selectedFiles, setSelectedFiles] = useState<SessionFile[]>([])
  const [outputConfig, setOutputConfig] = useState<OutputConfigurationData>({
    language: 'en',
    outputFormat: '',
    fields: []
  })
  const [generatedReport, setGeneratedReport] = useState<RAGResult | null>(null)
  
  // Get in-progress sessions
  const inProgressSessions = sessions.filter(s => s.status === 'in-progress')
  
  // Handle session selection
  const handleSessionSelect = (session: SessionData) => {
    setCurrentSession(session)
    setSelectedFiles(session.files)
    
    if (session.settings?.language) {
      setOutputConfig({
        language: session.settings.language,
        outputFormat: session.settings.outputFormat || '',
        fields: session.settings.fields ? session.settings.fields.map(field => ({
          id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: field
        })) : []
      })
    }
    
    toast({
      title: "Session loaded",
      description: `"${session.name}" has been loaded.`
    })
  }
  
  // Handle file selection toggle
  const toggleFileSelection = (file: SessionFile) => {
    if (selectedFiles.some(f => f.id === file.id)) {
      setSelectedFiles(selectedFiles.filter(f => f.id !== file.id))
    } else {
      setSelectedFiles([...selectedFiles, file])
    }
  }
  
  // Handle configuration saving
  const handleConfigurationSave = (config: OutputConfigurationData) => {
    setOutputConfig(config)
    setActiveTab('generate')
    
    // Save to current session if exists
    if (currentSession) {
      updateSession(currentSession.id, {
        settings: {
          ...currentSession.settings,
          language: config.language,
          outputFormat: config.outputFormat,
          fields: config.fields.map(f => f.name)
        }
      })
    }
  }
  
  // Handle report generation
  const handleReportGeneration = (result: RAGResult) => {
    setGeneratedReport(result)
    
    // Save to current session if exists
    if (currentSession) {
      updateSession(currentSession.id, {
        status: 'completed',
        content: {
          ...currentSession.content,
          rawContent: result.content,
          processedContent: result.content
        }
      })
    } else {
      // Create a new session with the report
      createSession({
        name: `Report - ${new Date().toLocaleDateString()}`,
        type: 'report',
        status: 'completed',
        files: selectedFiles,
        settings: {
          language: outputConfig.language,
          outputFormat: outputConfig.outputFormat,
          fields: outputConfig.fields.map(f => f.name)
        },
        content: {
          rawContent: result.content,
          processedContent: result.content
        }
      })
    }
  }
  
  // Determine if we can proceed to the next step
  const canConfigureOutput = selectedFiles.length > 0
  const canGenerateReport = outputConfig.outputFormat !== ''
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Generator</h1>
        <p className="text-muted-foreground">
          Create AI-powered structured reports from your files and recordings
        </p>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="sources" disabled={activeTab === 'output' && !canConfigureOutput}>
              Select Sources
            </TabsTrigger>
            <TabsTrigger value="output" disabled={activeTab === 'generate' && !canGenerateReport || !canConfigureOutput}>
              Configure Output
            </TabsTrigger>
            <TabsTrigger value="generate" disabled={!canGenerateReport}>
              Generate Report
            </TabsTrigger>
          </TabsList>
          
          {currentSession && (
            <div className="bg-muted px-3 py-1 rounded-md text-sm flex items-center">
              <span className="text-muted-foreground mr-2">Current session:</span>
              <span className="font-medium">{currentSession.name}</span>
            </div>
          )}
        </div>
        
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Source Files</CardTitle>
              <CardDescription>
                Choose files and recordings to include in your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No source files</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You haven't uploaded any files or created recordings yet.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/dashboard/uploads'}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/dashboard/recordings'}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Record Audio
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {inProgressSessions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-md font-medium">In-Progress Sessions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {inProgressSessions.map(session => (
                          <Card key={session.id} className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors" onClick={() => handleSessionSelect(session)}>
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-base">{session.name}</CardTitle>
                              <CardDescription>
                                {session.files.length} file{session.files.length !== 1 ? 's' : ''}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-xs text-muted-foreground">
                                Last updated: {new Date(session.updatedAt).toLocaleDateString()}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <h3 className="text-md font-medium">Available Files</h3>
                    
                    {sessions.flatMap(s => s.files).length === 0 ? (
                      <div className="text-center py-6 border rounded-md">
                        <p className="text-sm text-muted-foreground">
                          No files available. Upload files or create recordings first.
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-md divide-y">
                        {sessions
                          .flatMap(session => 
                            session.files.map(file => ({
                              ...file,
                              sessionName: session.name,
                              sessionId: session.id
                            }))
                          )
                          .map(file => (
                            <div 
                              key={file.id}
                              className={`flex items-center p-3 cursor-pointer transition-colors ${
                                selectedFiles.some(f => f.id === file.id)
                                  ? 'bg-primary/10'
                                  : 'hover:bg-accent hover:text-accent-foreground'
                              }`}
                              onClick={() => toggleFileSelection(file)}
                            >
                              <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                                selectedFiles.some(f => f.id === file.id)
                                  ? 'bg-primary border-primary'
                                  : 'border-muted-foreground'
                              }`}>
                                {selectedFiles.some(f => f.id === file.id) && (
                                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  {file.type.includes('audio') ? (
                                    <Mic className="h-4 w-4 mr-2 text-muted-foreground" />
                                  ) : (
                                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                  )}
                                  <p className="font-medium truncate">{file.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  From: {file.sessionName}
                                </p>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(0)} KB
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              onClick={() => setActiveTab('output')} 
              disabled={!canConfigureOutput}
            >
              Configure Output
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="output">
          <div className="space-y-4">
            <OutputConfiguration 
              onSubmit={handleConfigurationSave}
              initialConfig={outputConfig}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="generate">
          <RAGGenerator 
            files={selectedFiles}
            config={outputConfig}
            onGenerationComplete={handleReportGeneration}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
